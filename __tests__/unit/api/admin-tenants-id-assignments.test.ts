/**
 * @jest-environment node
 */
import { GET, POST, DELETE } from '@/app/api/v1/admin/tenants/[id]/assignments/route'
import { NextRequest } from 'next/server'
import { getTenantById, createAssignment, deleteAssignment } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  createAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockCreateAssignment = createAssignment as jest.MockedFunction<typeof createAssignment>
const mockDeleteAssignment = deleteAssignment as jest.MockedFunction<typeof deleteAssignment>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants/:id/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant assignments', async () => {
    const mockAssignments = [
      {
        id: 'assignment-1',
        userId: 'user-1',
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
      assignments: mockAssignments,
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/assignments`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockAssignments)
  })

  it('should return 403 for non-admin users', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/assignments`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('POST /api/v1/admin/tenants/:id/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should create tenant assignment', async () => {
    const mockAssignment = {
      id: 'assignment-1',
      userId: validUserId,
      tenantId: validTenantId,
      category: null,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCreateAssignment.mockResolvedValue(mockAssignment as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        userId: validUserId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockAssignment)
  })
})

describe('DELETE /api/v1/admin/tenants/:id/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const validAssignmentId = '770e8400-e29b-41d4-a716-446655440000'

  it('should delete tenant assignment', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockDeleteAssignment.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/assignments?assignmentId=${validAssignmentId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 400 if assignmentId missing', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/assignments`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

