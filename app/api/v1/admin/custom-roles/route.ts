import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  createCustomRole,
  listCustomRoles,
} from '@/lib/services/custom-role-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const createCustomRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user is ADMIN or IT_MANAGER
    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User must belong to an organization' } },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined

    const roles = await listCustomRoles(authContext.user.organizationId, { isActive })

    return NextResponse.json({
      success: true,
      data: { customRoles: roles },
    })
  } catch (error) {
    console.error('List custom roles error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user is ADMIN or IT_MANAGER
    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User must belong to an organization' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createCustomRoleSchema.parse(body)

    const customRole = await createCustomRole({
      ...validatedData,
      organizationId: authContext.user.organizationId,
    })

    // Log audit event
    await auditLog(
      AuditEventType.USER_ROLE_CHANGED,
      'CustomRole',
      customRole.id,
      authContext.user.id,
      authContext.user.email,
      `Created custom role: ${customRole.displayName}`,
      { customRoleId: customRole.id, name: customRole.name, displayName: customRole.displayName },
      request
    )

    return NextResponse.json(
      {
        success: true,
        data: { customRole },
      },
      { status: 201 }
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

    console.error('Create custom role error:', error)
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

