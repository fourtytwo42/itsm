import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTicketById, updateTicket, addTicketComment } from '@/lib/services/ticket-service'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { auditLog } from '@/lib/middleware/audit'
import { TicketPriority, TicketStatus, AuditEventType } from '@prisma/client'

const idSchema = z.object({
  id: z.string().uuid(),
})

const updateSchema = z.object({
  subject: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
})

const commentSchema = z.object({
  body: z.string().min(1),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = idSchema.parse(await params)
    const auth = await getAuthContext(request)
    
    // Check for public token if not authenticated
    let publicTokenId: string | undefined
    if (!auth?.user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { verifyPublicToken } = await import('@/lib/jwt')
          const payload = verifyPublicToken(token)
          publicTokenId = payload.publicId
        } catch (error) {
          // Invalid public token
          return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
          )
        }
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }
    }

    const ticket = await getTicketById(id)
    if (!ticket) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 })
    }

    // Check if user has access to this ticket
    if (auth?.user) {
      const isRequester = ticket.requesterId === auth.user.id
      const isAssignee = ticket.assigneeId === auth.user.id
      const isAdmin = auth.user.roles.includes('ADMIN')
      const isManager = auth.user.roles.includes('IT_MANAGER')
      const isAgent = auth.user.roles.includes('AGENT')

      if (!isRequester && !isAssignee && !isAdmin && !isManager && !isAgent) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        )
      }
    } else if (publicTokenId) {
      // Check if ticket belongs to this public token
      if (ticket.publicTokenId !== publicTokenId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch ticket' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    const { id } = idSchema.parse(await params)
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Get old ticket data for audit
    const oldTicket = await getTicketById(id)

    const updated = await updateTicket(id, validated)

    // Log audit events for status and priority changes
    if (validated.status && oldTicket && oldTicket.status !== validated.status) {
      await auditLog(
        AuditEventType.TICKET_STATUS_CHANGED,
        'Ticket',
        id,
        auth.user.id,
        auth.user.email,
        `Changed ticket ${updated.ticketNumber} status from ${oldTicket.status} to ${validated.status}`,
        { ticketId: id, ticketNumber: updated.ticketNumber, oldStatus: oldTicket.status, newStatus: validated.status },
        request
      )
    }

    if (validated.priority && oldTicket && oldTicket.priority !== validated.priority) {
      await auditLog(
        AuditEventType.TICKET_PRIORITY_CHANGED,
        'Ticket',
        id,
        auth.user.id,
        auth.user.email,
        `Changed ticket ${updated.ticketNumber} priority from ${oldTicket.priority} to ${validated.priority}`,
        { ticketId: id, ticketNumber: updated.ticketNumber, oldPriority: oldTicket.priority, newPriority: validated.priority },
        request
      )
    }

    if (validated.assigneeId !== undefined && oldTicket && oldTicket.assigneeId !== validated.assigneeId) {
      await auditLog(
        AuditEventType.TICKET_ASSIGNED,
        'Ticket',
        id,
        auth.user.id,
        auth.user.email,
        `Assigned ticket ${updated.ticketNumber} to ${validated.assigneeId || 'unassigned'}`,
        { ticketId: id, ticketNumber: updated.ticketNumber, oldAssigneeId: oldTicket.assigneeId, newAssigneeId: validated.assigneeId },
        request
      )
    }

    // Log general update if no specific event was logged
    if (!validated.status && !validated.priority && validated.assigneeId === undefined) {
      await auditLog(
        AuditEventType.TICKET_UPDATED,
        'Ticket',
        id,
        auth.user.id,
        auth.user.email,
        `Updated ticket: ${updated.ticketNumber}`,
        { ticketId: id, ticketNumber: updated.ticketNumber, changes: validated },
        request
      )
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update ticket' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    const { id } = idSchema.parse(await params)
    const body = await request.json()
    const validated = commentSchema.parse(body)

    const comment = await addTicketComment({
      ticketId: id,
      authorId: auth.user.id,
      body: validated.body,
    })

    // Get ticket for audit log
    const ticket = await getTicketById(id)

    // Log audit event
    await auditLog(
      AuditEventType.TICKET_COMMENT_ADDED,
      'Ticket',
      id,
      auth.user.id,
      auth.user.email,
      `Added comment to ticket: ${ticket?.ticketNumber || id}`,
      { ticketId: id, ticketNumber: ticket?.ticketNumber, commentId: comment.id },
      request
    )

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to add comment' } },
      { status: 500 }
    )
  }
}

