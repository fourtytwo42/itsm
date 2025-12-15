import { requireAuth, requireRole, requireAnyRole } from '@/lib/middleware/auth'

describe('Auth Middleware Utilities', () => {
  const mockAuthContext = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      roles: ['END_USER', 'AGENT'],
    },
  }

  describe('requireAuth', () => {
    it('should not throw for valid auth context', () => {
      expect(() => requireAuth(mockAuthContext)).not.toThrow()
    })

    it('should throw for null auth context', () => {
      expect(() => requireAuth(null)).toThrow('Unauthorized')
    })
  })

  describe('requireRole', () => {
    it('should not throw when user has required role', () => {
      expect(() => requireRole(mockAuthContext, 'END_USER')).not.toThrow()
      expect(() => requireRole(mockAuthContext, 'AGENT')).not.toThrow()
    })

    it('should throw when user does not have required role', () => {
      expect(() => requireRole(mockAuthContext, 'ADMIN')).toThrow('Forbidden: Insufficient permissions')
    })

    it('should throw for null auth context', () => {
      expect(() => requireRole(null as any, 'END_USER')).toThrow('Unauthorized')
    })
  })

  describe('requireAnyRole', () => {
    it('should not throw when user has one of the required roles', () => {
      expect(() => requireAnyRole(mockAuthContext, ['END_USER', 'ADMIN'])).not.toThrow()
      expect(() => requireAnyRole(mockAuthContext, ['AGENT', 'ADMIN'])).not.toThrow()
    })

    it('should throw when user has none of the required roles', () => {
      expect(() => requireAnyRole(mockAuthContext, ['ADMIN', 'IT_MANAGER'])).toThrow('Forbidden: Insufficient permissions')
    })

    it('should throw for null auth context', () => {
      expect(() => requireAnyRole(null as any, ['END_USER'])).toThrow('Unauthorized')
    })
  })
})

