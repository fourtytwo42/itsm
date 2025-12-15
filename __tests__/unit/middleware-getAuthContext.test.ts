import { getAuthContext } from '@/lib/middleware/auth'
import { verifyToken } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'
import { NextRequest } from 'next/server'

jest.mock('@/lib/jwt')
jest.mock('@/lib/auth')

describe('getAuthContext', () => {
  const mockRequest = (authHeader: string | null) => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('authorization', authHeader)
    }
    return {
      headers,
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null when no authorization header', async () => {
    const request = mockRequest(null)
    const result = await getAuthContext(request)

    expect(result).toBeNull()
  })

  it('should return null when authorization header does not start with Bearer', async () => {
    const request = mockRequest('Invalid token')
    const result = await getAuthContext(request)

    expect(result).toBeNull()
  })

  it('should return auth context for valid token', async () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      roles: ['END_USER'],
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      isActive: true,
      roles: [
        {
          role: {
            name: 'END_USER',
          },
        },
      ],
    }

    ;(verifyToken as jest.Mock).mockReturnValue(mockPayload)
    ;(getUserById as jest.Mock).mockResolvedValue(mockUser)

    const request = mockRequest('Bearer valid-token')
    const result = await getAuthContext(request)

    expect(result).not.toBeNull()
    expect(result?.user.id).toBe('user-123')
    expect(result?.user.email).toBe('test@example.com')
    expect(result?.user.roles).toContain('END_USER')
  })

  it('should return null for invalid token', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const request = mockRequest('Bearer invalid-token')
    const result = await getAuthContext(request)

    expect(result).toBeNull()
  })

  it('should return null for inactive user', async () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      roles: ['END_USER'],
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      isActive: false,
      roles: [],
    }

    ;(verifyToken as jest.Mock).mockReturnValue(mockPayload)
    ;(getUserById as jest.Mock).mockResolvedValue(mockUser)

    const request = mockRequest('Bearer valid-token')
    const result = await getAuthContext(request)

    expect(result).toBeNull()
  })

  it('should return null when user not found', async () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      roles: ['END_USER'],
    }

    ;(verifyToken as jest.Mock).mockReturnValue(mockPayload)
    ;(getUserById as jest.Mock).mockResolvedValue(null)

    const request = mockRequest('Bearer valid-token')
    const result = await getAuthContext(request)

    expect(result).toBeNull()
  })
})

