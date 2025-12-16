import prisma from '@/lib/prisma'
import { TicketStatus, TicketPriority } from '@prisma/client'

export interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number // minutes
  slaCompliance: number // percentage
  ticketsByPriority: Record<TicketPriority, number>
  ticketsByStatus: Record<TicketStatus, number>
  ticketsByDay?: Array<{ date: string; count: number }>
}

export interface AgentPerformance {
  id: string
  name: string
  email: string
  ticketsResolved: number
  ticketsAssigned: number
  averageResolutionTime: number // minutes
  slaCompliance: number // percentage
  firstResponseTime: number // minutes average
}

export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  agentId?: string
  priority?: TicketPriority
  status?: TicketStatus
}

export async function getDashboardMetrics(filters?: ReportFilters): Promise<DashboardMetrics> {
  const where: any = {}

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  if (filters?.priority) {
    where.priority = filters.priority
  }

  if (filters?.status) {
    where.status = filters.status
  }

  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    closedTickets,
    ticketsByPriority,
    ticketsByStatus,
    resolvedTicketsWithTime,
    slaTracking,
  ] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({
      where: {
        ...where,
        status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] },
      },
    }),
    prisma.ticket.count({
      where: {
        ...where,
        status: TicketStatus.RESOLVED,
      },
    }),
    prisma.ticket.count({
      where: {
        ...where,
        status: TicketStatus.CLOSED,
      },
    }),
    prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: true,
    }),
    prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.ticket.findMany({
      where: {
        ...where,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        closedAt: { not: null },
        createdAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    }),
    prisma.sLATracking.findMany({
      where: filters?.startDate || filters?.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {},
      select: {
        firstResponseBreached: true,
        resolutionBreached: true,
      },
    }),
  ])

  // Calculate average resolution time
  let averageResolutionTime = 0
  if (resolvedTicketsWithTime.length > 0) {
    const totalMinutes = resolvedTicketsWithTime.reduce((sum, ticket) => {
      if (ticket.closedAt && ticket.createdAt) {
        const diff = ticket.closedAt.getTime() - ticket.createdAt.getTime()
        return sum + diff / (1000 * 60) // Convert to minutes
      }
      return sum
    }, 0)
    averageResolutionTime = totalMinutes / resolvedTicketsWithTime.length
  }

  // Calculate SLA compliance
  let slaCompliance = 100
  if (slaTracking.length > 0) {
    const totalBreaches =
      slaTracking.filter((t) => t.firstResponseBreached || t.resolutionBreached).length
    slaCompliance = ((slaTracking.length - totalBreaches) / slaTracking.length) * 100
  }

  // Build tickets by priority
  const priorityCounts: Record<TicketPriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  }
  ticketsByPriority.forEach((item) => {
    priorityCounts[item.priority] = item._count
  })

  // Build tickets by status
  const statusCounts: Record<TicketStatus, number> = {
    NEW: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  }
  ticketsByStatus.forEach((item) => {
    statusCounts[item.status] = item._count
  })

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    closedTickets,
    averageResolutionTime: Math.round(averageResolutionTime),
    slaCompliance: Math.round(slaCompliance * 100) / 100,
    ticketsByPriority: priorityCounts,
    ticketsByStatus: statusCounts,
  }
}

export async function getAgentPerformance(filters?: ReportFilters): Promise<AgentPerformance[]> {
  const where: any = {
    assigneeId: { not: null },
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  if (filters?.agentId) {
    where.assigneeId = filters.agentId
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      slaTracking: {
        select: {
          firstResponseActual: true,
          firstResponseTarget: true,
          resolutionActual: true,
          resolutionTarget: true,
          firstResponseBreached: true,
          resolutionBreached: true,
        },
      },
    },
  })

  // Group by agent
  const agentMap = new Map<string, AgentPerformance>()

  tickets.forEach((ticket) => {
    if (!ticket.assignee) return

    const agentId = ticket.assignee.id
    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, {
        id: agentId,
        name: `${ticket.assignee.firstName || ''} ${ticket.assignee.lastName || ''}`.trim() || ticket.assignee.email,
        email: ticket.assignee.email,
        ticketsResolved: 0,
        ticketsAssigned: 0,
        averageResolutionTime: 0,
        slaCompliance: 100,
        firstResponseTime: 0,
      })
    }

    const agent = agentMap.get(agentId)!
    agent.ticketsAssigned++

    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      agent.ticketsResolved++

      if (ticket.closedAt && ticket.createdAt) {
        const resolutionTime = (ticket.closedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
        agent.averageResolutionTime =
          (agent.averageResolutionTime * (agent.ticketsResolved - 1) + resolutionTime) / agent.ticketsResolved
      }
    }

    // Calculate first response time from SLA tracking
    if (ticket.slaTracking?.firstResponseActual && ticket.slaTracking?.firstResponseTarget) {
      const firstResponseTime =
        (ticket.slaTracking.firstResponseActual.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
      agent.firstResponseTime =
        (agent.firstResponseTime * (agent.ticketsAssigned - 1) + firstResponseTime) / agent.ticketsAssigned
    }

    // Calculate SLA compliance
    if (ticket.slaTracking) {
      const totalTickets = agent.ticketsAssigned
      const breaches = (agent.ticketsResolved - agent.ticketsResolved) + // Previous breaches
        (ticket.slaTracking.firstResponseBreached || ticket.slaTracking.resolutionBreached ? 1 : 0)
      agent.slaCompliance = totalTickets > 0 ? ((totalTickets - breaches) / totalTickets) * 100 : 100
    }
  })

  // Calculate final SLA compliance for each agent
  const agents = Array.from(agentMap.values())
  for (const agent of agents) {
    const agentTickets = tickets.filter((t) => t.assigneeId === agent.id)
    const slaTrackings = agentTickets
      .map((t) => t.slaTracking)
      .filter((t) => t !== null) as Array<{
      firstResponseBreached: boolean
      resolutionBreached: boolean
    }>

    if (slaTrackings.length > 0) {
      const breaches = slaTrackings.filter((t) => t.firstResponseBreached || t.resolutionBreached).length
      agent.slaCompliance = ((slaTrackings.length - breaches) / slaTrackings.length) * 100
    }

    agent.averageResolutionTime = Math.round(agent.averageResolutionTime)
    agent.firstResponseTime = Math.round(agent.firstResponseTime)
    agent.slaCompliance = Math.round(agent.slaCompliance * 100) / 100
  }

  return agents.sort((a, b) => b.ticketsResolved - a.ticketsResolved)
}

