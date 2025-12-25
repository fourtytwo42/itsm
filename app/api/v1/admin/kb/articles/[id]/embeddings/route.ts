import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'
import { generateArticleEmbeddings } from '@/lib/services/embedding-service'
import { getArticleById } from '@/lib/services/kb-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireRole(authContext, 'IT_MANAGER') // Only IT managers and admins can generate embeddings

    const { id } = await params
    const article = await getArticleById(id)
    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
        },
        { status: 404 }
      )
    }

    await generateArticleEmbeddings(id)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Embeddings generated successfully',
      },
    })
  } catch (error) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate embeddings',
        },
      },
      { status: 500 }
    )
  }
}

