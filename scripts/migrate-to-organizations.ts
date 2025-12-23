import { PrismaClient, RoleName } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration to organization-based architecture...')

  // Step 1: Create default organization for existing data
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'default-organization' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default-organization',
      description: 'Default organization for migrated data',
      isActive: true,
    },
  })

  console.log('Created default organization:', defaultOrg.id)

  // Step 2: Update all tenants to belong to default organization
  const tenantUpdate = await prisma.tenant.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  })
  console.log('Updated tenants:', tenantUpdate.count)

  // Step 3: Update all users to belong to default organization (except global admin)
  const userUpdate = await prisma.user.updateMany({
    where: {
      organizationId: null,
      roles: {
        none: {
          role: {
            name: RoleName.GLOBAL_ADMIN,
          },
        },
      },
    },
    data: { organizationId: defaultOrg.id },
  })
  console.log('Updated users:', userUpdate.count)

  // Step 4: Update all tickets to belong to default organization
  const ticketUpdate = await prisma.ticket.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  })
  console.log('Updated tickets:', ticketUpdate.count)

  // Step 5: Update all KB articles to belong to default organization
  const kbUpdate = await prisma.knowledgeBaseArticle.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  })
  console.log('Updated KB articles:', kbUpdate.count)

  // Step 6: Update all assets to belong to default organization
  const assetUpdate = await prisma.asset.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  })
  console.log('Updated assets:', assetUpdate.count)

  // Step 7: (Removed - Change requests no longer exist)

  // Step 8: Convert existing ADMIN users to GLOBAL_ADMIN or keep as ADMIN
  // Check if there are any ADMIN users
  const adminUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: RoleName.ADMIN,
          },
        },
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

  for (const user of adminUsers) {
    // If user has no organization, make them GLOBAL_ADMIN
    // Otherwise, keep them as ADMIN (org admin)
    if (!user.organizationId) {
      // Remove ADMIN role and add GLOBAL_ADMIN
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          role: {
            name: RoleName.ADMIN,
          },
        },
      })

      const globalAdminRole = await prisma.role.findUnique({
        where: { name: RoleName.GLOBAL_ADMIN },
      })

      if (globalAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: globalAdminRole.id,
          },
        })
        console.log(`Converted ${user.email} to GLOBAL_ADMIN`)
      }
    }
  }

  // Step 9: Create default audit config for default organization
  await prisma.auditConfig.upsert({
    where: { organizationId: defaultOrg.id },
    update: {},
    create: {
      organizationId: defaultOrg.id,
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

  console.log('Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

