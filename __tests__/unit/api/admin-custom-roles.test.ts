/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/custom-roles/route'
import { NextRequest } from 'next/server'
import { createCustomRole, listCustomRoles } from '@/lib/services/custom-role-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/custom-role-service', () => ({
  createCustomRole: jest.fn(),
  listCustomRoles: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockCreateCustomRole = createCustomRole as jest.MockedFunction<typeof createCustomRole>
const mockListCustomRoles = listCustomRoles as jest.MockedFunction<typeof listCustomRoles>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/custom-roles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list custom roles for admin', async () => {
    const mockRoles = [
      {
        id: 'role-1',
        name: 'senior-agent',
        displayName: 'Senior Agent',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockListCustomRoles.mockResolvedValue(mockRoles as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/custom-roles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.customRoles).toEqual(mockRoles)
  })
})

describe('POST /api/v1/admin/custom-roles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create custom role', async () => {
    const mockRole = {
      id: 'role-1',
      name: 'senior-agent',
      displayName: 'Senior Agent',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockCreateCustomRole.mockResolvedValue(mockRole as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/custom-roles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'senior-agent',
        displayName: 'Senior Agent',
        description: 'Senior agent role',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.customRole).toEqual(mockRole)
  })

  it('should return validation error for invalid name format', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/custom-roles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Name!', // Invalid - contains uppercase and special chars
        displayName: 'Invalid Name',
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

