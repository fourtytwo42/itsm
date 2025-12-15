import { prisma } from '@/lib/prisma'
import {
  ChangeType,
  ChangeStatus,
  ChangePriority,
  RiskLevel,
  ApprovalStatus,
} from '@prisma/client'

export interface CreateChangeRequestInput {
  title: string
  description: string
  type: ChangeType
  priority?: ChangePriority
  riskLevel?: RiskLevel
  plannedStartDate?: Date
  plannedEndDate?: Date
  relatedTicketId?: string
  requestedById: string
}

export interface UpdateChangeRequestInput {
  title?: string
  description?: string
  type?: ChangeType
  priority?: ChangePriority
  riskLevel?: RiskLevel
  plannedStartDate?: Date
  plannedEndDate?: Date
  actualStartDate?: Date
  actualEndDate?: Date
  implementationNotes?: string
  relatedTicketId?: string
}

export interface ListChangeRequestsFilters {
  type?: ChangeType
  status?: ChangeStatus
  priority?: ChangePriority
  requestedBy?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CreateApprovalInput {
  changeRequestId: string
  approverId: string
  stage: number
  comments?: string
}

export interface ApproveChangeInput {
  changeRequestId: string
  approverId: string
  stage: number
  approved: boolean
  comments?: string
}

function generateChangeNumber(): string {
  const year = new Date().getFullYear()
  const prefix = 'CHG'
  return `${prefix}-${year}-0001` // Simplified - in production, query for last number
}

export async function createChangeRequest(input: CreateChangeRequestInput) {
  const changeNumber = generateChangeNumber()

  const changeRequest = await prisma.changeRequest.create({
    data: {
      changeNumber,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority || ChangePriority.MEDIUM,
      riskLevel: input.riskLevel,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      relatedTicketId: input.relatedTicketId,
      requestedById: input.requestedById,
      status: ChangeStatus.DRAFT,
    },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      relatedTicket: {
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  return changeRequest
}

export async function getChangeRequestById(id: string) {
  const changeRequest = await prisma.changeRequest.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      relatedTicket: {
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          stage: 'asc',
        },
      },
    },
  })

  return changeRequest
}

export async function listChangeRequests(filters: ListChangeRequestsFilters = {}) {
  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit
  const sort = filters.sort || 'createdAt'
  const order = filters.order || 'desc'

  const where: any = {
    deletedAt: null,
  }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.priority) {
    where.priority = filters.priority
  }

  if (filters.requestedBy) {
    where.requestedById = filters.requestedBy
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { changeNumber: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [changeRequests, total] = await Promise.all([
    prisma.changeRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedTicket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.changeRequest.count({ where }),
  ])

  return {
    changeRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateChangeRequest(id: string, input: UpdateChangeRequestInput) {
  const changeRequest = await prisma.changeRequest.update({
    where: { id },
    data: input,
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      relatedTicket: {
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  return changeRequest
}

export async function deleteChangeRequest(id: string) {
  const changeRequest = await prisma.changeRequest.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  return changeRequest
}

export async function submitChangeRequest(id: string) {
  const changeRequest = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: ChangeStatus.SUBMITTED,
    },
    include: {
      approvals: true,
    },
  })

  return changeRequest
}

export async function createApproval(input: CreateApprovalInput) {
  const approval = await prisma.changeApproval.create({
    data: {
      changeRequestId: input.changeRequestId,
      approverId: input.approverId,
      stage: input.stage,
      comments: input.comments,
      status: ApprovalStatus.PENDING,
    },
    include: {
      approver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      changeRequest: {
        select: {
          id: true,
          changeNumber: true,
          title: true,
        },
      },
    },
  })

  return approval
}

export async function approveChange(input: ApproveChangeInput) {
  // Update the approval
  const approval = await prisma.changeApproval.update({
    where: {
      changeRequestId_approverId_stage: {
        changeRequestId: input.changeRequestId,
        approverId: input.approverId,
        stage: input.stage,
      },
    },
    data: {
      status: input.approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      comments: input.comments,
      approvedAt: input.approved ? new Date() : null,
    },
    include: {
      changeRequest: {
        include: {
          approvals: true,
        },
      },
    },
  })

  const changeRequest = approval.changeRequest

  // If rejected, update change request status
  if (!input.approved) {
    await prisma.changeRequest.update({
      where: { id: input.changeRequestId },
      data: {
        status: ChangeStatus.REJECTED,
      },
    })
    return approval
  }

  // Check if all approvals for this stage are approved
  const stageApprovals = changeRequest.approvals.filter((a) => a.stage === input.stage)
  const allStageApproved = stageApprovals.every(
    (a) => a.status === ApprovalStatus.APPROVED
  )

  if (!allStageApproved) {
    // Still waiting for other approvals in this stage
    return approval
  }

  // Check if there are more stages
  const maxStage = Math.max(...changeRequest.approvals.map((a) => a.stage))
  const nextStage = input.stage + 1
  const nextStageApprovals = changeRequest.approvals.filter((a) => a.stage === nextStage)

  if (nextStageApprovals.length > 0) {
    // Move to next stage
    await prisma.changeRequest.update({
      where: { id: input.changeRequestId },
      data: {
        status: ChangeStatus.IN_REVIEW,
      },
    })
  } else if (input.stage >= maxStage) {
    // All stages approved, mark as approved
    await prisma.changeRequest.update({
      where: { id: input.changeRequestId },
      data: {
        status: ChangeStatus.APPROVED,
      },
    })
  }

  return approval
}

export async function startImplementation(id: string) {
  const changeRequest = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: ChangeStatus.IMPLEMENTED,
      actualStartDate: new Date(),
    },
  })

  return changeRequest
}

export async function completeImplementation(id: string, implementationNotes?: string) {
  const changeRequest = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: ChangeStatus.CLOSED,
      actualEndDate: new Date(),
      implementationNotes,
    },
  })

  return changeRequest
}

