/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/organizations/audit/route'
import { NextRequest } from 'next/server'
import { getAuditLogs } from '@/lib/services/audit-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { AuditEventType } from '@prisma/client'

jest.mock('@/lib/services/audit-service', () => ({
  getAuditLogs: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireAnyRole: jest.fn(),
}))

const mockGetAuditLogs = getAuditLogs as jest.MockedFunction<typeof getAuditLogs>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/organizations/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return audit logs for admin', async () => {
    const mockLogs = {
      logs: [
        {
          id: 'log-1',
          eventType: AuditEventType.USER_CREATED,
          entityType: 'User',
          userId: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })
    mockGetAuditLogs.mockResolvedValue(mockLogs as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/audit')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.logs).toEqual(mockLogs.logs)
    expect(data.pagination).toEqual(mockLogs.pagination)
  })

  it('should filter by event type', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })
    mockGetAuditLogs.mockResolvedValue({
      logs: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/audit?eventType=USER_CREATED')
    await GET(request)

    expect(mockGetAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AuditEventType.USER_CREATED,
      })
    )
  })
})

