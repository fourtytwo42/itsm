import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/services/notification-service'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authContext

    const preferences = await getNotificationPreferences(user.id)

    return NextResponse.json({
      success: true,
      data: { preferences },
    })
  } catch (error: any) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'PREFERENCES_ERROR', message: error.message } },
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
    const preferences = await updateNotificationPreferences(user.id, body)

    return NextResponse.json({
      success: true,
      data: { preferences },
    })
  } catch (error: any) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'PREFERENCES_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

