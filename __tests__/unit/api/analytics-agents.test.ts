/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/analytics/agents/route'
import { NextRequest } from 'next/server'
import { getAgentPerformance } from '@/lib/services/analytics-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/analytics-service', () => ({
  getAgentPerformance: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetAgentPerformance = getAgentPerformance as jest.MockedFunction<typeof getAgentPerformance>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/analytics/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return agent performance for admin', async () => {
    const mockAgents = [
      {
        agentId: 'agent-1',
        agentName: 'Agent One',
        ticketsResolved: 10,
        averageResponseTime: 120,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetAgentPerformance.mockResolvedValue(mockAgents)

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/agents')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.agents).toEqual(mockAgents)
  })

  it('should return agent performance for IT manager', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'manager@example.com',
        roles: ['IT_MANAGER'],
      },
    })
    mockGetAgentPerformance.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/agents')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 403 for non-manager roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/agents')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should filter by date range', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetAgentPerformance.mockResolvedValue([])

    const startDate = '2025-01-01'
    const endDate = '2025-01-31'
    const request = new NextRequest(
      `http://localhost:3000/api/v1/analytics/agents?startDate=${startDate}&endDate=${endDate}`
    )
    await GET(request)

    expect(mockGetAgentPerformance).toHaveBeenCalledWith(
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
    mockGetAgentPerformance.mockResolvedValue([])

    const agentId = 'agent-123'
    const request = new NextRequest(`http://localhost:3000/api/v1/analytics/agents?agentId=${agentId}`)
    await GET(request)

    expect(mockGetAgentPerformance).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId,
      })
    )
  })

  describe('error handling', () => {
    it('should return 500 on internal server error', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['ADMIN'],
        },
      })
      mockGetAgentPerformance.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/agents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

