import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketAssigned,
  notifyTicketComment,
} from '@/lib/services/notification-service'
import { NotificationType, NotificationStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { wsServer } from '@/lib/websocket/server'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('@/lib/websocket/server', () => ({
  wsServer: {
    broadcastToUser: jest.fn(),
  },
}))

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.TICKET_CREATED,
        title: 'Test Notification',
        message: 'Test message',
        link: '/tickets/1',
        metadata: {},
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await createNotification({
        userId: 'user-1',
        type: NotificationType.TICKET_CREATED,
        title: 'Test Notification',
        message: 'Test message',
        link: '/tickets/1',
      })

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.TICKET_CREATED,
          title: 'Test Notification',
          message: 'Test message',
          link: '/tickets/1',
          metadata: {},
        },
      })
      expect(wsServer.broadcastToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:new',
        expect.objectContaining({
          notification: expect.objectContaining({
            id: 'notif-1',
            type: NotificationType.TICKET_CREATED,
            title: 'Test Notification',
          }),
        })
      )
      expect(result).toEqual(mockNotification)
    })

    it('should respect notification preferences', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.TICKET_CREATED,
        title: 'Test Notification',
        message: 'Test message',
        link: null,
        metadata: {},
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        ticketCreated: false, // Disabled
        emailEnabled: true,
        pushEnabled: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences)

      await createNotification({
        userId: 'user-1',
        type: NotificationType.TICKET_CREATED,
        title: 'Test Notification',
        message: 'Test message',
      })

      // Should not broadcast because preference is disabled
      expect(wsServer.broadcastToUser).not.toHaveBeenCalled()
    })

    it('should test all notification type preferences', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.TICKET_UPDATED,
        title: 'Test',
        message: 'Test',
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        ticketCreated: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
        emailEnabled: true,
        pushEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const types = [
        NotificationType.TICKET_CREATED,
        NotificationType.TICKET_UPDATED,
        NotificationType.TICKET_ASSIGNED,
        NotificationType.TICKET_COMMENT,
        NotificationType.CHANGE_REQUEST_CREATED,
        NotificationType.CHANGE_REQUEST_APPROVED,
        NotificationType.CHANGE_REQUEST_REJECTED,
        NotificationType.SLA_BREACHED,
        NotificationType.ESCALATION,
      ]

      for (const type of types) {
        ;(prisma.notification.create as jest.Mock).mockResolvedValue({ ...mockNotification, type })
        ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences)
        ;(wsServer.broadcastToUser as jest.Mock).mockClear()

        await createNotification({
          userId: 'user-1',
          type,
          title: 'Test',
          message: 'Test',
        })

        expect(wsServer.broadcastToUser).toHaveBeenCalled()
      }
    })
  })

  describe('getNotifications', () => {
    it('should get notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: NotificationType.TICKET_CREATED,
          title: 'Test Notification',
          message: 'Test message',
          status: NotificationStatus.UNREAD,
          createdAt: new Date(),
        },
      ]

      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)

      const result = await getNotifications('user-1')

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      expect(result).toEqual(mockNotifications)
    })

    it('should filter unread notifications', async () => {
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])

      await getNotifications('user-1', { unreadOnly: true })

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: NotificationStatus.UNREAD },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    it('should respect limit', async () => {
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])

      await getNotifications('user-1', { limit: 10 })

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await markAsRead('notif-1', 'user-1')

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notif-1',
          userId: 'user-1',
        },
        data: {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      })
      expect(result).toBe(true)
    })

    it('should return false if notification not found', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await markAsRead('notif-1', 'user-1')

      expect(result).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

      await markAllAsRead('user-1')

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      })
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await deleteNotification('notif-1', 'user-1')

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'notif-1',
          userId: 'user-1',
        },
      })
      expect(result).toBe(true)
    })

    it('should return false if notification not found', async () => {
      ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await deleteNotification('notif-1', 'user-1')

      expect(result).toBe(false)
    })
  })

  describe('getUnreadCount', () => {
    it('should get unread count', async () => {
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(5)

      const result = await getUnreadCount('user-1')

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
      })
      expect(result).toBe(5)
    })
  })

  describe('getNotificationPreferences', () => {
    it('should get existing preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        emailEnabled: true,
        pushEnabled: true,
        ticketCreated: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences)

      const result = await getNotificationPreferences('user-1')

      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(result).toEqual(mockPreferences)
    })

    it('should create default preferences if not found', async () => {
      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        emailEnabled: true,
        pushEnabled: true,
        ticketCreated: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationPreference.create as jest.Mock).mockResolvedValue(mockPreferences)

      const result = await getNotificationPreferences('user-1')

      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          emailEnabled: true,
          pushEnabled: true,
          ticketCreated: true,
          ticketUpdated: true,
          ticketAssigned: true,
          ticketComment: true,
          escalation: true,
        },
      })
      expect(result).toEqual(mockPreferences)
    })
  })

  describe('updateNotificationPreferences', () => {
    it('should update preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        emailEnabled: false,
        pushEnabled: true,
        ticketCreated: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreferences)

      const result = await updateNotificationPreferences('user-1', { emailEnabled: false })

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { emailEnabled: false },
        create: expect.objectContaining({
          userId: 'user-1',
          emailEnabled: false,
        }),
      })
      expect(result).toEqual(mockPreferences)
    })
  })

  describe('notifyTicketCreated', () => {
    it('should create notification for assignee', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'assignee-1',
        type: NotificationType.TICKET_ASSIGNED,
        title: 'New Ticket Assigned',
        message: 'Ticket TKT-2025-0001 has been assigned to you.',
        link: '/tickets/ticket-1',
        metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001' },
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)

      await notifyTicketCreated('ticket-1', 'TKT-2025-0001', 'assignee-1')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'assignee-1',
          type: NotificationType.TICKET_ASSIGNED,
          title: 'New Ticket Assigned',
          message: 'Ticket TKT-2025-0001 has been assigned to you.',
          link: '/tickets/ticket-1',
          metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001' },
        },
      })
    })

    it('should not create notification if no assignee', async () => {
      await notifyTicketCreated('ticket-1', 'TKT-2025-0001', null)

      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })

  describe('notifyTicketUpdated', () => {
    it('should create notifications for multiple users', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.TICKET_UPDATED,
        title: 'Ticket Updated',
        message: 'Ticket TKT-2025-0001 has been updated.',
        link: '/tickets/ticket-1',
        metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001', changes: {} },
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)

      await notifyTicketUpdated('ticket-1', 'TKT-2025-0001', { status: { from: 'NEW', to: 'IN_PROGRESS' } }, [
        'user-1',
        'user-2',
      ])

      expect(prisma.notification.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('notifyTicketAssigned', () => {
    it('should create assignment notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'assignee-1',
        type: NotificationType.TICKET_ASSIGNED,
        title: 'Ticket Assigned',
        message: 'Ticket TKT-2025-0001 has been assigned to you.',
        link: '/tickets/ticket-1',
        metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001' },
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)

      await notifyTicketAssigned('ticket-1', 'TKT-2025-0001', 'assignee-1')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'assignee-1',
          type: NotificationType.TICKET_ASSIGNED,
          title: 'Ticket Assigned',
          message: 'Ticket TKT-2025-0001 has been assigned to you.',
          link: '/tickets/ticket-1',
          metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001' },
        },
      })
    })
  })

  describe('notifyTicketComment', () => {
    it('should create notifications for recipients excluding author', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.TICKET_COMMENT,
        title: 'New Comment',
        message: 'A new comment was added to ticket TKT-2025-0001.',
        link: '/tickets/ticket-1',
        metadata: { ticketId: 'ticket-1', ticketNumber: 'TKT-2025-0001', commentAuthorId: 'author-1' },
        status: NotificationStatus.UNREAD,
        readAt: null,
        createdAt: new Date(),
      }

      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      ;(prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null)

      await notifyTicketComment('ticket-1', 'TKT-2025-0001', 'author-1', ['author-1', 'user-1', 'user-2'])

      // Should notify user-1 and user-2, but not author-1
      expect(prisma.notification.create).toHaveBeenCalledTimes(2)
    })
  })
})

