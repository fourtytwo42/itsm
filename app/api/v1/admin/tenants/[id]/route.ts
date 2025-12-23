import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getTenantById, updateTenant, deleteTenant } from '@/lib/services/tenant-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  requiresLogin: z.boolean().optional(),
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

    const { id } = await params
    const tenant = await getTenantById(id)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: tenant })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tenant' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id } = await params
    const body = await request.json()
    const validated = updateTenantSchema.parse(body)

    // Get old tenant data for audit
    const oldTenant = await getTenantById(id)

    const tenant = await updateTenant(id, validated)

    // Log audit event
    await auditLog(
      AuditEventType.TENANT_UPDATED,
      'Tenant',
      tenant.id,
      auth.user.id,
      auth.user.email,
      `Updated tenant: ${tenant.name}`,
      { tenantId: tenant.id, name: tenant.name, changes: validated, oldValues: oldTenant },
      request
    )

    return NextResponse.json({ success: true, data: tenant })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update tenant' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id } = await params
    await deleteTenant(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to delete tenant' } },
      { status: 500 }
    )
  }
}

