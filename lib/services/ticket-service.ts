import prisma from '@/lib/prisma'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { wsServer } from '@/lib/websocket/server'
import {
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketAssigned,
  notifyTicketComment,
} from '@/lib/services/notification-service'

export interface CreateTicketInput {
  subject: string
  description: string
  requesterId: string
  priority?: TicketPriority
  assigneeId?: string | null
}

export interface UpdateTicketInput {
  subject?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string | null
}

export interface AddCommentInput {
  ticketId: string
  authorId: string
  body: string
}

export async function generateTicketNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `TKT-${year}-${random.toString().padStart(4, '0')}`
}

export async function createTicket(input: CreateTicketInput) {
  const ticketNumber = await generateTicketNumber()

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: input.subject,
      description: input.description,
      requesterId: input.requesterId,
      assigneeId: input.assigneeId || null,
      priority: input.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
    },
    include: {
      requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })

  // Broadcast WebSocket event
  wsServer.broadcastToAll('ticket:created', {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      requester: ticket.requester,
      assignee: ticket.assignee,
      createdAt: ticket.createdAt,
    },
  })

  // Create notification for assignee if assigned
  if (ticket.assigneeId) {
    await notifyTicketCreated(ticket.id, ticket.ticketNumber, ticket.assigneeId)
  }

  return ticket
}

export async function listTickets(params?: {
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string
  requesterId?: string
}) {
  return prisma.ticket.findMany({
    where: {
      status: params?.status,
      priority: params?.priority,
      assigneeId: params?.assigneeId,
      requesterId: params?.requesterId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })
}

export async function getTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
    },
  })
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  // Get current ticket to detect changes
  const currentTicket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true } },
      assignee: { select: { id: true } },
    },
  })

  if (!currentTicket) {
    throw new Error('Ticket not found')
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      subject: input.subject,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      closedAt: input.status === TicketStatus.CLOSED ? new Date() : undefined,
    },
    include: {
      requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })

  // Detect changes
  const changes: Record<string, any> = {}
  if (input.status && input.status !== currentTicket.status) {
    changes.status = { from: currentTicket.status, to: input.status }
  }
  if (input.priority && input.priority !== currentTicket.priority) {
    changes.priority = { from: currentTicket.priority, to: input.priority }
  }
  if (input.assigneeId !== undefined && input.assigneeId !== currentTicket.assigneeId) {
    changes.assigneeId = { from: currentTicket.assigneeId, to: input.assigneeId }
  }

  // Broadcast WebSocket event
  wsServer.broadcastToTicketSubscribers(id, 'ticket:updated', {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      requester: ticket.requester,
      assignee: ticket.assignee,
      updatedAt: ticket.updatedAt,
    },
    changes,
  })

  // Notify relevant users
  const userIds: string[] = []
  if (ticket.requesterId) userIds.push(ticket.requesterId)
  if (ticket.assigneeId) userIds.push(ticket.assigneeId)
  if (currentTicket.requesterId && !userIds.includes(currentTicket.requesterId)) {
    userIds.push(currentTicket.requesterId)
  }
  if (currentTicket.assigneeId && !userIds.includes(currentTicket.assigneeId)) {
    userIds.push(currentTicket.assigneeId)
  }

  if (Object.keys(changes).length > 0 && userIds.length > 0) {
    await notifyTicketUpdated(ticket.id, ticket.ticketNumber, changes, userIds)
  }

  // Handle assignment change
  if (input.assigneeId !== undefined && input.assigneeId !== currentTicket.assigneeId) {
    if (input.assigneeId) {
      await notifyTicketAssigned(ticket.id, ticket.ticketNumber, input.assigneeId)
      wsServer.broadcastToUser(input.assigneeId, 'ticket:assigned', {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
        },
      })
    }
  }

  return ticket
}

export async function addTicketComment(input: AddCommentInput) {
  // Get ticket to find all relevant users
  const ticket = await prisma.ticket.findUnique({
    where: { id: input.ticketId },
    include: {
      requester: { select: { id: true } },
      assignee: { select: { id: true } },
      comments: {
        select: { authorId: true },
        distinct: ['authorId'],
      },
    },
  })

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: input.ticketId,
      authorId: input.authorId,
      body: input.body,
    },
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })

  // Broadcast WebSocket event
  wsServer.broadcastToTicketSubscribers(input.ticketId, 'ticket:comment', {
    ticketId: input.ticketId,
    comment: {
      id: comment.id,
      body: comment.body,
      author: comment.author,
      createdAt: comment.createdAt,
    },
  })

  // Notify relevant users (requester, assignee, and other commenters)
  const userIds: string[] = []
  if (ticket.requesterId) userIds.push(ticket.requesterId)
  if (ticket.assigneeId) userIds.push(ticket.assigneeId)
  ticket.comments.forEach((c) => {
    if (c.authorId && !userIds.includes(c.authorId)) {
      userIds.push(c.authorId)
    }
  })

  if (userIds.length > 0) {
    await notifyTicketComment(
      input.ticketId,
      ticket.ticketNumber,
      input.authorId,
      userIds
    )
  }

  return comment
}

