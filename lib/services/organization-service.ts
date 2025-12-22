import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { RoleName } from '@prisma/client'

export interface CreateOrganizationInput {
  name: string
  slug: string
  description?: string
  logo?: string
  isActive?: boolean
}

export interface UpdateOrganizationInput {
  name?: string
  slug?: string
  description?: string
  logo?: string
  isActive?: boolean
}

export interface OrganizationFilters {
  search?: string
  isActive?: boolean
}

export async function createOrganization(
  input: CreateOrganizationInput,
  globalAdminId: string
) {
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
  }

  // Check if slug already exists
  const existing = await prisma.organization.findUnique({
    where: { slug: input.slug },
  })

  if (existing) {
    throw new Error('Organization with this slug already exists')
  }

  // Generate org admin email
  const orgAdminEmail = `admin@${input.slug}.demo`

  // Check if org admin email already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: orgAdminEmail },
  })

  if (existingAdmin) {
    throw new Error('Organization admin email already exists')
  }

  // Generate default password (random secure string)
  const defaultPassword =
    Math.random().toString(36).slice(-12) +
    Math.random().toString(36).slice(-12) +
    '!@#A1'

  const passwordHash = await hashPassword(defaultPassword)

  // Create organization and org admin in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        logo: input.logo,
        isActive: input.isActive ?? true,
      },
    })

    // Create org admin user
    const orgAdmin = await tx.user.create({
      data: {
        email: orgAdminEmail,
        passwordHash,
        firstName: 'Organization',
        lastName: 'Admin',
        isActive: true,
        emailVerified: true,
        mustChangePassword: true,
        organizationId: organization.id,
        roles: {
          create: {
            role: {
              connect: { name: RoleName.ADMIN },
            },
          },
        },
      },
    })

    // Create default audit config for organization
    await tx.auditConfig.create({
      data: {
        organizationId: organization.id,
        enabled: true,
        events: [
          'USER_CREATED',
          'USER_UPDATED',
          'USER_DELETED',
          'TENANT_CREATED',
          'TENANT_UPDATED',
          'TENANT_DELETED',
          'TICKET_CREATED',
          'TICKET_UPDATED',
          'TICKET_ASSIGNED',
          'TICKET_STATUS_CHANGED',
        ],
      },
    })

    return { organization, orgAdmin, defaultPassword }
  })

  return result
}

export async function updateOrganization(id: string, input: UpdateOrganizationInput) {
  if (input.slug) {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(input.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    // Check if slug already exists (excluding current organization)
    const existing = await prisma.organization.findUnique({
      where: { slug: input.slug },
    })

    if (existing && existing.id !== id) {
      throw new Error('Organization with this slug already exists')
    }
  }

  return prisma.organization.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      logo: input.logo,
      isActive: input.isActive,
    },
    include: {
      _count: {
        select: {
          users: true,
          tenants: true,
          tickets: true,
        },
      },
    },
  })
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          tenants: true,
          tickets: true,
          kbArticles: true,
          assets: true,
          changes: true,
        },
      },
    },
  })
}

export async function listOrganizations(filters?: OrganizationFilters) {
  const where: any = {}

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  return prisma.organization.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          tenants: true,
          tickets: true,
        },
      },
    },
  })
}

export async function deleteOrganization(id: string) {
  // Soft delete by setting isActive to false
  return prisma.organization.update({
    where: { id },
    data: { isActive: false },
  })
}

export async function getOrganizationUsers(organizationId: string) {
  return prisma.user.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}

export async function getOrganizationTenants(organizationId: string) {
  return prisma.tenant.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: {
          tickets: true,
          assignments: true,
        },
      },
    },
  })
}

export async function canManageOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Check if user is global admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user) {
    return false
  }

  const isGlobalAdmin = user.roles.some((ur) => ur.role.name === 'GLOBAL_ADMIN')
  if (isGlobalAdmin) {
    return true
  }

  // Check if user is admin of this organization
  const isAdmin = user.roles.some((ur) => ur.role.name === 'ADMIN')
  if (isAdmin && user.organizationId === organizationId) {
    return true
  }

  return false
}

