import prisma from '@/lib/prisma'
import { TicketPriority, TicketStatus } from '@prisma/client'

export interface CreateSLAPolicyInput {
  name: string
  description?: string
  priority: TicketPriority
  firstResponseTime: number // Minutes
  resolutionTime: number // Minutes
  businessHours?: Record<string, any>
}

export interface UpdateSLAPolicyInput {
  name?: string
  description?: string
  priority?: TicketPriority
  firstResponseTime?: number
  resolutionTime?: number
  businessHours?: Record<string, any>
  active?: boolean
}

export interface CreateEscalationRuleInput {
  slaPolicyId: string
  name: string
  description?: string
  triggerCondition: string
  triggerTime?: number
  action: string
  targetUserId?: string
  newPriority?: TicketPriority
}

export interface UpdateEscalationRuleInput {
  name?: string
  description?: string
  triggerCondition?: string
  triggerTime?: number
  action?: string
  targetUserId?: string
  newPriority?: TicketPriority
  active?: boolean
}

export async function createSLAPolicy(input: CreateSLAPolicyInput) {
  const slaPolicy = await prisma.sLAPolicy.create({
    data: {
      name: input.name,
      description: input.description,
      priority: input.priority,
      firstResponseTime: input.firstResponseTime,
      resolutionTime: input.resolutionTime,
      businessHours: input.businessHours,
      active: true,
    },
    include: {
      escalationRules: true,
    },
  })

  return slaPolicy
}

export async function getSLAPolicyById(id: string) {
  const slaPolicy = await prisma.sLAPolicy.findUnique({
    where: { id },
    include: {
      escalationRules: {
        where: { active: true },
      },
    },
  })

  return slaPolicy
}

export async function listSLAPolicies(activeOnly: boolean = false) {
  const where = activeOnly ? { active: true } : {}

  const slaPolicies = await prisma.sLAPolicy.findMany({
    where,
    include: {
      escalationRules: {
        where: { active: true },
      },
    },
    orderBy: {
      priority: 'asc',
    },
  })

  return slaPolicies
}

export async function updateSLAPolicy(id: string, input: UpdateSLAPolicyInput) {
  const slaPolicy = await prisma.sLAPolicy.update({
    where: { id },
    data: input,
    include: {
      escalationRules: {
        where: { active: true },
      },
    },
  })

  return slaPolicy
}

export async function deleteSLAPolicy(id: string) {
  await prisma.sLAPolicy.delete({
    where: { id },
  })
}

