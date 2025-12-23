import prisma from '@/lib/prisma'
import { RoleName } from '@prisma/client'

export interface CreateCustomRoleInput {
  name: string
  displayName: string
  description?: string
  organizationId: string
  isActive?: boolean
}

export interface UpdateCustomRoleInput {
  name?: string
  displayName?: string
  description?: string
  isActive?: boolean
}

export async function createCustomRole(input: CreateCustomRoleInput) {
  // Check if role with same name already exists in organization
  const existing = await prisma.customRole.findUnique({
    where: {
      organizationId_name: {
        organizationId: input.organizationId,
        name: input.name,
      },
    },
  })

  if (existing) {
    throw new Error(`Custom role with name "${input.name}" already exists in this organization`)
  }

  return prisma.customRole.create({
    data: {
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      organizationId: input.organizationId,
      isActive: input.isActive ?? true,
    },
  })
}

export async function getCustomRoleById(id: string) {
  return prisma.customRole.findUnique({
    where: { id },
    include: {
      organization: true,
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })
}

export async function listCustomRoles(organizationId: string, filters?: { isActive?: boolean }) {
  return prisma.customRole.findMany({
    where: {
      organizationId,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: {
      displayName: 'asc',
    },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  })
}

export async function updateCustomRole(id: string, input: UpdateCustomRoleInput) {
  const role = await prisma.customRole.findUnique({ where: { id } })
  if (!role) {
    throw new Error('Custom role not found')
  }

  // If name is being updated, check for conflicts
  if (input.name && input.name !== role.name) {
    const existing = await prisma.customRole.findUnique({
      where: {
        organizationId_name: {
          organizationId: role.organizationId,
          name: input.name,
        },
      },
    })

    if (existing) {
      throw new Error(`Custom role with name "${input.name}" already exists in this organization`)
    }
  }

  return prisma.customRole.update({
    where: { id },
    data: input,
  })
}

export async function deleteCustomRole(id: string) {
  // Check if any users have this role
  const userCount = await prisma.userRole.count({
    where: { customRoleId: id },
  })

  if (userCount > 0) {
    throw new Error(`Cannot delete custom role: ${userCount} user(s) are assigned to this role`)
  }

  return prisma.customRole.delete({
    where: { id },
  })
}

export async function getAvailableRolesForEscalation(organizationId: string) {
  const [systemRoles, customRoles] = await Promise.all([
    // System roles that can receive escalations (AGENT, IT_MANAGER only - NOT ADMIN or END_USER)
    Promise.resolve([
      { type: 'system' as const, id: RoleName.AGENT, name: 'Agent', displayName: 'Agent' },
      { type: 'system' as const, id: RoleName.IT_MANAGER, name: 'IT Manager', displayName: 'IT Manager' },
    ]),
    // Custom roles in the organization
    prisma.customRole.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    }).then(roles => roles.map(r => ({
      type: 'custom' as const,
      id: r.id,
      name: r.name,
      displayName: r.displayName,
    }))),
  ])

  return [...systemRoles, ...customRoles]
}

export async function getAvailableUsersForEscalation(
  organizationId: string,
  tenantId?: string | null
) {
  // Get users in the organization/tenant that are NOT ADMIN or END_USER
  // They should be AGENT, IT_MANAGER, or have custom roles
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      isActive: true,
      deletedAt: null,
      roles: {
        some: {
          OR: [
            { role: { name: { in: [RoleName.AGENT, RoleName.IT_MANAGER] } } },
            { customRole: { isNot: null } },
          ],
        },
      },
      // Exclude users with ADMIN or END_USER roles
      NOT: {
        roles: {
          some: {
            role: {
              name: {
                in: [RoleName.ADMIN, RoleName.END_USER],
              },
            },
          },
        },
      },
    },
    include: {
      roles: {
        include: {
          role: true,
          customRole: true,
        },
      },
      tenantAssignments: tenantId
        ? {
            where: {
              tenantId,
              category: null,
            },
          }
        : undefined,
    },
  })

  // Filter to only users assigned to the tenant if tenantId is provided
  const filteredUsers = tenantId
    ? users.filter((user) => {
        // User must be assigned to the tenant or have no tenant assignments (org-wide)
        return (
          user.tenantAssignments.length > 0 ||
          (user.tenantAssignments.length === 0 && !user.tenantId)
        )
      })
    : users

  return filteredUsers.map((user) => {
    const roles = user.roles
      .map((ur) => ur.role?.name || (ur.customRole ? `CUSTOM:${ur.customRole.name}` : null))
      .filter((r): r is string => r !== null)

    const primaryRole = user.roles.find((ur) => ur.role?.name)?.role?.name
      || user.roles.find((ur) => ur.customRole)?.customRole?.displayName
      || 'Unknown'

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      primaryRole: typeof primaryRole === 'string' ? primaryRole : primaryRole,
      displayName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email,
    }
  })
}

