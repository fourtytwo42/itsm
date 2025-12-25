import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getAIRuleById, updateAIRule, deleteAIRule } from '@/lib/services/ai-rule-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const updateAIRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
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

    const { id: tenantId, ruleId } = await params

    const rule = await getAIRuleById(ruleId)

    if (!rule) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'AI rule not found' } },
        { status: 404 }
      )
    }

    // Verify rule belongs to the tenant
    if (rule.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Rule does not belong to this tenant' } },
        { status: 403 }
      )
    }

    // If IT Manager, verify tenant is in their organization
    // Fetch tenant organizationId if not in rule response
    const tenantOrgId = rule.tenant?.organizationId ?? (await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { organizationId: true },
    }))?.organizationId

    if (isITManager && !isAdmin && tenantOrgId !== auth.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only access tenants in your organization' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    console.error('Error fetching AI rule:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch AI rule' } },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
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

    const { id: tenantId, ruleId } = await params

    const existingRule = await getAIRuleById(ruleId)

    if (!existingRule) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'AI rule not found' } },
        { status: 404 }
      )
    }

    // Verify rule belongs to the tenant
    if (existingRule.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Rule does not belong to this tenant' } },
        { status: 403 }
      )
    }

    // If IT Manager, verify tenant is in their organization
    const tenantOrgId1 = existingRule.tenant?.organizationId ?? (await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { organizationId: true },
    }))?.organizationId

    if (isITManager && !isAdmin && tenantOrgId1 !== auth.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only manage tenants in your organization' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateAIRuleSchema.parse(body)

    const rule = await updateAIRule(ruleId, {
      ...validated,
      updatedById: auth.user.id,
    })

    // Log audit event
    await auditLog(
      AuditEventType.TENANT_UPDATED,
      'AIRule',
      rule.id,
      auth.user.id,
      auth.user.email,
      `Updated AI rule: ${rule.name} for tenant: ${existingRule.tenant?.name || tenantId}`,
      { ruleId: rule.id, ruleName: rule.name, tenantId: tenantId },
      request
    )

    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() } },
        { status: 400 }
      )
    }
    console.error('Error updating AI rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unable to update AI rule',
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
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

    const { id: tenantId, ruleId } = await params

    const existingRule = await getAIRuleById(ruleId)

    if (!existingRule) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'AI rule not found' } },
        { status: 404 }
      )
    }

    // Verify rule belongs to the tenant
    if (existingRule.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Rule does not belong to this tenant' } },
        { status: 403 }
      )
    }

    // If IT Manager, verify tenant is in their organization
    const tenantOrgId2 = existingRule.tenant?.organizationId ?? (await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { organizationId: true },
    }))?.organizationId

    if (isITManager && !isAdmin && tenantOrgId2 !== auth.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only manage tenants in your organization' } },
        { status: 403 }
      )
    }

    await deleteAIRule(ruleId)

    // Log audit event
    await auditLog(
      AuditEventType.TENANT_UPDATED,
      'AIRule',
      ruleId,
      auth.user.id,
      auth.user.email,
      `Deleted AI rule: ${existingRule.name} for tenant: ${existingRule.tenant?.name || tenantId}`,
      { ruleId: ruleId, ruleName: existingRule.name, tenantId: tenantId },
      request
    )

    return NextResponse.json({ success: true, message: 'AI rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting AI rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unable to delete AI rule',
        },
      },
      { status: 500 }
    )
  }
}

