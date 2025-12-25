/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/analytics/export/route'
import { NextRequest } from 'next/server'
import { exportAnalyticsToCSV } from '@/lib/services/analytics-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { TicketPriority, TicketStatus } from '@prisma/client'

jest.mock('@/lib/services/analytics-service', () => ({
  exportAnalyticsToCSV: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockExportAnalyticsToCSV = exportAnalyticsToCSV as jest.MockedFunction<typeof exportAnalyticsToCSV>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/analytics/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should export tickets as CSV', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockExportAnalyticsToCSV.mockResolvedValue('id,subject\n1,Test ticket')

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/export?type=tickets&format=csv')
    const response = await GET(request)

    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(mockExportAnalyticsToCSV).toHaveBeenCalledWith('tickets', expect.objectContaining({}))
  })

  it('should export agents as CSV', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockExportAnalyticsToCSV.mockResolvedValue('agentId,name\n1,Agent One')

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/export?type=agents&format=csv')
    const response = await GET(request)

    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(mockExportAnalyticsToCSV).toHaveBeenCalledWith('agents', expect.objectContaining({}))
  })

  it('should filter by date range', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockExportAnalyticsToCSV.mockResolvedValue('data')

    const startDate = '2025-01-01'
    const endDate = '2025-01-31'
    const request = new NextRequest(
      `http://localhost:3000/api/v1/analytics/export?type=tickets&format=csv&startDate=${startDate}&endDate=${endDate}`
    )
    await GET(request)

    expect(mockExportAnalyticsToCSV).toHaveBeenCalledWith(
      'tickets',
      expect.objectContaining({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
    )
  })

  it('should return 501 for PDF format', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/export?type=tickets&format=pdf')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(501)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_IMPLEMENTED')
  })

  it('should return 403 for non-agent roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/analytics/export?type=tickets&format=csv')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

