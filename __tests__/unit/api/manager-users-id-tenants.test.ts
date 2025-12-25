/**
 * @jest-environment node
 */
import { GET, POST, DELETE } from '@/app/api/v1/manager/users/[id]/tenants/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

const mockUser = {
  findUnique: jest.fn(),
}
const mockTenantAssignment = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findUnique: jest.fn(),
}

const mockPrisma = {
  user: mockUser,
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

describe('GET /api/v1/manager/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant assignments for IT manager', async () => {
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
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockTenantAssignment.findMany
      .mockResolvedValueOnce([{
        tenantId: 'tenant-1',
      }])
      .mockResolvedValueOnce(mockAssignments)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should return 403 for non-IT manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('POST /api/v1/manager/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validTenantId = '660e8400-e29b-41d4-a716-446655440000'

  it('should create tenant assignment', async () => {
    const mockAssignment = {
      id: 'assignment-1',
      tenantId: validTenantId,
      userId: validUserId,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    // Manager's tenant assignments - must include the tenant being assigned
    mockTenantAssignment.findMany.mockResolvedValue([{
      tenantId: validTenantId,
    }])
    mockUser.findUnique.mockResolvedValue({
      id: validUserId,
      roles: [{
        role: { name: 'AGENT' },
      }],
    })
    mockTenantAssignment.findFirst.mockResolvedValue(null)
    mockTenantAssignment.create.mockResolvedValue(mockAssignment)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/users/${validUserId}/tenants`, {
      method: 'POST',
      body: JSON.stringify({
        tenantId: validTenantId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockAssignment)
  })
})

describe('DELETE /api/v1/manager/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validAssignmentId = '770e8400-e29b-41d4-a716-446655440000'

  it('should delete tenant assignment', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockTenantAssignment.findUnique.mockResolvedValue({
      id: validAssignmentId,
      tenantId: 'tenant-1',
      userId: validUserId,
    })
    mockTenantAssignment.findMany.mockResolvedValue([{
      tenantId: 'tenant-1',
    }])
    mockTenantAssignment.delete.mockResolvedValue({})

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/users/${validUserId}/tenants?assignmentId=${validAssignmentId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

