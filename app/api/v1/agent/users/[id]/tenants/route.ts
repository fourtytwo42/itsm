import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only agents can access this endpoint
    if (!authContext.user.roles.includes('AGENT')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only agents can access this endpoint' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get agent's tenant assignments
    const agentTenantAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: authContext.user.id,
        category: null,
      },
      select: {
        tenantId: true,
      },
    })

    const agentTenantIds = agentTenantAssignments.map((a) => a.tenantId)

    // If agent has no tenant assignments, return empty
    if (agentTenantIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Verify the target user is assigned to at least one of the agent's tenants
    const targetUserAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
        tenantId: { in: agentTenantIds },
        category: null,
      },
      select: {
        tenantId: true,
      },
    })

    // If target user is not in any of agent's tenants, return empty (agents can only see assignments for users in their tenants)
    if (targetUserAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get user's tenant assignments (only for tenants the agent has access to)
    const assignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
        tenantId: { in: agentTenantIds },
        category: null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: assignments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        tenant: a.tenant,
      })),
    })
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

