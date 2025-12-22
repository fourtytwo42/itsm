import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'
import { updateTenant } from '@/lib/services/tenant-service'
import { z } from 'zod'

const assignOwnerSchema = z.object({
  managerId: z.string().uuid().nullable(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireRole(authContext, 'ADMIN')

    const { id } = await params
    const body = await request.json()
    const { managerId } = assignOwnerSchema.parse(body)

    // Note: Tenant ownership is now at organization level, not manager level
    // This endpoint is kept for backward compatibility but may not be needed
    const tenant = await updateTenant(id, {})

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

