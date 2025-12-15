import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
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
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const policy = await getSLAPolicyById(params.id)

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
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has IT Manager or Admin role
    const hasManagerRole = authContext.user.roles.some(
      (r) => r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSLAPolicySchema.parse(body)

    const policy = await updateSLAPolicy(params.id, validatedData)

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
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has IT Manager or Admin role
    const hasManagerRole = authContext.user.roles.some(
      (r) => r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    await deleteSLAPolicy(params.id)

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

