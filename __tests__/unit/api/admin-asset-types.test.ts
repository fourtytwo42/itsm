/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/asset-types/route'
import { NextRequest } from 'next/server'
import { createCustomAssetType, listCustomAssetTypes } from '@/lib/services/asset-type-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/asset-type-service', () => ({
  createCustomAssetType: jest.fn(),
  listCustomAssetTypes: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockCreateCustomAssetType = createCustomAssetType as jest.MockedFunction<typeof createCustomAssetType>
const mockListCustomAssetTypes = listCustomAssetTypes as jest.MockedFunction<typeof listCustomAssetTypes>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/asset-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list asset types for admin', async () => {
    const mockTypes = [
      {
        id: 'type-1',
        name: 'Laptop',
        isActive: true,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockListCustomAssetTypes.mockResolvedValue(mockTypes as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/asset-types')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.assetTypes).toEqual(mockTypes)
  })

  it('should filter by isActive', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockListCustomAssetTypes.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/admin/asset-types?isActive=true')
    await GET(request)

    expect(mockListCustomAssetTypes).toHaveBeenCalled()
  })
})

describe('POST /api/v1/admin/asset-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create asset type', async () => {
    const mockType = {
      id: 'type-1',
      name: 'New Type',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockCreateCustomAssetType.mockResolvedValue(mockType as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/asset-types', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Type',
        description: 'Description',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.assetType).toEqual(mockType)
  })

  it('should return 403 for non-admin/manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/asset-types', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Type',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

