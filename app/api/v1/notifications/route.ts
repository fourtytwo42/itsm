import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/services/notification-service'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authContext

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await getNotifications(user.id, { limit, unreadOnly })
    const unreadCount = await getUnreadCount(user.id)

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATIONS_ERROR', message: error.message } },
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
    const { user } = authContext

    const body = await req.json()
    if (body.action === 'markAllAsRead') {
      await markAllAsRead(user.id)
      return NextResponse.json({ success: true, data: { message: 'All notifications marked as read' } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATIONS_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

