import {
  createOrganization,
  updateOrganization,
  getOrganizationById,
  listOrganizations,
  deleteOrganization,
  getOrganizationUsers,
  getOrganizationTenants,
  canManageOrganization,
} from '@/lib/services/organization-service'
import { RoleName } from '@prisma/client'

const mockOrganization = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}
const mockUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
}
const mockAuditConfig = {
  create: jest.fn(),
}
const mockTenant = {
  findMany: jest.fn(),
}
const mockPrisma = {
  organization: mockOrganization,
  user: mockUser,
  auditConfig: mockAuditConfig,
  tenant: mockTenant,
  $transaction: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
}))

const prisma = mockPrisma as any

describe('Organization Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrganization', () => {
    it('should create organization with defaults', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        isActive: true,
      }
      const mockOrgAdmin = {
        id: 'user-1',
        email: 'admin@test-org.demo',
      }

      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          organization: {
            create: jest.fn().mockResolvedValue(mockOrg),
          },
          user: {
            create: jest.fn().mockResolvedValue(mockOrgAdmin),
          },
          auditConfig: {
            create: jest.fn().mockResolvedValue({}),
          },
        }
        return callback(tx)
      })

      const result = await createOrganization(
        {
          name: 'Test Org',
          slug: 'test-org',
        },
        'global-admin-1'
      )

      expect(result.organization).toEqual(mockOrg)
      expect(result.orgAdmin).toEqual(mockOrgAdmin)
      expect(result.defaultPassword).toBeDefined()
    })

    it('should throw error for invalid slug format', async () => {
      await expect(
        createOrganization(
          {
            name: 'Test Org',
            slug: 'Invalid Slug!',
          },
          'global-admin-1'
        )
      ).rejects.toThrow('Slug must contain only lowercase letters, numbers, and hyphens')
    })

    it('should throw error if slug already exists', async () => {
      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-org' })

      await expect(
        createOrganization(
          {
            name: 'Test Org',
            slug: 'existing-slug',
          },
          'global-admin-1'
        )
      ).rejects.toThrow('Organization with this slug already exists')
    })

    it('should throw error if org admin email already exists', async () => {
      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' })

      await expect(
        createOrganization(
          {
            name: 'Test Org',
            slug: 'test-org',
          },
          'global-admin-1'
        )
      ).rejects.toThrow('Organization admin email already exists')
    })
  })

  describe('updateOrganization', () => {
    it('should update organization', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Updated Org',
        slug: 'updated-org',
        _count: {
          users: 5,
          tenants: 2,
          tickets: 10,
        },
      }

      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.organization.update as jest.Mock).mockResolvedValue(mockOrg)

      const result = await updateOrganization('org-1', {
        name: 'Updated Org',
        slug: 'updated-org',
      })

      expect(result).toEqual(mockOrg)
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          name: 'Updated Org',
          slug: 'updated-org',
        },
        include: expect.any(Object),
      })
    })

    it('should throw error for invalid slug format', async () => {
      await expect(
        updateOrganization('org-1', {
          slug: 'Invalid Slug!',
        })
      ).rejects.toThrow('Slug must contain only lowercase letters, numbers, and hyphens')
    })

    it('should throw error if slug already exists for different org', async () => {
      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: 'different-org' })

      await expect(
        updateOrganization('org-1', {
          slug: 'existing-slug',
        })
      ).rejects.toThrow('Organization with this slug already exists')
    })
  })

  describe('getOrganizationById', () => {
    it('should return organization with counts', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        _count: {
          users: 5,
          tenants: 2,
          tickets: 10,
          kbArticles: 3,
          assets: 20,
        },
      }

      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg)

      const result = await getOrganizationById('org-1')

      expect(result).toEqual(mockOrg)
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('listOrganizations', () => {
    it('should list all organizations', async () => {
      const mockOrgs = [
        {
          id: 'org-1',
          name: 'Org 1',
          _count: { users: 5, tenants: 2, tickets: 10 },
        },
      ]

      ;(prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs)

      const result = await listOrganizations()

      expect(result).toEqual(mockOrgs)
      expect(prisma.organization.findMany).toHaveBeenCalled()
    })

    it('should filter by search', async () => {
      ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])

      await listOrganizations({ search: 'test' })

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
            { slug: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ]),
        }),
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by isActive', async () => {
      ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])

      await listOrganizations({ isActive: true })

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })
  })

  describe('deleteOrganization', () => {
    it('should soft delete organization', async () => {
      const mockOrg = {
        id: 'org-1',
        isActive: false,
      }

      ;(prisma.organization.update as jest.Mock).mockResolvedValue(mockOrg)

      const result = await deleteOrganization('org-1')

      expect(result).toEqual(mockOrg)
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { isActive: false },
      })
    })
  })

  describe('getOrganizationUsers', () => {
    it('should return organization users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user@example.com',
          roles: [],
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getOrganizationUsers('org-1')

      expect(result).toEqual(mockUsers)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          deletedAt: null,
        },
        include: expect.any(Object),
      })
    })
  })

  describe('getOrganizationTenants', () => {
    it('should return organization tenants', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Tenant 1',
          _count: { tickets: 5, assignments: 2 },
        },
      ]

      ;(prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants)

      const result = await getOrganizationTenants('org-1')

      expect(result).toEqual(mockTenants)
      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('canManageOrganization', () => {
    it('should return true for global admin', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.GLOBAL_ADMIN,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await canManageOrganization('user-1', 'org-1')

      expect(result).toBe(true)
    })

    it('should return true for org admin of same organization', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.ADMIN,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await canManageOrganization('user-1', 'org-1')

      expect(result).toBe(true)
    })

    it('should return false for org admin of different organization', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-2',
        roles: [
          {
            role: {
              name: RoleName.ADMIN,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await canManageOrganization('user-1', 'org-1')

      expect(result).toBe(false)
    })

    it('should return false for non-admin user', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await canManageOrganization('user-1', 'org-1')

      expect(result).toBe(false)
    })

    it('should return false if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await canManageOrganization('user-1', 'org-1')

      expect(result).toBe(false)
    })
  })

  describe('updateOrganization edge cases', () => {
    it('should allow updating to same slug', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Updated Org',
        slug: 'existing-slug',
        _count: {
          users: 5,
          tenants: 2,
          tickets: 10,
        },
      }

      ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: 'org-1' })
      ;(prisma.organization.update as jest.Mock).mockResolvedValue(mockOrg)

      const result = await updateOrganization('org-1', {
        slug: 'existing-slug',
      })

      expect(result).toEqual(mockOrg)
      expect(prisma.organization.update).toHaveBeenCalled()
    })

    it('should update without slug validation if slug not provided', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Updated Org',
        _count: {
          users: 5,
          tenants: 2,
          tickets: 10,
        },
      }

      ;(prisma.organization.update as jest.Mock).mockResolvedValue(mockOrg)

      await updateOrganization('org-1', {
        name: 'Updated Org',
      })

      expect(prisma.organization.findUnique).not.toHaveBeenCalled()
      expect(prisma.organization.update).toHaveBeenCalled()
    })
  })

  describe('listOrganizations edge cases', () => {
    it('should handle both search and isActive filters together', async () => {
      ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])

      await listOrganizations({ search: 'test', isActive: true })

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.any(Array),
          isActive: true,
        }),
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should return empty array when no organizations match', async () => {
      ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])

      const result = await listOrganizations({ search: 'nonexistent' })

      expect(result).toEqual([])
    })
  })
})

