import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const assignTenantSchema = z.object({
  tenantId: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only IT_MANAGER can view user tenant assignments
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    if (!isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'IT Manager access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get IT Manager's tenant assignments
    const managerTenantAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: authContext.user.id,
        category: null,
      },
      select: {
        tenantId: true,
      },
    })

    const managerTenantIds = managerTenantAssignments.map((a) => a.tenantId)

    if (managerTenantIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get user's tenant assignments, but only for tenants the manager can manage
    const assignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: id,
        tenantId: { in: managerTenantIds },
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
    console.error('Error fetching user tenant assignments:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch assignments' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only IT_MANAGER can assign users to tenants
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    if (!isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'IT Manager access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignTenantSchema.parse(body)

    // Get IT Manager's tenant assignments
    const managerTenantAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: authContext.user.id,
        category: null,
      },
      select: {
        tenantId: true,
      },
    })

    const managerTenantIds = managerTenantAssignments.map((a) => a.tenantId)

    // Verify the tenant is one the manager can manage
    if (!managerTenantIds.includes(validatedData.tenantId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only assign users to your own tenants' } },
        { status: 403 }
      )
    }

    // Verify the user is not an ADMIN or IT_MANAGER
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const userRole = targetUser.roles[0]?.role?.name
    if (userRole === 'ADMIN' || userRole === 'IT_MANAGER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot assign ADMIN or IT_MANAGER users to tenants' } },
        { status: 403 }
      )
    }

    // Verify user is not the manager themselves
    if (id === authContext.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify your own tenant assignments' } },
        { status: 403 }
      )
    }

    // Create or update assignment
    // First check if assignment exists
    const existing = await prisma.tenantAssignment.findFirst({
      where: {
        tenantId: validatedData.tenantId,
        userId: id,
        category: null,
      },
    })

    let assignment
    if (existing) {
      assignment = existing
    } else {
      assignment = await prisma.tenantAssignment.create({
        data: {
          tenantId: validatedData.tenantId,
          userId: id,
          category: null,
        },
      })
    }

    return NextResponse.json({ success: true, data: assignment }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user to tenant:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to assign user to tenant' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)

    // Only IT_MANAGER can unassign users from tenants
    const isITManager = authContext.user.roles.includes('IT_MANAGER')
    if (!isITManager) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'IT Manager access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'assignmentId is required' } },
        { status: 400 }
      )
    }

    // Get the assignment to verify it's for a tenant the manager can manage
    const assignment = await prisma.tenantAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        tenantId: true,
        userId: true,
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    // Verify the user is not the manager themselves
    if (assignment.userId === authContext.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify your own tenant assignments' } },
        { status: 403 }
      )
    }

    // Get IT Manager's tenant assignments
    const managerTenantAssignments = await prisma.tenantAssignment.findMany({
      where: {
        userId: authContext.user.id,
        category: null,
      },
      select: {
        tenantId: true,
      },
    })

    const managerTenantIds = managerTenantAssignments.map((a) => a.tenantId)

    // Verify the tenant is one the manager can manage
    if (!managerTenantIds.includes(assignment.tenantId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only unassign users from your own tenants' } },
        { status: 403 }
      )
    }

    await prisma.tenantAssignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ success: true, message: 'User unassigned from tenant' }, { status: 200 })
  } catch (error) {
    console.error('Error unassigning user from tenant:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to unassign user from tenant' } },
      { status: 500 }
    )
  }
}

