/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/admin/custom-roles/[id]/route'
import { NextRequest } from 'next/server'
import { getCustomRoleById, updateCustomRole, deleteCustomRole } from '@/lib/services/custom-role-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/custom-role-service', () => ({
  getCustomRoleById: jest.fn(),
  updateCustomRole: jest.fn(),
  deleteCustomRole: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetCustomRoleById = getCustomRoleById as jest.MockedFunction<typeof getCustomRoleById>
const mockUpdateCustomRole = updateCustomRole as jest.MockedFunction<typeof updateCustomRole>
const mockDeleteCustomRole = deleteCustomRole as jest.MockedFunction<typeof deleteCustomRole>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/custom-roles/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validRoleId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return custom role by id', async () => {
    const mockRole = {
      id: validRoleId,
      name: 'senior-agent',
      displayName: 'Senior Agent',
      organizationId: 'org-1',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomRoleById.mockResolvedValue(mockRole as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/custom-roles/${validRoleId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validRoleId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.customRole).toEqual(mockRole)
  })

  it('should return 403 if role belongs to different organization', async () => {
    const mockRole = {
      id: validRoleId,
      name: 'senior-agent',
      organizationId: 'org-2', // Different org
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomRoleById.mockResolvedValue(mockRole as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/custom-roles/${validRoleId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validRoleId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('PUT /api/v1/admin/custom-roles/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validRoleId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update custom role', async () => {
    const mockRole = {
      id: validRoleId,
      name: 'senior-agent',
      displayName: 'Updated Display Name',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomRoleById.mockResolvedValue({
      id: validRoleId,
      organizationId: 'org-1',
    } as any)
    mockUpdateCustomRole.mockResolvedValue(mockRole as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/custom-roles/${validRoleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        displayName: 'Updated Display Name',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validRoleId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.customRole).toEqual(mockRole)
  })
})

describe('DELETE /api/v1/admin/custom-roles/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validRoleId = '550e8400-e29b-41d4-a716-446655440000'

  it('should delete custom role', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomRoleById.mockResolvedValue({
      id: validRoleId,
      organizationId: 'org-1',
    } as any)
    mockDeleteCustomRole.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/custom-roles/${validRoleId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validRoleId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

