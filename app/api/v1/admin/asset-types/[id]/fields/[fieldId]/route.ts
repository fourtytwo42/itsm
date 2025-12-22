import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getCustomAssetTypeById,
  getAssetTypeCustomFieldById,
  updateAssetTypeCustomField,
  deleteAssetTypeCustomField,
} from '@/lib/services/asset-type-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid(),
  fieldId: z.string().uuid(),
})

const updateFieldSchema = z.object({
  label: z.string().min(1).optional(),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox']).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.any().optional(),
  placeholder: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
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

    const { id, fieldId } = paramsSchema.parse(await params)
    
    // Verify asset type belongs to user's organization
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)
    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    const field = await getAssetTypeCustomFieldById(fieldId, id)
    if (!field) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom field not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateFieldSchema.parse(body)

    await updateAssetTypeCustomField(fieldId, id, validatedData)

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_UPDATED,
      'AssetTypeCustomField',
      fieldId,
      authContext.user.id,
      authContext.user.email,
      `Updated custom field: ${field.label} for asset type: ${assetType.name}`,
      { fieldId, updates: validatedData, assetTypeId: id },
      request
    )

    const updatedField = await getAssetTypeCustomFieldById(fieldId, id)

    return NextResponse.json({
      success: true,
      data: { field: updatedField },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('Update custom field error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
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

    const { id, fieldId } = paramsSchema.parse(await params)
    
    // Verify asset type belongs to user's organization
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)
    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    const field = await getAssetTypeCustomFieldById(fieldId, id)
    if (!field) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom field not found' } },
        { status: 404 }
      )
    }

    await deleteAssetTypeCustomField(fieldId, id)

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_DELETED,
      'AssetTypeCustomField',
      fieldId,
      authContext.user.id,
      authContext.user.email,
      `Deleted custom field: ${field.label} from asset type: ${assetType.name}`,
      { fieldId, label: field.label, assetTypeId: id },
      request
    )

    return NextResponse.json({
      success: true,
      data: { message: 'Custom field deleted successfully' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('Delete custom field error:', error)
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

