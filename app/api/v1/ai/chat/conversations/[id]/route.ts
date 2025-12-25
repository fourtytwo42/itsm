import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { clearConversation, deleteConversation } from '@/lib/services/chat-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Delete the conversation (this will cascade delete messages)
    await deleteConversation(id, authContext.user.id)

    return NextResponse.json(
      {
        success: true,
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

