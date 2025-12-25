/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/admin/users/[id]/tenants/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

const mockUser = {
  findUnique: jest.fn(),
}
const mockTenant = {
  findMany: jest.fn(),
}
const mockTenantAssignment = {
  findMany: jest.fn(),
  deleteMany: jest.fn(),
  createMany: jest.fn(),
}

const mockPrisma = {
  user: mockUser,
  tenant: mockTenant,
  tenantAssignment: mockTenantAssignment,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant assignments for admin', async () => {
    const mockAssignments = [
      {
        id: 'assignment-1',
        tenantId: 'tenant-1',
        tenant: {
          id: 'tenant-1',
          name: 'Test Tenant',
          slug: 'test-tenant',
          isActive: true,
        },
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockTenantAssignment.findMany.mockResolvedValue(mockAssignments)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should return 403 for IT manager viewing different org', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
        organizationId: 'org-1',
      },
    })
    mockUser.findUnique.mockResolvedValue({
      id: validUserId,
      organizationId: 'org-2', // Different org
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })
})

describe('PUT /api/v1/admin/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validTenantId = '660e8400-e29b-41d4-a716-446655440000'

  it('should update tenant assignments', async () => {
    const mockAssignments = [
      {
        id: 'assignment-1',
        tenantId: validTenantId,
        tenant: {
          id: validTenantId,
          name: 'Test Tenant',
          slug: 'test-tenant',
          isActive: true,
        },
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        isGlobalAdmin: false,
      },
    })
    mockUser.findUnique.mockResolvedValue({
      id: validUserId,
      organizationId: 'org-1',
    })
    mockTenant.findMany.mockResolvedValue([{
      id: validTenantId,
    }])
    mockTenantAssignment.findMany
      .mockResolvedValueOnce([]) // Current assignments
      .mockResolvedValueOnce(mockAssignments) // Updated assignments
    mockTenantAssignment.deleteMany.mockResolvedValue({ count: 0 })
    mockTenantAssignment.createMany.mockResolvedValue({ count: 1 })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/tenants`, {
      method: 'PUT',
      body: JSON.stringify({
        tenantIds: [validTenantId],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should return 404 if user not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        isGlobalAdmin: false,
      },
    })
    mockUser.findUnique.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/tenants`, {
      method: 'PUT',
      body: JSON.stringify({
        tenantIds: [validTenantId],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })
})

