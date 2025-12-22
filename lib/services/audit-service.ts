import prisma from '@/lib/prisma'
import { AuditEventType } from '@prisma/client'

export interface AuditLogFilters {
  organizationId?: string | null
  eventType?: AuditEventType
  entityType?: string
  entityId?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export interface CreateAuditLogInput {
  organizationId?: string | null
  eventType: AuditEventType
  entityType: string
  entityId?: string | null
  userId: string
  userEmail: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export async function logEvent(input: CreateAuditLogInput) {
  // Check if event should be logged
  if (input.organizationId) {
    const shouldLog = await shouldLogEvent(input.organizationId, input.eventType)
    if (!shouldLog) {
      return null // Event is disabled for this organization
    }
  }

  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      userEmail: input.userEmail,
      description: input.description,
      metadata: input.metadata ? (input.metadata as any) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  })
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const {
    organizationId,
    eventType,
    entityType,
    entityId,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters

  const skip = (page - 1) * limit

  const where: any = {}

  if (organizationId !== undefined) {
    where.organizationId = organizationId
  }

  if (eventType) {
    where.eventType = eventType
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (entityId) {
    where.entityId = entityId
  }

  if (userId) {
    where.userId = userId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
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
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getAuditConfig(organizationId: string) {
  return prisma.auditConfig.findUnique({
    where: { organizationId },
  })
}

export async function updateAuditConfig(
  organizationId: string,
  config: {
    enabled?: boolean
    events?: AuditEventType[]
    retentionDays?: number | null
  }
) {
  return prisma.auditConfig.upsert({
    where: { organizationId },
    update: {
      enabled: config.enabled,
      events: config.events,
      retentionDays: config.retentionDays,
    },
    create: {
      organizationId,
      enabled: config.enabled ?? true,
      events: config.events ?? [],
      retentionDays: config.retentionDays,
    },
  })
}

export async function shouldLogEvent(
  organizationId: string,
  eventType: AuditEventType
): Promise<boolean> {
  const config = await prisma.auditConfig.findUnique({
    where: { organizationId },
  })

  if (!config || !config.enabled) {
    return false
  }

  return config.events.includes(eventType)
}

