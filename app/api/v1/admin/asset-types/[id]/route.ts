import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getCustomAssetTypeById,
  updateCustomAssetType,
  deleteCustomAssetType,
} from '@/lib/services/asset-type-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const idSchema = z.object({
  id: z.string().uuid(),
})

const updateAssetTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
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
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { assetType },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('Get asset type error:', error)
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

export async function PUT(
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
    const body = await request.json()
    const validatedData = updateAssetTypeSchema.parse(body)

    await updateCustomAssetType(id, authContext.user.organizationId, validatedData)

    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_UPDATED,
      'CustomAssetType',
      id,
      authContext.user.id,
      authContext.user.email,
      `Updated custom asset type: ${assetType?.name || id}`,
      { assetTypeId: id, updates: validatedData },
      request
    )

    return NextResponse.json({
      success: true,
      data: { assetType },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('Update asset type error:', error)
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
    const assetType = await getCustomAssetTypeById(id, authContext.user.organizationId)

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Asset type not found' } },
        { status: 404 }
      )
    }

    await deleteCustomAssetType(id, authContext.user.organizationId)

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_DELETED,
      'CustomAssetType',
      id,
      authContext.user.id,
      authContext.user.email,
      `Deleted custom asset type: ${assetType.name}`,
      { assetTypeId: id, name: assetType.name },
      request
    )

    return NextResponse.json({
      success: true,
      data: { message: 'Asset type deleted successfully' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    console.error('Delete asset type error:', error)
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

