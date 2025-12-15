import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { importAssetsFromCSV } from '@/lib/services/asset-service'

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth(request)
    if (!authContext) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has Agent or higher role
    const hasAgentRole = authContext.user.roles.some(
      (r) => r.role.name === 'AGENT' || r.role.name === 'IT_MANAGER' || r.role.name === 'ADMIN'
    )

    if (!hasAgentRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'CSV file is required',
          },
        },
        { status: 400 }
      )
    }

    const csvText = await file.text()
    const result = await importAssetsFromCSV(csvText, authContext.user.id)

    return NextResponse.json(
      {
        success: true,
        data: result,
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

