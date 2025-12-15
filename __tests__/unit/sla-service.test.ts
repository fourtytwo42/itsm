import {
  createSLAPolicy,
  getSLAPolicyById,
  listSLAPolicies,
  updateSLAPolicy,
  deleteSLAPolicy,
  getSLAPolicyForTicket,
  initializeSLATracking,
  updateFirstResponseTime,
  updateResolutionTime,
  getSLATrackingByTicketId,
  checkAndExecuteEscalation,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  getSLAComplianceStats,
} from '@/lib/services/sla-service'
import { prisma } from '@/lib/prisma'
import { TicketPriority } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    sLAPolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sLATracking: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    escalationRule: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ticket: {
      update: jest.fn(),
    },
  },
}))

describe('SLA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSLAPolicy', () => {
    it('should create SLA policy', async () => {
      const mockPolicy = {
        id: 'sla-1',
        name: 'Standard SLA',
        priority: TicketPriority.MEDIUM,
        firstResponseTime: 60,
        resolutionTime: 480,
        active: true,
        escalationRules: [],
      }

      ;(prisma.sLAPolicy.create as jest.Mock).mockResolvedValue(mockPolicy)

      const result = await createSLAPolicy({
        name: 'Standard SLA',
        priority: TicketPriority.MEDIUM,
        firstResponseTime: 60,
        resolutionTime: 480,
      })

      expect(result).toEqual(mockPolicy)
      expect(prisma.sLAPolicy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Standard SLA',
          priority: TicketPriority.MEDIUM,
          firstResponseTime: 60,
          resolutionTime: 480,
          active: true,
        }),
        include: {
          escalationRules: true,
        },
      })
    })
  })

  describe('getSLAPolicyById', () => {
    it('should return SLA policy', async () => {
      const mockPolicy = {
        id: 'sla-1',
        name: 'Standard SLA',
        escalationRules: [],
      }

      ;(prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(mockPolicy)

      const result = await getSLAPolicyById('sla-1')

      expect(result).toEqual(mockPolicy)
    })

    it('should return null if not found', async () => {
      ;(prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getSLAPolicyById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('listSLAPolicies', () => {
    it('should list all policies', async () => {
      const mockPolicies = [
        {
          id: 'sla-1',
          name: 'Standard SLA',
          escalationRules: [],
        },
      ]

      ;(prisma.sLAPolicy.findMany as jest.Mock).mockResolvedValue(mockPolicies)

      const result = await listSLAPolicies(false)

      expect(result).toEqual(mockPolicies)
    })

    it('should list only active policies', async () => {
      const mockPolicies = []
      ;(prisma.sLAPolicy.findMany as jest.Mock).mockResolvedValue(mockPolicies)

      await listSLAPolicies(true)

      expect(prisma.sLAPolicy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        })
      )
    })
  })

  describe('updateSLAPolicy', () => {
    it('should update SLA policy', async () => {
      const mockPolicy = {
        id: 'sla-1',
        name: 'Updated SLA',
        escalationRules: [],
      }

      ;(prisma.sLAPolicy.update as jest.Mock).mockResolvedValue(mockPolicy)

      const result = await updateSLAPolicy('sla-1', {
        name: 'Updated SLA',
      })

      expect(result).toEqual(mockPolicy)
    })
  })

  describe('deleteSLAPolicy', () => {
    it('should delete SLA policy', async () => {
      ;(prisma.sLAPolicy.delete as jest.Mock).mockResolvedValue({})

      await deleteSLAPolicy('sla-1')

      expect(prisma.sLAPolicy.delete).toHaveBeenCalledWith({
        where: { id: 'sla-1' },
      })
    })
  })

  describe('getSLAPolicyForTicket', () => {
    it('should get SLA policy for ticket priority', async () => {
      const mockPolicy = {
        id: 'sla-1',
        priority: TicketPriority.HIGH,
        escalationRules: [],
      }

      ;(prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy)

      const result = await getSLAPolicyForTicket(TicketPriority.HIGH)

      expect(result).toEqual(mockPolicy)
      expect(prisma.sLAPolicy.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            priority: TicketPriority.HIGH,
            active: true,
          },
          include: expect.objectContaining({
            escalationRules: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('initializeSLATracking', () => {
    it('should initialize SLA tracking', async () => {
      const mockPolicy = {
        id: 'sla-1',
        firstResponseTime: 60,
        resolutionTime: 480,
      }

      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        slaPolicyId: 'sla-1',
        firstResponseTarget: new Date(),
        resolutionTarget: new Date(),
      }

      ;(prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(mockPolicy)
      ;(prisma.sLATracking.upsert as jest.Mock).mockResolvedValue(mockTracking)

      const result = await initializeSLATracking('ticket-1', 'sla-1')

      expect(result).toEqual(mockTracking)
      expect(prisma.sLATracking.upsert).toHaveBeenCalled()
    })

    it('should throw error if policy not found', async () => {
      ;(prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(initializeSLATracking('ticket-1', 'non-existent')).rejects.toThrow(
        'SLA Policy not found'
      )
    })
  })

  describe('updateFirstResponseTime', () => {
    it('should update first response time and check breach', async () => {
      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        firstResponseTarget: new Date(Date.now() - 1000), // Past date
        firstResponseActual: null,
        slaPolicy: {
          id: 'sla-1',
        },
      }

      const responseTime = new Date()

      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(mockTracking)
      ;(prisma.sLATracking.update as jest.Mock).mockResolvedValue({
        ...mockTracking,
        firstResponseActual: responseTime,
        firstResponseBreached: true,
      })
      ;(prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue({
        id: 'sla-1',
        escalationRules: [],
      })

      const result = await updateFirstResponseTime('ticket-1', responseTime)

      expect(result).toBeDefined()
      expect(prisma.sLATracking.update).toHaveBeenCalled()
    })

    it('should return null if tracking not found', async () => {
      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await updateFirstResponseTime('ticket-1', new Date())

      expect(result).toBeNull()
    })
  })

  describe('updateResolutionTime', () => {
    it('should update resolution time and check breach', async () => {
      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        resolutionTarget: new Date(Date.now() - 1000), // Past date
        resolutionActual: null,
        slaPolicy: {
          id: 'sla-1',
        },
      }

      const resolutionTime = new Date()

      const mockTrackingWithPolicy = {
        ...mockTracking,
        slaPolicy: {
          id: 'sla-1',
          escalationRules: [],
        },
      }

      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(mockTrackingWithPolicy)
      ;(prisma.sLATracking.update as jest.Mock).mockResolvedValue({
        ...mockTrackingWithPolicy,
        resolutionActual: resolutionTime,
        resolutionBreached: true,
      })

      const result = await updateResolutionTime('ticket-1', resolutionTime)

      expect(result).toBeDefined()
      expect(prisma.sLATracking.update).toHaveBeenCalled()
    })
  })

  describe('getSLATrackingByTicketId', () => {
    it('should get tracking by ticket ID', async () => {
      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        slaPolicy: {
          id: 'sla-1',
        },
        ticket: {
          id: 'ticket-1',
          ticketNumber: 'TKT-001',
        },
      }

      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(mockTracking)

      const result = await getSLATrackingByTicketId('ticket-1')

      expect(result).toEqual(mockTracking)
    })
  })

  describe('checkAndExecuteEscalation', () => {
    it('should execute escalation actions', async () => {
      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        slaPolicy: {
          id: 'sla-1',
          escalationRules: [
            {
              id: 'rule-1',
              action: 'ASSIGN_TO_MANAGER',
              targetUserId: 'user-1',
            },
          ],
        },
        ticket: {
          id: 'ticket-1',
          ticketNumber: 'TKT-001',
          priority: TicketPriority.MEDIUM,
        },
      }

      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(mockTracking)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue({})

      await checkAndExecuteEscalation('ticket-1', 'FIRST_RESPONSE_BREACHED')

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: {
          assigneeId: 'user-1',
        },
      })
    })

    it('should handle INCREASE_PRIORITY action', async () => {
      const mockTracking = {
        id: 'tracking-1',
        ticketId: 'ticket-1',
        slaPolicy: {
          id: 'sla-1',
          escalationRules: [
            {
              id: 'rule-1',
              action: 'INCREASE_PRIORITY',
              newPriority: TicketPriority.HIGH,
            },
          ],
        },
        ticket: {
          id: 'ticket-1',
          ticketNumber: 'TKT-001',
          priority: TicketPriority.MEDIUM,
        },
      }

      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(mockTracking)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue({})

      await checkAndExecuteEscalation('ticket-1', 'RESOLUTION_BREACHED')

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: {
          priority: TicketPriority.HIGH,
        },
      })
    })

    it('should return early if tracking not found', async () => {
      ;(prisma.sLATracking.findUnique as jest.Mock).mockResolvedValue(null)

      await checkAndExecuteEscalation('ticket-1', 'FIRST_RESPONSE_BREACHED')

      expect(prisma.ticket.update).not.toHaveBeenCalled()
    })
  })

  describe('createEscalationRule', () => {
    it('should create escalation rule', async () => {
      const mockRule = {
        id: 'rule-1',
        slaPolicyId: 'sla-1',
        name: 'Escalate to Manager',
        action: 'ASSIGN_TO_MANAGER',
      }

      ;(prisma.escalationRule.create as jest.Mock).mockResolvedValue(mockRule)

      const result = await createEscalationRule({
        slaPolicyId: 'sla-1',
        name: 'Escalate to Manager',
        triggerCondition: 'FIRST_RESPONSE_BREACHED',
        action: 'ASSIGN_TO_MANAGER',
        targetUserId: 'user-1',
      })

      expect(result).toEqual(mockRule)
    })
  })

  describe('updateEscalationRule', () => {
    it('should update escalation rule', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Updated Rule',
      }

      ;(prisma.escalationRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await updateEscalationRule('rule-1', {
        name: 'Updated Rule',
      })

      expect(result).toEqual(mockRule)
    })
  })

  describe('deleteEscalationRule', () => {
    it('should delete escalation rule', async () => {
      ;(prisma.escalationRule.delete as jest.Mock).mockResolvedValue({})

      await deleteEscalationRule('rule-1')

      expect(prisma.escalationRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
      })
    })
  })

  describe('getSLAComplianceStats', () => {
    it('should get compliance stats', async () => {
      const mockTracking = [
        {
          id: 'tracking-1',
          firstResponseBreached: false,
          resolutionBreached: false,
          firstResponseActual: new Date(),
          resolutionActual: new Date(),
          ticket: {
            status: 'RESOLVED',
            priority: TicketPriority.MEDIUM,
          },
          slaPolicy: {
            priority: TicketPriority.MEDIUM,
          },
        },
        {
          id: 'tracking-2',
          firstResponseBreached: true,
          resolutionBreached: false,
          firstResponseActual: new Date(),
          resolutionActual: null,
          ticket: {
            status: 'IN_PROGRESS',
            priority: TicketPriority.HIGH,
          },
          slaPolicy: {
            priority: TicketPriority.HIGH,
          },
        },
      ]

      ;(prisma.sLATracking.findMany as jest.Mock).mockResolvedValue(mockTracking)

      const result = await getSLAComplianceStats()

      expect(result.total).toBe(2)
      expect(result.firstResponseBreached).toBe(1)
      expect(result.resolutionBreached).toBe(0)
      expect(result.firstResponseCompliance).toBe(50)
    })

    it('should handle date filters', async () => {
      ;(prisma.sLATracking.findMany as jest.Mock).mockResolvedValue([])

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await getSLAComplianceStats(startDate, endDate)

      expect(prisma.sLATracking.findMany).toHaveBeenCalledWith(
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
})

