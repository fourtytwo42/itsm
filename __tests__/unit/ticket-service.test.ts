import { addTicketComment, createTicket, generateTicketNumber, getTicketById, listTickets, updateTicket } from '@/lib/services/ticket-service'
import { prisma } from '@/lib/prisma'
import { TicketPriority, TicketStatus } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketComment: {
      create: jest.fn(),
    },
  },
}))

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
    it('should list tickets with filters', async () => {
      const mockTickets = [{ id: '1' }]
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)

      const result = await listTickets({ status: TicketStatus.NEW, priority: TicketPriority.HIGH })

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TicketStatus.NEW,
            priority: TicketPriority.HIGH,
          }),
        })
      )
      expect(result).toEqual(mockTickets)
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
  })
})

