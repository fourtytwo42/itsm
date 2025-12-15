import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import {
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '@/lib/services/config-service'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const types = await getTicketTypes()

    return NextResponse.json({
      success: true,
      data: { types },
    })
  } catch (error: any) {
    console.error('Get ticket types error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'TICKET_TYPES_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const type = await createTicketType(body)

    return NextResponse.json({
      success: true,
      data: { type },
    })
  } catch (error: any) {
    console.error('Create ticket type error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'TICKET_TYPES_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Type ID required' }, { status: 400 })
    }

    const type = await updateTicketType(id, data)

    return NextResponse.json({
      success: true,
      data: { type },
    })
  } catch (error: any) {
    console.error('Update ticket type error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'TICKET_TYPES_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Type ID required' }, { status: 400 })
    }

    await deleteTicketType(id)

    return NextResponse.json({
      success: true,
      data: { message: 'Ticket type deleted' },
    })
  } catch (error: any) {
    console.error('Delete ticket type error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'TICKET_TYPES_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

