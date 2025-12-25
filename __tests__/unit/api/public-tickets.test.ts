/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/public/tickets/route'
import { NextRequest } from 'next/server'
import { verifyPublicToken } from '@/lib/jwt'
import { listTickets } from '@/lib/services/ticket-service'

jest.mock('@/lib/jwt', () => ({
  verifyPublicToken: jest.fn(),
}))

jest.mock('@/lib/services/ticket-service', () => ({
  listTickets: jest.fn(),
}))

const mockVerifyPublicToken = verifyPublicToken as jest.MockedFunction<typeof verifyPublicToken>
const mockListTickets = listTickets as jest.MockedFunction<typeof listTickets>

describe('GET /api/v1/public/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return tickets with valid public token', async () => {
    const mockTickets = [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
      },
    ]

    mockVerifyPublicToken.mockReturnValue({
      publicId: 'public-token-123',
    } as any)
    mockListTickets.mockResolvedValue({
      tickets: mockTickets,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/public/tickets', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      tickets: mockTickets,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    })
    expect(mockVerifyPublicToken).toHaveBeenCalledWith('valid-token')
    expect(mockListTickets).toHaveBeenCalledWith({
      publicTokenId: 'public-token-123',
    })
  })

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/public/tickets')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 401 if authorization header does not start with Bearer', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/public/tickets', {
      headers: {
        authorization: 'Invalid token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 401 if token is invalid', async () => {
    mockVerifyPublicToken.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const request = new NextRequest('http://localhost:3000/api/v1/public/tickets', {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_TOKEN')
  })
})

