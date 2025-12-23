import {
  getDashboardMetrics,
  getAgentPerformance,
  calculateMTTR,
  getTicketVolumeByDay,
  exportAnalyticsToCSV,
} from '@/lib/services/analytics-service'
import { TicketStatus, TicketPriority } from '@prisma/client'

const mockTicket = {
  count: jest.fn(),
  findMany: jest.fn(),
  groupBy: jest.fn(),
}
const mockUser = {
  findUnique: jest.fn(),
}

const mockPrisma = {
  ticket: mockTicket,
  user: mockUser,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      organizationId: 'org-1',
    })
  })

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics', async () => {
      ;(prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(25) // open
        .mockResolvedValueOnce(70) // resolved
        .mockResolvedValueOnce(5) // closed

      ;(prisma.ticket.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { priority: TicketPriority.LOW, _count: 30 },
          { priority: TicketPriority.MEDIUM, _count: 40 },
          { priority: TicketPriority.HIGH, _count: 25 },
          { priority: TicketPriority.CRITICAL, _count: 5 },
        ])
        .mockResolvedValueOnce([
          { status: TicketStatus.NEW, _count: 10 },
          { status: TicketStatus.IN_PROGRESS, _count: 15 },
          { status: TicketStatus.RESOLVED, _count: 70 },
          { status: TicketStatus.CLOSED, _count: 5 },
        ])

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
        },
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T13:00:00Z'),
        },
      ])

      const result = await getDashboardMetrics()

      expect(result.totalTickets).toBe(100)
      expect(result.openTickets).toBe(25)
      expect(result.resolvedTickets).toBe(70)
      expect(result.closedTickets).toBe(5)
      expect(result.averageResolutionTime).toBeGreaterThan(0)
      expect(result.ticketsByPriority.LOW).toBe(30)
      expect(result.ticketsByStatus.NEW).toBe(10)
    })

    it('should handle date filters', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.ticket.groupBy as jest.Mock).mockResolvedValue([])
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getDashboardMetrics({ startDate, endDate })

      expect(prisma.ticket.count).toHaveBeenCalledWith(
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

    it('should handle priority and status filters', async () => {
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.ticket.groupBy as jest.Mock).mockResolvedValue([])
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getDashboardMetrics({
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS,
      })

      expect(prisma.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: TicketPriority.HIGH,
            status: TicketStatus.IN_PROGRESS,
          }),
        })
      )
    })

    it('should handle empty resolved tickets', async () => {
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.ticket.groupBy as jest.Mock).mockResolvedValue([])
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDashboardMetrics()

      expect(result.averageResolutionTime).toBe(0)
    })

    it('should handle resolved tickets without closedAt', async () => {
      ;(prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(0) // open
        .mockResolvedValueOnce(1) // resolved
        .mockResolvedValueOnce(0) // closed

      ;(prisma.ticket.groupBy as jest.Mock).mockResolvedValue([])
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null, // No closedAt
        },
      ])

      const result = await getDashboardMetrics()

      expect(result.averageResolutionTime).toBe(0)
    })

  })

  describe('getAgentPerformance', () => {
    it('should return agent performance data', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('user-1')
      expect(result[0].ticketsResolved).toBe(1)
      expect(result[0].ticketsAssigned).toBe(1)
    })

    it('should handle multiple agents', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          assignee: {
            id: 'user-1',
            email: 'agent1@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'ticket-2',
          assigneeId: 'user-2',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T13:00:00Z'),
          assignee: {
            id: 'user-2',
            email: 'agent2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result).toHaveLength(2)
      expect(result[0].ticketsResolved).toBe(1)
      expect(result[1].ticketsResolved).toBe(1)
    })

    it('should handle agent filter', async () => {
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getAgentPerformance({ agentId: 'user-1' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: 'user-1',
          }),
        })
      )
    })

  })

  describe('calculateMTTR', () => {
    it('should calculate MTTR correctly', async () => {
      const mockTickets = [
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'), // 120 minutes
        },
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T13:00:00Z'), // 180 minutes
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await calculateMTTR()

      expect(result).toBe(150) // (120 + 180) / 2
    })

    it('should return 0 if no tickets', async () => {
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      const result = await calculateMTTR()

      expect(result).toBe(0)
    })

    it('should handle date filters', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await calculateMTTR({ startDate, endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
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

    it('should handle date filters with only startDate', async () => {
      const startDate = new Date('2025-01-01')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await calculateMTTR({ startDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
            },
          }),
        })
      )
    })

    it('should handle date filters with only endDate', async () => {
      const endDate = new Date('2025-01-31')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await calculateMTTR({ endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should handle agent filter', async () => {
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await calculateMTTR({ agentId: 'user-1' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: 'user-1',
          }),
        })
      )
    })
  })

  describe('getTicketVolumeByDay', () => {
    it('should return ticket volume by day', async () => {
      const mockTickets = [
        { createdAt: new Date('2025-01-01T10:00:00Z') },
        { createdAt: new Date('2025-01-01T14:00:00Z') },
        { createdAt: new Date('2025-01-02T10:00:00Z') },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getTicketVolumeByDay()

      expect(result).toHaveLength(2)
      expect(result.find((r) => r.date === '2025-01-01')?.count).toBe(2)
      expect(result.find((r) => r.date === '2025-01-02')?.count).toBe(1)
    })

    it('should handle date filters', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getTicketVolumeByDay({ startDate, endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
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

    it('should handle date filters with only startDate', async () => {
      const startDate = new Date('2025-01-01')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getTicketVolumeByDay({ startDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
            },
          }),
        })
      )
    })

    it('should handle date filters with only endDate', async () => {
      const endDate = new Date('2025-01-31')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getTicketVolumeByDay({ endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lte: endDate,
            },
          }),
        })
      )
    })
  })

  describe('exportAnalyticsToCSV', () => {
    it('should export tickets to CSV', async () => {
      const mockTickets = [
        {
          ticketNumber: 'TKT-001',
          subject: 'Test Ticket',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.MEDIUM,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          requester: {
            email: 'user@example.com',
            firstName: 'User',
            lastName: 'Name',
          },
          assignee: {
            email: 'agent@example.com',
            firstName: 'Agent',
            lastName: 'Name',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await exportAnalyticsToCSV('tickets')

      expect(result).toContain('Ticket Number')
      expect(result).toContain('TKT-001')
      expect(result).toContain('Test Ticket')
    })

    it('should export agents to CSV', async () => {
      // Mock getAgentPerformance
      const mockTickets: any[] = []
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await exportAnalyticsToCSV('agents')

      expect(result).toContain('Agent Name')
      expect(result).toContain('Tickets Resolved')
    })


    it('should handle date filters', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await exportAnalyticsToCSV('tickets', { startDate, endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
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

    it('should handle date filters with only startDate for export', async () => {
      const startDate = new Date('2025-01-01')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await exportAnalyticsToCSV('tickets', { startDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
            },
          }),
        })
      )
    })

    it('should handle date filters with only endDate for export', async () => {
      const endDate = new Date('2025-01-31')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await exportAnalyticsToCSV('tickets', { endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should handle tickets with unassigned assignee', async () => {
      const mockTickets = [
        {
          ticketNumber: 'TKT-001',
          subject: 'Test Ticket',
          status: TicketStatus.NEW,
          priority: TicketPriority.MEDIUM,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          requester: {
            email: 'user@example.com',
            firstName: 'User',
            lastName: 'Name',
          },
          assignee: null,
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await exportAnalyticsToCSV('tickets')

      expect(result).toContain('Unassigned')
    })

    it('should handle tickets without closedAt in export', async () => {
      const mockTickets = [
        {
          ticketNumber: 'TKT-001',
          subject: 'Test Ticket',
          status: TicketStatus.NEW,
          priority: TicketPriority.MEDIUM,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          requester: {
            email: 'user@example.com',
            firstName: 'User',
            lastName: 'Name',
          },
          assignee: {
            email: 'agent@example.com',
            firstName: 'Agent',
            lastName: 'Name',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await exportAnalyticsToCSV('tickets')

      expect(result).toContain('TKT-001')
      expect(result).toContain('Test Ticket')
    })

    it('should handle tickets without closedAt', async () => {
      const mockTickets = [
        {
          ticketNumber: 'TKT-001',
          subject: 'Test Ticket',
          status: TicketStatus.NEW,
          priority: TicketPriority.MEDIUM,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          requester: {
            email: 'user@example.com',
            firstName: 'User',
            lastName: 'Name',
          },
          assignee: {
            email: 'agent@example.com',
            firstName: 'Agent',
            lastName: 'Name',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await exportAnalyticsToCSV('tickets')

      expect(result).toContain('TKT-001')
    })

  })

  describe('getAgentPerformance edge cases', () => {
    it('should handle tickets without SLA tracking', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result).toHaveLength(1)
    })

    it('should handle tickets without closedAt', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.IN_PROGRESS,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result).toHaveLength(1)
      expect(result[0].ticketsResolved).toBe(0)
      expect(result[0].ticketsAssigned).toBe(1)
    })

    it('should handle agent name fallback to email', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: null,
            lastName: null,
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result[0].name).toBe('agent@example.com')
    })

    it('should handle tickets with first response time calculation', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.IN_PROGRESS,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          comments: [
            {
              createdAt: new Date('2025-01-01T10:15:00Z'), // 15 minutes after ticket creation
            },
          ],
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result[0].firstResponseTime).toBe(15) // 15 minutes
    })

    it('should handle tickets without first response time', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.IN_PROGRESS,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          comments: [], // No comments = no first response time
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result[0].firstResponseTime).toBe(0)
    })

    it('should handle tickets with only firstName', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          assigneeId: 'user-1',
          status: TicketStatus.RESOLVED,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'),
          assignee: {
            id: 'user-1',
            email: 'agent@example.com',
            firstName: 'John',
            lastName: null,
          },
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await getAgentPerformance()

      expect(result[0].name).toBe('John')
    })

    it('should handle date filters with only startDate', async () => {
      const startDate = new Date('2025-01-01')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getAgentPerformance({ startDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
            },
          }),
        })
      )
    })

    it('should handle date filters with only endDate', async () => {
      const endDate = new Date('2025-01-31')
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])

      await getAgentPerformance({ endDate })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lte: endDate,
            },
          }),
        })
      )
    })
  })

  describe('calculateMTTR edge cases', () => {
    it('should handle tickets without closedAt', async () => {
      const mockTickets = [
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: null,
        },
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'), // 120 minutes
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await calculateMTTR()

      // Only tickets with closedAt are counted in the average
      expect(result).toBe(120)
    })

    it('should skip tickets without closedAt in calculation', async () => {
      const mockTickets = [
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T11:00:00Z'), // 60 minutes
        },
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          closedAt: new Date('2025-01-01T12:00:00Z'), // 120 minutes
        },
      ]

      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await calculateMTTR()

      expect(result).toBe(90) // (60 + 120) / 2
    })
  })
})

