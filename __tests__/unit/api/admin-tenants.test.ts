/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/tenants/route'
import { NextRequest } from 'next/server'
import { listTenants, createTenant } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  listTenants: jest.fn(),
  createTenant: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockListTenants = listTenants as jest.MockedFunction<typeof listTenants>
const mockCreateTenant = createTenant as jest.MockedFunction<typeof createTenant>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list tenants for admin', async () => {
    const mockTenants = [
      {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockListTenants.mockResolvedValue(mockTenants as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTenants)
  })

  it('should allow IT manager access', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockListTenants.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 403 for non-admin/manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('POST /api/v1/admin/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create tenant for admin', async () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'New Tenant',
      slug: 'new-tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })
    mockCreateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Tenant',
        slug: 'new-tenant',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTenant)
  })

  it('should return validation error for invalid slug', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Tenant',
        slug: 'Invalid Slug!',
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
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      })
      mockListTenants.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 400 on error in POST (route returns 400 for Error instances)', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
          organizationId: 'org-1',
          isGlobalAdmin: false,
        },
      })
      mockCreateTenant.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Tenant',
          slug: 'test-tenant',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      // Route returns 400 for Error instances (line 109)
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

