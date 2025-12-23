import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateTenantAssignmentsSchema = z.object({
  tenantIds: z.array(z.string().uuid()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Allow ADMIN, IT_MANAGER, or AGENT to view tenant assignments
    const isAdmin = authContext.user.roles.includes('ADMIN')
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    const isAgent = authContext.user.roles.includes('AGENT')

    if (!isAdmin && !isITManager && !isAgent) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin, IT Manager, or Agent access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // If IT Manager, verify the user is in the same organization
    if (isITManager && !isAdmin) {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { organizationId: true },
      })

      if (!targetUser || targetUser.organizationId !== authContext.user.organizationId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Can only view tenant assignments for users in your organization' } },
          { status: 403 }
        )
      }
    }

    // If Agent, verify the user is in at least one of the agent's tenants
    if (isAgent && !isAdmin && !isITManager) {
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
    }

    // Get user's tenant assignments (for Admin and IT Manager)
    const assignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
        category: null, // Only get general assignments, not category-specific
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTenantAssignmentsSchema.parse(body)

    // Get user to verify they exist and get their organization
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Verify all tenants belong to the same organization (unless global admin)
    if (!authContext.user.isGlobalAdmin && user.organizationId) {
      const tenants = await prisma.tenant.findMany({
        where: {
          id: { in: validatedData.tenantIds },
          organizationId: user.organizationId,
        },
        select: { id: true },
      })

      if (tenants.length !== validatedData.tenantIds.length) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'All tenants must belong to the user\'s organization' } },
          { status: 403 }
        )
      }
    }

    // Get current assignments
    const currentAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
        category: null,
      },
      select: { tenantId: true },
    })

    const currentTenantIds = currentAssignments.map((a) => a.tenantId)
    const newTenantIds = validatedData.tenantIds

    // Find tenants to add and remove
    const tenantsToAdd = newTenantIds.filter((tid) => !currentTenantIds.includes(tid))
    const tenantsToRemove = currentTenantIds.filter((tid) => !newTenantIds.includes(tid))

    // Remove old assignments
    if (tenantsToRemove.length > 0) {
      await prisma.tenantAssignment.deleteMany({
        where: {
          userId: id,
          tenantId: { in: tenantsToRemove },
          category: null,
        },
      })
    }

    // Add new assignments
    if (tenantsToAdd.length > 0) {
      await prisma.tenantAssignment.createMany({
        data: tenantsToAdd.map((tenantId) => ({
          userId: id,
          tenantId,
          category: null,
        })),
        skipDuplicates: true,
      })
    }

    // Return updated assignments
    const updatedAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
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
      data: updatedAssignments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        tenant: a.tenant,
      })),
    })
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

