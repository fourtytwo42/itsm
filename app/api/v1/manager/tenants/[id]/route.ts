import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getTenantById, updateTenant, canManageTenant } from '@/lib/services/tenant-service'
import { z } from 'zod'

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  requiresLogin: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params
    const tenant = await getTenantById(id)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // Check if user can manage this tenant
    const canManage = await canManageTenant(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this tenant' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { tenant },
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

    // Check if user can manage this tenant
    const canManage = await canManageTenant(authContext.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this tenant' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTenantSchema.parse(body)

    // IT Managers cannot change ownership
    const isAdmin = authContext.user.roles.includes('ADMIN')
    if (!isAdmin && validatedData.hasOwnProperty('ownedById')) {
      delete (validatedData as any).ownedById
    }

    const tenant = await updateTenant(id, validatedData)

    return NextResponse.json({
      success: true,
      data: { tenant },
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

