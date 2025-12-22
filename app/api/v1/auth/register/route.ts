import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const result = await registerUser(validatedData)

    // Merge public token tickets to user account if public token is provided
    const publicTokenHeader = request.headers.get('x-public-token')
    if (publicTokenHeader) {
      try {
        const { verifyPublicToken } = await import('@/lib/jwt')
        const payload = verifyPublicToken(publicTokenHeader)
        const { mergePublicTokenTicketsToUser } = await import('@/lib/services/ticket-service')
        await mergePublicTokenTicketsToUser(payload.publicId, result.user.id)
      } catch (error) {
        // Silently fail - merging tickets is optional
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_ERROR',
            message: error.message,
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
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

