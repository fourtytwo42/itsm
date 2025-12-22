import prisma from '@/lib/prisma'
import { notifyTicketAssigned } from '@/lib/services/notification-service'
import { wsServer } from '@/lib/websocket/server'
import { TicketStatus } from '@prisma/client'

export interface RouteTicketInput {
  ticketId: string
  tenantId?: string | null
  category?: string | null
}

/**
 * Route ticket to an agent based on category assignments
 * Uses round-robin approach among available agents
 */
export async function routeTicketByCategory(input: RouteTicketInput) {
  if (!input.tenantId || !input.category) {
    return null // No routing possible without tenant and category
  }

  // Find all agents/managers assigned to this tenant + category
  const assignments = await prisma.tenantAssignment.findMany({
    where: {
      tenantId: input.tenantId,
      OR: [
        { category: input.category }, // Specific category assignment
        { category: null }, // All categories assignment
      ],
    },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  })

  // Filter to only AGENT and IT_MANAGER roles
  const eligibleUsers = assignments
    .map((a) => a.user)
    .filter((user) => {
      const roles = user.roles.map((ur) => ur.role.name)
      return roles.includes('AGENT') || roles.includes('IT_MANAGER')
    })

  if (eligibleUsers.length === 0) {
    return null // No eligible agents found
  }

  // Get current ticket counts for each agent to implement load balancing
  const agentLoads = await Promise.all(
    eligibleUsers.map(async (user) => {
      const ticketCount = await prisma.ticket.count({
        where: {
          assigneeId: user.id,
          status: {
            in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
          },
        },
      })
      return { userId: user.id, load: ticketCount }
    })
  )

  // Sort by load (ascending) and pick the agent with least load
  agentLoads.sort((a, b) => a.load - b.load)
  const selectedAgentId = agentLoads[0].userId

  return selectedAgentId
}

/**
 * Assign ticket to an agent and notify them
 */
export async function assignTicketToAgent(ticketId: string, agentId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
    },
  })

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { assigneeId: agentId },
  })

  // Notify the assigned agent
  await notifyTicketAssigned(ticketId, ticket.ticketNumber, agentId)

  // Broadcast WebSocket event
  wsServer.broadcastToUser(agentId, 'ticket:assigned', {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
    },
  })

  return ticket
}

