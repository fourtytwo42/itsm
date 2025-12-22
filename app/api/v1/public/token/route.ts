import { NextRequest, NextResponse } from 'next/server'
import { signPublicToken } from '@/lib/jwt'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId } = body

    // Generate a unique public ID for this browser/session
    const publicId = randomUUID()

    // Create public token payload
    const payload = {
      publicId,
      tenantId: tenantId || undefined,
      createdAt: Date.now(),
    }

    // Sign the token
    const token = signPublicToken(payload)

    return NextResponse.json({
      success: true,
      data: {
        token,
        publicId,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Unable to generate public token' } },
      { status: 500 }
    )
  }
}