export async function getSLAPolicyForTicket(priority: TicketPriority) {
  const slaPolicy = await prisma.sLAPolicy.findFirst({
    where: {
      priority,
      active: true,
    },
    include: {
      escalationRules: {
        where: { active: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return slaPolicy
}

export async function initializeSLATracking(ticketId: string, slaPolicyId: string) {
  const slaPolicy = await prisma.sLAPolicy.findUnique({
    where: { id: slaPolicyId },
  })

  if (!slaPolicy) {
    throw new Error('SLA Policy not found')
  }

  const now = new Date()
  const firstResponseTarget = new Date(now.getTime() + slaPolicy.firstResponseTime * 60 * 1000)
  const resolutionTarget = new Date(now.getTime() + slaPolicy.resolutionTime * 60 * 1000)

  const tracking = await prisma.sLATracking.upsert({
    where: { ticketId },
    create: {
      ticketId,
      slaPolicyId,
      firstResponseTarget,
      resolutionTarget,
    },
    update: {
      firstResponseTarget,
      resolutionTarget,
    },
  })

  return tracking
}

export async function updateFirstResponseTime(ticketId: string, responseTime: Date) {
  const tracking = await prisma.sLATracking.findUnique({
    where: { ticketId },
    include: {
      slaPolicy: true,
    },
  })

  if (!tracking) {
    return null
  }

  const firstResponseBreached = tracking.firstResponseTarget
    ? responseTime > tracking.firstResponseTarget
    : false

  const updated = await prisma.sLATracking.update({
    where: { ticketId },
    data: {
      firstResponseActual: responseTime,
      firstResponseBreached,
    },
  })

  // Check for escalation
  if (firstResponseBreached) {
    await checkAndExecuteEscalation(ticketId, 'FIRST_RESPONSE_BREACHED')
  }

  return updated
}

export async function updateResolutionTime(ticketId: string, resolutionTime: Date) {
  const tracking = await prisma.sLATracking.findUnique({
    where: { ticketId },
    include: {
      slaPolicy: true,
    },
  })

  if (!tracking) {
    return null
  }

  const resolutionBreached = tracking.resolutionTarget
    ? resolutionTime > tracking.resolutionTarget
    : false

  const updated = await prisma.sLATracking.update({
    where: { ticketId },
    data: {
      resolutionActual: resolutionTime,
      resolutionBreached,
    },
  })

  // Check for escalation
  if (resolutionBreached) {
    await checkAndExecuteEscalation(ticketId, 'RESOLUTION_BREACHED')
  }

  return updated
}

export async function getSLATrackingByTicketId(ticketId: string) {
  const tracking = await prisma.sLATracking.findUnique({
    where: { ticketId },
    include: {
      slaPolicy: true,
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          priority: true,
        },
      },
    },
  })

  return tracking
}

export async function checkAndExecuteEscalation(ticketId: string, condition: string) {
  const tracking = await prisma.sLATracking.findUnique({
    where: { ticketId },
    include: {
      slaPolicy: {
        include: {
          escalationRules: {
            where: {
              active: true,
              triggerCondition: condition,
            },
          },
        },
      },
      ticket: true,
    },
  })

  if (!tracking || !tracking.slaPolicy) {
    return
  }

  const escalationRules = tracking.slaPolicy.escalationRules || []
  for (const rule of escalationRules) {
    await executeEscalationAction(tracking.ticket, rule)
  }
}

async function executeEscalationAction(ticket: any, rule: any) {
  switch (rule.action) {
    case 'ASSIGN_TO_MANAGER':
      if (rule.targetUserId) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            assigneeId: rule.targetUserId,
          },
        })
      }
      break

    case 'INCREASE_PRIORITY':
      if (rule.newPriority) {
        const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        const currentIndex = priorityOrder.indexOf(ticket.priority)
        const newIndex = priorityOrder.indexOf(rule.newPriority)

        if (newIndex > currentIndex) {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              priority: rule.newPriority,
            },
          })
        }
      }
      break

    case 'NOTIFY_STAKEHOLDERS':
      // Notification logic would go here
      // For now, just log
      console.log(`Notifying stakeholders for ticket ${ticket.ticketNumber}`)
      break

    case 'CREATE_CHANGE':
      // Change request creation logic would go here
      console.log(`Creating change request for ticket ${ticket.ticketNumber}`)
      break

    default:
      console.warn(`Unknown escalation action: ${rule.action}`)
  }
}

export async function createEscalationRule(input: CreateEscalationRuleInput) {
  const rule = await prisma.escalationRule.create({
    data: {
      slaPolicyId: input.slaPolicyId,
      name: input.name,
      description: input.description,
      triggerCondition: input.triggerCondition,
      triggerTime: input.triggerTime,
      action: input.action,
      targetUserId: input.targetUserId,
      newPriority: input.newPriority,
      active: true,
    },
  })

  return rule
}

export async function updateEscalationRule(id: string, input: UpdateEscalationRuleInput) {
  const rule = await prisma.escalationRule.update({
    where: { id },
    data: input,
  })

  return rule
}

export async function deleteEscalationRule(id: string) {
  await prisma.escalationRule.delete({
    where: { id },
  })
}

export async function getSLAComplianceStats(startDate?: Date, endDate?: Date) {
  const where: any = {}
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const tracking = await prisma.sLATracking.findMany({
    where,
    include: {
      ticket: {
        select: {
          status: true,
          priority: true,
        },
      },
      slaPolicy: {
        select: {
          priority: true,
        },
      },
    },
  })

  const total = tracking.length
  const firstResponseBreached = tracking.filter((t) => t.firstResponseBreached).length
  const resolutionBreached = tracking.filter((t) => t.resolutionBreached).length
  const firstResponseMet = tracking.filter(
    (t) => t.firstResponseActual && !t.firstResponseBreached
  ).length
  const resolutionMet = tracking.filter(
    (t) => t.resolutionActual && !t.resolutionBreached
  ).length

  return {
    total,
    firstResponseBreached,
    resolutionBreached,
    firstResponseMet,
    resolutionMet,
    firstResponseCompliance: total > 0 ? ((total - firstResponseBreached) / total) * 100 : 0,
    resolutionCompliance: total > 0 ? ((total - resolutionBreached) / total) * 100 : 0,
  }
}

