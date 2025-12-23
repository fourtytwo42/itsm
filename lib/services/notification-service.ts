import prisma from '@/lib/prisma'
import { NotificationType, NotificationStatus } from '@prisma/client'
import { wsServer } from '@/lib/websocket/server'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata || {},
    },
  })

  // Check user's notification preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: params.userId },
  })

  // Only send real-time notification if enabled
  const shouldNotify = preferences
    ? getPreferenceForType(preferences, params.type)
    : true // Default to true if no preferences set

  if (shouldNotify) {
    // Send via WebSocket
    wsServer.broadcastToUser(params.userId, 'notification:new', {
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt,
      },
    })
  }

  return notification
}

function getPreferenceForType(
  preferences: {
    ticketCreated: boolean
    ticketUpdated: boolean
    ticketAssigned: boolean
    ticketComment: boolean
    escalation: boolean
  },
  type: NotificationType
): boolean {
  switch (type) {
    case NotificationType.TICKET_CREATED:
      return preferences.ticketCreated
    case NotificationType.TICKET_UPDATED:
      return preferences.ticketUpdated
    case NotificationType.TICKET_ASSIGNED:
      return preferences.ticketAssigned
    case NotificationType.TICKET_COMMENT:
      return preferences.ticketComment
    case NotificationType.ESCALATION:
      return preferences.escalation
    default:
      return true
  }
}

export async function getNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  const where: any = { userId }
  if (options?.unreadOnly) {
    where.status = NotificationStatus.UNREAD
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  })

  return notifications
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date(),
    },
  })

  return notification.count > 0
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      status: NotificationStatus.UNREAD,
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date(),
    },
  })
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
  })

  return notification.count > 0
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      status: NotificationStatus.UNREAD,
    },
  })
}

export async function getNotificationPreferences(userId: string) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        ticketCreated: true,
        ticketUpdated: true,
        ticketAssigned: true,
        ticketComment: true,
        escalation: true,
      },
    })
  }

  return preferences
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<{
    emailEnabled: boolean
    pushEnabled: boolean
    ticketCreated: boolean
    ticketUpdated: boolean
    ticketAssigned: boolean
    ticketComment: boolean
    escalation: boolean
  }>
) {
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      ticketCreated: true,
      ticketUpdated: true,
      ticketAssigned: true,
      ticketComment: true,
      escalation: true,
      ...updates,
    },
  })

  return preferences
}

// Helper functions to notify about ticket events
export async function notifyTicketCreated(ticketId: string, ticketNumber: string, assigneeId: string | null) {
  if (assigneeId) {
    await createNotification({
      userId: assigneeId,
      type: NotificationType.TICKET_ASSIGNED,
      title: 'New Ticket Assigned',
      message: `Ticket ${ticketNumber} has been assigned to you.`,
      link: `/tickets/${ticketId}`,
      metadata: { ticketId, ticketNumber },
    })
  }
}

export async function notifyTicketUpdated(
  ticketId: string,
  ticketNumber: string,
  changes: Record<string, any>,
  userIds: string[]
) {
  for (const userId of userIds) {
    await createNotification({
      userId,
      type: NotificationType.TICKET_UPDATED,
      title: 'Ticket Updated',
      message: `Ticket ${ticketNumber} has been updated.`,
      link: `/tickets/${ticketId}`,
      metadata: { ticketId, ticketNumber, changes },
    })
  }
}

export async function notifyTicketAssigned(ticketId: string, ticketNumber: string, assigneeId: string) {
  await createNotification({
    userId: assigneeId,
    type: NotificationType.TICKET_ASSIGNED,
    title: 'Ticket Assigned',
    message: `Ticket ${ticketNumber} has been assigned to you.`,
    link: `/tickets/${ticketId}`,
    metadata: { ticketId, ticketNumber },
  })
}

export async function notifyTicketComment(ticketId: string, ticketNumber: string, commentAuthorId: string, userIds: string[]) {
  // Don't notify the comment author
  const recipients = userIds.filter((id) => id !== commentAuthorId)

  for (const userId of recipients) {
    await createNotification({
      userId,
      type: NotificationType.TICKET_COMMENT,
      title: 'New Comment',
      message: `A new comment was added to ticket ${ticketNumber}.`,
      link: `/tickets/${ticketId}`,
      metadata: { ticketId, ticketNumber, commentAuthorId },
    })
  }
}

