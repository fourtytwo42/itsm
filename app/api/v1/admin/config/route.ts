import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import { getSystemConfig, setSystemConfig, getAllSettings, getSettingsByCategory } from '@/lib/services/config-service'
import { SettingCategory } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view configuration
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as SettingCategory | null

    if (category) {
      const settings = await getSettingsByCategory(category)
      return NextResponse.json({
        success: true,
        data: { settings },
      })
    }

    const config = await getSystemConfig()
    const allSettings = await getAllSettings()

    return NextResponse.json({
      success: true,
      data: {
        config,
        settings: allSettings,
      },
    })
  } catch (error: any) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message: error.message } },
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

    // Only admins can update configuration
    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid config format' }, { status: 400 })
    }

    await setSystemConfig(config, authContext.user.id)

    const updatedConfig = await getSystemConfig()

    return NextResponse.json({
      success: true,
      data: { config: updatedConfig },
    })
  } catch (error: any) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

