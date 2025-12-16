#!/usr/bin/env tsx
/**
 * Reset and Seed Database Script
 * 
 * This script resets the database (drops all tables) and seeds it with demo data.
 * Perfect for demo environments where you want a fresh start.
 * 
 * Usage:
 *   npm run reset-db
 *   or
 *   npx tsx scripts/reset-db.ts
 */

import { PrismaClient, RoleName } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetting database...')
  
  // Reset database (drops all data and recreates schema)
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE')
  await prisma.$executeRawUnsafe('CREATE SCHEMA public')
  await prisma.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO itsm_user')
  await prisma.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO public')
  
  // Recreate vector extension
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector')
  
  // Run migrations
  console.log('📦 Running migrations...')
  const { execSync } = require('child_process')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  
  console.log('🌱 Seeding database with demo data...')
  
  // Hash password for all demo users
  const demoPasswordHash = await hashPassword('demo123')
  
  // Create Roles
  await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: 'System Administrator' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.IT_MANAGER },
      update: {},
      create: { name: RoleName.IT_MANAGER, description: 'IT Manager' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.AGENT },
      update: {},
      create: { name: RoleName.AGENT, description: 'Support Agent' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.END_USER },
      update: {},
      create: { name: RoleName.END_USER, description: 'End User' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.REQUESTER },
      update: {},
      create: { name: RoleName.REQUESTER, description: 'Submit tickets without account' },
    }),
  ])
  
  // Create Demo Users
  const adminUser = await prisma.user.upsert({
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
          role: { connect: { name: RoleName.ADMIN } },
        },
      },
    },
  })
  
  const itManagerUser = await prisma.user.upsert({
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
          role: { connect: { name: RoleName.IT_MANAGER } },
        },
      },
    },
  })
  
  const agentUser = await prisma.user.upsert({
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
          role: { connect: { name: RoleName.AGENT } },
        },
      },
    },
  })
  
  const endUser1 = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      roles: {
        create: {
          role: { connect: { name: RoleName.END_USER } },
        },
      },
    },
  })
  
  // Create Sample Tickets
  await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: 'TKT-2025-0001',
        subject: 'Cannot access email',
        description: 'I am unable to access my email account. Getting authentication error.',
        status: 'NEW',
        priority: 'HIGH',
        requesterId: endUser1.id,
        assigneeId: agentUser.id,
      },
      {
        ticketNumber: 'TKT-2025-0002',
        subject: 'Printer not working',
        description: 'The office printer is showing error code E-123. Need assistance.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        requesterId: endUser1.id,
        assigneeId: agentUser.id,
      },
      {
        ticketNumber: 'TKT-2025-0003',
        subject: 'Software installation request',
        description: 'Need to install Adobe Creative Suite on my workstation.',
        status: 'NEW',
        priority: 'LOW',
        requesterId: endUser1.id,
      },
    ],
  })
  
  // Create Sample KB Articles
  await prisma.knowledgeBaseArticle.createMany({
    data: [
      {
        slug: 'how-to-reset-password',
        title: 'How to Reset Your Password',
        content: 'To reset your password, click on "Forgot Password" on the login page and follow the instructions sent to your email.',
        status: 'PUBLISHED',
        tags: ['password', 'account', 'security'],
      },
      {
        slug: 'troubleshooting-network',
        title: 'Troubleshooting Network Connectivity',
        content: 'If you are experiencing network connectivity issues, first check your network cable connection, then restart your network adapter.',
        status: 'PUBLISHED',
        tags: ['network', 'connectivity', 'troubleshooting'],
      },
      {
        slug: 'vpn-connection-failing',
        title: 'VPN connection failing',
        content: 'Check your internet connection and ensure VPN credentials are correct.',
        status: 'PUBLISHED',
        tags: ['vpn', 'network', 'remote'],
      },
    ],
  })
  
  // Create Sample Assets
  await prisma.asset.createMany({
    data: [
      {
        assetNumber: 'AST-2025-0001',
        name: 'Laptop - Dell XPS 15',
        type: 'HARDWARE',
        status: 'ACTIVE',
        serialNumber: 'DLXPS001',
        assignedToId: endUser1.id,
      },
      {
        assetNumber: 'AST-2025-0002',
        name: 'Microsoft Office License',
        type: 'SOFTWARE',
        status: 'ACTIVE',
      },
    ],
  })
  
  // Email configuration
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
  
  console.log('✅ Database reset and seeded successfully!')
  console.log('\n📋 Demo Accounts (all use password: demo123):')
  console.log('   Admin:    admin@demo.com')
  console.log('   Manager:  manager@demo.com')
  console.log('   Agent:    agent@demo.com')
  console.log('   User:     user@demo.com')
  console.log('\n📊 Created:')
  console.log(`   - ${await prisma.user.count()} users`)
  console.log(`   - ${await prisma.ticket.count()} tickets`)
  console.log(`   - ${await prisma.knowledgeBaseArticle.count()} KB articles`)
  console.log(`   - ${await prisma.asset.count()} assets`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

