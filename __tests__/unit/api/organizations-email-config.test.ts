/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/organizations/email-config/route'
import { NextRequest } from 'next/server'
import { getEmailConfig, upsertEmailConfig } from '@/lib/services/email-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { EmailProtocol, EmailEncryption } from '@prisma/client'

jest.mock('@/lib/services/email-service', () => ({
  getEmailConfig: jest.fn(),
  upsertEmailConfig: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return {
      emailConfiguration: {
        findUnique: jest.fn(),
      },
    }
  },
}))

const mockGetEmailConfig = getEmailConfig as jest.MockedFunction<typeof getEmailConfig>
const mockUpsertEmailConfig = upsertEmailConfig as jest.MockedFunction<typeof upsertEmailConfig>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/organizations/email-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return email config for authenticated user', async () => {
    const mockConfig = {
      id: 'config-1',
      host: 'smtp.example.com',
      port: 587,
      protocol: EmailProtocol.SMTP,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetEmailConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/email-config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockConfig)
  })

  it('should return 403 if user has no organization', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['ADMIN'],
        organizationId: undefined,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/email-config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

describe('POST /api/v1/organizations/email-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create/update email config', async () => {
    const mockConfig = {
      id: 'config-1',
      host: 'smtp.example.com',
      port: 587,
      protocol: EmailProtocol.SMTP,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockUpsertEmailConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/email-config', {
      method: 'POST',
      body: JSON.stringify({
        protocol: EmailProtocol.SMTP,
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockConfig)
  })
})

