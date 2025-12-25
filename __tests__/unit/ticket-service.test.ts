import { addTicketComment, createTicket, generateTicketNumber, getTicketById, listTickets, updateTicket } from '@/lib/services/ticket-service'
import { TicketPriority, TicketStatus } from '@prisma/client'

const mockTicket = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
}
const mockTicketComment = {
  create: jest.fn(),
}

const mockUser = {
  findUnique: jest.fn(),
}

const mockPrisma = {
  ticket: mockTicket,
  ticketComment: mockTicketComment,
  user: mockUser,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

jest.mock('@/lib/websocket/server', () => ({
  wsServer: {
    broadcastToAll: jest.fn(),
    broadcastToTicketSubscribers: jest.fn(),
    broadcastToUser: jest.fn(),
  },
}))

jest.mock('@/lib/services/notification-service', () => ({
  notifyTicketCreated: jest.fn(),
  notifyTicketUpdated: jest.fn(),
  notifyTicketAssigned: jest.fn(),
  notifyTicketComment: jest.fn(),
}))

jest.mock('@/lib/services/ticket-routing-service', () => ({
  routeTicketByCategory: jest.fn(),
  assignTicketToAgent: jest.fn(),
}))

jest.mock('@/lib/services/tenant-service', () => ({
  getUserAssignedCategories: jest.fn(),
}))

describe('Ticket Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateTicketNumber', () => {
    it('should generate ticket number with correct format', async () => {
      const number = await generateTicketNumber()
      expect(number.startsWith('TKT-')).toBe(true)
      expect(number.split('-')).toHaveLength(3)
    })
  })

  describe('createTicket', () => {
    it('should create ticket with defaults', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requester: { id: 'user-1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        assignee: null,
        assigneeId: null,
        createdAt: new Date(),
      }
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket)

      const result = await createTicket({
        subject: 'Test ticket',
        description: 'Test desc',
        requesterId: 'user-1',
      })

      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: 'Test ticket',
            description: 'Test desc',
            requesterId: 'user-1',
            priority: TicketPriority.MEDIUM,
            status: TicketStatus.NEW,
          }),
          include: expect.any(Object),
        })
      )
      expect(result).toEqual(mockTicket)
    })

    it('should create ticket with unauthenticated user', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requesterEmail: 'guest@example.com',
        requesterName: 'Guest User',
        requester: null,
        assignee: null,
        assigneeId: null,
        createdAt: new Date(),
      }
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket)

      const result = await createTicket({
        subject: 'Test ticket',
        description: 'Test desc',
        requesterEmail: 'guest@example.com',
        requesterName: 'Guest User',
      })

      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: 'Test ticket',
            description: 'Test desc',
            requesterEmail: 'guest@example.com',
            requesterName: 'Guest User',
            requesterId: null,
          }),
        })
      )
      expect(result).toEqual(mockTicket)
    })

    it('should throw error if neither requesterId nor requesterEmail/requesterName provided', async () => {
      await expect(
        createTicket({
          subject: 'Test ticket',
          description: 'Test desc',
        })
      ).rejects.toThrow('Either requesterId or requesterEmail/requesterName must be provided')
    })

    it('should create ticket without auto-routing when routeTicketByCategory returns null', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requester: { id: 'user-1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        assignee: null,
        assigneeId: null,
        tenant: { id: 'tenant-1', name: 'Tenant 1', slug: 'tenant-1' },
        createdAt: new Date(),
      }
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket)

      const { routeTicketByCategory, assignTicketToAgent } = require('@/lib/services/ticket-routing-service')
      ;(routeTicketByCategory as jest.Mock).mockResolvedValue(null) // No eligible agent found
      const { notifyTicketCreated } = require('@/lib/services/notification-service')

      const result = await createTicket({
        subject: 'Test ticket',
        description: 'Test desc',
        requesterId: 'user-1',
        tenantId: 'tenant-1',
        category: 'Hardware',
      })

      expect(routeTicketByCategory).toHaveBeenCalledWith({
        ticketId: '1',
        tenantId: 'tenant-1',
        category: 'Hardware',
      })
      expect(assignTicketToAgent).not.toHaveBeenCalled() // Should not assign when no agent found
      expect(notifyTicketCreated).not.toHaveBeenCalled() // Should not notify when no assignee
      expect(result.assigneeId).toBeNull() // Ticket should remain unassigned
    })

    it('should auto-route ticket when tenantId and category provided but no assignee', async () => {
      const { routeTicketByCategory, assignTicketToAgent } = require('@/lib/services/ticket-routing-service')
      const initialTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requester: { id: 'user-1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        assignee: null,
        assigneeId: null,
        createdAt: new Date(),
      }
      const routedTicket = {
        ...initialTicket,
        assigneeId: 'agent-1',
        assignee: { id: 'agent-1', email: 'agent@example.com', firstName: 'Agent', lastName: 'Name' },
      }
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(initialTicket)
      ;(routeTicketByCategory as jest.Mock).mockResolvedValue('agent-1')
      ;(assignTicketToAgent as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(routedTicket)
      const { notifyTicketCreated } = require('@/lib/services/notification-service')

      const result = await createTicket({
        subject: 'Test ticket',
        description: 'Test desc',
        requesterId: 'user-1',
        tenantId: 'tenant-1',
        category: 'Hardware',
      })

      expect(routeTicketByCategory).toHaveBeenCalledWith({
        ticketId: '1',
        tenantId: 'tenant-1',
        category: 'Hardware',
      })
      expect(assignTicketToAgent).toHaveBeenCalledWith('1', 'agent-1')
      expect(notifyTicketCreated).toHaveBeenCalledWith('1', 'TKT-2025-0001', 'agent-1')
      expect(result).toEqual(routedTicket)
    })

    it('should create ticket with assignee and send notification', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        subject: 'Test ticket',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requester: { id: 'user-1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        assignee: { id: 'assignee-1', email: 'assignee@example.com', firstName: 'Assignee', lastName: 'Name' },
        assigneeId: 'assignee-1',
        createdAt: new Date(),
      }
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket)
      const { notifyTicketCreated } = require('@/lib/services/notification-service')
      const { wsServer } = require('@/lib/websocket/server')

      const result = await createTicket({
        subject: 'Test ticket',
        description: 'Test desc',
        requesterId: 'user-1',
        assigneeId: 'assignee-1',
      })

      expect(wsServer.broadcastToAll).toHaveBeenCalledWith('ticket:created', expect.any(Object))
      expect(notifyTicketCreated).toHaveBeenCalledWith('1', 'TKT-2025-0001', 'assignee-1')
      expect(result).toEqual(mockTicket)
    })
  })

  describe('listTickets', () => {
    beforeEach(() => {
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(0)
    })

    it('should list tickets with filters', async () => {
      const mockTickets = [{ id: '1' }]
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(1)

      const result = await listTickets({ status: TicketStatus.NEW, priority: TicketPriority.HIGH })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TicketStatus.NEW,
            priority: TicketPriority.HIGH,
          }),
        })
      )
      expect(result).toEqual({
        tickets: mockTickets,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      })
    })

    it('should filter by excludeStatuses', async () => {
      await listTickets({ excludeStatuses: [TicketStatus.CLOSED, TicketStatus.RESOLVED] })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: [TicketStatus.CLOSED, TicketStatus.RESOLVED] },
          }),
        })
      )
    })

    it('should filter by onlyAssignedToMe', async () => {
      await listTickets({ onlyAssignedToMe: true, userId: 'user-1' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: 'user-1',
          }),
        })
      )
    })

    it('should filter by excludeAssignedToOthers', async () => {
      await listTickets({ excludeAssignedToOthers: true, userId: 'user-1' })

      const callArgs = (prisma.ticket.findMany as jest.Mock).mock.calls[0][0]
      const where = callArgs.where
      
      // excludeAssignedToOthers creates an AND condition with OR inside
      expect(where.AND || where.OR).toBeDefined()
      if (where.AND) {
        expect(where.AND).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              OR: [{ assigneeId: 'user-1' }, { assigneeId: null }],
            }),
          ])
        )
      } else {
        expect(where.OR).toEqual([{ assigneeId: 'user-1' }, { assigneeId: null }])
      }
    })

    it('should filter by search term', async () => {
      await listTickets({ search: 'printer' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { subject: { contains: 'printer', mode: 'insensitive' } },
              { description: { contains: 'printer', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('should return empty when user has no organization', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: null })

      const result = await listTickets({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(result).toEqual({
        tickets: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      })
      expect(prisma.ticket.findMany).not.toHaveBeenCalled()
    })

    it('should filter by user organization when not GLOBAL_ADMIN', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: 'org-1' })

      await listTickets({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      })
      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should not filter by organization for GLOBAL_ADMIN', async () => {
      await listTickets({ userId: 'admin-1', userRoles: ['GLOBAL_ADMIN'] })

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            organizationId: expect.anything(),
          }),
        })
      )
    })

    it('should return empty when user has no category assignments', async () => {
      const { getUserAssignedCategories } = require('@/lib/services/tenant-service')
      ;(getUserAssignedCategories as jest.Mock).mockResolvedValue(new Map())

      const result = await listTickets({
        userId: 'agent-1',
        userRoles: ['AGENT'],
        tenantId: 'tenant-1',
      })

      expect(result).toEqual({
        tickets: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      })
      expect(prisma.ticket.findMany).not.toHaveBeenCalled()
    })

    it('should filter by user assigned categories for AGENT', async () => {
      const { getUserAssignedCategories } = require('@/lib/services/tenant-service')
      const categoryMap = new Map()
      categoryMap.set('tenant-1', new Set(['Hardware', 'Software']))
      ;(getUserAssignedCategories as jest.Mock).mockResolvedValue(categoryMap)

      await listTickets({
        userId: 'agent-1',
        userRoles: ['AGENT'],
      })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                tenantId: 'tenant-1',
                category: { in: ['Hardware', 'Software'] },
              },
            ],
          }),
        })
      )
    })

    it('should merge search and category filters with AND', async () => {
      const { getUserAssignedCategories } = require('@/lib/services/tenant-service')
      const categoryMap = new Map()
      categoryMap.set('tenant-1', new Set(['Hardware']))
      ;(getUserAssignedCategories as jest.Mock).mockResolvedValue(categoryMap)

      await listTickets({
        userId: 'agent-1',
        userRoles: ['AGENT'],
        search: 'printer',
      })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { OR: expect.any(Array) }, // search conditions
              { OR: expect.any(Array) }, // category conditions
            ]),
          }),
        })
      )
    })

    it('should handle pagination', async () => {
      const mockTickets = [{ id: '1' }, { id: '2' }]
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(100)

      const result = await listTickets({ page: 2, limit: 10 })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
      })
    })

    it('should handle custom sorting', async () => {
      await listTickets({ sortBy: 'subject', sortOrder: 'asc' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { subject: 'asc' },
        })
      )
    })

    it('should default to createdAt when invalid sortBy provided', async () => {
      await listTickets({ sortBy: 'invalidField', sortOrder: 'asc' })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      )
    })
  })

  describe('getTicketById', () => {
    it('should fetch ticket with relations', async () => {
      const mockTicket = { id: '1', ticketNumber: 'TKT-2025-0001' }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket)

      const result = await getTicketById('1')

      expect(prisma.ticket.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          include: expect.any(Object),
        })
      )
      expect(result).toEqual(mockTicket)
    })
  })

  describe('updateTicket', () => {
    it('should update ticket', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: null,
        requester: { id: 'requester-1' },
        assignee: null,
      }
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.CLOSED,
        priority: TicketPriority.MEDIUM,
        requesterId: 'requester-1',
        assigneeId: null,
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: null,
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)

      const result = await updateTicket('1', { status: TicketStatus.CLOSED })

      expect(prisma.ticket.findUnique).toHaveBeenCalled()
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ status: TicketStatus.CLOSED }),
          include: expect.any(Object),
        })
      )
      expect(result).toEqual(mockTicket)
    })

    it('should handle status change and notify users', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1' },
        assignee: { id: 'assignee-1' },
      }
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        requesterId: 'requester-1',
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: { id: 'assignee-1', email: 'assignee@example.com', firstName: 'Assignee', lastName: 'Name' },
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)
      const { notifyTicketUpdated } = require('@/lib/services/notification-service')
      const { wsServer } = require('@/lib/websocket/server')

      await updateTicket('1', { status: TicketStatus.IN_PROGRESS })

      expect(wsServer.broadcastToTicketSubscribers).toHaveBeenCalledWith('1', 'ticket:updated', expect.any(Object))
      expect(notifyTicketUpdated).toHaveBeenCalled()
    })

    it('should handle assignment change and notify new assignee', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: null,
        requester: { id: 'requester-1' },
        assignee: null,
      }
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        requesterId: 'requester-1',
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: { id: 'assignee-1', email: 'assignee@example.com', firstName: 'Assignee', lastName: 'Name' },
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)
      const { notifyTicketAssigned } = require('@/lib/services/notification-service')
      const { wsServer } = require('@/lib/websocket/server')

      await updateTicket('1', { assigneeId: 'assignee-1' })

      expect(notifyTicketAssigned).toHaveBeenCalledWith('1', 'TKT-2025-0001', 'assignee-1')
      expect(wsServer.broadcastToUser).toHaveBeenCalledWith('assignee-1', 'ticket:assigned', expect.any(Object))
    })

    it('should throw error if ticket not found', async () => {
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(updateTicket('1', { status: TicketStatus.CLOSED })).rejects.toThrow('Ticket not found')
    })

    it('should set closedAt when status is CLOSED', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        assigneeId: null,
        requester: { id: 'requester-1' },
        assignee: null,
      }
      const mockTicket = {
        ...currentTicket,
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: null,
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)

      await updateTicket('1', { status: TicketStatus.CLOSED })

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TicketStatus.CLOSED,
            closedAt: expect.any(Date),
          }),
        })
      )
    })

    it('should handle priority change', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.LOW,
        assigneeId: 'assignee-1',
        requesterId: 'requester-1',
        requester: { id: 'requester-1' },
        assignee: { id: 'assignee-1' },
      }
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.HIGH,
        assigneeId: 'assignee-1',
        requesterId: 'requester-1',
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: { id: 'assignee-1', email: 'assignee@example.com', firstName: 'Assignee', lastName: 'Name' },
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)
      const { notifyTicketUpdated } = require('@/lib/services/notification-service')

      await updateTicket('1', { priority: TicketPriority.HIGH })

      expect(notifyTicketUpdated).toHaveBeenCalledWith(
        '1',
        'TKT-2025-0001',
        expect.objectContaining({
          priority: { from: TicketPriority.LOW, to: TicketPriority.HIGH },
        }),
        expect.arrayContaining(['requester-1', 'assignee-1'])
      )
    })

    it('should handle unassigning ticket', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1' },
        assignee: { id: 'assignee-1' },
      }
      const mockTicket = {
        ...currentTicket,
        assigneeId: null,
        assignee: null,
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)

      await updateTicket('1', { assigneeId: null })

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assigneeId: null,
          }),
        })
      )
    })

    it('should not notify when no changes', async () => {
      const currentTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
        assigneeId: null,
        requester: { id: 'requester-1' },
        assignee: null,
      }
      const mockTicket = {
        ...currentTicket,
        requester: { id: 'requester-1', email: 'requester@example.com', firstName: 'Requester', lastName: 'Name' },
        assignee: null,
        updatedAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket)
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)
      const { notifyTicketUpdated } = require('@/lib/services/notification-service')

      await updateTicket('1', { subject: 'Updated subject' })

      expect(notifyTicketUpdated).not.toHaveBeenCalled()
    })
  })

  describe('addTicketComment', () => {
    it('should add comment to ticket', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        requesterId: 'requester-1',
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1' },
        assignee: { id: 'assignee-1' },
        comments: [{ authorId: 'commenter-1' }],
      }
      const mockComment = {
        id: 'c1',
        body: 'Comment',
        author: { id: 'u1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        createdAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticketComment.create as jest.Mock).mockResolvedValue(mockComment)

      const result = await addTicketComment({ ticketId: '1', authorId: 'u1', body: 'Comment' })

      expect(prisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          requester: { select: { id: true } },
          assignee: { select: { id: true } },
          comments: {
            select: { authorId: true },
            distinct: ['authorId'],
          },
        },
      })
      expect(prisma.ticketComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ticketId: '1', authorId: 'u1', body: 'Comment' },
          include: expect.any(Object),
        })
      )
      expect(result).toEqual(mockComment)
    })

    it('should throw error if ticket not found', async () => {
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(addTicketComment({ ticketId: '1', authorId: 'u1', body: 'Comment' })).rejects.toThrow(
        'Ticket not found'
      )
    })

    it('should handle ticket with no requester or assignee', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        requesterId: null,
        assigneeId: null,
        requester: null,
        assignee: null,
        comments: [],
      }
      const mockComment = {
        id: 'c1',
        body: 'Comment',
        author: { id: 'u1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        createdAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticketComment.create as jest.Mock).mockResolvedValue(mockComment)
      const { notifyTicketComment } = require('@/lib/services/notification-service')

      await addTicketComment({ ticketId: '1', authorId: 'u1', body: 'Comment' })

      expect(notifyTicketComment).not.toHaveBeenCalled()
    })

    it('should notify all relevant users including commenters', async () => {
      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-0001',
        requesterId: 'requester-1',
        assigneeId: 'assignee-1',
        requester: { id: 'requester-1' },
        assignee: { id: 'assignee-1' },
        comments: [{ authorId: 'commenter-1' }, { authorId: 'commenter-2' }],
      }
      const mockComment = {
        id: 'c1',
        body: 'Comment',
        author: { id: 'u1', email: 'user@example.com', firstName: 'User', lastName: 'Name' },
        createdAt: new Date(),
      }
      ;(prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticketComment.create as jest.Mock).mockResolvedValue(mockComment)
      const { notifyTicketComment } = require('@/lib/services/notification-service')

      await addTicketComment({ ticketId: '1', authorId: 'u1', body: 'Comment' })

      expect(notifyTicketComment).toHaveBeenCalledWith(
        '1',
        'TKT-2025-0001',
        'u1',
        expect.arrayContaining(['requester-1', 'assignee-1', 'commenter-1', 'commenter-2'])
      )
    })
  })
})

