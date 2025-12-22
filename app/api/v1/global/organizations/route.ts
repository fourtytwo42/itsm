import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'
import {
  createOrganization,
  listOrganizations,
} from '@/lib/services/organization-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireRole(authContext, 'GLOBAL_ADMIN')

    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
    }

    const organizations = await listOrganizations(filters)

    return NextResponse.json(organizations)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireRole(authContext, 'GLOBAL_ADMIN')

    const body = await request.json()
    const { organization, orgAdmin, defaultPassword } = await createOrganization(
      body,
      authContext.user.id
    )

    // Log audit event
    await auditLog(
      AuditEventType.ORGANIZATION_CREATED,
      'Organization',
      organization.id,
      authContext.user.id,
      authContext.user.email,
      `Created organization: ${organization.name}`,
      { organizationId: organization.id, orgAdminEmail: orgAdmin.email },
      request
    )

    return NextResponse.json({
      organization,
      orgAdmin: {
        email: orgAdmin.email,
        defaultPassword, // Only returned on creation
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

