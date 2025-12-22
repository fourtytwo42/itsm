import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireAnyRole } from '@/lib/middleware/auth'
import { getAuditLogs } from '@/lib/services/audit-service'
import { AuditEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN', 'ADMIN'])

    const searchParams = request.nextUrl.searchParams
    const filters = {
      organizationId: authContext.user.isGlobalAdmin
        ? searchParams.get('organizationId') || undefined
        : authContext.user.organizationId || undefined,
      eventType: searchParams.get('eventType') as AuditEventType | undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    }

    const result = await getAuditLogs(filters)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

