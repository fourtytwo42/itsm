import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getChangeRequestById,
  updateChangeRequest,
  deleteChangeRequest,
  submitChangeRequest,
} from '@/lib/services/change-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params
    const changeRequest = await getChangeRequestById(id)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateChangeRequestSchema.parse(body)

    const { id } = await params

    // Get old change request data for audit
    const oldChangeRequest = await getChangeRequestById(id)

    const changeRequest = await updateChangeRequest(id, {
      ...validatedData,
      plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : undefined,
      plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : undefined,
      actualStartDate: validatedData.actualStartDate ? new Date(validatedData.actualStartDate) : undefined,
      actualEndDate: validatedData.actualEndDate ? new Date(validatedData.actualEndDate) : undefined,
      relatedTicketId: validatedData.relatedTicketId === null ? undefined : validatedData.relatedTicketId,
    })

    // Log audit event
    await auditLog(
      AuditEventType.CHANGE_UPDATED,
      'ChangeRequest',
      changeRequest.id,
      authContext.user.id,
      authContext.user.email,
      `Updated change request: ${changeRequest.changeNumber}`,
      { changeId: changeRequest.id, changeNumber: changeRequest.changeNumber, changes: validatedData },
      request
    )

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get change request data for audit before deletion
    const changeRequest = await getChangeRequestById(id)

    await deleteChangeRequest(id)

    // Log audit event
    if (changeRequest) {
      await auditLog(
        AuditEventType.CHANGE_DELETED,
        'ChangeRequest',
        id,
        authContext.user.id,
        authContext.user.email,
        `Deleted change request: ${changeRequest.changeNumber}`,
        { changeId: id, changeNumber: changeRequest.changeNumber, title: changeRequest.title },
        request
      )
    }

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

