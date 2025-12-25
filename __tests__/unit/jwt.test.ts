import { signToken, verifyToken, signRefreshToken, verifyRefreshToken, signPublicToken, verifyPublicToken } from '@/lib/jwt'

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    roles: ['END_USER'],
  }

  describe('signToken', () => {
    it('should sign a token', () => {
      const token = signToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should produce different tokens for different payloads', () => {
      const token1 = signToken(mockPayload)
      const token2 = signToken({ ...mockPayload, userId: 'user-456' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = signToken(mockPayload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.roles).toEqual(mockPayload.roles)
    })

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token')
    })

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow()
    })
  })

  describe('signRefreshToken', () => {
    it('should sign a refresh token', () => {
      const refreshPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      }
      const token = signRefreshToken(refreshPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const refreshPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      }
      const token = signRefreshToken(refreshPayload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(refreshPayload.userId)
      expect(decoded.email).toBe(refreshPayload.email)
    })

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => verifyRefreshToken(invalidToken)).toThrow('Invalid or expired refresh token')
    })
  })

  describe('signPublicToken', () => {
    it('should sign a public token', () => {
      const payload = {
        publicId: 'public-123',
        tenantId: 'tenant-1',
        createdAt: Date.now(),
      }
      const token = signPublicToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should sign a public token without tenantId', () => {
      const payload = {
        publicId: 'public-123',
        createdAt: Date.now(),
      }
      const token = signPublicToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyPublicToken', () => {
    it('should verify a valid public token', () => {
      const payload = {
        publicId: 'public-123',
        tenantId: 'tenant-1',
        createdAt: Date.now(),
      }
      const token = signPublicToken(payload)
      const decoded = verifyPublicToken(token)

      expect(decoded.publicId).toBe(payload.publicId)
      expect(decoded.tenantId).toBe(payload.tenantId)
      expect(decoded.createdAt).toBe(payload.createdAt)
    })

    it('should verify a public token without tenantId', () => {
      const payload = {
        publicId: 'public-123',
        createdAt: Date.now(),
      }
      const token = signPublicToken(payload)
      const decoded = verifyPublicToken(token)

      expect(decoded.publicId).toBe(payload.publicId)
      expect(decoded.createdAt).toBe(payload.createdAt)
      expect(decoded.tenantId).toBeUndefined()
    })

    it('should throw error for invalid public token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => verifyPublicToken(invalidToken)).toThrow('Invalid or expired public token')
    })

    it('should throw error for empty public token', () => {
      expect(() => verifyPublicToken('')).toThrow()
    })
  })
})

