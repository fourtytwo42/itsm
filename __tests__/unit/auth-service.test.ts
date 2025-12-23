import { authenticateUser, registerUser, hashPassword } from '@/lib/auth'
import { RoleName } from '@prisma/client'

const mockUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
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

const prisma = mockPrisma as any

describe('Auth Service Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const email = 'test@example.com'
      const password = 'password123'
      const passwordHash = await hashPassword(password)

      const mockUser = {
        id: 'user-123',
        email,
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const result = await authenticateUser({ email, password })

      expect(result.user.email).toBe(email)
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.roles).toContain('END_USER')
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

    it('should throw error for inactive user', async () => {
      const email = 'inactive@example.com'
      const password = 'password123'
      const passwordHash = await hashPassword(password)

      const mockUser = {
        id: 'user-123',
        email,
        passwordHash,
        isActive: false,
        roles: [],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await expect(authenticateUser({ email, password })).rejects.toThrow('Account is inactive')
    })

    it('should throw error for invalid password', async () => {
      const email = 'test@example.com'
      const password = 'wrongpassword'
      const passwordHash = await hashPassword('correctpassword')

      const mockUser = {
        id: 'user-123',
        email,
        passwordHash,
        isActive: true,
        roles: [],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await expect(authenticateUser({ email, password })).rejects.toThrow('Invalid email or password')
    })
  })

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        passwordHash: 'hashed',
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const result = await registerUser(userData)

      expect(result.user.email).toBe(userData.email)
      expect(result.user.firstName).toBe(userData.firstName)
      expect(result.user.lastName).toBe(userData.lastName)
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.roles).toContain('END_USER')
    })

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      }

      const mockExistingUser = {
        id: 'user-123',
        email: userData.email,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser)

      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists')
    })
  })
})

