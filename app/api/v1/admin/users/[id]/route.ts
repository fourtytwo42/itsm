import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getUserById, updateUser, deleteUser } from '@/lib/services/user-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'
import { RoleName } from '@prisma/client'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roles: z.array(z.nativeEnum(RoleName)).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only admin and IT manager can view user details
    if (!authContext.user.roles.includes('ADMIN') && !authContext.user.roles.includes('IT_MANAGER')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const user = await getUserById(id)

    return NextResponse.json(
      {
        success: true,
        data: { user },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only admin can update users
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can update users' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Get old user data for audit
    const oldUser = await getUserById(id)

    const user = await updateUser(id, validatedData)

    // Log audit event
    await auditLog(
      AuditEventType.USER_UPDATED,
      'User',
      user.id,
      authContext.user.id,
      authContext.user.email,
      `Updated user: ${user.email}`,
      {
        userId: user.id,
        email: user.email,
        changes: validatedData,
        oldValues: oldUser ? { isActive: oldUser.isActive, roles: oldUser.roles.map((r: any) => r.role.name) } : null,
      },
      request
    )

    return NextResponse.json(
      {
        success: true,
        data: { user },
      },
      { status: 200 }
    )
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

    // Only admin can delete users
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can delete users' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === authContext.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Cannot delete your own account' } },
        { status: 400 }
      )
    }

    // Get user data for audit before deletion
    const user = await getUserById(id)

    await deleteUser(id)

    // Log audit event
    if (user) {
      await auditLog(
        AuditEventType.USER_DELETED,
        'User',
        id,
        authContext.user.id,
        authContext.user.email,
        `Deleted user: ${user.email}`,
        { userId: id, email: user.email },
        request
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
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


