import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { updateUser, canManageAgentInOrganization, getUserById } from '@/lib/services/user-service'
import { z } from 'zod'

const disableSchema = z.object({
  disabled: z.boolean(),
})

export async function PUT(
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
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only disable/enable agents in your organization' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { disabled } = disableSchema.parse(body)

    await updateUser(id, { isActive: !disabled })

    return NextResponse.json({
      success: true,
      data: { message: `Agent ${disabled ? 'disabled' : 'enabled'} successfully` },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

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

