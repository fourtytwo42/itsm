import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { updateUser, canManageAgentInOrganization, getUserById } from '@/lib/services/user-service'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Get agent to check organization
    const agent = await getUserById(id)
    if (!agent) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      )
    }

    // Check if user can manage this agent (same organization)
    const canManage = await canManageAgentInOrganization(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only reset passwords for agents in your organization' } },
        { status: 403 }
      )
    }

    // Generate new temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10)
    
    await updateUser(id, { password: hashedPassword })

    return NextResponse.json({
      success: true,
      data: {
        temporaryPassword,
        message: 'Password reset. Share this temporary password with the agent.',
      },
    })
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

