import {
  routeTicketByCategory,
  assignTicketToAgent,
} from '@/lib/services/ticket-routing-service'
import { TicketStatus } from '@prisma/client'

const mockTenantAssignment = {
  findMany: jest.fn(),
}
const mockTicket = {
  findUnique: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
}

const mockPrisma = {
  tenantAssignment: mockTenantAssignment,
  ticket: mockTicket,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/services/notification-service', () => ({
  notifyTicketAssigned: jest.fn(),
}))

jest.mock('@/lib/websocket/server', () => ({
  wsServer: {
    broadcastToUser: jest.fn(),
  },
}))

const prisma = mockPrisma as any

describe('Ticket Routing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('routeTicketByCategory', () => {
    it('should return null if no tenant or category', async () => {
      const result1 = await routeTicketByCategory({ ticketId: 'ticket-1' })
      expect(result1).toBeNull()

      const result2 = await routeTicketByCategory({ ticketId: 'ticket-1', tenantId: 'tenant-1' })
      expect(result2).toBeNull()

      const result3 = await routeTicketByCategory({ ticketId: 'ticket-1', category: 'category-1' })
      expect(result3).toBeNull()
    })

    it('should return null if no eligible agents found', async () => {
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue([])

      const result = await routeTicketByCategory({
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        category: 'category-1',
      })

      expect(result).toBeNull()
    })

    it('should route to agent with least load', async () => {
      const mockAssignments = [
        {
          userId: 'user-1',
          user: {
            id: 'user-1',
            roles: [
              {
                role: {
                  name: 'AGENT',
                },
              },
            ],
          },
        },
        {
          userId: 'user-2',
          user: {
            id: 'user-2',
            roles: [
              {
                role: {
                  name: 'AGENT',
                },
              },
            ],
          },
        },
      ]

      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)
      ;(prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(5) // user-1 has 5 tickets
        .mockResolvedValueOnce(2) // user-2 has 2 tickets (should be selected)

      const result = await routeTicketByCategory({
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        category: 'category-1',
      })

      expect(result).toBe('user-2')
    })

    it('should handle IT_MANAGER role', async () => {
      const mockAssignments = [
        {
          user: {
            id: 'manager-1',
            roles: [{ role: { name: 'IT_MANAGER' } }],
          },
        },
      ]
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)

      const result = await routeTicketByCategory({
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        category: 'Hardware',
      })

      expect(result).toBe('manager-1')
    })

    it('should filter to only AGENT and IT_MANAGER roles', async () => {
      const mockAssignments = [
        {
          userId: 'user-1',
          user: {
            id: 'user-1',
            roles: [
              {
                role: {
                  name: 'END_USER', // Should be filtered out
                },
              },
            ],
          },
        },
        {
          userId: 'user-2',
          user: {
            id: 'user-2',
            roles: [
              {
                role: {
                  name: 'AGENT', // Should be included
                },
              },
            ],
          },
        },
      ]

      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)

      const result = await routeTicketByCategory({
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        category: 'category-1',
      })

      expect(result).toBe('user-2')
      expect(prisma.ticket.count).toHaveBeenCalledTimes(1) // Only for user-2
    })
  })

  describe('assignTicketToAgent', () => {
    it('should assign ticket to agent and notify', async () => {
      const mockTicket = {
        id: 'ticket-1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
      }

      const { notifyTicketAssigned } = require('@/lib/services/notification-service')
      const { wsServer } = require('@/lib/websocket/server')

      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)

      const result = await assignTicketToAgent('ticket-1', 'agent-1')

      expect(result).toEqual(mockTicket)
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { assigneeId: 'agent-1' },
      })
      expect(notifyTicketAssigned).toHaveBeenCalledWith('ticket-1', 'TKT-2025-0001', 'agent-1')
      expect(wsServer.broadcastToUser).toHaveBeenCalledWith(
        'agent-1',
        'ticket:assigned',
        expect.any(Object)
      )
    })

    it('should throw error if ticket not found', async () => {
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(assignTicketToAgent('ticket-1', 'agent-1')).rejects.toThrow('Ticket not found')
    })
  })
})

