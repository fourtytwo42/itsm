/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/agent/users/[id]/tenants/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

const mockTenantAssignment = {
  findMany: jest.fn(),
}

const mockPrisma = {
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

describe('GET /api/v1/agent/users/:id/tenants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant assignments for agent', async () => {
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
        id: 'agent-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
      },
    })
    // Mock agent's tenant assignments
    mockTenantAssignment.findMany
      .mockResolvedValueOnce([{
        tenantId: 'tenant-1',
      }])
      .mockResolvedValueOnce([{
        tenantId: 'tenant-1',
      }])
      .mockResolvedValueOnce(mockAssignments)

    const request = new NextRequest(`http://localhost:3000/api/v1/agent/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should return empty array if agent has no tenant assignments', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'agent-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
      },
    })
    mockTenantAssignment.findMany.mockResolvedValue([])

    const request = new NextRequest(`http://localhost:3000/api/v1/agent/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should return 403 for non-agent roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/agent/users/${validUserId}/tenants`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

