/**
 * @jest-environment node
 */
import { POST, PUT } from '@/app/api/v1/auth/reset-password/route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

const mockUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
  findFirst: jest.fn(),
}

const mockPrisma = {
  user: mockUser,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
}))

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

describe('POST /api/v1/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should request password reset for valid email', async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })
    mockUser.update.mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    })
    expect(mockUser.update).toHaveBeenCalled()
  })

  it('should return success even if user does not exist (security)', async () => {
    mockUser.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return validation error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
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

describe('PUT /api/v1/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reset password with valid token', async () => {
    mockUser.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })
    mockHashPassword.mockResolvedValue('hashed-password')
    mockUser.update.mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({
        token: 'valid-reset-token',
        password: 'newpassword123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockHashPassword).toHaveBeenCalledWith('newpassword123')
    expect(mockUser.update).toHaveBeenCalled()
  })

  it('should return error for invalid token', async () => {
    mockUser.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'newpassword123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_TOKEN')
  })

  it('should return validation error for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({
        token: 'valid-token',
        password: 'short',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

