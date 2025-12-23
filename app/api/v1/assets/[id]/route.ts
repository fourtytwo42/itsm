import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  getAssetById,
  updateAsset,
  deleteAsset,
} from '@/lib/services/asset-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'
import { AssetStatus } from '@prisma/client'

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  customFields: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params
    const asset = await getAssetById(id)

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Asset not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { asset },
      },
      { status: 200 }
    )
  } catch (error) {
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

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateAssetSchema.parse(body)

    const { id } = await params

    // Get old asset data for audit
    const oldAsset = await getAssetById(id)

    const asset = await updateAsset(id, {
      ...validatedData,
      assignedToId: validatedData.assignedToId === null ? undefined : validatedData.assignedToId,
    })

    // Build changes object for audit
    const changes: Record<string, any> = {}
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        const oldValue = (oldAsset as any)?.[key]
        const newValue = validatedData[key as keyof typeof validatedData]
        if (oldValue !== newValue) {
          changes[key] = { old: oldValue, new: newValue }
        }
      }
    })

    // Log audit event for assignment changes
    if (validatedData.assignedToId !== undefined && oldAsset && oldAsset.assignedToId !== validatedData.assignedToId) {
      await auditLog(
        AuditEventType.ASSET_ASSIGNED,
        'Asset',
        asset.id,
        authContext.user.id,
        authContext.user.email,
        `Assigned asset ${asset.assetNumber} to ${validatedData.assignedToId || 'unassigned'}`,
        { 
          assetId: asset.id, 
          assetNumber: asset.assetNumber, 
          oldAssigneeId: oldAsset.assignedToId, 
          newAssigneeId: validatedData.assignedToId,
          changes 
        },
        request
      )
    } else if (Object.keys(changes).length > 0) {
      // Log general update with detailed changes
      await auditLog(
        AuditEventType.ASSET_UPDATED,
        'Asset',
        asset.id,
        authContext.user.id,
        authContext.user.email,
        `Updated asset: ${asset.assetNumber}`,
        { 
          assetId: asset.id, 
          assetNumber: asset.assetNumber, 
          changes 
        },
        request
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { asset },
      },
      { status: 200 }
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

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get asset data for audit before deletion
    const asset = await getAssetById(id)

    await deleteAsset(id)

    // Log audit event
    if (asset) {
      await auditLog(
        AuditEventType.ASSET_DELETED,
        'Asset',
        id,
        authContext.user.id,
        authContext.user.email,
        `Deleted asset: ${asset.assetNumber}`,
        { assetId: id, assetNumber: asset.assetNumber, name: asset.name },
        request
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { message: 'Asset deleted successfully' },
      },
      { status: 200 }
    )
  } catch (error) {
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

