import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireAnyRole } from '@/lib/middleware/auth'
import { getOrganizationById, updateOrganization } from '@/lib/services/organization-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    if (!authContext.user.organizationId) {
      return NextResponse.json({ organization: null })
    }

    const organization = await getOrganizationById(authContext.user.organizationId)

    return NextResponse.json({ organization })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN', 'ADMIN', 'IT_MANAGER'])

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { error: 'No organization associated with this user' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Only allow updating name and description for non-global admins
    const updateData: { name?: string; description?: string } = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description

    const organization = await updateOrganization(authContext.user.organizationId, updateData)

    // Log audit event
    await auditLog(
      AuditEventType.ORGANIZATION_UPDATED,
      'Organization',
      organization.id,
      authContext.user.id,
      authContext.user.email,
      `Updated organization: ${organization.name}`,
      { organizationId: organization.id, changes: updateData },
      request
    )

    return NextResponse.json({ organization })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

