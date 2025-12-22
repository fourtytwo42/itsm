import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ArticleStatus, AuditEventType } from '@prisma/client'
import { getArticleById, updateArticle } from '@/lib/services/kb-service'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'
import { auditLog } from '@/lib/middleware/audit'

const idSchema = z.object({
  id: z.string().uuid(),
})

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(3).optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  tenantIds: z.array(z.string().uuid()).nullable().optional(), // Array of tenant IDs, or null for "all tenants"
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
    // Allow ADMIN, IT_MANAGER, and AGENT to update KB articles
    if (!auth.user.roles.some((r) => ['ADMIN', 'IT_MANAGER', 'AGENT'].includes(r))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = idSchema.parse(await params)
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Get old article data for audit
    const oldArticle = await getArticleById(id)

    const updateData: any = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.content !== undefined) updateData.content = validated.content
    if (validated.tags !== undefined) updateData.tags = validated.tags
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.tenantIds !== undefined) updateData.tenantIds = validated.tenantIds

    const updated = await updateArticle(id, updateData)

    // Log audit event
    await auditLog(
      AuditEventType.KB_ARTICLE_UPDATED,
      'KnowledgeBaseArticle',
      updated.id,
      auth.user.id,
      auth.user.email,
      `Updated KB article: ${updated.title}`,
      { articleId: updated.id, title: updated.title, slug: updated.slug, changes: validated },
      request
    )

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

