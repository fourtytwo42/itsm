import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { calculateMTTR } from '@/lib/services/analytics-service'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const agentId = searchParams.get('agentId') || undefined

    const mttr = await calculateMTTR({
      startDate,
      endDate,
      agentId,
      userId: authContext.user.id,
      userRoles: authContext.user.roles,
    })

    return NextResponse.json(
      {
        success: true,
        data: { mttr },
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

