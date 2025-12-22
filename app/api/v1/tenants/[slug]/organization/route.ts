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

    // Get organization from tenant
    if (!tenant.organization) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found for tenant' } },
        { status: 404 }
      )
    }

    // Return public organization info
    return NextResponse.json({
      success: true,
      data: {
        id: tenant.organization.id,
        name: tenant.organization.name,
        slug: tenant.organization.slug,
        logo: tenant.organization.logo,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch organization' } },
      { status: 500 }
    )
  }
}

