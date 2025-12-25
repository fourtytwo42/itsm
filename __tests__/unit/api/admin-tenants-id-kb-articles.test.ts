/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/tenants/[id]/kb-articles/route'
import { NextRequest } from 'next/server'
import { getTenantById, manageTenantKBArticles } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  manageTenantKBArticles: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockManageTenantKBArticles = manageTenantKBArticles as jest.MockedFunction<typeof manageTenantKBArticles>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants/:id/kb-articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant KB articles', async () => {
    const mockArticles = [
      {
        id: 'article-1',
        title: 'How to reset password',
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
      kbArticles: mockArticles,
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/kb-articles`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticles)
  })
})

describe('POST /api/v1/admin/tenants/:id/kb-articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const validArticleId = '660e8400-e29b-41d4-a716-446655440000'

  it('should manage tenant KB articles', async () => {
    const mockArticles = [
      {
        id: validArticleId,
        title: 'How to reset password',
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
    mockManageTenantKBArticles.mockResolvedValue(mockArticles as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/kb-articles`, {
      method: 'POST',
      body: JSON.stringify({
        articleIds: [validArticleId],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticles)
  })
})

