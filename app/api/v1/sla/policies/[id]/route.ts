import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getSLAPolicyById,
  updateSLAPolicy,
  deleteSLAPolicy,
} from '@/lib/services/sla-service'
import { z } from 'zod'
import { TicketPriority } from '@prisma/client'

const updateSLAPolicySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  firstResponseTime: z.number().int().positive().optional(),
  resolutionTime: z.number().int().positive().optional(),
  businessHours: z.record(z.any()).optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params
    const policy = await getSLAPolicyById(id)

    if (!policy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'SLA Policy not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { policy },
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

    // Check if user has IT Manager or Admin role
    const hasManagerRole = authContext.user.roles.some(
      (r) => r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSLAPolicySchema.parse(body)

    const { id } = await params
    const policy = await updateSLAPolicy(id, validatedData)

    return NextResponse.json(
      {
        success: true,
        data: { policy },
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

    // Check if user has IT Manager or Admin role
    const hasManagerRole = authContext.user.roles.some(
      (r) => r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params
    await deleteSLAPolicy(id)

    return NextResponse.json(
      {
        success: true,
        data: { message: 'SLA Policy deleted successfully' },
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

