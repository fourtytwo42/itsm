import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import {
  getAssetById,
  updateAsset,
  deleteAsset,
} from '@/lib/services/asset-service'
import { z } from 'zod'
import { AssetType, AssetStatus } from '@prisma/client'

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(AssetType).optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  customFields: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const asset = await getAssetById(params.id)

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
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r.role.name === 'AGENT' || r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateAssetSchema.parse(body)

    const asset = await updateAsset(params.id, {
      ...validatedData,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
      warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : undefined,
      assignedToId: validatedData.assignedToId === null ? null : validatedData.assignedToId,
    })

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
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r.role.name === 'AGENT' || r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    await deleteAsset(params.id)

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

