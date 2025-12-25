/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/assets/route'
import { NextRequest } from 'next/server'
import { listAssets, createAsset, exportAssetsToCSV } from '@/lib/services/asset-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { AssetStatus } from '@prisma/client'

jest.mock('@/lib/services/asset-service', () => ({
  listAssets: jest.fn(),
  createAsset: jest.fn(),
  exportAssetsToCSV: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockListAssets = listAssets as jest.MockedFunction<typeof listAssets>
const mockCreateAsset = createAsset as jest.MockedFunction<typeof createAsset>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/assets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list assets', async () => {
    const mockAssets = [
      {
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Laptop',
        status: AssetStatus.IN_USE,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockListAssets.mockResolvedValue({
      assets: mockAssets,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/assets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.assets).toEqual(mockAssets)
  })

  it('should filter assets by status', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockListAssets.mockResolvedValue({
      assets: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/assets?status=IN_USE')
    await GET(request)

    expect(mockListAssets).toHaveBeenCalled()
    const callArgs = (mockListAssets as jest.Mock).mock.calls[0][0]
    // Status comes from URL param as string, route converts it
    expect(callArgs.status).toBe('IN_USE')
  })

  it('should export assets as CSV', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    const { exportAssetsToCSV } = await import('@/lib/services/asset-service')
    ;(exportAssetsToCSV as jest.Mock).mockResolvedValue('name,status\nLaptop,IN_USE')

    const request = new NextRequest('http://localhost:3000/api/v1/assets?export=csv')
    const response = await GET(request)

    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(exportAssetsToCSV).toHaveBeenCalled()
  })
})

describe('POST /api/v1/assets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create asset', async () => {
    const validTypeId = '550e8400-e29b-41d4-a716-446655440000'
    const mockAsset = {
      id: 'asset-1',
      assetNumber: 'AST-2025-0001',
      name: 'New Laptop',
      status: AssetStatus.IN_USE,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
        organizationId: 'org-1',
      },
    })
    mockCreateAsset.mockResolvedValue(mockAsset as any)

    const request = new NextRequest('http://localhost:3000/api/v1/assets', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Laptop',
        customAssetTypeId: validTypeId,
        status: AssetStatus.IN_USE,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.asset).toEqual(mockAsset)
  })

  it('should return validation error for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/assets', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid - empty name
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  describe('error handling', () => {
    it('should return 500 on internal server error in GET', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['AGENT'],
        },
      })
      mockListAssets.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/assets')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 500 on internal server error in POST', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['AGENT'],
          organizationId: 'org-1',
        },
      })
      mockCreateAsset.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Asset',
          customAssetTypeId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

