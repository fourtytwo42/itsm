/**
 * @jest-environment node
 */
import { requireAuth, requireRole, requireAnyRole, requireOrganizationAccess } from '@/lib/middleware/auth'
import type { AuthContext } from '@/lib/middleware/auth'

describe('requireAuth', () => {
  it('should not throw when authContext is valid', () => {
    const authContext: AuthContext = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
      organizationId: 'org-1',
    }

    expect(() => requireAuth(authContext)).not.toThrow()
  })

  it('should throw when authContext is null', () => {
    expect(() => requireAuth(null)).toThrow('Unauthorized')
  })

  it('should throw when authContext is undefined', () => {
    expect(() => requireAuth(undefined as any)).toThrow('Unauthorized')
  })
})

describe('requireRole', () => {
  const authContext: AuthContext = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      roles: ['ADMIN', 'END_USER'],
      organizationId: 'org-1',
      isGlobalAdmin: false,
    },
    organizationId: 'org-1',
  }

  it('should not throw when user has the required role', () => {
    expect(() => requireRole(authContext, 'ADMIN')).not.toThrow()
  })

  it('should throw when user does not have the required role', () => {
    expect(() => requireRole(authContext, 'IT_MANAGER')).toThrow('Forbidden: Insufficient permissions')
  })

  it('should throw when authContext is null', () => {
    expect(() => requireRole(null as any, 'ADMIN')).toThrow('Unauthorized')
  })
})

describe('requireAnyRole', () => {
  const authContext: AuthContext = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      roles: ['ADMIN'],
      organizationId: 'org-1',
      isGlobalAdmin: false,
    },
    organizationId: 'org-1',
  }

  it('should not throw when user has at least one required role', () => {
    expect(() => requireAnyRole(authContext, ['ADMIN', 'IT_MANAGER'])).not.toThrow()
  })

  it('should not throw when user has multiple required roles', () => {
    const contextWithMultipleRoles: AuthContext = {
      ...authContext,
      user: {
        ...authContext.user,
        roles: ['ADMIN', 'IT_MANAGER'],
      },
    }
    expect(() => requireAnyRole(contextWithMultipleRoles, ['ADMIN', 'IT_MANAGER'])).not.toThrow()
  })

  it('should throw when user does not have any required role', () => {
    expect(() => requireAnyRole(authContext, ['IT_MANAGER', 'AGENT'])).toThrow('Forbidden: Insufficient permissions')
  })

  it('should throw when authContext is null', () => {
    expect(() => requireAnyRole(null as any, ['ADMIN'])).toThrow('Unauthorized')
  })

  it('should handle empty roles array', () => {
    expect(() => requireAnyRole(authContext, [])).toThrow('Forbidden: Insufficient permissions')
  })
})

describe('requireOrganizationAccess', () => {
  it('should not throw when user is global admin', async () => {
    const authContext: AuthContext = {
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    }

    await expect(requireOrganizationAccess(authContext, 'any-org-id')).resolves.not.toThrow()
  })

  it('should not throw when user belongs to the organization', async () => {
    const authContext: AuthContext = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
      organizationId: 'org-1',
    }

    await expect(requireOrganizationAccess(authContext, 'org-1')).resolves.not.toThrow()
  })

  it('should throw when user does not belong to the organization', async () => {
    const authContext: AuthContext = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
      organizationId: 'org-1',
    }

    await expect(requireOrganizationAccess(authContext, 'org-2')).rejects.toThrow('Forbidden: No access to this organization')
  })

  it('should throw when user has no organizationId', async () => {
    const authContext: AuthContext = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        isGlobalAdmin: false,
      },
    }

    await expect(requireOrganizationAccess(authContext, 'org-1')).rejects.toThrow('Forbidden: No access to this organization')
  })

  it('should throw when authContext is null', async () => {
    await expect(requireOrganizationAccess(null as any, 'org-1')).rejects.toThrow('Unauthorized')
  })
})

