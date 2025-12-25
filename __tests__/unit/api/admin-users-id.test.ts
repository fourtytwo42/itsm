/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/admin/users/[id]/route'
import { NextRequest } from 'next/server'
import { deleteUser, getUserById, updateUser } from '@/lib/services/user-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { RoleName } from '@prisma/client'

jest.mock('@/lib/services/user-service', () => ({
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return user by id for admin', async () => {
    const mockUser = {
      id: validUserId,
      email: 'user@example.com',
      roles: [RoleName.END_USER],
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetUserById.mockResolvedValue(mockUser as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toEqual(mockUser)
  })

  it('should allow IT manager access', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetUserById.mockResolvedValue({
      id: validUserId,
      email: 'user@example.com',
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 403 for non-admin/manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('PUT /api/v1/admin/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update user', async () => {
    const mockUser = {
      id: validUserId,
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetUserById.mockResolvedValue({
      id: validUserId,
      email: 'old@example.com',
    } as any)
    mockUpdateUser.mockResolvedValue(mockUser as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}`, {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toEqual(mockUser)
  })

  it('should return 403 if user is not admin', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['IT_MANAGER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}`, {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

