import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getUsers } from '@/lib/services/user-service'
import prisma from '@/lib/prisma'
import { RoleName } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    requireAuth(authContext)

    // Only agents can access this endpoint
    if (!authContext.user.roles.includes('AGENT')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only agents can access this endpoint' } },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
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

