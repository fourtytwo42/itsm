/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/tenants/[slug]/route'
import { NextRequest } from 'next/server'
import { getTenantBySlug } from '@/lib/services/tenant-service'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantBySlug: jest.fn(),
}))

const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>

describe('GET /api/v1/tenants/:slug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return tenant by slug', async () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
      logo: null,
      description: 'Test description',
      requiresLogin: false,
      categories: [{ category: 'category-1' }],
      kbArticles: [
        {
          article: {
            id: 'article-1',
            title: 'Test Article',
            slug: 'test-article',
          },
        },
      ],
      customFields: [],
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Test Tenant')
    expect(data.data.slug).toBe('test-tenant')
  })

  it('should return 404 if tenant not found', async () => {
    mockGetTenantBySlug.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/non-existent')
    const response = await GET(request, { params: Promise.resolve({ slug: 'non-existent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

