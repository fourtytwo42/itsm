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
      const mockTicket = { id: '1', ticketNumber: 'TKT-2025-0001' }
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
        })
      )
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
      const mockTicket = { id: '1', status: TicketStatus.CLOSED }
      ;(prisma.ticket.update as jest.Mock).mockResolvedValue(mockTicket)

      const result = await updateTicket('1', { status: TicketStatus.CLOSED })

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ status: TicketStatus.CLOSED }),
        })
      )
      expect(result).toEqual(mockTicket)
    })
  })

  describe('addTicketComment', () => {
    it('should add comment to ticket', async () => {
      const mockComment = { id: 'c1', body: 'Comment' }
      ;(prisma.ticketComment.create as jest.Mock).mockResolvedValue(mockComment)

      const result = await addTicketComment({ ticketId: '1', authorId: 'u1', body: 'Comment' })

      expect(prisma.ticketComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ticketId: '1', authorId: 'u1', body: 'Comment' },
          include: expect.any(Object),
        })
      )
      expect(result).toEqual(mockComment)
    })
  })
})

