import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { createUser, getUsers } from '@/lib/services/user-service'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { RoleName } from '@prisma/client'

const registerAgentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tenantId: z.string().uuid(),
  roles: z.array(z.nativeEnum(RoleName)).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only IT_MANAGER can access this endpoint
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    const isAdmin = authContext.user.roles.includes('ADMIN')

    if (!isITManager && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only IT Managers can access this endpoint' } },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') as RoleName | undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      emailVerified: searchParams.get('emailVerified') === 'true' ? true : searchParams.get('emailVerified') === 'false' ? false : undefined,
      tenantId: searchParams.get('tenantId') || undefined, // Filter by tenant if provided
      userId: authContext.user.id,
      userRoles: authContext.user.roles,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort: searchParams.get('sort') || 'createdAt',
      order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
    }

    // IT Manager and Admin can see all users in their organization
    const result = await getUsers(filters)

    return NextResponse.json({
      success: true,
      data: result,
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

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only IT_MANAGER can register agents
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    if (!isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only IT Managers can register agents' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = registerAgentSchema.parse(body)

    // Ensure only AGENT or END_USER roles
    if (validatedData.roles) {
      const invalidRoles = validatedData.roles.filter(
        (r) => r !== RoleName.AGENT && r !== RoleName.END_USER
      )
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'IT Managers can only create AGENT or END_USER accounts',
            },
          },
          { status: 400 }
        )
      }
    }

    const agent = await createUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      roles: validatedData.roles || [RoleName.AGENT],
      organizationId: authContext.user.organizationId || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: { agent },
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

