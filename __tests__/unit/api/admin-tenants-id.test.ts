/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/admin/tenants/[id]/route'
import { NextRequest } from 'next/server'
import { getTenantById, updateTenant, deleteTenant } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockUpdateTenant = updateTenant as jest.MockedFunction<typeof updateTenant>
const mockDeleteTenant = deleteTenant as jest.MockedFunction<typeof deleteTenant>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant by id for admin', async () => {
    const mockTenant = {
      id: validTenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTenant)
  })

  it('should return 404 if tenant not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('PUT /api/v1/admin/tenants/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update tenant', async () => {
    const mockTenant = {
      id: validTenantId,
      name: 'Updated Tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue({
      id: validTenantId,
      name: 'Old Tenant',
    } as any)
    mockUpdateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Tenant',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTenant)
  })
})

describe('DELETE /api/v1/admin/tenants/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should delete tenant', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue({
      id: validTenantId,
      name: 'Test Tenant',
    } as any)
    mockDeleteTenant.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteTenant).toHaveBeenCalledWith(validTenantId)
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
      mockGetTenantById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/tenant-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'tenant-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 400 on error in PUT (route returns 400 for Error instances)', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      })
      mockGetTenantById.mockResolvedValue({
        id: 'tenant-1',
        name: 'Existing Tenant',
      } as any)
      mockUpdateTenant.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/tenant-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Tenant',
        }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'tenant-1' }) })
      const data = await response.json()

      // Route returns 400 for Error instances (line 107)
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 500 on internal server error in DELETE', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      })
      mockDeleteTenant.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/tenant-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'tenant-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

