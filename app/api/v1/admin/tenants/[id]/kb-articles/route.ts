import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { manageTenantKBArticles } from '@/lib/services/tenant-service'
import { z } from 'zod'

const manageKBArticlesSchema = z.object({
  articleIds: z.array(z.string().uuid()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    if (!auth.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const { getTenantById } = await import('@/lib/services/tenant-service')
    const tenant = await getTenantById(id)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: tenant.kbArticles })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch KB articles' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    if (!auth.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validated = manageKBArticlesSchema.parse(body)

    const kbArticles = await manageTenantKBArticles(id, validated.articleIds)
    return NextResponse.json({ success: true, data: kbArticles })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update KB articles' } },
      { status: 500 }
    )
  }
}

