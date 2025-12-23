import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  createCustomAssetType,
  listCustomAssetTypes,
} from '@/lib/services/asset-type-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'

const createAssetTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user is ADMIN or IT_MANAGER
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

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined

    const assetTypes = await listCustomAssetTypes(
      authContext.user.organizationId
    )

    // Filter by isActive if provided
    let filteredTypes = assetTypes
    if (isActive !== undefined) {
      filteredTypes = assetTypes.filter(at => at.isActive === isActive)
    }

    return NextResponse.json({
      success: true,
      data: { assetTypes: filteredTypes },
    })
  } catch (error) {
    console.error('List asset types error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Check if user is ADMIN or IT_MANAGER
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

    const body = await request.json()
    const validatedData = createAssetTypeSchema.parse(body)

    const assetType = await createCustomAssetType({
      ...validatedData,
      organizationId: authContext.user.organizationId,
    })

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_CREATED,
      'CustomAssetType',
      assetType.id,
      authContext.user.id,
      authContext.user.email,
      `Created custom asset type: ${assetType.name}`,
      { assetTypeId: assetType.id, name: assetType.name },
      request
    )

    return NextResponse.json(
      {
        success: true,
        data: { assetType },
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

    console.error('Create asset type error:', error)
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

