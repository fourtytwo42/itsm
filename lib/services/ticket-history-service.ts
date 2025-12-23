import prisma from '@/lib/prisma'
import { TicketHistoryType } from '@prisma/client'

export interface CreateTicketHistoryInput {
  ticketId: string
  type: TicketHistoryType
  userId: string
  oldValue?: string | null
  newValue?: string | null
  note?: string | null
  metadata?: Record<string, any> | null
}

export async function createTicketHistory(input: CreateTicketHistoryInput) {
  return prisma.ticketHistory.create({
    data: {
      ticketId: input.ticketId,
      type: input.type,
      userId: input.userId,
      oldValue: input.oldValue || null,
      newValue: input.newValue || null,
      note: input.note || null,
      metadata: input.metadata ? (input.metadata as any) : null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function getTicketHistory(ticketId: string) {
  return prisma.ticketHistory.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

