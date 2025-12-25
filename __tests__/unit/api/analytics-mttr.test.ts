/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/analytics/mttr/route'
import { NextRequest } from 'next/server'
import { calculateMTTR } from '@/lib/services/analytics-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/analytics-service', () => ({
  calculateMTTR: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockCalculateMTTR = calculateMTTR as jest.MockedFunction<typeof calculateMTTR>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/analytics/mttr', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return MTTR', async () => {
    const mockMTTR = {
      average: 120,
      median: 100,
      min: 30,
      max: 500,
      ticketsCount: 50,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCalculateMTTR.mockResolvedValue(mockMTTR)

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/mttr')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.mttr).toEqual(mockMTTR)
  })

  it('should filter by date range', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCalculateMTTR.mockResolvedValue({
      average: 100,
      median: 90,
      min: 20,
      max: 400,
      ticketsCount: 30,
    })

    const startDate = '2025-01-01'
    const endDate = '2025-01-31'
    const request = new NextRequest(
      `http://localhost:3000/api/v1/analytics/mttr?startDate=${startDate}&endDate=${endDate}`
    )
    await GET(request)

    expect(mockCalculateMTTR).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
    )
  })

  it('should filter by agentId', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCalculateMTTR.mockResolvedValue({
      average: 110,
      median: 95,
      min: 25,
      max: 450,
      ticketsCount: 20,
    })

    const agentId = 'agent-123'
    const request = new NextRequest(`http://localhost:3000/api/v1/analytics/mttr?agentId=${agentId}`)
    await GET(request)

    expect(mockCalculateMTTR).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId,
      })
    )
  })
})

