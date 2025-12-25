import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { createAIRule, listAIRulesForTenant } from '@/lib/services/ai-rule-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const createAIRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    // Allow ADMIN or IT_MANAGER
    const isAdmin = auth.user.roles.includes('ADMIN')
    const isITManager = auth.user.roles.includes('IT_MANAGER')

    if (!isAdmin && !isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or IT Manager access required' } },
        { status: 403 }
      )
    }

    const { id: tenantId } = await params

    // Verify tenant exists and user has access
    const tenant = await (await import('@/lib/services/tenant-service')).getTenantById(tenantId)
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // If IT Manager, verify tenant is in their organization
    if (isITManager && !isAdmin && tenant.organizationId !== auth.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only access tenants in your organization' } },
        { status: 403 }
      )
    }

    const rules = await listAIRulesForTenant(tenantId)
    return NextResponse.json({ success: true, data: rules })
  } catch (error) {
    console.error('Error fetching AI rules:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch AI rules' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    // Allow ADMIN or IT_MANAGER
    const isAdmin = auth.user.roles.includes('ADMIN')
    const isITManager = auth.user.roles.includes('IT_MANAGER')

    if (!isAdmin && !isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or IT Manager access required' } },
        { status: 403 }
      )
    }

    const { id: tenantId } = await params

    // Verify tenant exists and user has access
    const tenant = await (await import('@/lib/services/tenant-service')).getTenantById(tenantId)
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // If IT Manager, verify tenant is in their organization
    if (isITManager && !isAdmin && tenant.organizationId !== auth.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only manage tenants in your organization' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createAIRuleSchema.parse(body)

    const rule = await createAIRule({
      tenantId,
      name: validated.name,
      description: validated.description,
      content: validated.content,
      priority: validated.priority,
      isActive: validated.isActive,
      createdById: auth.user.id,
    })

    // Log audit event
    await auditLog(
      AuditEventType.TENANT_UPDATED,
      'AIRule',
      rule.id,
      auth.user.id,
      auth.user.email,
      `Created AI rule: ${rule.name} for tenant: ${tenantId}`,
      { ruleId: rule.id, ruleName: rule.name, tenantId: tenantId },
      request
    )

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() } },
        { status: 400 }
      )
    }
    console.error('Error creating AI rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unable to create AI rule',
        },
      },
      { status: 500 }
    )
  }
}

