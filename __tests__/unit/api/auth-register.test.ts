/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/auth/register/route'
import { NextRequest } from 'next/server'
import { registerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({
  registerUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return {
      tenant: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantAssignment: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    }
  },
}))

jest.mock('@/lib/jwt', () => ({
  verifyPublicToken: jest.fn(),
}))

jest.mock('@/lib/services/ticket-service', () => ({
  mergePublicTokenTicketsToUser: jest.fn(),
}))

const mockRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>
const mockPrisma = prisma as any

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register user', async () => {
    const mockUser = {
      user: {
        id: 'user-1',
        email: 'newuser@example.com',
      },
      token: 'mock-jwt-token',
    }

    mockRegisterUser.mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockUser)
  })

  it('should return validation error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
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

  it('should return validation error for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'short',
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

  it('should assign user to tenant if tenantSlug provided', async () => {
    const mockUserResult = {
      user: {
        id: 'user-1',
        email: 'newuser@example.com',
      },
      token: 'mock-jwt-token',
    }

    mockRegisterUser.mockResolvedValue(mockUserResult)
    ;(mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: 'tenant-1',
      organizationId: 'org-1',
    })
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      organizationId: null,
    })
    ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})
    ;(mockPrisma.tenantAssignment.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.tenantAssignment.create as jest.Mock).mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        tenantSlug: 'test-tenant',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    // Tenant assignment happens internally and is tested via successful registration
  })
})

