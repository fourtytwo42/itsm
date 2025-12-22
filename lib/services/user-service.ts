import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { RoleName } from '@prisma/client'

export interface CreateUserInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  roles?: RoleName[]
  isActive?: boolean
  emailVerified?: boolean
  tenantId?: string
  organizationId?: string
}

export interface UpdateUserInput {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  roles?: RoleName[]
  isActive?: boolean
  emailVerified?: boolean
  tenantId?: string
  organizationId?: string
}

export interface UserFilters {
  search?: string
  role?: RoleName
  isActive?: boolean
  emailVerified?: boolean
  tenantId?: string
  organizationId?: string // Filter by organization
  userId?: string // For filtering by user's organization
  userRoles?: string[] // User's roles
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export async function getUsers(filters: UserFilters = {}) {
  const {
    search,
    role,
    isActive,
    emailVerified,
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc',
  } = filters

  const skip = (page - 1) * limit

  const where: any = {
    deletedAt: null,
  }

  // Filter by organization - if user is not GLOBAL_ADMIN, filter by their organization
  if (filters.userId && filters.userRoles) {
    if (!filters.userRoles.includes('GLOBAL_ADMIN')) {
      // Get user's organization
      const user = await prisma.user.findUnique({
        where: { id: filters.userId },
        select: { organizationId: true },
      })
      if (user?.organizationId) {
        where.organizationId = user.organizationId
      } else {
        // User has no organization, return empty
        return { users: [], pagination: { page, limit, total: 0, totalPages: 0 } }
      }
    }
  }

  if (filters.organizationId) {
    where.organizationId = filters.organizationId
  }

  if (filters.tenantId) {
    where.tenantId = filters.tenantId
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  if (emailVerified !== undefined) {
    where.emailVerified = emailVerified
  }

  if (role) {
    where.roles = {
      some: {
        role: {
          name: role,
        },
      },
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      roles: user.roles.map((ur) => ur.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    roles: user.roles.map((ur) => ur.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function createUser(input: CreateUserInput) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  // Hash password
  const passwordHash = await hashPassword(input.password)

  // Get roles
  const roles = input.roles || [RoleName.END_USER]

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      isActive: input.isActive ?? true,
      emailVerified: input.emailVerified ?? false,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      roles: {
        create: roles.map((roleName) => ({
          role: {
            connect: { name: roleName },
          },
        })),
      },
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    roles: user.roles.map((ur) => ur.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      roles: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if email is being changed and if it's already taken
  if (input.email && input.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }
  }

  // Prepare update data
  const updateData: any = {}

  if (input.email !== undefined) {
    updateData.email = input.email
  }

  if (input.password) {
    updateData.passwordHash = await hashPassword(input.password)
  }

  if (input.firstName !== undefined) {
    updateData.firstName = input.firstName
  }

  if (input.lastName !== undefined) {
    updateData.lastName = input.lastName
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive
  }

  if (input.emailVerified !== undefined) {
    updateData.emailVerified = input.emailVerified
  }

  if (input.tenantId !== undefined) {
    updateData.tenantId = input.tenantId
  }

  if (input.organizationId !== undefined) {
    updateData.organizationId = input.organizationId
  }

  // Update roles if provided
  if (input.roles) {
    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: { userId: id },
    })

    // Create new roles
    updateData.roles = {
      create: input.roles.map((roleName) => ({
        role: {
          connect: { name: roleName },
        },
      })),
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    avatar: updatedUser.avatar,
    isActive: updatedUser.isActive,
    emailVerified: updatedUser.emailVerified,
    roles: updatedUser.roles.map((ur) => ur.role.name),
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  }
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  return { success: true }
}

// Agent assignment to tenants by IT Managers
export async function assignAgentToTenant(
  agentId: string,
  tenantId: string,
  managerId: string
) {
  // Verify manager can manage the tenant (is IT_MANAGER or ADMIN in same organization)
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!manager) {
    throw new Error('Manager not found')
  }

  const isAdmin = manager.roles.some((ur) => ur.role.name === 'ADMIN')
  const isITManager = manager.roles.some((ur) => ur.role.name === 'IT_MANAGER')

  if (!isAdmin && !isITManager) {
    throw new Error('Only IT Managers or Admins can assign agents')
  }

  // Get tenant and verify it belongs to manager's organization
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { organizationId: true },
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  if (manager.organizationId !== tenant.organizationId) {
    throw new Error('You can only assign agents to tenants in your organization')
  }

  // Get agent and verify they belong to same organization
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { organizationId: true, roles: { include: { role: true } } },
  })

  if (!agent) {
    throw new Error('Agent not found')
  }

  // Verify agent is actually an agent
  const isAgent = agent.roles.some((ur) => ur.role.name === 'AGENT')
  if (!isAgent) {
    throw new Error('User is not an agent')
  }

  if (agent.organizationId !== tenant.organizationId) {
    throw new Error('Agent must belong to the same organization as the tenant')
  }

  // Check if assignment already exists
  const existing = await prisma.tenantAssignment.findFirst({
    where: {
      tenantId,
      userId: agentId,
      category: null,
    },
  })

  let assignment
  if (existing) {
    assignment = existing
  } else {
    assignment = await prisma.tenantAssignment.create({
      data: {
        tenantId,
        userId: agentId,
        category: null, // Assigned to all categories
      },
    })
  }

  return assignment
}

export async function unassignAgentFromTenant(
  agentId: string,
  tenantId: string,
  managerId: string
) {
  // Verify manager can manage the tenant
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!manager) {
    throw new Error('Manager not found')
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { organizationId: true },
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  if (manager.organizationId !== tenant.organizationId) {
    throw new Error('You can only manage tenants in your organization')
  }

  // Delete assignment
  await prisma.tenantAssignment.deleteMany({
    where: {
      tenantId,
      userId: agentId,
    },
  })

  return { success: true }
}

export async function getAgentTenantAssignments(agentId: string) {
  return prisma.tenantAssignment.findMany({
    where: { userId: agentId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
        },
      },
    },
  })
}

export async function canManageAgentInOrganization(
  managerId: string,
  agentId: string
): Promise<boolean> {
  // Check if manager and agent are in same organization
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { organizationId: true, roles: { include: { role: true } } },
  })

  if (!manager) {
    return false
  }

  const isAdmin = manager.roles.some((ur) => ur.role.name === 'ADMIN')
  const isITManager = manager.roles.some((ur) => ur.role.name === 'IT_MANAGER')

  if (!isAdmin && !isITManager) {
    return false
  }

  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { organizationId: true },
  })

  if (!agent) {
    return false
  }

  // Must be in same organization
  return manager.organizationId === agent.organizationId
}

export async function activateUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return await prisma.user.update({
    where: { id },
    data: { isActive: true },
  })
}

export async function deactivateUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return await prisma.user.update({
    where: { id },
    data: { isActive: false },
  })
}

