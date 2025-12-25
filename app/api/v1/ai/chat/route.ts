import { NextRequest, NextResponse } from 'next/server'
import { chatWithTools } from '@/lib/services/ai-service'
import { getAuthContext } from '@/lib/middleware/auth'
import {
  getOrCreateConversation,
  saveMessage,
} from '@/lib/services/chat-service'
import { z } from 'zod'

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string().nullable(),
        name: z.string().optional(),
        tool_call_id: z.string().optional(),
      })
    )
    .optional(),
  conversationId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[Chat API] [${requestId}] POST request received`)
  
  try {
    const authContext = await getAuthContext(request)
    console.log(`[Chat API] [${requestId}] Auth context retrieved`, { 
      hasUser: !!authContext?.user?.id,
      userId: authContext?.user?.id 
    })
    
    const body = await request.json()
    console.log(`[Chat API] [${requestId}] Request body parsed`, { 
      hasMessages: !!body.messages,
      messageCount: body.messages?.length || 0,
      hasConversationId: !!body.conversationId,
      hasTenantId: !!body.tenantId 
    })
    
    const validatedData = chatSchema.parse(body)
    console.log(`[Chat API] [${requestId}] Request validated successfully`)

    // Get or create conversation (for tracking purposes only, not for loading history)
    let conversationId = validatedData.conversationId
    if (!conversationId && authContext?.user?.id) {
      const conversation = await getOrCreateConversation(authContext.user.id)
      conversationId = conversation.id
    }

    // Always use messages from request body (from localStorage on frontend)
    // Never load history from database - localStorage is the single source of truth
    let messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string | null; name?: string; tool_call_id?: string }> = []

    if (validatedData.messages && validatedData.messages.length > 0) {
      messages = validatedData.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content,
        name: m.name,
        tool_call_id: m.tool_call_id,
      }))
    }

    // If no messages at all, return error
    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No messages provided',
          },
        },
        { status: 400 }
      )
    }

    // Get user's organization and roles for KB search scoping
    let organizationId: string | undefined
    let userRoles: string[] | undefined

    if (authContext?.user?.id) {
      // Use organizationId and roles from authContext if available
      organizationId = authContext.user.organizationId || authContext.organizationId
      userRoles = authContext.user.roles
    }

    // Call AI service
    console.log(`[Chat API] [${requestId}] Calling chatWithTools`, { 
      messageCount: messages.length,
      hasRequesterId: !!authContext?.user?.id,
      hasTenantId: !!validatedData.tenantId 
    })
    
    const result = await chatWithTools({
      messages,
      requesterId: authContext?.user?.id,
      tenantId: validatedData.tenantId,
      organizationId,
      userRoles,
    })
    
    console.log(`[Chat API] [${requestId}] chatWithTools completed`, { 
      hasReply: !!result.reply,
      replyLength: result.reply?.length || 0,
      replyPreview: result.reply?.substring(0, 100),
      toolCallsCount: result.toolCalls?.length || 0 
    })
    
    // Validate that we have a reply
    if (!result.reply || result.reply.trim().length === 0) {
      console.error(`[Chat API] [${requestId}] Empty reply from chatWithTools`, { result })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_ERROR',
            message: 'Received empty response from AI service. Please try again.',
          },
        },
        { status: 500 }
      )
    }

    // Save messages to database if we have a conversationId
    // This stores a server-side copy for searchability, but localStorage remains the source of truth for AI context
    if (conversationId && authContext?.user?.id) {
      // Save the last user message (the new one from this request)
      const userMessages = messages.filter((m) => m.role === 'user')
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1]
        await saveMessage(conversationId, 'user', lastUserMessage.content || null)
      }

      // Save the assistant response with tool calls if present
      const toolCallsData = (result as any).toolCallsData || null
      await saveMessage(
        conversationId,
        'assistant',
        result.reply,
        toolCallsData,
        undefined
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reply: result.reply,
          toolCalls: result.toolCalls,
          conversationId,
        },
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
      console.error('AI Chat Error:', error.message, error.stack)
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
