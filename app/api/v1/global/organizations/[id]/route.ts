import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireAnyRole } from '@/lib/middleware/auth'
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  canManageOrganization,
} from '@/lib/services/organization-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN'])

    const { id } = await params
    const organization = await getOrganizationById(id)
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN'])

    const { id } = await params
    const body = await request.json()
    const organization = await updateOrganization(id, body)

    // Log audit event
    await auditLog(
      AuditEventType.ORGANIZATION_UPDATED,
      'Organization',
      organization.id,
      authContext.user.id,
      authContext.user.email,
      `Updated organization: ${organization.name}`,
      { organizationId: organization.id, changes: body },
      request
    )

    return NextResponse.json(organization)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN'])

    const { id } = await params
    const organization = await getOrganizationById(id)
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    await deleteOrganization(id)

    // Log audit event
    await auditLog(
      AuditEventType.ORGANIZATION_DELETED,
      'Organization',
      organization.id,
      authContext.user.id,
      authContext.user.email,
      `Deleted organization: ${organization.name}`,
      { organizationId: organization.id },
      request
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

