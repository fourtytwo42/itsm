import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import { markAsRead, deleteNotification } from '@/lib/services/notification-service'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authContext

    const body = await req.json()
    if (body.action === 'read') {
      const success = await markAsRead(params.id, user.id)
      if (!success) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: { message: 'Notification marked as read' } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authContext

    const success = await deleteNotification(params.id, user.id)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { message: 'Notification deleted' } })
  } catch (error: any) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

