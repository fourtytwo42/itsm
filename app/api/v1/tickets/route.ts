import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createTicket, listTickets } from '@/lib/services/ticket-service'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { auditLog } from '@/lib/middleware/audit'
import { TicketPriority, TicketStatus, AuditEventType } from '@prisma/client'

const createTicketSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(3),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().uuid().optional(),
})

const listSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  requesterId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    const { searchParams } = new URL(request.url)
    const parsed = listSchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      assigneeId: searchParams.get('assigneeId') ?? undefined,
      requesterId: searchParams.get('requesterId') ?? undefined,
      tenantId: searchParams.get('tenantId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Pass user info for category filtering
    const tickets = await listTickets({
      ...parsed.data,
      userId: auth?.user?.id,
      userRoles: auth?.user?.roles,
    })
    return NextResponse.json({ success: true, data: tickets })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tickets' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)

    const body = await request.json()
    const validated = createTicketSchema.parse(body)

    const ticket = await createTicket({
      subject: validated.subject,
      description: validated.description,
      priority: validated.priority,
      assigneeId: validated.assigneeId,
      requesterId: auth.user.id,
      organizationId: auth.user.organizationId || undefined,
    })

    // Log audit event
    await auditLog(
      AuditEventType.TICKET_CREATED,
      'Ticket',
      ticket.id,
      auth.user.id,
      auth.user.email,
      `Created ticket: ${ticket.ticketNumber} - ${ticket.subject}`,
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, subject: ticket.subject },
      request
    )

    return NextResponse.json({ success: true, data: ticket }, { status: 201 })
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create ticket' } },
      { status: 500 }
    )
  }
}

