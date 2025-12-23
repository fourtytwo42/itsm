import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tenantSlug: z.string().optional(), // Optional tenant slug for auto-assignment
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const result = await registerUser(validatedData)

    // If tenantSlug is provided, assign user to that tenant
    if (validatedData.tenantSlug) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: validatedData.tenantSlug },
          select: { id: true, organizationId: true },
        })

        if (tenant) {
          // Get full user data to check organizationId
          const fullUser = await prisma.user.findUnique({
            where: { id: result.user.id },
            select: { id: true, organizationId: true },
          })

          // Update user's organization if not set
          if (fullUser && !fullUser.organizationId && tenant.organizationId) {
            await prisma.user.update({
              where: { id: result.user.id },
              data: { organizationId: tenant.organizationId },
            })
          }

          // Create tenant assignment (check if exists first, then create if not)
          const existingAssignment = await prisma.tenantAssignment.findFirst({
            where: {
              tenantId: tenant.id,
              userId: result.user.id,
              category: null,
            },
          })

          if (!existingAssignment) {
            await prisma.tenantAssignment.create({
              data: {
                tenantId: tenant.id,
                userId: result.user.id,
                category: null,
              },
            })
          }
        }
      } catch (error) {
        // Silently fail - tenant assignment is optional
        console.error('Failed to assign user to tenant:', error)
      }
    }

    // Merge public token tickets to user account if public token is provided
    const publicTokenHeader = request.headers.get('x-public-token')
    if (publicTokenHeader) {
      try {
        const { verifyPublicToken } = await import('@/lib/jwt')
        const payload = verifyPublicToken(publicTokenHeader)
        const { mergePublicTokenTicketsToUser } = await import('@/lib/services/ticket-service')
        await mergePublicTokenTicketsToUser(payload.publicId, result.user.id)
      } catch (error) {
        // Silently fail - merging tickets is optional
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

