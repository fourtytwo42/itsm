/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/manager/agents/[id]/reset-password/route'
import { NextRequest } from 'next/server'
import { getUserById, updateUser, canManageAgentInOrganization } from '@/lib/services/user-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/user-service', () => ({
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  canManageAgentInOrganization: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed-${password}`)),
}))

const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>
const mockCanManageAgentInOrganization = canManageAgentInOrganization as jest.MockedFunction<typeof canManageAgentInOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/manager/agents/:id/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAgentId = '550e8400-e29b-41d4-a716-446655440000'

  it('should reset agent password', async () => {
    const mockAgent = {
      id: validAgentId,
      email: 'agent@example.com',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetUserById.mockResolvedValue(mockAgent as any)
    mockCanManageAgentInOrganization.mockResolvedValue(true)
    mockUpdateUser.mockResolvedValue({} as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}/reset-password`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.temporaryPassword).toBeDefined()
    expect(data.data.message).toBeDefined()
  })

  it('should return 404 if agent not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetUserById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}/reset-password`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('should return 403 if user cannot manage agent', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetUserById.mockResolvedValue({
      id: validAgentId,
      email: 'agent@example.com',
    } as any)
    mockCanManageAgentInOrganization.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}/reset-password`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

