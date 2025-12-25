import prisma from '@/lib/prisma'
import { TicketStatus, TicketPriority, TicketHistoryType } from '@prisma/client'
import { wsServer } from '@/lib/websocket/server'
import { createTicketHistory } from './ticket-history-service'
import {
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketAssigned,
  notifyTicketComment,
} from '@/lib/services/notification-service'

export interface CreateTicketInput {
  subject: string
  description: string
  requesterId?: string // Optional for unauthenticated users
  requesterEmail?: string // For unauthenticated users
  requesterName?: string // For unauthenticated users
  publicTokenId?: string // For anonymous users with public JWT
  priority?: TicketPriority
  assigneeId?: string | null
  tenantId?: string | null
  organizationId?: string | null // Ticket belongs to an organization
  category?: string | null
  customFields?: Record<string, any>
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

  // Handle unauthenticated users
  if (!input.requesterId && (!input.requesterEmail || !input.requesterName)) {
    throw new Error('Either requesterId or requesterEmail/requesterName must be provided')
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: input.subject,
      description: input.description,
      requesterId: input.requesterId || null,
      requesterEmail: input.requesterEmail || null,
      requesterName: input.requesterName || null,
      publicTokenId: input.publicTokenId || null,
      assigneeId: input.assigneeId || null,
      tenantId: input.tenantId || null,
      organizationId: input.organizationId || null,
      category: input.category || null,
      customFields: input.customFields ? (input.customFields as any) : null,
      priority: input.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
    },
    include: {
      requester: input.requesterId ? { select: { id: true, email: true, firstName: true, lastName: true } } : false,
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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
      requester: ticket.requester || { email: (ticket as any).requesterEmail || '', name: (ticket as any).requesterName || '' },
      assignee: ticket.assignee,
      createdAt: ticket.createdAt,
    },
  })

  // Auto-route ticket if tenant and category are provided but no assignee
  let finalTicket = ticket
  if (!ticket.assigneeId && input.tenantId && input.category) {
    const { routeTicketByCategory, assignTicketToAgent } = await import('./ticket-routing-service')
    const agentId = await routeTicketByCategory({
      ticketId: ticket.id,
      tenantId: input.tenantId,
      category: input.category,
    })

    if (agentId) {
      await assignTicketToAgent(ticket.id, agentId)
      // Reload ticket to get updated assignee
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          requester: input.requesterId ? { select: { id: true, email: true, firstName: true, lastName: true } } : false,
          assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })
      if (updatedTicket) {
        finalTicket = updatedTicket as any
      }
    }
  }

  // Create notification for assignee if assigned
  if (finalTicket.assigneeId) {
    await notifyTicketCreated(finalTicket.id, finalTicket.ticketNumber, finalTicket.assigneeId)
  }

  return finalTicket
}

