import prisma from '@/lib/prisma'

export interface CreateAIRuleInput {
  tenantId?: string
  organizationId?: string
  name: string
  description?: string
  content: string
  priority?: number
  isActive?: boolean
  createdById?: string
}

export interface UpdateAIRuleInput {
  name?: string
  description?: string
  content?: string
  priority?: number
  isActive?: boolean
  updatedById?: string
}

/**
 * Validate that rule belongs to either tenant or organization, not both
 */
function validateRuleOwnership(input: { tenantId?: string; organizationId?: string }) {
  if (input.tenantId && input.organizationId) {
    throw new Error('AIRule must belong to either a tenant OR an organization, not both')
  }
  if (!input.tenantId && !input.organizationId) {
    throw new Error('AIRule must belong to either a tenant or an organization')
  }
}

/**
 * Create a new AI rule for a tenant or organization
 */
export async function createAIRule(input: CreateAIRuleInput) {
  validateRuleOwnership(input)

  // If tenantId is provided, verify tenant exists
  if (input.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
    })
    if (!tenant) {
      throw new Error('Tenant not found')
    }
  }

  // If organizationId is provided, verify organization exists
  if (input.organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: input.organizationId },
    })
    if (!organization) {
      throw new Error('Organization not found')
    }
  }

  return prisma.aIRule.create({
    data: {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      content: input.content,
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
      createdById: input.createdById,
      updatedById: input.createdById, // Set updatedBy on creation
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Update an existing AI rule
 */
export async function updateAIRule(id: string, input: UpdateAIRuleInput) {
  const existing = await prisma.aIRule.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('AIRule not found')
  }

  // Note: Ownership (tenantId/organizationId) cannot be changed via update
  // To change ownership, delete and recreate the rule

  return prisma.aIRule.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      content: input.content,
      priority: input.priority,
      isActive: input.isActive,
      updatedById: input.updatedById,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Get AI rule by ID
 */
export async function getAIRuleById(id: string) {
  return prisma.aIRule.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * List AI rules for a tenant
 */
export async function listAIRulesForTenant(tenantId: string) {
  return prisma.aIRule.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: [
      { priority: 'desc' }, // Higher priority first
      { createdAt: 'desc' },
    ],
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * List AI rules for an organization
 */
export async function listAIRulesForOrganization(organizationId: string) {
  return prisma.aIRule.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: [
      { priority: 'desc' }, // Higher priority first
      { createdAt: 'desc' },
    ],
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Get active AI rules for a tenant (including organization-level rules)
 * Returns rules ordered by priority (higher first), then by creation date
 */
export async function getActiveAIRulesForTenant(tenantId: string) {
  // Get the tenant to find its organization
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { organizationId: true },
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  // Get tenant-specific rules and organization-level rules
  const where: any = {
    isActive: true,
    OR: [
      { tenantId },
      ...(tenant.organizationId ? [{ organizationId: tenant.organizationId }] : []),
    ],
  }

  return prisma.aIRule.findMany({
    where,
    orderBy: [
      { priority: 'desc' }, // Higher priority first
      { createdAt: 'desc' },
    ],
  })
}

/**
 * Delete an AI rule (soft delete by setting isActive to false)
 */
export async function deleteAIRule(id: string) {
  const existing = await prisma.aIRule.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('AIRule not found')
  }

  // Soft delete
  return prisma.aIRule.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Hard delete an AI rule (permanent removal)
 */
export async function hardDeleteAIRule(id: string) {
  return prisma.aIRule.delete({
    where: { id },
  })
}

