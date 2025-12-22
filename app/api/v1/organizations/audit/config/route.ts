import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireAnyRole } from '@/lib/middleware/auth'
import {
  getAuditConfig,
  updateAuditConfig,
} from '@/lib/services/audit-service'
import { AuditEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN', 'ADMIN'])

    const organizationId = authContext.user.isGlobalAdmin
      ? request.nextUrl.searchParams.get('organizationId') || authContext.user.organizationId
      : authContext.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    const config = await getAuditConfig(organizationId)

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN', 'ADMIN'])

    const body = await request.json()
    const organizationId = authContext.user.isGlobalAdmin
      ? body.organizationId || authContext.user.organizationId
      : authContext.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    const config = await updateAuditConfig(organizationId, {
      enabled: body.enabled,
      events: body.events as AuditEventType[],
      retentionDays: body.retentionDays,
    })

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

