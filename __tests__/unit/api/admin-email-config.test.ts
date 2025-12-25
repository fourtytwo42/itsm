/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/email-config/route'
import { NextRequest } from 'next/server'
import { getEmailConfig, upsertEmailConfig } from '@/lib/services/email-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { EmailProtocol, EmailEncryption } from '@prisma/client'

jest.mock('@/lib/services/email-service', () => ({
  getEmailConfig: jest.fn(),
  upsertEmailConfig: jest.fn(),
}))

const mockRequireRole = jest.fn()
jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: (...args: any[]) => mockRequireRole(...args),
}))

const mockGetEmailConfig = getEmailConfig as jest.MockedFunction<typeof getEmailConfig>
const mockUpsertEmailConfig = upsertEmailConfig as jest.MockedFunction<typeof upsertEmailConfig>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/email-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return email config', async () => {
    const mockConfig = {
      id: 'config-1',
      host: 'smtp.example.com',
      port: 587,
      protocol: EmailProtocol.SMTP,
    }

    mockGetEmailConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/email-config')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockConfig)
  })
})

describe('POST /api/v1/admin/email-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireRole.mockImplementation(() => {}) // Default: allow
  })

  it('should create/update email config', async () => {
    const mockConfig = {
      id: 'config-1',
      host: 'smtp.example.com',
      port: 587,
      protocol: EmailProtocol.SMTP,
      encryption: EmailEncryption.TLS,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockUpsertEmailConfig.mockResolvedValue(mockConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/email-config', {
      method: 'POST',
      body: JSON.stringify({
        protocol: EmailProtocol.SMTP,
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        encryption: EmailEncryption.TLS,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    // The route returns saved config directly, not wrapped
    expect(data.data).toEqual(mockConfig)
  })

  it('should return 403 for non-admin users', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })
    mockRequireRole.mockImplementation(() => {
      throw new Error('Forbidden: Admin access required')
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/email-config', {
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

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should return validation error for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/email-config', {
      method: 'POST',
      body: JSON.stringify({
        protocol: EmailProtocol.SMTP,
        host: '', // Invalid - empty host
        port: 587,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

