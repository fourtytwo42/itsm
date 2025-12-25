/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/tenants/[slug]/organization/route'
import { NextRequest } from 'next/server'
import { getTenantBySlug } from '@/lib/services/tenant-service'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantBySlug: jest.fn(),
}))

const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>

describe('GET /api/v1/tenants/:slug/organization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return organization for tenant', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
      organization: {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
        logo: '/logo.png',
      },
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/organization')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('org-1')
    expect(data.data.name).toBe('Test Organization')
  })

  it('should return 404 if tenant not found', async () => {
    mockGetTenantBySlug.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/nonexistent/organization')
    const response = await GET(request, { params: Promise.resolve({ slug: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('should return 404 if tenant has no organization', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
      organization: null,
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/organization')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

