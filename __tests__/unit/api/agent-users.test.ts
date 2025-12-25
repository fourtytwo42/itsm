/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/agent/users/route'
import { NextRequest } from 'next/server'
import { getUsers } from '@/lib/services/user-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/user-service', () => ({
  getUsers: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/agent/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list users for agent', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'agent-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
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

    const request = new NextRequest('http://localhost:3000/api/v1/agent/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.users).toEqual(mockUsers)
  })

  it('should return 403 for non-agent roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/agent/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should filter by search', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'agent-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
      },
    })
    mockGetUsers.mockResolvedValue({
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/agent/users?search=test')
    await GET(request)

    expect(mockGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test',
      })
    )
  })
})

