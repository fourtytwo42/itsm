import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/services/tenant-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tenant = await getTenantBySlug(slug)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // Return public tenant info (no sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        description: tenant.description,
        requiresLogin: tenant.requiresLogin,
        categories: tenant.categories.map((c) => c.category),
        kbArticles: tenant.kbArticles.map((ka) => ({
          id: ka.article.id,
          title: ka.article.title,
          slug: ka.article.slug,
        })),
        customFields: tenant.customFields,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tenant' } },
      { status: 500 }
    )
  }
}

