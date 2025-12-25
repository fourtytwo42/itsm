/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/manager/agents/route'
import { NextRequest } from 'next/server'
import { getUsers, createUser } from '@/lib/services/user-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { RoleName } from '@prisma/client'

jest.mock('@/lib/services/user-service', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/manager/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list users for IT manager', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'agent@example.com',
        roles: [RoleName.AGENT],
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetUsers.mockResolvedValue({
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.users).toEqual(mockUsers)
  })

  it('should allow admin access', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetUsers.mockResolvedValue({
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents')
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

    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('POST /api/v1/manager/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create agent for IT manager', async () => {
    const mockAgent = {
      id: 'agent-1',
      email: 'newagent@example.com',
      roles: [RoleName.AGENT],
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
        organizationId: 'org-1',
      },
    })
    mockCreateUser.mockResolvedValue(mockAgent as any)

    const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newagent@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Agent',
        tenantId: validTenantId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.agent).toEqual(mockAgent)
  })

  it('should return 403 if user is not IT manager', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
      },
    })

    const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newagent@example.com',
        password: 'password123',
        tenantId: validTenantId,
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

  it('should return validation error for invalid roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
        organizationId: 'org-1',
      },
    })

    const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
    const request = new NextRequest('http://localhost:3000/api/v1/manager/agents', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newagent@example.com',
        password: 'password123',
        tenantId: validTenantId,
        roles: [RoleName.ADMIN], // Invalid - IT managers can't create admin accounts
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

