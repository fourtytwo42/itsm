/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/organizations/audit/config/route'
import { NextRequest } from 'next/server'
import { getAuditConfig, updateAuditConfig } from '@/lib/services/audit-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { AuditEventType } from '@prisma/client'

jest.mock('@/lib/services/audit-service', () => ({
  getAuditConfig: jest.fn(),
  updateAuditConfig: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireAnyRole: jest.fn(),
}))

const mockGetAuditConfig = getAuditConfig as jest.MockedFunction<typeof getAuditConfig>
const mockUpdateAuditConfig = updateAuditConfig as jest.MockedFunction<typeof updateAuditConfig>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/organizations/audit/config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return audit config for admin', async () => {
    const mockConfig = {
      id: 'config-1',
      organizationId: 'org-1',
      enabled: true,
      events: [AuditEventType.USER_CREATED],
      retentionDays: 90,
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
    mockGetAuditConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/audit/config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockConfig)
  })

  it('should return 400 if organization ID required', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: undefined,
        isGlobalAdmin: false,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/audit/config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Organization ID required')
  })
})

describe('PUT /api/v1/organizations/audit/config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update audit config', async () => {
    const mockConfig = {
      id: 'config-1',
      organizationId: 'org-1',
      enabled: true,
      events: [AuditEventType.USER_CREATED, AuditEventType.USER_UPDATED],
      retentionDays: 120,
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
    mockUpdateAuditConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/audit/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: true,
        events: [AuditEventType.USER_CREATED, AuditEventType.USER_UPDATED],
        retentionDays: 120,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockConfig)
  })
})

