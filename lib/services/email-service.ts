import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { EmailConfiguration, EmailEncryption, EmailProtocol } from '@prisma/client'

export type EmailConfigInput = {
  providerName?: string
  protocol: EmailProtocol
  host: string
  port: number
  username: string
  password: string
  encryption?: EmailEncryption
  pollingIntervalMinutes?: number
}

export async function upsertEmailConfig(input: EmailConfigInput): Promise<EmailConfiguration> {
  const id = 'default-email-config'
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

export async function getEmailConfig(): Promise<EmailConfiguration | null> {
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

