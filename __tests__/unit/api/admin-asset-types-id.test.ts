/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/admin/asset-types/[id]/route'
import { NextRequest } from 'next/server'
import { getCustomAssetTypeById, updateCustomAssetType, deleteCustomAssetType } from '@/lib/services/asset-type-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/asset-type-service', () => ({
  getCustomAssetTypeById: jest.fn(),
  updateCustomAssetType: jest.fn(),
  deleteCustomAssetType: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetCustomAssetTypeById = getCustomAssetTypeById as jest.MockedFunction<typeof getCustomAssetTypeById>
const mockUpdateCustomAssetType = updateCustomAssetType as jest.MockedFunction<typeof updateCustomAssetType>
const mockDeleteCustomAssetType = deleteCustomAssetType as jest.MockedFunction<typeof deleteCustomAssetType>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/asset-types/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTypeId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return asset type by id', async () => {
    const mockType = {
      id: validTypeId,
      name: 'Laptop',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue(mockType as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validTypeId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.assetType).toEqual(mockType)
  })

  it('should return 404 if asset type not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validTypeId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('PUT /api/v1/admin/asset-types/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTypeId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update asset type', async () => {
    const mockType = {
      id: validTypeId,
      name: 'Updated Type',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    // The route calls getCustomAssetTypeById after update to return the updated type
    mockGetCustomAssetTypeById.mockResolvedValue(mockType as any)
    mockUpdateCustomAssetType.mockResolvedValue(mockType as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validTypeId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Type',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.assetType).toEqual(mockType)
  })
})

describe('DELETE /api/v1/admin/asset-types/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTypeId = '550e8400-e29b-41d4-a716-446655440000'

  it('should delete asset type', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue({
      id: validTypeId,
      name: 'Type to Delete',
    } as any)
    mockDeleteCustomAssetType.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validTypeId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteCustomAssetType).toHaveBeenCalledWith(validTypeId, 'org-1')
  })
})

