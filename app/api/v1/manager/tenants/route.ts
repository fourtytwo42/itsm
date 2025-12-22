import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { createTenant, listTenants } from '@/lib/services/tenant-service'
import { z } from 'zod'

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  logo: z.string().optional(),
  requiresLogin: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined

    // List tenants in the same organization
    const tenants = await listTenants({
      search,
      isActive,
      userId: authContext.user.id,
      userRoles: authContext.user.roles,
    })

    return NextResponse.json({
      success: true,
      data: { tenants },
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

    // Only IT_MANAGER can create tenants
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    if (!isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only IT Managers can create tenants' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTenantSchema.parse(body)

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'User must be assigned to an organization' } },
        { status: 403 }
      )
    }

    const tenant = await createTenant({
      ...validatedData,
      organizationId: authContext.user.organizationId,
    })

    return NextResponse.json(
      {
        success: true,
        data: { tenant },
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

