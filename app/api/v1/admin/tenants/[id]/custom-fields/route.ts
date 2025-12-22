import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { createCustomField, updateCustomField, deleteCustomField } from '@/lib/services/tenant-service'
import { z } from 'zod'
import { CustomFieldType } from '@prisma/client'

const createCustomFieldSchema = z.object({
  label: z.string().min(1),
  fieldType: z.nativeEnum(CustomFieldType),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  order: z.number().optional(),
})

const updateCustomFieldSchema = z.object({
  label: z.string().min(1).optional(),
  fieldType: z.nativeEnum(CustomFieldType).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  order: z.number().optional(),
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

    return NextResponse.json({ success: true, data: tenant.customFields })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch custom fields' } },
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
    const validated = createCustomFieldSchema.parse(body)

    const customField = await createCustomField({
      tenantId: id,
      ...validated,
    })

    return NextResponse.json({ success: true, data: customField }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create custom field' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const { fieldId, ...updateData } = body

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fieldId is required' } },
        { status: 400 }
      )
    }

    const validated = updateCustomFieldSchema.parse(updateData)
    const customField = await updateCustomField(fieldId, validated)

    return NextResponse.json({ success: true, data: customField })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update custom field' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const fieldId = searchParams.get('fieldId')

    if (!fieldId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fieldId is required' } },
        { status: 400 }
      )
    }

    await deleteCustomField(fieldId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to delete custom field' } },
      { status: 500 }
    )
  }
}

