import { buildSmtpTransport, getEmailConfig, parseEmail, sendEmail, upsertEmailConfig } from '@/lib/services/email-service'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { EmailEncryption, EmailProtocol } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailConfiguration: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ accepted: ['to@example.com'] }),
  })),
}))

jest.mock('mailparser', () => ({
  simpleParser: jest.fn().mockResolvedValue({ subject: 'Parsed Email' }),
}))

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseConfig = {
    id: 'default-email-config',
    providerName: 'Demo',
    protocol: EmailProtocol.IMAP,
    host: 'mail.example.com',
    port: 993,
    username: 'demo@example.com',
    password: 'secret',
    encryption: EmailEncryption.SSL,
    pollingIntervalMinutes: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('upsertEmailConfig should create or update config', async () => {
    ;(prisma.emailConfiguration.upsert as jest.Mock).mockResolvedValue(baseConfig)

    const result = await upsertEmailConfig({
      protocol: EmailProtocol.IMAP,
      host: 'mail.example.com',
      port: 993,
      username: 'demo@example.com',
      password: 'secret',
    })

    expect(prisma.emailConfiguration.upsert).toHaveBeenCalled()
    expect(result).toEqual(baseConfig)
  })

  it('getEmailConfig should return configuration', async () => {
    ;(prisma.emailConfiguration.findFirst as jest.Mock).mockResolvedValue(baseConfig)
    const result = await getEmailConfig()
    expect(result).toEqual(baseConfig)
  })

  it('buildSmtpTransport should configure transport with encryption', () => {
    const transport = buildSmtpTransport(baseConfig as any)
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: baseConfig.host,
        port: baseConfig.port,
        secure: true,
      })
    )
    expect(transport.sendMail).toBeDefined()
  })

  it('sendEmail should send using stored config', async () => {
    ;(prisma.emailConfiguration.findFirst as jest.Mock).mockResolvedValue(baseConfig)
    const result = await sendEmail({ to: 'to@example.com', subject: 'Hello', text: 'World' })
    expect(result).toEqual({ accepted: ['to@example.com'] })
  })

  it('sendEmail should throw if config missing', async () => {
    ;(prisma.emailConfiguration.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(sendEmail({ to: 'to@example.com', subject: 'Hello', text: 'World' })).rejects.toThrow(
      'Email configuration not found'
    )
  })

  it('parseEmail should call simpleParser', async () => {
    const parsed = await parseEmail('RAW')
    expect(parsed).toEqual({ subject: 'Parsed Email' })
  })
})

