import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { getDashboardMetrics } from '@/lib/services/analytics-service'
import { TicketPriority, TicketStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const priority = searchParams.get('priority') as TicketPriority | null
    const status = searchParams.get('status') as TicketStatus | null

    const metrics = await getDashboardMetrics({
      startDate,
      endDate,
      priority: priority || undefined,
      status: status || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: { metrics },
      },
      { status: 200 }
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

