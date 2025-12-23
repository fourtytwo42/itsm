import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getUserById,
  updateUser,
  deleteUser,
  canManageAgentInOrganization,
} from '@/lib/services/user-service'
import { z } from 'zod'
import { RoleName } from '@prisma/client'

const updateAgentSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  roles: z.array(z.nativeEnum(RoleName)).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Check if user can manage this agent (same organization)
    const canManage = await canManageAgentInOrganization(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this agent' } },
        { status: 403 }
      )
    }

    const agent = await getUserById(id)

    return NextResponse.json({
      success: true,
      data: { agent },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Check if user can manage this agent (same organization)
    const canManage = await canManageAgentInOrganization(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this agent' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateAgentSchema.parse(body)

    const agent = await updateUser(id, validatedData)

    return NextResponse.json({
      success: true,
      data: { agent },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Check if user can manage this agent (same organization)
    const canManage = await canManageAgentInOrganization(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this agent' } },
        { status: 403 }
      )
    }

    await deleteUser(id)

    return NextResponse.json({
      success: true,
      data: { message: 'Agent deleted successfully' },
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

