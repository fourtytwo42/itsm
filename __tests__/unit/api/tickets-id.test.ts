/**
 * @jest-environment node
 */
import { GET, PATCH, POST } from '@/app/api/v1/tickets/[id]/route'
import { NextRequest } from 'next/server'
import { getTicketById, updateTicket, addTicketComment } from '@/lib/services/ticket-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { TicketStatus, TicketPriority } from '@prisma/client'

jest.mock('@/lib/services/ticket-service', () => ({
  getTicketById: jest.fn(),
  updateTicket: jest.fn(),
  addTicketComment: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/services/ticket-history-service', () => ({
  createTicketHistory: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

jest.mock('@/lib/jwt', () => ({
  verifyPublicToken: jest.fn(),
}))

const mockGetTicketById = getTicketById as jest.MockedFunction<typeof getTicketById>
const mockUpdateTicket = updateTicket as jest.MockedFunction<typeof updateTicket>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/tickets/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTicketId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should return ticket by id for authenticated user', async () => {
    const mockTicket = {
      id: validTicketId,
      ticketNumber: 'TKT-2025-0001',
      subject: 'Test ticket',
      requesterId: validUserId,
      assigneeId: null,
    }

    mockGetTicketById.mockResolvedValue(mockTicket as any)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTicket)
  })

  it('should return 404 if ticket not found', async () => {
    mockGetTicketById.mockResolvedValue(null)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('should return 401 if not authenticated and no public token', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })
})

describe('PATCH /api/v1/tickets/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTicketId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should update ticket', async () => {
    const mockTicket = {
      id: validTicketId,
      ticketNumber: 'TKT-2025-0001',
      subject: 'Updated subject',
      status: TicketStatus.IN_PROGRESS,
    }

    mockGetTicketById.mockResolvedValue({
      id: validTicketId,
      requesterId: validUserId,
    } as any)
    mockUpdateTicket.mockResolvedValue(mockTicket as any)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        subject: 'Updated subject',
        status: TicketStatus.IN_PROGRESS,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTicket)
  })

  it('should return 500 on internal error', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetTicketById.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest(`http://localhost:3000/api/v1/tickets/${validTicketId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validTicketId }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})

