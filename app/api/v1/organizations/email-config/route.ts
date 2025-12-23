import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEmailConfig, upsertEmailConfig } from '@/lib/services/email-service'
import { EmailEncryption, EmailProtocol } from '@prisma/client'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

const schema = z.object({
  providerName: z.string().optional(),
  protocol: z.nativeEnum(EmailProtocol),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().optional(), // Optional for updates (can be empty to keep existing)
  encryption: z.nativeEnum(EmailEncryption).optional(),
  pollingIntervalMinutes: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only ADMIN and IT_MANAGER can view email config for their organization
    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No organization associated with your account' } },
        { status: 403 }
      )
    }

    const config = await getEmailConfig(authContext.user.organizationId)
    return NextResponse.json({ success: true, data: config })
  } catch (error: any) {
    console.error('Get email config error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch email configuration' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only ADMIN and IT_MANAGER can configure email for their organization
    const isAdmin = authContext.user.roles.includes('ADMIN')
    const isITManager = authContext.user.roles.includes('IT_MANAGER')

    if (!isAdmin && !isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or IT Manager access required' } },
        { status: 403 }
      )
    }

    if (!authContext.user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No organization associated with your account' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = schema.parse(body)

    // Check if config exists to determine if password is required
    const existingConfig = await prisma.emailConfiguration.findUnique({
      where: { organizationId: authContext.user.organizationId },
    })
    
    // Password is required if creating new config
    if (!existingConfig && (!validated.password || validated.password.trim() === '')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password is required when creating new email configuration' } },
        { status: 400 }
      )
    }

    const saved = await upsertEmailConfig({
      ...validated,
      organizationId: authContext.user.organizationId,
    })
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
    console.error('Save email config error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to save configuration' } },
      { status: 500 }
    )
  }
}

