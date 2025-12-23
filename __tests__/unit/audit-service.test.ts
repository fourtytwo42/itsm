import {
  logEvent,
  getAuditLogs,
  shouldLogEvent,
  getAuditConfig,
  updateAuditConfig,
} from '@/lib/services/audit-service'
import { AuditEventType } from '@prisma/client'

const mockAuditLog = {
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
}
const mockAuditConfig = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  upsert: jest.fn(),
}

const mockPrisma = {
  auditLog: mockAuditLog,
  auditConfig: mockAuditConfig,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logEvent', () => {
    it('should create audit log', async () => {
      const mockLog = {
        id: 'log-1',
        eventType: AuditEventType.USER_CREATED,
        userId: 'user-1',
        userEmail: 'user@example.com',
      }

      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        events: ['USER_CREATED'],
      })
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockLog)

      const result = await logEvent({
        organizationId: 'org-1',
        eventType: AuditEventType.USER_CREATED,
        entityType: 'User',
        entityId: 'user-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        description: 'User created',
      })

      expect(result).toEqual(mockLog)
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })

    it('should not log if event is disabled', async () => {
      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        events: [],
      })

      const result = await logEvent({
        organizationId: 'org-1',
        eventType: AuditEventType.USER_CREATED,
        entityType: 'User',
        userId: 'user-1',
        userEmail: 'user@example.com',
        description: 'User created',
      })

      expect(result).toBeNull()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should log if no organizationId', async () => {
      const mockLog = {
        id: 'log-1',
        eventType: AuditEventType.USER_CREATED,
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockLog)

      const result = await logEvent({
        eventType: AuditEventType.USER_CREATED,
        entityType: 'User',
        userId: 'user-1',
        userEmail: 'user@example.com',
        description: 'User created',
      })

      expect(result).toEqual(mockLog)
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('getAuditLogs', () => {
    it('should return audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          eventType: AuditEventType.USER_CREATED,
        },
      ]

      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs)
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      const result = await getAuditLogs({
        organizationId: 'org-1',
        page: 1,
        limit: 50,
      })

      expect(result.logs).toEqual(mockLogs)
      expect(result.pagination.total).toBe(1)
      expect(prisma.auditLog.findMany).toHaveBeenCalled()
      expect(prisma.auditLog.count).toHaveBeenCalled()
    })

    it('should filter by event type', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(0)

      await getAuditLogs({
        eventType: AuditEventType.USER_CREATED,
      })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: AuditEventType.USER_CREATED,
          }),
        })
      )
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(0)

      await getAuditLogs({
        startDate,
        endDate,
      })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })
  })

  describe('shouldLogEvent', () => {
    it('should return true if event is enabled', async () => {
      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        events: [AuditEventType.USER_CREATED],
      })

      const result = await shouldLogEvent('org-1', AuditEventType.USER_CREATED)

      expect(result).toBe(true)
    })

    it('should return false if event is disabled', async () => {
      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        events: [],
      })

      const result = await shouldLogEvent('org-1', AuditEventType.USER_CREATED)

      expect(result).toBe(false)
    })

    it('should return false if audit config is disabled', async () => {
      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue({
        enabled: false,
        events: [AuditEventType.USER_CREATED],
      })

      const result = await shouldLogEvent('org-1', AuditEventType.USER_CREATED)

      expect(result).toBe(false)
    })

    it('should return false if config not found', async () => {
      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await shouldLogEvent('org-1', AuditEventType.USER_CREATED)

      expect(result).toBe(false)
    })
  })

  describe('getAuditConfig', () => {
    it('should return audit config', async () => {
      const mockConfig = {
        id: 'config-1',
        organizationId: 'org-1',
        enabled: true,
        events: ['USER_CREATED'],
      }

      ;(prisma.auditConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)

      const result = await getAuditConfig('org-1')

      expect(result).toEqual(mockConfig)
      expect(prisma.auditConfig.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      })
    })
  })

  describe('updateAuditConfig', () => {
    it('should update audit config', async () => {
      const mockConfig = {
        id: 'config-1',
        organizationId: 'org-1',
        enabled: true,
        events: ['USER_CREATED', 'USER_UPDATED'],
      }

      ;(prisma.auditConfig.upsert as jest.Mock).mockResolvedValue(mockConfig)

      const result = await updateAuditConfig('org-1', {
        enabled: true,
        events: ['USER_CREATED', 'USER_UPDATED'],
      })

      expect(result).toEqual(mockConfig)
      expect(prisma.auditConfig.upsert).toHaveBeenCalled()
    })
  })
})

