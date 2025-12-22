import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  listAssets,
  createAsset,
  exportAssetsToCSV,
} from '@/lib/services/asset-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType } from '@prisma/client'
import { z } from 'zod'
import { AssetType, AssetStatus } from '@prisma/client'

const createAssetSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AssetType),
  customAssetTypeId: z.string().uuid().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  assignedToId: z.string().uuid().optional(),
  location: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  customFields: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as AssetType | null
    const status = searchParams.get('status') as AssetStatus | null
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'
    const exportCSV = searchParams.get('export') === 'csv'

    const filters = {
      type: type || undefined,
      status: status || undefined,
      assignedTo: assignedTo || undefined,
      search: search || undefined,
      userId: authContext.user.id,
      userRoles: authContext.user.roles,
      page,
      limit,
      sort,
      order,
    }

    if (exportCSV) {
      const csv = await exportAssetsToCSV(filters)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="assets-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const result = await listAssets(filters)

    return NextResponse.json(
      {
        success: true,
        data: result,
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

export async function POST(request: NextRequest) {
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
    const validatedData = createAssetSchema.parse(body)

    const asset = await createAsset({
      name: validatedData.name,
      type: validatedData.type,
      customAssetTypeId: validatedData.customAssetTypeId,
      category: validatedData.category,
      manufacturer: validatedData.manufacturer,
      model: validatedData.model,
      serialNumber: validatedData.serialNumber,
      status: validatedData.status,
      assignedToId: validatedData.assignedToId,
      location: validatedData.location,
      building: validatedData.building,
      floor: validatedData.floor,
      room: validatedData.room,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
      purchasePrice: validatedData.purchasePrice,
      warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : undefined,
      customFields: validatedData.customFields,
      createdById: authContext.user.id,
      organizationId: authContext.user.organizationId || undefined,
    })

    // Log audit event
    await auditLog(
      AuditEventType.ASSET_CREATED,
      'Asset',
      asset.id,
      authContext.user.id,
      authContext.user.email,
      `Created asset: ${asset.assetNumber} - ${asset.name}`,
      { assetId: asset.id, assetNumber: asset.assetNumber, name: asset.name, type: asset.type },
      request
    )

    return NextResponse.json(
      {
        success: true,
        data: { asset },
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

