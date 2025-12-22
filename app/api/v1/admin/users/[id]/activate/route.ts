import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { activateUser, deactivateUser, getUserById } from '@/lib/services/user-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only admin can activate/deactivate users
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can activate/deactivate users' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'activate'

    // Get user data for audit
    const userData = await getUserById(id)

    const user = action === 'activate' ? await activateUser(id) : await deactivateUser(id)

    // Log audit event
    if (userData) {
      await auditLog(
        action === 'activate' ? AuditEventType.USER_ACTIVATED : AuditEventType.USER_DEACTIVATED,
        'User',
        id,
        authContext.user.id,
        authContext.user.email,
        `${action === 'activate' ? 'Activated' : 'Deactivated'} user: ${userData.email}`,
        { userId: id, email: userData.email },
        request
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { user },
        message: `User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
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


