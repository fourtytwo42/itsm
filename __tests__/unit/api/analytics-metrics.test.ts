/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/analytics/metrics/route'
import { NextRequest } from 'next/server'
import { getDashboardMetrics } from '@/lib/services/analytics-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/analytics-service', () => ({
  getDashboardMetrics: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetDashboardMetrics = getDashboardMetrics as jest.MockedFunction<typeof getDashboardMetrics>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/analytics/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return dashboard metrics', async () => {
    const mockMetrics = {
      totalTickets: 100,
      openTickets: 25,
      resolvedToday: 5,
      averageResponseTime: 120,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/metrics')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.metrics).toEqual(mockMetrics)
  })

  it('should filter metrics by date range', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetDashboardMetrics.mockResolvedValue({
      totalTickets: 50,
      openTickets: 10,
      resolvedToday: 2,
      averageResponseTime: 100,
    })

    const startDate = '2025-01-01'
    const endDate = '2025-01-31'
    const request = new NextRequest(
      `http://localhost:3000/api/v1/analytics/metrics?startDate=${startDate}&endDate=${endDate}`
    )
    await GET(request)

    expect(mockGetDashboardMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
    )
  })

  describe('error handling', () => {
    it('should return 500 on internal server error', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['AGENT'],
        },
      })
      mockGetDashboardMetrics.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/metrics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

