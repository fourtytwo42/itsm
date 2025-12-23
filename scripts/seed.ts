import { PrismaClient, RoleName } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.GLOBAL_ADMIN },
      update: {},
      create: {
        name: RoleName.GLOBAL_ADMIN,
        description: 'Global system administrator - can see and manage all organizations',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        description: 'Organization administrator',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.IT_MANAGER },
      update: {},
      create: {
        name: RoleName.IT_MANAGER,
        description: 'Team management and analytics',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.AGENT },
      update: {},
      create: {
        name: RoleName.AGENT,
        description: 'Ticket resolution and asset management',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.END_USER },
      update: {},
      create: {
        name: RoleName.END_USER,
        description: 'Submit tickets and access KB',
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.REQUESTER },
      update: {},
      create: {
        name: RoleName.REQUESTER,
        description: 'Submit tickets without account',
      },
    }),
  ])

  console.log('Roles created:', roles.length)

  // Hash password for demo accounts
  const demoPasswordHash = await hashPassword('demo123')

  // Create global admin user
  const globalAdmin = await prisma.user.upsert({
    where: { email: 'global@demo.com' },
    update: {},
    create: {
      email: 'global@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Global',
      lastName: 'Admin',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.GLOBAL_ADMIN },
          },
        },
      },
    },
  })

  console.log('Global admin created:', globalAdmin.email)

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      description: 'Demo organization for testing',
      isActive: true,
    },
  })

  console.log('Organization created:', organization.name)

  // Create org admin (auto-created with organization)
  const orgAdminEmail = `admin@${organization.slug}.demo`
  const orgAdminPasswordHash = await hashPassword('demo123')
  const orgAdmin = await prisma.user.upsert({
    where: { email: orgAdminEmail },
    update: {},
    create: {
      email: orgAdminEmail,
      passwordHash: orgAdminPasswordHash,
      firstName: 'Organization',
      lastName: 'Admin',
      isActive: true,
      emailVerified: true,
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

  console.log('Org admin created:', orgAdmin.email)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: 'manager@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'IT',
      lastName: 'Manager',
      isActive: true,
      emailVerified: true,
      organizationId: organization.id,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.IT_MANAGER },
          },
        },
      },
    },
  })

  console.log('IT Manager created:', manager.email)

  // Create agent - independent, in organization
  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: 'agent@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Support',
      lastName: 'Agent',
      isActive: true,
      emailVerified: true,
      organizationId: organization.id,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.AGENT },
          },
        },
      },
    },
  })

  console.log('Agent created:', agent.email)

  // Create end user in organization
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: 'user@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'End',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      organizationId: organization.id,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.END_USER },
          },
        },
      },
    },
  })

  console.log('End user created:', user.email)

  // Create demo tenant owned by organization
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {
      organizationId: organization.id,
    },
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      description: 'Demo tenant for testing multi-tenant features',
      organizationId: organization.id,
      requiresLogin: false,
      isActive: true,
      categories: {
        create: [
          { category: 'IT Support' },
          { category: 'HR' },
          { category: 'Facilities' },
        ],
      },
    },
    include: {
      categories: true,
    },
  })

  console.log('Demo tenant created:', demoTenant.name, '(owned by organization:', organization.name + ')')

  // Assign agent to tenant (all categories)
  const existingAgentAssignment = await prisma.tenantAssignment.findFirst({
    where: {
      tenantId: demoTenant.id,
      userId: agent.id,
      category: null,
    },
  })

  if (!existingAgentAssignment) {
    await prisma.tenantAssignment.create({
      data: {
        tenantId: demoTenant.id,
        userId: agent.id,
        category: null, // All categories
      },
    })
  }

  // Assign end user to tenant (all categories)
  const existingUserAssignment = await prisma.tenantAssignment.findFirst({
    where: {
      tenantId: demoTenant.id,
      userId: user.id,
      category: null,
    },
  })

  if (!existingUserAssignment) {
    await prisma.tenantAssignment.create({
      data: {
        tenantId: demoTenant.id,
        userId: user.id,
        category: null, // All categories
      },
    })
  }

  // Assign IT Manager to tenant (all categories)
  const existingManagerAssignment = await prisma.tenantAssignment.findFirst({
    where: {
      tenantId: demoTenant.id,
      userId: manager.id,
      category: null,
    },
  })

  if (!existingManagerAssignment) {
    await prisma.tenantAssignment.create({
      data: {
        tenantId: demoTenant.id,
        userId: manager.id,
        category: null, // All categories
      },
    })
  }

  console.log('Tenant assignments created:')
  console.log('- Agent assigned to tenant')
  console.log('- End User assigned to tenant')
  console.log('- IT Manager assigned to tenant')

  // Create sample tickets (associated with demo tenant)
  const ticket1 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-2025-0001' },
    update: {
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
    create: {
      ticketNumber: 'TKT-2025-0001',
      subject: 'Laptop not booting',
      description: 'The laptop hangs on boot screen.',
      status: 'NEW',
      priority: 'HIGH',
      requesterId: user.id,
      assigneeId: agent.id,
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
  })

  const ticket2 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-2025-0002' },
    update: {
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
    create: {
      ticketNumber: 'TKT-2025-0002',
      subject: 'VPN connection failing',
      description: 'Cannot connect to corporate VPN from home.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      requesterId: user.id,
      assigneeId: agent.id,
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
  })

  const ticket3 = await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-2025-0003' },
    update: {
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
    create: {
      ticketNumber: 'TKT-2025-0003',
      subject: 'Email not syncing on mobile',
      description: 'Outlook app is not syncing emails.',
      status: 'NEW',
      priority: 'LOW',
      requesterId: user.id,
      assigneeId: manager.id,
      tenantId: demoTenant.id,
      organizationId: organization.id,
      category: 'IT Support',
    },
  })

  console.log('Tickets created/updated:', 3)

  // Email configuration seed
  await prisma.emailConfiguration.upsert({
    where: { id: 'default-email-config' },
    update: {},
    create: {
      id: 'default-email-config',
      providerName: 'Demo Mail',
      protocol: 'IMAP',
      host: 'mail.example.com',
      port: 993,
      username: 'demo@example.com',
      password: 'demo-password',
      encryption: 'SSL',
      pollingIntervalMinutes: 5,
    },
  })

  // Knowledge base articles (associated with demo tenant)
  const kbArticle1 = await prisma.knowledgeBaseArticle.upsert({
    where: { slug: 'vpn-connection-failing' },
    update: {
      tenantId: demoTenant.id,
      organizationId: organization.id,
    },
    create: {
      slug: 'vpn-connection-failing',
      title: 'VPN connection failing',
      content: 'Check your internet connection and ensure VPN credentials are correct.',
      status: 'PUBLISHED',
      tags: ['vpn', 'network', 'remote'],
      tenantId: demoTenant.id,
      organizationId: organization.id,
    },
  })

  const kbArticle2 = await prisma.knowledgeBaseArticle.upsert({
    where: { slug: 'email-not-syncing' },
    update: {
      tenantId: demoTenant.id,
      organizationId: organization.id,
    },
    create: {
      slug: 'email-not-syncing',
      title: 'Email not syncing on mobile',
      content: 'Remove and re-add the account, ensure IMAP is enabled.',
      status: 'PUBLISHED',
      tags: ['email', 'mobile', 'sync'],
      tenantId: demoTenant.id,
    },
  })

  const kbArticle3 = await prisma.knowledgeBaseArticle.upsert({
    where: { slug: 'laptop-boot-issue' },
    update: {
      tenantId: demoTenant.id,
    },
    create: {
      slug: 'laptop-boot-issue',
      title: 'Laptop not booting',
      content: 'Boot into safe mode, run disk check, and ensure BIOS settings are correct.',
      status: 'PUBLISHED',
      tags: ['laptop', 'boot', 'hardware'],
      tenantId: demoTenant.id,
    },
  })

  // Link KB articles to tenant
  const articles = [kbArticle1, kbArticle2, kbArticle3]
  for (const article of articles) {
    const existingLink = await prisma.tenantKBArticle.findFirst({
      where: {
        tenantId: demoTenant.id,
        articleId: article.id,
      },
    })

    if (!existingLink) {
      await prisma.tenantKBArticle.create({
        data: {
          tenantId: demoTenant.id,
          articleId: article.id,
        },
      })
    }
  }

  console.log('KB articles created/updated and linked to tenant:', articles.length)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

