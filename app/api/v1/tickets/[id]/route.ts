import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTicketById, updateTicket, addTicketComment } from '@/lib/services/ticket-service'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { TicketPriority, TicketStatus } from '@prisma/client'

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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = idSchema.parse(await params)
    const ticket = await getTicketById(id)
    if (!ticket) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 })
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

    const updated = await updateTicket(id, validated)
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

