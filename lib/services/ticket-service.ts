import { prisma } from '@/lib/prisma'
import { TicketStatus, TicketPriority } from '@prisma/client'

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

  return prisma.ticket.create({
    data: {
      ticketNumber,
      subject: input.subject,
      description: input.description,
      requesterId: input.requesterId,
      assigneeId: input.assigneeId || null,
      priority: input.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
    },
  })
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
  return prisma.ticket.update({
    where: { id },
    data: {
      subject: input.subject,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      closedAt: input.status === TicketStatus.CLOSED ? new Date() : undefined,
    },
  })
}

export async function addTicketComment(input: AddCommentInput) {
  return prisma.ticketComment.create({
    data: {
      ticketId: input.ticketId,
      authorId: input.authorId,
      body: input.body,
    },
    include: {
      author: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })
}

