import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface TokenPayload {
  userId: string
  email: string
  roles: string[]
}

export interface RefreshTokenPayload {
  userId: string
  email: string
}

export interface PublicTokenPayload {
  publicId: string // Unique identifier for this browser/session
  tenantId?: string // Optional tenant ID if visiting a specific tenant
  createdAt: number // Timestamp when token was created
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
  })
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

// Public JWT for anonymous users (longer expiration - 1 year)
const PUBLIC_JWT_EXPIRES_IN = '365d'

export function signPublicToken(payload: PublicTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: PUBLIC_JWT_EXPIRES_IN,
    algorithm: 'HS256',
  })
}

export function verifyPublicToken(token: string): PublicTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as PublicTokenPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired public token')
  }
}

