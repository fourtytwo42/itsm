/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/assets/[id]/route'
import { NextRequest } from 'next/server'
import { getAssetById, updateAsset, deleteAsset } from '@/lib/services/asset-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { AssetStatus } from '@prisma/client'

jest.mock('@/lib/services/asset-service', () => ({
  getAssetById: jest.fn(),
  updateAsset: jest.fn(),
  deleteAsset: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetAssetById = getAssetById as jest.MockedFunction<typeof getAssetById>
const mockUpdateAsset = updateAsset as jest.MockedFunction<typeof updateAsset>
const mockDeleteAsset = deleteAsset as jest.MockedFunction<typeof deleteAsset>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/assets/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return asset by id', async () => {
    const mockAsset = {
      id: validAssetId,
      assetNumber: 'AST-2025-0001',
      name: 'Laptop',
      status: AssetStatus.IN_USE,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetAssetById.mockResolvedValue(mockAsset as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.asset).toEqual(mockAsset)
  })

  it('should return 404 if asset not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetAssetById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('PUT /api/v1/assets/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update asset', async () => {
    const mockAsset = {
      id: validAssetId,
      assetNumber: 'AST-2025-0001',
      name: 'Updated Laptop',
      status: AssetStatus.RETIRED,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })
    mockGetAssetById.mockResolvedValue({
      id: validAssetId,
      name: 'Old Laptop',
    } as any)
    mockUpdateAsset.mockResolvedValue(mockAsset as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Laptop',
        status: AssetStatus.RETIRED,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.asset).toEqual(mockAsset)
  })

  it('should return 403 if user lacks permissions', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'], // Not allowed to update
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Laptop',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('DELETE /api/v1/assets/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetId = '550e8400-e29b-41d4-a716-446655440000'

  it('should delete asset', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })
    mockGetAssetById.mockResolvedValue({
      id: validAssetId,
      name: 'Laptop',
    } as any)
    mockDeleteAsset.mockResolvedValue({ success: true })

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteAsset).toHaveBeenCalledWith(validAssetId)
  })
})

