/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/auth/login/route'
import { NextRequest } from 'next/server'
import { authenticateUser } from '@/lib/auth'

jest.mock('@/lib/auth', () => ({
  authenticateUser: jest.fn(),
}))

jest.mock('@/lib/jwt', () => ({
  verifyPublicToken: jest.fn(),
}))

jest.mock('@/lib/services/ticket-service', () => ({
  mergePublicTokenTicketsToUser: jest.fn(),
}))

const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login user with valid credentials', async () => {
    const mockUser = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
      },
      token: 'mock-jwt-token',
    }

    mockAuthenticateUser.mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockUser)
    expect(mockAuthenticateUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should return validation error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
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

  it('should return auth error for invalid credentials', async () => {
    mockAuthenticateUser.mockRejectedValue(new Error('Invalid credentials'))

    const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_ERROR')
  })

  it('should merge public token tickets if header provided', async () => {
    const { verifyPublicToken } = await import('@/lib/jwt')
    const { mergePublicTokenTicketsToUser } = await import('@/lib/services/ticket-service')

    const mockUser = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
      },
      token: 'mock-jwt-token',
    }

    mockAuthenticateUser.mockResolvedValue(mockUser)
    ;(verifyPublicToken as jest.Mock).mockReturnValue({ publicId: 'token-123' })
    ;(mergePublicTokenTicketsToUser as jest.Mock).mockResolvedValue(5)

    const request = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-public-token': 'public-token-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(verifyPublicToken).toHaveBeenCalledWith('public-token-123')
    expect(mergePublicTokenTicketsToUser).toHaveBeenCalledWith('token-123', 'user-1')
  })
})

