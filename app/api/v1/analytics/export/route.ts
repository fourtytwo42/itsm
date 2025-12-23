import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { exportAnalyticsToCSV } from '@/lib/services/analytics-service'
import { TicketPriority, TicketStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = (searchParams.get('type') || 'tickets') as 'tickets' | 'agents'
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const agentId = searchParams.get('agentId') || undefined
    const priority = searchParams.get('priority') as TicketPriority | null
    const status = searchParams.get('status') as TicketStatus | null

    if (format === 'csv') {
      const csv = await exportAnalyticsToCSV(type, {
        startDate,
        endDate,
        agentId,
        priority: priority || undefined,
        status: status || undefined,
        userId: authContext.user.id,
        userRoles: authContext.user.roles,
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // PDF export would go here (using pdf-lib or similar)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'PDF export not yet implemented',
        },
      },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

