/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/tenants/[slug]/tickets/route'
import { NextRequest } from 'next/server'
import { getTenantBySlug } from '@/lib/services/tenant-service'
import { listTickets, createTicket } from '@/lib/services/ticket-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { TicketPriority } from '@prisma/client'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantBySlug: jest.fn(),
}))

jest.mock('@/lib/services/ticket-service', () => ({
  listTickets: jest.fn(),
  createTicket: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

jest.mock('@/lib/jwt', () => ({
  verifyPublicToken: jest.fn(),
}))

const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>
const mockListTickets = listTickets as jest.MockedFunction<typeof listTickets>
const mockCreateTicket = createTicket as jest.MockedFunction<typeof createTicket>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/tenants/:slug/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return tickets for tenant with auth', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
    }
    const mockTickets = [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
      },
    ]

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
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

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/tickets')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return empty array for unauthenticated user without public token', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/tickets')
    const response = await GET(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should return 404 if tenant not found', async () => {
    mockGetTenantBySlug.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/nonexistent/tickets')
    const response = await GET(request, { params: Promise.resolve({ slug: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v1/tenants/:slug/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create ticket for tenant', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
      requiresLogin: false,
      categories: [{ category: 'Support' }],
      customFields: [],
      organizationId: 'org-1',
    }
    const mockTicket = {
      id: 'ticket-1',
      ticketNumber: 'TKT-2025-0001',
      subject: 'New ticket',
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)
    mockGetAuthContext.mockResolvedValue(null)
    mockCreateTicket.mockResolvedValue(mockTicket as any)

    // Mock fetch for public token generation
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { publicId: 'public-token-123' },
      }),
    }) as jest.Mock

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'New ticket',
        description: 'Ticket description',
        category: 'Support',
        name: 'John Doe',
        email: 'john@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTicket)
  })

  it('should return 401 if tenant requires login', async () => {
    const mockTenant = {
      id: 'tenant-1',
      slug: 'test-tenant',
      requiresLogin: true,
    }

    mockGetTenantBySlug.mockResolvedValue(mockTenant as any)
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/tenants/test-tenant/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'New ticket',
        description: 'Ticket description',
        category: 'Support',
        name: 'John Doe',
        email: 'john@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-tenant' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })
})

