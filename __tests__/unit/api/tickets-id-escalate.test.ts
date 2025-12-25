/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/tickets/[id]/escalate/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'
import { getAvailableRolesForEscalation, getAvailableUsersForEscalation } from '@/lib/services/custom-role-service'
import { RoleName } from '@prisma/client'

const mockTicket = {
  findUnique: jest.fn(),
  update: jest.fn(),
}
const mockCustomRole = {
  findUnique: jest.fn(),
}
const mockUser = {
  findUnique: jest.fn(),
}
const mockTenantAssignment = {
  findFirst: jest.fn(),
}

const mockPrisma = {
  ticket: mockTicket,
  customRole: mockCustomRole,
  user: mockUser,
  tenantAssignment: mockTenantAssignment,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/services/custom-role-service', () => ({
  getAvailableRolesForEscalation: jest.fn(),
  getAvailableUsersForEscalation: jest.fn(),
}))

jest.mock('@/lib/services/ticket-history-service', () => ({
  createTicketHistory: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>
const mockGetAvailableRolesForEscalation = getAvailableRolesForEscalation as jest.MockedFunction<typeof getAvailableRolesForEscalation>
const mockGetAvailableUsersForEscalation = getAvailableUsersForEscalation as jest.MockedFunction<typeof getAvailableUsersForEscalation>

describe('GET /api/v1/tickets/:id/escalate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTicketId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return available roles and users for escalation', async () => {
    const mockRoles = [{ id: 'role-1', name: 'Senior Agent' }]
    const mockUsers = [{ id: 'user-1', email: 'agent@example.com' }]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
        organizationId: 'org-1',
      },
    })
    mockTicket.findUnique.mockResolvedValue({
      id: validTicketId,
      tenantId: 'tenant-1',
      organizationId: 'org-1',
    })
    mockGetAvailableRolesForEscalation.mockResolvedValue(mockRoles as any)
    mockGetAvailableUsersForEscalation.mockResolvedValue(mockUsers as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}/escalate`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.availableRoles).toEqual(mockRoles)
    expect(data.data.availableUsers).toEqual(mockUsers)
  })

  it('should return 400 if user has no organization', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        organizationId: undefined,
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}/escalate`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('BAD_REQUEST')
  })
})

describe('POST /api/v1/tickets/:id/escalate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTicketId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should escalate ticket to system role', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'agent-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
        organizationId: 'org-1',
      },
    })
    mockTicket.findUnique.mockResolvedValue({
      id: validTicketId,
      organizationId: 'org-1',
      assigneeId: null,
      organization: {},
    })
    mockTicket.update.mockResolvedValue({
      id: validTicketId,
      escalatedToSystemRole: RoleName.IT_MANAGER,
      escalatedByUser: { id: 'agent-1' },
      escalatedToUser: null,
      escalatedToCustomRole: null,
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({
        escalatedToSystemRole: RoleName.IT_MANAGER,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.ticket).toBeDefined()
  })

  it('should return 403 if user cannot escalate', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({
        escalatedToSystemRole: RoleName.IT_MANAGER,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

