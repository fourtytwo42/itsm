import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import {
  getChangeRequestById,
  updateChangeRequest,
  deleteChangeRequest,
  submitChangeRequest,
} from '@/lib/services/change-service'
import { z } from 'zod'
import { ChangeType, ChangePriority, RiskLevel } from '@prisma/client'

const updateChangeRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.nativeEnum(ChangeType).optional(),
  priority: z.nativeEnum(ChangePriority).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  actualStartDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  implementationNotes: z.string().optional(),
  relatedTicketId: z.string().uuid().optional().nullable(),
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

    const changeRequest = await getChangeRequestById(params.id)

    if (!changeRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Change request not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { changeRequest },
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

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r.role.name === 'AGENT' || r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateChangeRequestSchema.parse(body)

    const changeRequest = await updateChangeRequest(params.id, {
      ...validatedData,
      plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : undefined,
      plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : undefined,
      actualStartDate: validatedData.actualStartDate ? new Date(validatedData.actualStartDate) : undefined,
      actualEndDate: validatedData.actualEndDate ? new Date(validatedData.actualEndDate) : undefined,
      relatedTicketId: validatedData.relatedTicketId === null ? null : validatedData.relatedTicketId,
    })

    return NextResponse.json(
      {
        success: true,
        data: { changeRequest },
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

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r.role.name === 'AGENT' || r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    await deleteChangeRequest(params.id)

    return NextResponse.json(
      {
        success: true,
        data: { message: 'Change request deleted successfully' },
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

