import { PrismaClient, RoleName } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        description: 'Full system access',
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

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.ADMIN },
          },
        },
      },
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'IT',
      lastName: 'Manager',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.IT_MANAGER },
          },
        },
      },
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: {},
    create: {
      email: 'agent@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Support',
      lastName: 'Agent',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.AGENT },
          },
        },
      },
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'End',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: RoleName.END_USER },
          },
        },
      },
    },
  })

  console.log('Demo users created:')
  console.log('- Admin:', admin.email)
  console.log('- Manager:', manager.email)
  console.log('- Agent:', agent.email)
  console.log('- User:', user.email)

  // Create sample tickets
  const tickets = await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: 'TKT-2025-0001',
        subject: 'Laptop not booting',
        description: 'The laptop hangs on boot screen.',
        status: 'NEW',
        priority: 'HIGH',
        requesterId: user.id,
        assigneeId: agent.id,
      },
      {
        ticketNumber: 'TKT-2025-0002',
        subject: 'VPN connection failing',
        description: 'Cannot connect to corporate VPN from home.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        requesterId: user.id,
        assigneeId: agent.id,
      },
      {
        ticketNumber: 'TKT-2025-0003',
        subject: 'Email not syncing on mobile',
        description: 'Outlook app is not syncing emails.',
        status: 'NEW',
        priority: 'LOW',
        requesterId: user.id,
        assigneeId: manager.id,
      },
    ],
  })

  console.log('Tickets created:', tickets.count)

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

  // Knowledge base articles
  await prisma.knowledgeBaseArticle.createMany({
    data: [
      {
        slug: 'vpn-connection-failing',
        title: 'VPN connection failing',
        content: 'Check your internet connection and ensure VPN credentials are correct.',
        status: 'PUBLISHED',
        tags: ['vpn', 'network', 'remote'],
      },
      {
        slug: 'email-not-syncing',
        title: 'Email not syncing on mobile',
        content: 'Remove and re-add the account, ensure IMAP is enabled.',
        status: 'PUBLISHED',
        tags: ['email', 'mobile', 'sync'],
      },
      {
        slug: 'laptop-boot-issue',
        title: 'Laptop not booting',
        content: 'Boot into safe mode, run disk check, and ensure BIOS settings are correct.',
        status: 'PUBLISHED',
        tags: ['laptop', 'boot', 'hardware'],
      },
    ],
  })

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

