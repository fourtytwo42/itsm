import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import { getOrganizationById } from '@/lib/services/organization-service'

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    if (!authContext.user.organizationId) {
      return NextResponse.json({ organization: null })
    }

    const organization = await getOrganizationById(authContext.user.organizationId)

    return NextResponse.json({ organization })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

