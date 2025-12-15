import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { getSLATrackingByTicketId } from '@/lib/services/sla-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const tracking = await getSLATrackingByTicketId(params.ticketId)

    if (!tracking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'SLA Tracking not found for this ticket',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { tracking },
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

