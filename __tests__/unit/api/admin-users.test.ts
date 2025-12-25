/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/users/route'
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

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list users for admin', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user@example.com',
        roles: [RoleName.END_USER],
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
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

    const request = new NextRequest('http://localhost:3000/api/v1/admin/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.users).toEqual(mockUsers)
  })

  it('should return 403 for non-admin users', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should filter users by role', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/v1/admin/users?role=AGENT')
    await GET(request)

    expect(mockGetUsers).toHaveBeenCalled()
    const callArgs = (mockGetUsers as jest.Mock).mock.calls[0][0]
    expect(callArgs.role).toBe(RoleName.AGENT)
  })
})

describe('POST /api/v1/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create user', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'newuser@example.com',
      roles: [RoleName.END_USER],
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockCreateUser.mockResolvedValue(mockUser as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.user).toEqual(mockUser)
  })

  it('should return 403 if user is not admin', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
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

  describe('error handling', () => {
    it('should return 500 on internal server error in GET', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      })
      mockGetUsers.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 500 on internal server error in POST', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        },
      })
      mockCreateUser.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

