import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'
import { getAvailableRolesForEscalation, getAvailableUsersForEscalation } from '@/lib/services/custom-role-service'
import { createTicketHistory } from '@/lib/services/ticket-history-service'
import { auditLog } from '@/lib/middleware/audit'
import { AuditEventType, RoleName, TicketHistoryType } from '@prisma/client'
import { z } from 'zod'

const escalateTicketSchema = z.object({
  escalatedToRoleId: z.string().uuid().optional(),
  escalatedToSystemRole: z.nativeEnum(RoleName).optional(),
  escalatedToUserId: z.string().uuid().optional(),
  escalationNote: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User must belong to an organization' } },
        { status: 400 }
      )
    }

    // Get ticket to check tenant
    const ticket = await prisma.ticket.findUnique({
      where: { id: (await params).id },
      select: { tenantId: true, organizationId: true },
    })

    if (!ticket || ticket.organizationId !== authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 }
      )
    }

    // Get available roles and users for escalation
    const [availableRoles, availableUsers] = await Promise.all([
      getAvailableRolesForEscalation(authContext.user.organizationId),
      getAvailableUsersForEscalation(authContext.user.organizationId, ticket.tenantId),
    ])

    return NextResponse.json({
      success: true,
      data: { availableRoles, availableUsers },
    })
  } catch (error) {
    console.error('Get escalation roles error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only agents and above can escalate tickets
    const canEscalate = authContext.user.roles.some(
      (r) => r === 'AGENT' || r === 'IT_MANAGER' || r === 'ADMIN' || r.startsWith('CUSTOM:')
    )

    if (!canEscalate) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only agents and above can escalate tickets' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = escalateTicketSchema.parse(body)

    // Must provide either role (custom/system) or specific user
    const hasRole = validatedData.escalatedToRoleId || validatedData.escalatedToSystemRole
    const hasUser = !!validatedData.escalatedToUserId

    if (!hasRole && !hasUser) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Must provide either escalatedToRoleId, escalatedToSystemRole, or escalatedToUserId' } },
        { status: 400 }
      )
    }

    // Cannot provide multiple escalation targets
    const targetCount = [validatedData.escalatedToRoleId, validatedData.escalatedToSystemRole, validatedData.escalatedToUserId].filter(Boolean).length
    if (targetCount > 1) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Can only provide one escalation target (role or user)' } },
        { status: 400 }
      )
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 }
      )
    }

    // Verify ticket belongs to user's organization
    if (ticket.organizationId !== authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // If escalating to custom role, verify it exists and belongs to organization
    if (validatedData.escalatedToRoleId) {
      const customRole = await prisma.customRole.findUnique({
        where: { id: validatedData.escalatedToRoleId },
      })

      if (!customRole || customRole.organizationId !== authContext.user.organizationId) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Custom role not found' } },
          { status: 404 }
        )
      }
    }

    // If escalating to system role, verify it's not ADMIN or END_USER
    if (validatedData.escalatedToSystemRole) {
      if (validatedData.escalatedToSystemRole === RoleName.ADMIN || validatedData.escalatedToSystemRole === RoleName.END_USER) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot escalate to ADMIN or END_USER roles' } },
          { status: 400 }
        )
      }
    }

    // If escalating to specific user, verify user exists and is eligible
    if (validatedData.escalatedToUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validatedData.escalatedToUserId },
        include: {
          roles: {
            include: {
              role: true,
              customRole: true,
            },
          },
        },
      })

      if (!targetUser || targetUser.organizationId !== authContext.user.organizationId) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
          { status: 404 }
        )
      }

      // Verify user is not ADMIN or END_USER
      const userRoles = targetUser.roles
        .map((ur) => ur.role?.name || (ur.customRole ? `CUSTOM:${ur.customRole.name}` : null))
        .filter((r): r is string => r !== null)

      if (userRoles.includes('ADMIN') || userRoles.includes('END_USER')) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot escalate to ADMIN or END_USER' } },
          { status: 400 }
        )
      }

      // Verify user is assigned to the ticket's tenant if ticket has a tenant
      if (ticket.tenantId) {
        const tenantAssignment = await prisma.tenantAssignment.findFirst({
          where: {
            userId: validatedData.escalatedToUserId,
            tenantId: ticket.tenantId,
            category: null,
          },
        })

        if (!tenantAssignment) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'User is not assigned to this ticket\'s tenant' } },
            { status: 400 }
          )
        }
      }
    }

    // Determine escalation target description for history
    let escalationTarget = ''
    if (validatedData.escalatedToUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validatedData.escalatedToUserId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      })
      escalationTarget = targetUser
        ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email
        : 'Unknown User'
    } else if (validatedData.escalatedToRoleId) {
      const customRole = await prisma.customRole.findUnique({
        where: { id: validatedData.escalatedToRoleId },
        select: { displayName: true },
      })
      escalationTarget = customRole?.displayName || 'Unknown Role'
    } else if (validatedData.escalatedToSystemRole) {
      escalationTarget = validatedData.escalatedToSystemRole.replace('_', ' ')
    }

    // Update ticket with escalation
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        escalatedToRoleId: validatedData.escalatedToRoleId || null,
        escalatedToSystemRole: validatedData.escalatedToSystemRole || null,
        escalatedToUserId: validatedData.escalatedToUserId || null,
        escalatedAt: new Date(),
        escalatedBy: authContext.user.id,
        escalationNote: validatedData.escalationNote || null,
      },
      include: {
        escalatedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        escalatedToUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        escalatedToCustomRole: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    })

    // Create ticket history entry
    await createTicketHistory({
      ticketId: id,
      type: TicketHistoryType.ESCALATED,
      userId: authContext.user.id,
      oldValue: ticket.assigneeId ? 'Assigned' : 'Unassigned',
      newValue: escalationTarget,
      note: validatedData.escalationNote || null,
      metadata: {
        escalatedToRoleId: validatedData.escalatedToRoleId,
        escalatedToSystemRole: validatedData.escalatedToSystemRole,
        escalatedToUserId: validatedData.escalatedToUserId,
      },
    })

    // Log audit event
    await auditLog(
      AuditEventType.TICKET_ESCALATED,
      'Ticket',
      ticket.id,
      authContext.user.id,
      authContext.user.email,
      `Escalated ticket to ${escalationTarget}`,
      {
        ticketId: ticket.id,
        escalatedToRoleId: validatedData.escalatedToRoleId,
        escalatedToSystemRole: validatedData.escalatedToSystemRole,
        escalatedToUserId: validatedData.escalatedToUserId,
        escalationNote: validatedData.escalationNote,
      },
      request
    )

    return NextResponse.json({
      success: true,
      data: { ticket: updatedTicket },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    console.error('Escalate ticket error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

