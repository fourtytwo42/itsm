import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  listSLAPolicies,
  createSLAPolicy,
} from '@/lib/services/sla-service'
import { z } from 'zod'
import { TicketPriority } from '@prisma/client'

const createSLAPolicySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.nativeEnum(TicketPriority),
  firstResponseTime: z.number().int().positive(),
  resolutionTime: z.number().int().positive(),
  businessHours: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const policies = await listSLAPolicies(activeOnly)

    return NextResponse.json(
      {
        success: true,
        data: { policies },
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
    const validatedData = createSLAPolicySchema.parse(body)

    const policy = await createSLAPolicy(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: { policy },
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

