import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getCustomRoleById,
  updateCustomRole,
  deleteCustomRole,
} from '@/lib/services/custom-role-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const updateCustomRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens').optional(),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const customRole = await getCustomRoleById(id)

    if (!customRole) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom role not found' } },
        { status: 404 }
      )
    }

    // Verify the role belongs to the user's organization
    if (customRole.organizationId !== authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { customRole },
    })
  } catch (error) {
    console.error('Get custom role error:', error)
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

    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const existingRole = await getCustomRoleById(id)

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom role not found' } },
        { status: 404 }
      )
    }

    if (existingRole.organizationId !== authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateCustomRoleSchema.parse(body)

    const customRole = await updateCustomRole(id, validatedData)

    // Log audit event
    await auditLog(
      AuditEventType.USER_ROLE_CHANGED,
      'CustomRole',
      customRole.id,
      authContext.user.id,
      authContext.user.email,
      `Updated custom role: ${customRole.displayName}`,
      { customRoleId: customRole.id, changes: validatedData },
      request
    )

    return NextResponse.json({
      success: true,
      data: { customRole },
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

    console.error('Update custom role error:', error)
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

    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const existingRole = await getCustomRoleById(id)

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom role not found' } },
        { status: 404 }
      )
    }

    if (existingRole.organizationId !== authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    await deleteCustomRole(id)

    // Log audit event
    await auditLog(
      AuditEventType.USER_ROLE_CHANGED,
      'CustomRole',
      id,
      authContext.user.id,
      authContext.user.email,
      `Deleted custom role: ${existingRole.displayName}`,
      { customRoleId: id, name: existingRole.name },
      request
    )

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete custom role error:', error)
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

