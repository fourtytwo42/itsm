/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/tickets/route'
import { NextRequest } from 'next/server'
import { listTickets, createTicket } from '@/lib/services/ticket-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { auditLog } from '@/lib/middleware/audit'
import { TicketPriority, TicketStatus } from '@prisma/client'

jest.mock('@/lib/services/ticket-service', () => ({
  listTickets: jest.fn(),
  createTicket: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockListTickets = listTickets as jest.MockedFunction<typeof listTickets>
const mockCreateTicket = createTicket as jest.MockedFunction<typeof createTicket>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>
const mockAuditLog = auditLog as jest.MockedFunction<typeof auditLog>

describe('GET /api/v1/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list tickets', async () => {
    const mockTickets = [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockListTickets.mockResolvedValue({
      tickets: mockTickets,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/tickets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTickets)
    expect(mockListTickets).toHaveBeenCalled()
  })

  it('should filter tickets by status', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockListTickets.mockResolvedValue({
      tickets: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/tickets?status=NEW')
    await GET(request)

    expect(mockListTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TicketStatus.NEW,
      })
    )
  })

  it('should handle validation errors', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tickets?page=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v1/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create ticket', async () => {
    const mockTicket = {
      id: 'ticket-1',
      ticketNumber: 'TKT-2025-0001',
      subject: 'Test ticket',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
      },
    })
    mockCreateTicket.mockResolvedValue(mockTicket as any)

    const request = new NextRequest('http://localhost:3000/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Test ticket',
        description: 'Test description',
        priority: TicketPriority.MEDIUM,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTicket)
    expect(mockCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Test ticket',
        description: 'Test description',
        priority: TicketPriority.MEDIUM,
        requesterId: 'user-1',
      })
    )
    expect(mockAuditLog).toHaveBeenCalled()
  })


  it('should return validation error for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'AB', // Too short
        description: 'Test',
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

