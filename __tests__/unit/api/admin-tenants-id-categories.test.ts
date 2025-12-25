/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/tenants/[id]/categories/route'
import { NextRequest } from 'next/server'
import { getTenantById, manageTenantCategories } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  manageTenantCategories: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockManageTenantCategories = manageTenantCategories as jest.MockedFunction<typeof manageTenantCategories>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants/:id/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant categories', async () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Support',
        tenantId: validTenantId,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue({
      id: validTenantId,
      categories: mockCategories,
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/categories`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockCategories)
  })
})

describe('POST /api/v1/admin/tenants/:id/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should manage tenant categories', async () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Support',
        tenantId: validTenantId,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockManageTenantCategories.mockResolvedValue(mockCategories as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/categories`, {
      method: 'POST',
      body: JSON.stringify({
        categories: ['Support', 'Hardware'],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockCategories)
  })
})

