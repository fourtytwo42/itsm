import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { signToken, signRefreshToken, type TokenPayload } from './jwt'
import { RoleName } from '@prisma/client'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    roles: string[]
  }
  accessToken: string
  refreshToken: string
}

export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { email, password } = credentials

  // Find user with roles
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true,
          customRole: true,
        },
      },
    },
  })

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password')
  }

  if (!user.isActive) {
    throw new Error('Account is inactive')
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash)
  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  })

  // Get user roles (both system and custom)
  const roles = user.roles
    .map((ur) => ur.role?.name || (ur.customRole ? `CUSTOM:${ur.customRole.name}` : null))
    .filter((r): r is string => r !== null)

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roles,
  }

  const accessToken = signToken(tokenPayload)
  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    },
    accessToken,
    refreshToken,
  }
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export async function registerUser(data: RegisterData): Promise<AuthResult> {
  const { email, password, firstName, lastName } = data

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user with END_USER role by default
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      roles: {
        create: {
          role: {
            connect: {
              name: RoleName.END_USER,
            },
          },
        },
      },
    },
    include: {
      roles: {
        include: {
          role: true,
          customRole: true,
        },
      },
    },
  })

  // Get user roles (both system and custom)
  const roles = user.roles
    .map((ur) => ur.role?.name || (ur.customRole ? `CUSTOM:${ur.customRole.name}` : null))
    .filter((r): r is string => r !== null)

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roles,
  }

  const accessToken = signToken(tokenPayload)
  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    },
    accessToken,
    refreshToken,
  }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
          customRole: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

