import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getCustomAssetTypeById,
  createAssetTypeCustomField,
  listAssetTypeCustomFields,
} from '@/lib/services/asset-type-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const idSchema = z.object({
  id: z.string().uuid(),
})

const createFieldSchema = z.object({
  fieldName: z.string().min(1),
  label: z.string().min(1),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox']),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.any().optional(),
  placeholder: z.string().optional(),
  order: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User must belong to an organization' } },
        { status: 400 }
      )
    }

    const { id } = idSchema.parse(await params)
    
    // Verify asset type belongs to user's organization
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)
    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    const fields = await listAssetTypeCustomFields(id)

    return NextResponse.json({
      success: true,
      data: { fields },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('List custom fields error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const hasPermission = authContext.user.roles.some(
      (r) => r === 'ADMIN' || r === 'IT_MANAGER'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User must belong to an organization' } },
        { status: 400 }
      )
    }

    const { id } = idSchema.parse(await params)
    
    // Verify asset type belongs to user's organization
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)
    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createFieldSchema.parse(body)

    const field = await createAssetTypeCustomField({
      ...validatedData,
      customAssetTypeId: id,
    })

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_CREATED,
      'AssetTypeCustomField',
      field.id,
      authContext.user.id,
      authContext.user.email,
      `Created custom field: ${field.label} for asset type: ${assetType.name}`,
      { fieldId: field.id, fieldName: field.fieldName, label: field.label, assetTypeId: id },
      request
    )

    return NextResponse.json(
      {
        success: true,
        data: { field },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    console.error('Create custom field error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

