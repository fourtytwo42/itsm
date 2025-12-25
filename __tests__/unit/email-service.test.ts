import { buildSmtpTransport, getEmailConfig, parseEmail, sendEmail, upsertEmailConfig } from '@/lib/services/email-service'
import nodemailer from 'nodemailer'
import { EmailEncryption, EmailProtocol } from '@prisma/client'

const mockEmailConfiguration = {
  upsert: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
}

const mockPrisma = {
  emailConfiguration: mockEmailConfiguration,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

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

  it('sendEmail should handle transport.sendMail errors', async () => {
    ;(prisma.emailConfiguration.findFirst as jest.Mock).mockResolvedValue(baseConfig)
    const mockTransport = {
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP connection failed')),
    }
    ;(nodemailer.createTransport as jest.Mock).mockReturnValueOnce(mockTransport)

    await expect(sendEmail({ to: 'to@example.com', subject: 'Hello', text: 'World' })).rejects.toThrow(
      'SMTP connection failed'
    )
  })

  it('parseEmail should call simpleParser with string', async () => {
    const parsed = await parseEmail('RAW')
    expect(parsed).toEqual({ subject: 'Parsed Email' })
  })

  it('parseEmail should handle Buffer input', async () => {
    const simpleParser = require('mailparser').simpleParser
    const buffer = Buffer.from('raw email content')
    await parseEmail(buffer)
    expect(simpleParser).toHaveBeenCalledWith(buffer)
  })

  it('parseEmail should handle parsing errors', async () => {
    const simpleParser = require('mailparser').simpleParser
    const error = new Error('Invalid email format')
    simpleParser.mockRejectedValueOnce(error)

    await expect(parseEmail('invalid')).rejects.toThrow('Invalid email format')
  })


  describe('upsertEmailConfig edge cases', () => {
    it('should create organization-scoped config when organizationId provided', async () => {
      ;(prisma.emailConfiguration.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.emailConfiguration.upsert as jest.Mock).mockResolvedValue({
        id: 'config-1',
        organizationId: 'org-1',
        host: 'smtp.example.com',
      })

      await upsertEmailConfig({
        protocol: EmailProtocol.SMTP,
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        organizationId: 'org-1',
      })

      expect(prisma.emailConfiguration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          create: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should update organization-scoped config without password when password not provided', async () => {
      const existingConfig = {
        id: 'config-1',
        organizationId: 'org-1',
        password: 'existing-password',
      }
      ;(prisma.emailConfiguration.findUnique as jest.Mock).mockResolvedValue(existingConfig)
      ;(prisma.emailConfiguration.upsert as jest.Mock).mockResolvedValue({
        ...existingConfig,
        host: 'smtp.example.com',
      })

      await upsertEmailConfig({
        protocol: EmailProtocol.SMTP,
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        organizationId: 'org-1',
      })

      expect(prisma.emailConfiguration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.not.objectContaining({
            password: expect.anything(),
          }),
        })
      )
    })

    it('should throw error when creating new org config without password', async () => {
      ;(prisma.emailConfiguration.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        upsertEmailConfig({
          protocol: EmailProtocol.SMTP,
          host: 'smtp.example.com',
          port: 587,
          username: 'user@example.com',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Password is required when creating new email configuration')
    })

    it('should handle different encryption types', async () => {
      ;(prisma.emailConfiguration.upsert as jest.Mock).mockResolvedValue({
        id: 'config-1',
        encryption: EmailEncryption.TLS,
      })

      await upsertEmailConfig({
        protocol: EmailProtocol.SMTP,
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        encryption: EmailEncryption.TLS,
      })

      expect(prisma.emailConfiguration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            encryption: EmailEncryption.TLS,
          }),
        })
      )
    })
  })

  describe('getEmailConfig edge cases', () => {
    it('should return organization-specific config when organizationId provided', async () => {
      const mockConfig = { id: 'config-1', organizationId: 'org-1' }
      ;(prisma.emailConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig)

      const result = await getEmailConfig('org-1')

      expect(prisma.emailConfiguration.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      })
      expect(result).toEqual(mockConfig)
    })

    it('should return first config found when organizationId not provided', async () => {
      const mockConfig = { id: 'config-1' }
      ;(prisma.emailConfiguration.findFirst as jest.Mock).mockResolvedValue(mockConfig)

      const result = await getEmailConfig()

      expect(prisma.emailConfiguration.findFirst).toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('buildSmtpTransport edge cases', () => {
    it('should configure secure connection for SSL encryption', () => {
      const config = {
        host: 'smtp.example.com',
        port: 465,
        username: 'user@example.com',
        password: 'password',
        encryption: EmailEncryption.SSL,
      }

      const transport = buildSmtpTransport(config as any)

      expect(transport).toBeDefined()
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
        })
      )
    })

    it('should configure non-secure connection for NONE encryption', () => {
      const config = {
        host: 'smtp.example.com',
        port: 25,
        username: 'user@example.com',
        password: 'password',
        encryption: EmailEncryption.NONE,
      }

      const transport = buildSmtpTransport(config as any)

      expect(transport).toBeDefined()
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false,
        })
      )
    })

    it('should configure TLS with ciphers for TLS encryption', () => {
      const config = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password',
        encryption: EmailEncryption.TLS,
      }

      const transport = buildSmtpTransport(config as any)

      expect(transport).toBeDefined()
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: { ciphers: 'TLSv1.2' },
        })
      )
    })
  })
})

