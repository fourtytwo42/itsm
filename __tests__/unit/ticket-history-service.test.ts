import {
  createTicketHistory,
  getTicketHistory,
} from '@/lib/services/ticket-history-service'
import { TicketHistoryType } from '@prisma/client'

const mockTicketHistory = {
  create: jest.fn(),
  findMany: jest.fn(),
}

const mockPrisma = {
  ticketHistory: mockTicketHistory,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/services/notification-service', () => ({
  notifyTicketCreated: jest.fn(),
  notifyTicketUpdated: jest.fn(),
  notifyTicketAssigned: jest.fn(),
  notifyTicketComment: jest.fn(),
}))

const prisma = mockPrisma as any

describe('Ticket History Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTicketHistory', () => {
    it('should create ticket history entry', async () => {
      const mockHistory = {
        id: 'history-1',
        ticketId: 'ticket-1',
        type: TicketHistoryType.STATUS_CHANGED,
        userId: 'user-1',
        oldValue: 'NEW',
        newValue: 'IN_PROGRESS',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
      }

      ;(prisma.ticketHistory.create as jest.Mock).mockResolvedValue(mockHistory)

      const result = await createTicketHistory({
        ticketId: 'ticket-1',
        type: TicketHistoryType.STATUS_CHANGED,
        userId: 'user-1',
        oldValue: 'NEW',
        newValue: 'IN_PROGRESS',
      })

      expect(result).toEqual(mockHistory)
      expect(prisma.ticketHistory.create).toHaveBeenCalledWith({
        data: {
          ticketId: 'ticket-1',
          type: TicketHistoryType.STATUS_CHANGED,
          userId: 'user-1',
          oldValue: 'NEW',
          newValue: 'IN_PROGRESS',
          note: null,
          metadata: null,
        },
        include: expect.any(Object),
      })
    })

    it('should handle optional fields', async () => {
      const mockHistory = {
        id: 'history-1',
        ticketId: 'ticket-1',
        type: TicketHistoryType.COMMENT_ADDED,
        userId: 'user-1',
        note: 'Added comment',
        metadata: { commentId: 'comment-1' },
      }

      ;(prisma.ticketHistory.create as jest.Mock).mockResolvedValue(mockHistory)

      const result = await createTicketHistory({
        ticketId: 'ticket-1',
        type: TicketHistoryType.COMMENT_ADDED,
        userId: 'user-1',
        note: 'Added comment',
        metadata: { commentId: 'comment-1' },
      })

      expect(result).toEqual(mockHistory)
    })
  })

  describe('getTicketHistory', () => {
    it('should return ticket history ordered by date', async () => {
      const mockHistory = [
        {
          id: 'history-2',
          ticketId: 'ticket-1',
          type: TicketHistoryType.STATUS_CHANGED,
          createdAt: new Date('2025-01-02'),
        },
        {
          id: 'history-1',
          ticketId: 'ticket-1',
          type: TicketHistoryType.CREATED,
          createdAt: new Date('2025-01-01'),
        },
      ]

      ;(prisma.ticketHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

      const result = await getTicketHistory('ticket-1')

      expect(result).toEqual(mockHistory)
      expect(prisma.ticketHistory.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })
  })
})

