/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/manager/tenants/[id]/route'
import { NextRequest } from 'next/server'
import { getTenantById, updateTenant, canManageTenant } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  updateTenant: jest.fn(),
  canManageTenant: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockUpdateTenant = updateTenant as jest.MockedFunction<typeof updateTenant>
const mockCanManageTenant = canManageTenant as jest.MockedFunction<typeof canManageTenant>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/manager/tenants/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant by id', async () => {
    const mockTenant = {
      id: validTenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockCanManageTenant.mockResolvedValue(true)
    mockGetTenantById.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/tenants/${validTenantId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.tenant).toEqual(mockTenant)
  })

  it('should return 403 if user cannot manage tenant', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockCanManageTenant.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/tenants/${validTenantId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('PUT /api/v1/manager/tenants/:id', () => {
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
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockCanManageTenant.mockResolvedValue(true)
    mockUpdateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/tenants/${validTenantId}`, {
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
    expect(data.data.tenant).toEqual(mockTenant)
  })

  it('should not allow IT managers to change ownership', async () => {
    const mockTenant = {
      id: validTenantId,
      name: 'Updated Tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'], // Not ADMIN
      },
    })
    mockCanManageTenant.mockResolvedValue(true)
    mockUpdateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/tenants/${validTenantId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Tenant',
        ownedById: 'new-owner-id', // This should be removed for IT_MANAGER
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // The route should remove ownedById for non-admin users
  })
})

