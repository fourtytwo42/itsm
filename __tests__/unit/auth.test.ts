import {
  hashPassword,
  verifyPassword,
  authenticateUser,
  registerUser,
  getUserById,
  type LoginCredentials,
  type RegisterData,
} from '@/lib/auth'
import { signToken, signRefreshToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { RoleName } from '@prisma/client'

jest.mock('@/lib/jwt', () => ({
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Don't mock bcryptjs at module level - let hashPassword/verifyPassword tests use real implementation
// We'll mock it conditionally in tests that need it

const mockSignToken = signToken as jest.MockedFunction<typeof signToken>
const mockSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce different hashes for the same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should handle empty password', async () => {
      const password = ''
      const hash = await hashPassword('somepassword')

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('authenticateUser', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      organizationId: 'org-1',
      roles: [
        {
          role: {
            name: RoleName.AGENT,
          },
          customRole: null,
        },
      ],
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockSignToken.mockReturnValue('access-token')
      mockSignRefreshToken.mockReturnValue('refresh-token')
    })

    it('should authenticate user with valid credentials', async () => {
      const bcrypt = require('bcryptjs')
      const realHash = await bcrypt.hash('password123', 12)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const result = await authenticateUser({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user.email).toBe('test@example.com')
      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(result.user.roles).toContain('AGENT')
      expect(prisma.user.update).toHaveBeenCalled()
    })

    it('should throw error for inactive user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      })

      await expect(
        authenticateUser({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is inactive')
    })

    it('should throw error for missing password hash', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      })

      await expect(
        authenticateUser({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw error for invalid password', async () => {
      const bcrypt = require('bcryptjs')
      const realHash = await bcrypt.hash('correct-password', 12)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: realHash,
      })

      await expect(
        authenticateUser({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw error for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        authenticateUser({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password')
    })
  })

  describe('registerUser', () => {
    const mockNewUser = {
      id: 'user-2',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      passwordHash: 'hashed-password123',
      roles: [
        {
          role: {
            name: RoleName.END_USER,
          },
          customRole: null,
        },
      ],
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockSignToken.mockReturnValue('access-token')
      mockSignRefreshToken.mockReturnValue('refresh-token')
    })

    it('should register new user with END_USER role', async () => {
      const bcrypt = require('bcryptjs')
      const realHash = await bcrypt.hash('password123', 12)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockNewUser,
        passwordHash: realHash,
      })

      const result = await registerUser({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })

      expect(result.user.email).toBe('new@example.com')
      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(result.user.roles).toContain('END_USER')
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            passwordHash: expect.any(String),
            roles: {
              create: {
                role: {
                  connect: {
                    name: RoleName.END_USER,
                  },
                },
              },
            },
          }),
        })
      )
    })

    it('should register user without firstName and lastName', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockNewUser,
        firstName: null,
        lastName: null,
      })

      const result = await registerUser({
        email: 'new@example.com',
        password: 'password123',
      })

      expect(result.user.email).toBe('new@example.com')
      expect(result.user.firstName).toBeNull()
      expect(result.user.lastName).toBeNull()
    })

    it('should throw error if user already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      })

      await expect(
        registerUser({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('User with this email already exists')
    })
  })

  describe('getUserById', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: [
        {
          role: {
            name: RoleName.AGENT,
          },
          customRole: null,
        },
      ],
      organization: {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
      },
    }

    it('should return user with organization', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await getUserById('user-1')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.objectContaining({
          organization: expect.any(Object),
        }),
      })
    })

    it('should return null for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getUserById('non-existent')

      expect(result).toBeNull()
    })
  })
})

