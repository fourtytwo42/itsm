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
}

export interface UpdateUserInput {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  roles?: RoleName[]
  isActive?: boolean
  emailVerified?: boolean
}

export interface UserFilters {
  search?: string
  role?: RoleName
  isActive?: boolean
  emailVerified?: boolean
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

