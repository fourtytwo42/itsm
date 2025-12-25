/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/admin/users/[id]/activate/route'
import { NextRequest } from 'next/server'
import { activateUser, deactivateUser, getUserById } from '@/lib/services/user-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/user-service', () => ({
  activateUser: jest.fn(),
  deactivateUser: jest.fn(),
  getUserById: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockActivateUser = activateUser as jest.MockedFunction<typeof activateUser>
const mockDeactivateUser = deactivateUser as jest.MockedFunction<typeof deactivateUser>
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/admin/users/:id/activate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should activate user', async () => {
    const mockUser = {
      id: validUserId,
      email: 'user@example.com',
      isActive: true,
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
      email: 'user@example.com',
    } as any)
    mockActivateUser.mockResolvedValue(mockUser as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/activate?action=activate`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toEqual(mockUser)
    expect(mockActivateUser).toHaveBeenCalledWith(validUserId)
  })

  it('should deactivate user', async () => {
    const mockUser = {
      id: validUserId,
      email: 'user@example.com',
      isActive: false,
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
      email: 'user@example.com',
    } as any)
    mockDeactivateUser.mockResolvedValue(mockUser as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/activate?action=deactivate`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toEqual(mockUser)
    expect(mockDeactivateUser).toHaveBeenCalledWith(validUserId)
  })

  it('should return 403 for non-admin users', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/users/${validUserId}/activate`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validUserId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

