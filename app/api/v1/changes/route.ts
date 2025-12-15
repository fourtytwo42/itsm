import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import {
  listChangeRequests,
  createChangeRequest,
} from '@/lib/services/change-service'
import { z } from 'zod'
import { ChangeType, ChangePriority, RiskLevel } from '@prisma/client'

const createChangeRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.nativeEnum(ChangeType),
  priority: z.nativeEnum(ChangePriority).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  relatedTicketId: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as ChangeType | null
    const status = searchParams.get('status') as any
    const priority = searchParams.get('priority') as ChangePriority | null
    const requestedBy = searchParams.get('requestedBy')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const filters = {
      type: type || undefined,
      status: status || undefined,
      priority: priority || undefined,
      requestedBy: requestedBy || undefined,
      search: search || undefined,
      page,
      limit,
      sort,
      order,
    }

    const result = await listChangeRequests(filters)

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

export async function POST(request: NextRequest) {
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
    const validatedData = createChangeRequestSchema.parse(body)

    const changeRequest = await createChangeRequest({
      ...validatedData,
      plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : undefined,
      plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : undefined,
      requestedById: authContext.user.id,
    })

    return NextResponse.json(
      {
        success: true,
        data: { changeRequest },
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

