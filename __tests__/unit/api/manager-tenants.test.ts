/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/manager/tenants/route'
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

const mockListTenants = listTenants as jest.MockedFunction<typeof listTenants>
const mockCreateTenant = createTenant as jest.MockedFunction<typeof createTenant>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/manager/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list tenants for IT manager', async () => {
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
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockListTenants.mockResolvedValue(mockTenants as any)

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.tenants).toEqual(mockTenants)
  })

  it('should allow admin access', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockListTenants.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 403 for non-manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should filter by search', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockListTenants.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants?search=test')
    await GET(request)

    expect(mockListTenants).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test',
      })
    )
  })
})

describe('POST /api/v1/manager/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create tenant for IT manager', async () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'New Tenant',
      slug: 'new-tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
        organizationId: 'org-1',
      },
    })
    mockCreateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants', {
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
    expect(data.data.tenant).toEqual(mockTenant)
  })

  it('should return 403 if user is not IT manager', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants', {
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

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should return validation error for invalid slug', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
        organizationId: 'org-1',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/manager/tenants', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Tenant',
        slug: 'Invalid Slug!', // Invalid - contains uppercase and special chars
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
})

