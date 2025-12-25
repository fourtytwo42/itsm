import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getUserConversations,
  getConversationById,
  clearConversation,
  deleteConversation,
} from '@/lib/services/chat-service'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const conversations = await getUserConversations(authContext.user.id)

    return NextResponse.json(
      {
        success: true,
        data: conversations,
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

