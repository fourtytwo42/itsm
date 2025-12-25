/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/assets/[id]/tickets/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockTicketAssetRelation = {
  findMany: jest.fn(),
}

const mockPrisma = {
  ticketAssetRelation: mockTicketAssetRelation,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/assets/:id/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tickets for asset', async () => {
    const mockRelations = [
      {
        ticket: {
          id: 'ticket-1',
          ticketNumber: 'TKT-2025-0001',
          subject: 'Test ticket',
          status: 'OPEN',
          priority: 'HIGH',
          createdAt: new Date(),
          requester: {
            id: 'user-1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          assignee: null,
        },
        relationType: 'AFFECTED_BY',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockTicketAssetRelation.findMany.mockResolvedValue(mockRelations)

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}/tickets`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].ticketNumber).toBe('TKT-2025-0001')
    expect(mockTicketAssetRelation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assetId: validAssetId },
      })
    )
  })

  it('should return empty array if no tickets', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockTicketAssetRelation.findMany.mockResolvedValue([])

    const request = new NextRequest(`http://localhost:3000/api/v1/assets/${validAssetId}/tickets`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })
})

