/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/manager/agents/[id]/route'
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

const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>
const mockCanManageAgentInOrganization = canManageAgentInOrganization as jest.MockedFunction<typeof canManageAgentInOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/manager/agents/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAgentId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return agent by id', async () => {
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
    mockCanManageAgentInOrganization.mockResolvedValue(true)
    mockGetUserById.mockResolvedValue(mockAgent as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.agent).toEqual(mockAgent)
  })

  it('should return 403 if user cannot manage agent', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockCanManageAgentInOrganization.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('PUT /api/v1/manager/agents/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAgentId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update agent', async () => {
    const mockAgent = {
      id: validAgentId,
      email: 'updated@example.com',
      firstName: 'Updated',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'manager-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockCanManageAgentInOrganization.mockResolvedValue(true)
    mockUpdateUser.mockResolvedValue(mockAgent as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/manager/agents/${validAgentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@example.com',
        firstName: 'Updated',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validAgentId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.agent).toEqual(mockAgent)
  })
})

