import { NextRequest, NextResponse } from 'next/server'
import { chatWithTools } from '@/lib/services/ai-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { z } from 'zod'

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      content: z.string().nullable(),
      name: z.string().optional(),
      tool_call_id: z.string().optional(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    const body = await request.json()
    const validatedData = chatSchema.parse(body)

    const result = await chatWithTools({
      messages: validatedData.messages,
      requesterId: authContext?.user.id,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
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

