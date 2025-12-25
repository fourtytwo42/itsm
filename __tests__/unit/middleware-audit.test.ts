/**
 * @jest-environment node
 */
import { auditLog } from '@/lib/middleware/audit'
import { logEvent } from '@/lib/services/audit-service'
import { AuditEventType } from '@prisma/client'
import { NextRequest } from 'next/server'

jest.mock('@/lib/services/audit-service', () => ({
  logEvent: jest.fn(),
}))

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>

describe('auditLog middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log audit event with all parameters', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      { userId: 'user-123' }
    )

    expect(mockLogEvent).toHaveBeenCalledWith({
      organizationId: null,
      eventType: AuditEventType.USER_CREATED,
      entityType: 'User',
      entityId: 'user-123',
      userId: 'admin-1',
      userEmail: 'admin@example.com',
      description: 'Created new user',
      metadata: { userId: 'user-123' },
      ipAddress: 'unknown',
      userAgent: 'unknown',
    })
  })

  it('should extract organizationId from metadata', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      { userId: 'user-123', organizationId: 'org-1' }
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
      })
    )
  })

  it('should extract IP address from x-forwarded-for header', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    })

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      undefined,
      request
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '192.168.1.1',
      })
    )
  })

  it('should extract IP address from x-real-ip header when x-forwarded-for is not present', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-real-ip': '10.0.0.1',
      },
    })

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      undefined,
      request
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '10.0.0.1',
      })
    )
  })

  it('should use first IP from x-forwarded-for array', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    })

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      undefined,
      request
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '192.168.1.1, 10.0.0.1',
      })
    )
  })

  it('should extract user agent from request', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'user-agent': 'Mozilla/5.0 Test Browser',
      },
    })

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user',
      undefined,
      request
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'Mozilla/5.0 Test Browser',
      })
    )
  })

  it('should use unknown for IP and user agent when request is not provided', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      'user-123',
      'admin-1',
      'admin@example.com',
      'Created new user'
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: 'unknown',
        userAgent: 'unknown',
      })
    )
  })

  it('should handle null entityId', async () => {
    mockLogEvent.mockResolvedValue(undefined)

    await auditLog(
      AuditEventType.USER_CREATED,
      'User',
      null,
      'admin-1',
      'admin@example.com',
      'Created new user'
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: null,
      })
    )
  })

  it('should handle audit log errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockLogEvent.mockRejectedValue(new Error('Database error'))

    await expect(
      auditLog(
        AuditEventType.USER_CREATED,
        'User',
        'user-123',
        'admin-1',
        'admin@example.com',
        'Created new user'
      )
    ).resolves.not.toThrow()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log audit event:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })
})

