import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { manageTenantCategories } from '@/lib/services/tenant-service'
import { z } from 'zod'

const manageCategoriesSchema = z.object({
  categories: z.array(z.string().min(1)),
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

    return NextResponse.json({ success: true, data: tenant.categories })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch categories' } },
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
    const validated = manageCategoriesSchema.parse(body)

    const categories = await manageTenantCategories(id, validated.categories)
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update categories' } },
      { status: 500 }
    )
  }
}

