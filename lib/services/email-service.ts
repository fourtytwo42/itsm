import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { EmailConfiguration, EmailEncryption, EmailProtocol } from '@prisma/client'

export type EmailConfigInput = {
  providerName?: string
  protocol: EmailProtocol
  host: string
  port: number
  username: string
  password?: string // Optional for updates (can be empty to keep existing password)
  encryption?: EmailEncryption
  pollingIntervalMinutes?: number
  organizationId?: string
}

export async function upsertEmailConfig(input: EmailConfigInput): Promise<EmailConfiguration> {
  // If organizationId is provided, create organization-scoped config
  if (input.organizationId) {
    // Check if config exists
    const existing = await prisma.emailConfiguration.findUnique({
      where: { organizationId: input.organizationId },
    })

    const updateData: any = {
      providerName: input.providerName,
      protocol: input.protocol,
      host: input.host,
      port: input.port,
      username: input.username,
      encryption: input.encryption ?? EmailEncryption.SSL,
      pollingIntervalMinutes: input.pollingIntervalMinutes ?? 5,
    }

    // Only update password if provided (to allow updates without changing password)
    if (input.password && input.password.trim() !== '') {
      updateData.password = input.password
    } else if (!existing) {
      // If creating new config, password is required
      throw new Error('Password is required when creating new email configuration')
    }

    return prisma.emailConfiguration.upsert({
      where: { organizationId: input.organizationId },
      update: updateData,
      create: {
        providerName: input.providerName,
        protocol: input.protocol,
        host: input.host,
        port: input.port,
        username: input.username,
        password: input.password || '', // Will throw error before reaching here if password is missing
        encryption: input.encryption ?? EmailEncryption.SSL,
        pollingIntervalMinutes: input.pollingIntervalMinutes ?? 5,
        organizationId: input.organizationId,
      },
    })
  }

  // Legacy global config (for backward compatibility)
  const id = 'default-email-config'
  if (!input.password) {
    throw new Error('Password is required')
  }
  
  return prisma.emailConfiguration.upsert({
    where: { id },
    update: {
      providerName: input.providerName,
      protocol: input.protocol,
      host: input.host,
      port: input.port,
      username: input.username,
      password: input.password,
      encryption: input.encryption ?? EmailEncryption.SSL,
      pollingIntervalMinutes: input.pollingIntervalMinutes ?? 5,
    },
    create: {
      id,
      providerName: input.providerName,
      protocol: input.protocol,
      host: input.host,
      port: input.port,
      username: input.username,
      password: input.password,
      encryption: input.encryption ?? EmailEncryption.SSL,
      pollingIntervalMinutes: input.pollingIntervalMinutes ?? 5,
    },
  })
}

export async function getEmailConfig(organizationId?: string): Promise<EmailConfiguration | null> {
  if (organizationId) {
    return prisma.emailConfiguration.findUnique({
      where: { organizationId },
    })
  }
  // Legacy: return first config found (global or any org)
  return prisma.emailConfiguration.findFirst()
}

export function buildSmtpTransport(config: EmailConfiguration) {
  const secure = config.encryption !== EmailEncryption.NONE
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: config.encryption === EmailEncryption.TLS ? { ciphers: 'TLSv1.2' } : undefined,
  })
}

export async function sendEmail(params: { to: string; subject: string; text: string }) {
  const config = await getEmailConfig()
  if (!config) {
    throw new Error('Email configuration not found')
  }

  const transport = buildSmtpTransport(config)
  return transport.sendMail({
    from: config.username,
    to: params.to,
    subject: params.subject,
    text: params.text,
  })
}

export async function parseEmail(raw: Buffer | string) {
  return simpleParser(raw)
}

