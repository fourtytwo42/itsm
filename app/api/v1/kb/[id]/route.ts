import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ArticleStatus } from '@prisma/client'
import { getArticleById, updateArticle } from '@/lib/services/kb-service'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'

const idSchema = z.object({
  id: z.string().uuid(),
})

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(3).optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = idSchema.parse(await params)
    const article = await getArticleById(id)
    if (!article) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch article' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)
    requireRole(auth, 'ADMIN')

    const { id } = idSchema.parse(await params)
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updated = await updateArticle(id, validated)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update article' } },
      { status: 500 }
    )
  }
}

