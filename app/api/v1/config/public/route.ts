import { NextRequest, NextResponse } from 'next/server'
import { getSystemConfig } from '@/lib/services/config-service'

export async function GET(req: NextRequest) {
  try {
    const config = await getSystemConfig()
    
    // Only return registration status (public info)
    return NextResponse.json({
      success: true,
      data: {
        registrationEnabled: config.registrationEnabled ?? true,
      },
    })
  } catch (error: any) {
    // Default to enabled if error
    return NextResponse.json({
      success: true,
      data: {
        registrationEnabled: true,
      },
    })
  }
}

