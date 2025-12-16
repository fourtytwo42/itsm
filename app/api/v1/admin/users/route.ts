import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getUsers, createUser } from '@/lib/services/user-service'
import { z } from 'zod'
import { RoleName } from '@prisma/client'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roles: z.array(z.nativeEnum(RoleName)).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    requireAuth(authContext)

    // Only admin and IT manager can view users
    if (!authContext.user.roles.includes('ADMIN') && !authContext.user.roles.includes('IT_MANAGER')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') as RoleName | undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      emailVerified: searchParams.get('emailVerified') === 'true' ? true : searchParams.get('emailVerified') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort: searchParams.get('sort') || 'createdAt',
      order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
    }

    const result = await getUsers(filters)

    return NextResponse.json(
      {
        success: true,
        data: result,
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

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    requireAuth(authContext)

    // Only admin can create users
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can create users' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = createUserSchema.parse(body)

    const user = await createUser(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: { user },
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