export async function listTickets(params?: {
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string
  requesterId?: string
  publicTokenId?: string // For filtering by public token
  tenantId?: string
  organizationId?: string // Filter by organization
  category?: string
  userId?: string // For filtering by user's assigned categories
  userRoles?: string[] // User's roles
  search?: string // Search by username, email, or problem text
  excludeStatuses?: TicketStatus[] // Exclude certain statuses (e.g., CLOSED, RESOLVED for dashboard)
  onlyAssignedToMe?: boolean // Only show tickets assigned to current user
  excludeAssignedToOthers?: boolean // Exclude tickets assigned to other users
  page?: number
  limit?: number
  sortBy?: string // Field to sort by
  sortOrder?: 'asc' | 'desc'
}) {
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit
  const sortBy = params?.sortBy || 'createdAt'
  const sortOrder = params?.sortOrder || 'desc'

  const where: any = {}

  // Status filters
  if (params?.status) {
    where.status = params.status
  }
  if (params?.excludeStatuses && params.excludeStatuses.length > 0) {
    where.status = { notIn: params.excludeStatuses }
  }

  // Assignment filters
  if (params?.assigneeId) {
    where.assigneeId = params.assigneeId
  }
  if (params?.onlyAssignedToMe && params?.userId) {
    where.assigneeId = params.userId
  }
  if (params?.excludeAssignedToOthers && params?.userId) {
    where.OR = [
      { assigneeId: params.userId },
      { assigneeId: null },
    ]
  }

  // Other filters
  if (params?.priority) {
    where.priority = params.priority
  }
  if (params?.requesterId) {
    where.requesterId = params.requesterId
  }
  if (params?.publicTokenId) {
    where.publicTokenId = params.publicTokenId
  }
  if (params?.tenantId) {
    where.tenantId = params.tenantId
  }
  if (params?.category) {
    where.category = params.category
  }

  // Search filter (username, email, or problem text)
  if (params?.search) {
    const searchTerm = params.search.trim()
    where.OR = [
      { subject: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { requesterEmail: { contains: searchTerm, mode: 'insensitive' } },
      { requesterName: { contains: searchTerm, mode: 'insensitive' } },
      {
        requester: {
          OR: [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  // Filter by organization - if user is not GLOBAL_ADMIN, filter by their organization
  // For END_USER, also filter to only tickets they requested
  if (params?.userId && params?.userRoles) {
    const isEndUser = params.userRoles.includes('END_USER')
    
    if (!params.userRoles.includes('GLOBAL_ADMIN')) {
      // Get user's organization
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { organizationId: true },
      })
      if (user?.organizationId) {
        where.organizationId = user.organizationId
      } else {
        // User has no organization, return empty with pagination
        return {
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        }
      }
    }
    
    // For END_USER, only show tickets they requested
    if (isEndUser) {
      where.requesterId = params.userId
    }
  }

  if (params?.organizationId) {
    where.organizationId = params.organizationId
  }

  // Filter by user's assigned categories if user is AGENT or IT_MANAGER
  if (params?.userId && params?.userRoles) {
    const isAgentOrManager = params.userRoles.some((r) => ['AGENT', 'IT_MANAGER'].includes(r))
    if (isAgentOrManager && !params.userRoles.includes('GLOBAL_ADMIN') && !params.userRoles.includes('ADMIN')) {
      // Get user's assigned categories
      const { getUserAssignedCategories } = await import('./tenant-service')
      const categoryMap = await getUserAssignedCategories(params.userId)

      if (categoryMap.size > 0) {
        // Build OR conditions for tenantId + category combinations
        const categoryConditions: any[] = []
        categoryMap.forEach((categories, tenantId) => {
          if (categories.size > 0) {
            categoryConditions.push({
              tenantId,
              category: { in: Array.from(categories) },
            })
          }
        })

        if (categoryConditions.length > 0) {
          // Merge with existing OR conditions from search if they exist
          if (where.OR && Array.isArray(where.OR)) {
            // If we have search OR conditions, we need to wrap them properly
            // This will be handled later in the function
            // For now, store category conditions separately
            const existingOR = where.OR
            delete where.OR
            where.AND = [
              { OR: existingOR },
              { OR: categoryConditions },
            ]
          } else if (!where.OR) {
            where.OR = categoryConditions
          }
        } else {
          // User has no category assignments, return empty with pagination
          return {
            tickets: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          }
        }
      } else {
        // User has no assignments, return empty with pagination
        return {
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        }
      }
    }
  }

  // Handle complex where clauses - ensure proper AND/OR nesting
  // If we have excludeAssignedToOthers, merge it properly with existing conditions
  if (params?.excludeAssignedToOthers && params?.userId) {
    const assigneeCondition = {
      OR: [
        { assigneeId: params.userId },
        { assigneeId: null },
      ],
    }
    if (where.AND) {
      where.AND.push(assigneeCondition)
    } else if (where.OR && Array.isArray(where.OR)) {
      // If we have OR conditions, wrap them with AND
      const existingOR = where.OR
      delete where.OR
      where.AND = [
        { OR: existingOR },
        assigneeCondition,
      ]
    } else {
      where.AND = [assigneeCondition]
    }
  }

  // Remove undefined values
  Object.keys(where).forEach((key) => {
    if (where[key] === undefined) {
      delete where[key]
    }
  })

  // Build orderBy clause
  const orderBy: any = {}
  const validSortFields = ['createdAt', 'updatedAt', 'ticketNumber', 'subject', 'status', 'priority']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  orderBy[sortField] = sortOrder

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ])

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      escalatedByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      escalatedToCustomRole: { select: { id: true, name: true, displayName: true } },
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

// Merge public token tickets to a user account (called on login/register)
export async function mergePublicTokenTicketsToUser(publicTokenId: string, userId: string) {
  // Update all tickets with this public token to be owned by the user
  const updated = await prisma.ticket.updateMany({
    where: {
      publicTokenId,
      requesterId: null, // Only update tickets that aren't already assigned to a user
    },
    data: {
      requesterId: userId,
      publicTokenId: null, // Clear the public token ID
    },
  })

  return updated.count
}

