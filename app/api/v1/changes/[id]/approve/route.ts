import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { approveChange, createApproval } from '@/lib/services/change-service'
import { z } from 'zod'

const approveChangeSchema = z.object({
  approverId: z.string().uuid(),
  stage: z.number().int().positive(),
  approved: z.boolean(),
  comments: z.string().optional(),
})

const createApprovalSchema = z.object({
  approverId: z.string().uuid(),
  stage: z.number().int().positive(),
  comments: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user has IT Manager or Admin role for approvals
    const hasManagerRole = authContext.user.roles.some(
      (r) => r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions for approvals' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'approve'

    if (action === 'create') {
      const validatedData = createApprovalSchema.parse(body)
      const approval = await createApproval({
        changeRequestId: id,
        ...validatedData,
      })

      return NextResponse.json(
        {
          success: true,
          data: { approval },
        },
        { status: 201 }
      )
    } else {
      const validatedData = approveChangeSchema.parse(body)
      const approval = await approveChange({
        changeRequestId: id,
        ...validatedData,
      })

      return NextResponse.json(
        {
          success: true,
          data: { approval },
        },
        { status: 200 }
      )
    }
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

