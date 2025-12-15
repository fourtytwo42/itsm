import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ArticleStatus } from '@prisma/client'
import { createArticle, listArticles } from '@/lib/services/kb-service'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'

const createSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(3),
  slug: z.string().min(3),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
})

const listSchema = z.object({
  status: z.nativeEnum(ArticleStatus).optional(),
  tag: z.string().optional(),
  slug: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = listSchema.parse({
      status: searchParams.get('status') ?? undefined,
      tag: searchParams.get('tag') ?? undefined,
      slug: searchParams.get('slug') ?? undefined,
    })
    if (parsed.slug) {
      const articles = await listArticles({ ...parsed, status: parsed.status })
      const filtered = articles.filter((a) => a.slug === parsed.slug)
      return NextResponse.json({ success: true, data: filtered })
    }
    const articles = await listArticles(parsed)
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
    requireRole(auth, 'ADMIN')

    const body = await request.json()
    const validated = createSchema.parse(body)

    const article = await createArticle(validated)
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