export async function calculateMTTR(filters?: ReportFilters): Promise<number> {
  const where: any = {
    status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
    closedAt: { not: null },
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  if (filters?.agentId) {
    where.assigneeId = filters.agentId
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      createdAt: true,
      closedAt: true,
    },
  })

  const ticketsWithTime = tickets.filter((t) => t.closedAt && t.createdAt)

  if (ticketsWithTime.length === 0) {
    return 0
  }

  const totalMinutes = ticketsWithTime.reduce((sum, ticket) => {
    const diff = ticket.closedAt!.getTime() - ticket.createdAt!.getTime()
    return sum + diff / (1000 * 60) // Convert to minutes
  }, 0)

  return Math.round(totalMinutes / ticketsWithTime.length)
}

export async function getTicketVolumeByDay(filters?: ReportFilters): Promise<Array<{ date: string; count: number }>> {
  const where: any = {}

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by day
  const dayMap = new Map<string, number>()

  tickets.forEach((ticket) => {
    const date = ticket.createdAt.toISOString().split('T')[0]
    dayMap.set(date, (dayMap.get(date) || 0) + 1)
  })

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function exportAnalyticsToCSV(
  type: 'tickets' | 'agents' | 'sla',
  filters?: ReportFilters
): Promise<string> {
  let csvData = ''

  if (type === 'tickets') {
    const where: any = {}
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        requester: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignee: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    csvData = [
      'Ticket Number,Subject,Status,Priority,Requester,Assignee,Created At,Closed At',
      ...tickets.map((t) =>
        [
          t.ticketNumber,
          `"${t.subject.replace(/"/g, '""')}"`,
          t.status,
          t.priority,
          t.requester.email,
          t.assignee?.email || 'Unassigned',
          t.createdAt.toISOString(),
          t.closedAt?.toISOString() || '',
        ].join(',')
      ),
    ].join('\n')
  } else if (type === 'agents') {
    const agents = await getAgentPerformance(filters)
    csvData = [
      'Agent Name,Email,Tickets Resolved,Tickets Assigned,Average Resolution Time (min),SLA Compliance (%)',
      ...agents.map((a) =>
        [
          `"${a.name.replace(/"/g, '""')}"`,
          a.email,
          a.ticketsResolved,
          a.ticketsAssigned,
          a.averageResolutionTime,
          a.slaCompliance,
        ].join(',')
      ),
    ].join('\n')
  } else if (type === 'sla') {
    const where: any = {}
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const tracking = await prisma.sLATracking.findMany({
      where,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            subject: true,
          },
        },
        slaPolicy: {
          select: {
            name: true,
            priority: true,
          },
        },
      },
    })

    csvData = [
      'Ticket Number,Subject,SLA Policy,First Response Target,First Response Actual,First Response Breached,Resolution Target,Resolution Actual,Resolution Breached',
      ...tracking.map((t) =>
        [
          t.ticket.ticketNumber,
          `"${t.ticket.subject.replace(/"/g, '""')}"`,
          t.slaPolicy.name,
          t.firstResponseTarget?.toISOString() || '',
          t.firstResponseActual?.toISOString() || '',
          t.firstResponseBreached ? 'Yes' : 'No',
          t.resolutionTarget?.toISOString() || '',
          t.resolutionActual?.toISOString() || '',
          t.resolutionBreached ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n')
  }

  return csvData
}

