import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEmailConfig, upsertEmailConfig } from '@/lib/services/email-service'
import { EmailEncryption, EmailProtocol } from '@prisma/client'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'

const schema = z.object({
  providerName: z.string().optional(),
  protocol: z.nativeEnum(EmailProtocol),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  encryption: z.nativeEnum(EmailEncryption).optional(),
  pollingIntervalMinutes: z.number().int().positive().optional(),
})

export async function GET() {
  const config = await getEmailConfig()
  return NextResponse.json({ success: true, data: config })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    requireAuth(auth)
    requireRole(auth, 'ADMIN')

    const body = await request.json()
    const validated = schema.parse(body)

    const saved = await upsertEmailConfig(validated)
    return NextResponse.json({ success: true, data: saved }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to save configuration' } },
      { status: 500 }
    )
  }
}

