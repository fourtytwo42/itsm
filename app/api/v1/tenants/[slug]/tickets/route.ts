import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/services/tenant-service'
import { listTickets, createTicket } from '@/lib/services/ticket-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { z } from 'zod'
import { TicketPriority } from '@prisma/client'

const createTicketSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(3),
  category: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  customFields: z.record(z.any()).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tenant = await getTenantBySlug(slug)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // Get auth context (may be null for unauthenticated users)
    const auth = await getAuthContext(request)

    // Check for public token if not logged in
    let publicTokenId: string | undefined
    if (!auth?.user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { verifyPublicToken } = await import('@/lib/jwt')
          const payload = verifyPublicToken(token)
          publicTokenId = payload.publicId
        } catch (error) {
          // Invalid public token, return empty
          return NextResponse.json({ success: true, data: [] })
        }
      } else {
        // No auth and no public token, return empty
        return NextResponse.json({ success: true, data: [] })
      }
    }

    // Get tickets for this tenant
    const tickets = await listTickets({
      tenantId: tenant.id,
      requesterId: auth?.user?.id,
      publicTokenId,
      userId: auth?.user?.id,
      userRoles: auth?.user?.roles,
    })

    return NextResponse.json({ success: true, data: tickets })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tickets' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tenant = await getTenantBySlug(slug)

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      )
    }

    // Check if tenant requires login
    if (tenant.requiresLogin) {
      const auth = await getAuthContext(request)
      if (!auth) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const validated = createTicketSchema.parse(body)

    // Validate category belongs to tenant
    const categoryExists = tenant.categories.some((c) => c.category === validated.category)
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category' } },
        { status: 400 }
      )
    }

    // Validate custom fields against tenant's custom field definitions
    if (validated.customFields) {
      for (const field of tenant.customFields) {
        if (field.required && !validated.customFields[field.id]) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: `Field ${field.label} is required` } },
            { status: 400 }
          )
        }
      }
    }

    // Get auth context (may be null for unauthenticated users)
    const auth = await getAuthContext(request)
    
    // Get or create public token if not logged in
    let publicTokenId: string | undefined
    if (!auth?.user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { verifyPublicToken } = await import('@/lib/jwt')
          const payload = verifyPublicToken(token)
          publicTokenId = payload.publicId
        } catch (error) {
          // Invalid public token - we'll create a new one below
        }
      }
      
      // If no valid public token, generate one
      if (!publicTokenId) {
        const tokenResponse = await fetch(`${request.nextUrl.origin}/api/v1/public/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenant.id }),
        })
        const tokenData = await tokenResponse.json()
        if (tokenData.success) {
          publicTokenId = tokenData.data.publicId
        }
      }
    }

    const ticket = await createTicket({
      subject: validated.subject,
      description: validated.description,
      category: validated.category,
      tenantId: tenant.id,
      customFields: validated.customFields || {},
      priority: validated.priority,
      requesterId: auth?.user?.id,
      requesterEmail: validated.email,
      requesterName: validated.name,
      publicTokenId,
      organizationId: tenant.organizationId || undefined,
    })

    return NextResponse.json({ success: true, data: ticket }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create ticket' } },
      { status: 500 }
    )
  }
}
