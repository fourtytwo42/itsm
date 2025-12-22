import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ArticleStatus, AuditEventType } from '@prisma/client'
import { createArticle, listArticles } from '@/lib/services/kb-service'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'
import { auditLog } from '@/lib/middleware/audit'

const createSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(3),
  slug: z.string().min(3),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  tenantIds: z.array(z.string().uuid()).nullable().optional(), // Array of tenant IDs, or null for "all tenants"
})

const listSchema = z.object({
  status: z.nativeEnum(ArticleStatus).optional(),
  tag: z.string().optional(),
  slug: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    const { searchParams } = new URL(request.url)
    const parsed = listSchema.parse({
      status: searchParams.get('status') ?? undefined,
      tag: searchParams.get('tag') ?? undefined,
      slug: searchParams.get('slug') ?? undefined,
    })
    
    const params = {
      ...parsed,
      userId: authContext?.user?.id,
      userRoles: authContext?.user?.roles,
    }
    
    if (parsed.slug) {
      const articles = await listArticles({ ...params, status: parsed.status })
      const filtered = articles.filter((a) => a.slug === parsed.slug)
      return NextResponse.json({ success: true, data: filtered })
    }
    const articles = await listArticles(params)
    return NextResponse.json({ success: true, data: articles })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch articles' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)
    // Allow ADMIN, IT_MANAGER, and AGENT to create KB articles
    if (!auth.user.roles.some((r) => ['ADMIN', 'IT_MANAGER', 'AGENT'].includes(r))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    const article = await createArticle({
      title: validated.title,
      content: validated.content,
      slug: validated.slug,
      tags: validated.tags,
      status: validated.status,
      organizationId: auth.user.organizationId || undefined,
      tenantIds: validated.tenantIds ?? null, // null means "all tenants"
    })

    // Log audit event
    await auditLog(
      AuditEventType.KB_ARTICLE_CREATED,
      'KnowledgeBaseArticle',
      article.id,
      auth.user.id,
      auth.user.email,
      `Created KB article: ${article.title}`,
      { articleId: article.id, title: article.title, slug: article.slug },
      request
    )

    return NextResponse.json({ success: true, data: article }, { status: 201 })
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create article' } },
      { status: 500 }
    )
  }
}

