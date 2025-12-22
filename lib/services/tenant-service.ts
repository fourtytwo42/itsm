import prisma from '@/lib/prisma'
import { CustomFieldType } from '@prisma/client'

export interface CreateTenantInput {
  name: string
  slug: string
  description?: string
  logo?: string
  requiresLogin?: boolean
  isActive?: boolean
  organizationId: string // Tenant belongs to an organization
}

export interface UpdateTenantInput {
  name?: string
  slug?: string
  description?: string
  logo?: string
  requiresLogin?: boolean
  isActive?: boolean
}

export interface CreateCustomFieldInput {
  tenantId: string
  label: string
  fieldType: CustomFieldType
  required?: boolean
  options?: string[]
  placeholder?: string
  order?: number
}

export interface UpdateCustomFieldInput {
  label?: string
  fieldType?: CustomFieldType
  required?: boolean
  options?: string[]
  placeholder?: string
  order?: number
}

export interface CreateAssignmentInput {
  tenantId: string
  userId: string
  category?: string | null // null means all categories
}

export async function createTenant(input: CreateTenantInput) {
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
  }

  // Check if slug already exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: input.slug },
  })

  if (existing) {
    throw new Error('Tenant with this slug already exists')
  }

  return prisma.tenant.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      logo: input.logo,
      requiresLogin: input.requiresLogin ?? false,
      isActive: input.isActive ?? true,
      organizationId: input.organizationId,
    },
    include: {
      categories: true,
      kbArticles: {
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      customFields: {
        orderBy: { order: 'asc' },
      },
      assignments: {
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

export async function updateTenant(id: string, input: UpdateTenantInput) {
  if (input.slug) {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(input.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    // Check if slug already exists (excluding current tenant)
    const existing = await prisma.tenant.findUnique({
      where: { slug: input.slug },
    })

    if (existing && existing.id !== id) {
      throw new Error('Tenant with this slug already exists')
    }
  }

  return prisma.tenant.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      logo: input.logo,
      requiresLogin: input.requiresLogin,
      isActive: input.isActive,
    },
    include: {
      categories: true,
      kbArticles: {
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      customFields: {
        orderBy: { order: 'asc' },
      },
      assignments: {
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

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug, isActive: true },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      categories: true,
      kbArticles: {
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
              tags: true,
            },
          },
        },
      },
      customFields: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      categories: true,
      kbArticles: {
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      customFields: {
        orderBy: { order: 'asc' },
      },
      assignments: {
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

export async function listTenants(filters?: {
  search?: string
  isActive?: boolean
  organizationId?: string // Filter by organization
  userId?: string // For filtering by user's organization
  userRoles?: string[] // User's roles
}) {
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

  // Filter by organization - if user is not GLOBAL_ADMIN, filter by their organization
  if (filters?.userId && filters?.userRoles) {
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
        return []
      }
    }
  }

  if (filters?.organizationId) {
    where.organizationId = filters.organizationId
  }

  return prisma.tenant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      categories: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          tickets: true,
          assignments: true,
        },
      },
    },
  })
}

export async function deleteTenant(id: string) {
  // Soft delete by setting isActive to false
  return prisma.tenant.update({
    where: { id },
    data: { isActive: false },
  })
}

export async function manageTenantCategories(tenantId: string, categories: string[]) {
  // Delete existing categories
  await prisma.tenantCategory.deleteMany({
    where: { tenantId },
  })

  // Create new categories
  if (categories.length > 0) {
    await prisma.tenantCategory.createMany({
      data: categories.map((category) => ({
        tenantId,
        category,
      })),
    })
  }

  return prisma.tenantCategory.findMany({
    where: { tenantId },
  })
}

export async function manageTenantKBArticles(tenantId: string, articleIds: string[]) {
  // Delete existing KB article links
  await prisma.tenantKBArticle.deleteMany({
    where: { tenantId },
  })

  // Create new KB article links
  if (articleIds.length > 0) {
    await prisma.tenantKBArticle.createMany({
      data: articleIds.map((articleId) => ({
        tenantId,
        articleId,
      })),
    })
  }

  return prisma.tenantKBArticle.findMany({
    where: { tenantId },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  })
}

export async function createCustomField(input: CreateCustomFieldInput) {
  return prisma.tenantCustomField.create({
    data: {
      tenantId: input.tenantId,
      label: input.label,
      fieldType: input.fieldType,
      required: input.required ?? false,
      options: input.options ?? [],
      placeholder: input.placeholder,
      order: input.order ?? 0,
    },
  })
}

export async function updateCustomField(id: string, input: UpdateCustomFieldInput) {
  return prisma.tenantCustomField.update({
    where: { id },
    data: {
      label: input.label,
      fieldType: input.fieldType,
      required: input.required,
      options: input.options,
      placeholder: input.placeholder,
      order: input.order,
    },
  })
}

export async function deleteCustomField(id: string) {
  return prisma.tenantCustomField.delete({
    where: { id },
  })
}

export async function createAssignment(input: CreateAssignmentInput) {
  return prisma.tenantAssignment.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      category: input.category,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function deleteAssignment(id: string) {
  return prisma.tenantAssignment.delete({
    where: { id },
  })
}

export async function getUserTenantAssignments(userId: string) {
  return prisma.tenantAssignment.findMany({
    where: { userId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function getUserAssignedCategories(userId: string) {
  const assignments = await prisma.tenantAssignment.findMany({
    where: { userId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Build map of tenantId -> categories
  const categoryMap = new Map<string, Set<string>>()

  for (const assignment of assignments) {
    const tenantId = assignment.tenantId

    if (!categoryMap.has(tenantId)) {
      categoryMap.set(tenantId, new Set())
    }

    if (assignment.category === null) {
      // User is assigned to all categories for this tenant
      // Get all categories for this tenant
      const tenantCategories = await prisma.tenantCategory.findMany({
        where: { tenantId },
      })
      tenantCategories.forEach((tc) => {
        categoryMap.get(tenantId)!.add(tc.category)
      })
    } else {
      // User is assigned to specific category
      categoryMap.get(tenantId)!.add(assignment.category)
    }
  }

  return categoryMap
}

// Organization-based tenant management
export async function canManageTenant(userId: string, tenantId: string): Promise<boolean> {
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

  // Get tenant and check if user belongs to same organization
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { organizationId: true },
  })

  if (!tenant) {
    return false
  }

  // User must belong to the same organization as the tenant
  return user.organizationId === tenant.organizationId
}

