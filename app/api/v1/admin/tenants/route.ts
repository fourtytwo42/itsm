import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { createTenant, listTenants } from '@/lib/services/tenant-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  requiresLogin: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    if (!auth.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      userId: auth.user.id,
      userRoles: auth.user.roles,
    }

    const tenants = await listTenants(filters)
    return NextResponse.json({ success: true, data: tenants })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tenants' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    if (!auth.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createTenantSchema.parse(body)

    // For global admin, organizationId can be in the request body
    // For org admin, use their organizationId
    const organizationId = auth.user.isGlobalAdmin 
      ? (validated as any).organizationId || auth.user.organizationId
      : auth.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Organization ID required' } },
        { status: 403 }
      )
    }

    const tenant = await createTenant({
      ...validated,
      organizationId,
    })

    // Log audit event
    await auditLog(
      AuditEventType.TENANT_CREATED,
      'Tenant',
      tenant.id,
      auth.user.id,
      auth.user.email,
      `Created tenant: ${tenant.name}`,
      { tenantId: tenant.id, name: tenant.name, slug: tenant.slug },
      request
    )

    return NextResponse.json({ success: true, data: tenant }, { status: 201 })
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create tenant' } },
      { status: 500 }
    )
  }
}

