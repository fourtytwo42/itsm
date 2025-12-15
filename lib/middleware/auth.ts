import { NextRequest } from 'next/server'
import { verifyToken, type TokenPayload } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'

export interface AuthContext {
  user: {
    id: string
    email: string
    roles: string[]
  }
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    const user = await getUserById(payload.userId)
    if (!user || !user.isActive) {
      return null
    }

    const roles = user.roles.map((ur) => ur.role.name)

    return {
      user: {
        id: user.id,
        email: user.email,
        roles,
      },
    }
  } catch (error) {
    return null
  }
}

export function requireAuth(authContext: AuthContext | null): asserts authContext is AuthContext {
  if (!authContext) {
    throw new Error('Unauthorized')
  }
}

export function requireRole(authContext: AuthContext, role: string): void {
  requireAuth(authContext)
  if (!authContext.user.roles.includes(role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
}

export function requireAnyRole(authContext: AuthContext, roles: string[]): void {
  requireAuth(authContext)
  const hasRole = roles.some((role) => authContext.user.roles.includes(role))
  if (!hasRole) {
    throw new Error('Forbidden: Insufficient permissions')
  }
}

