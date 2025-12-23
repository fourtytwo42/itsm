import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    const { id } = await params

    // Get tickets related to this asset via TicketAssetRelation
    const relations = await prisma.ticketAssetRelation.findMany({
      where: { assetId: id },
      include: {
        ticket: {
          include: {
            requester: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            assignee: {
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
      orderBy: {
        ticket: {
          createdAt: 'desc',
        },
      },
    })

    const tickets = relations.map((rel) => ({
      id: rel.ticket.id,
      ticketNumber: rel.ticket.ticketNumber,
      subject: rel.ticket.subject,
      status: rel.ticket.status,
      priority: rel.ticket.priority,
      createdAt: rel.ticket.createdAt,
      requester: rel.ticket.requester,
      assignee: rel.ticket.assignee,
      relationType: rel.relationType,
    }))

    return NextResponse.json(
      {
        success: true,
        data: tickets,
      },
      { status: 200 }
    )
  } catch (error) {
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

