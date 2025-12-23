import {
  createTenant,
  updateTenant,
  getTenantBySlug,
  getTenantById,
  listTenants,
  deleteTenant,
  manageTenantCategories,
  manageTenantKBArticles,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  createAssignment,
  deleteAssignment,
  getUserTenantAssignments,
  getUserAssignedCategories,
  canManageTenant,
} from '@/lib/services/tenant-service'
import { CustomFieldType } from '@prisma/client'

const mockTenant = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}
const mockTenantCategory = {
  deleteMany: jest.fn(),
  createMany: jest.fn(),
  findMany: jest.fn(),
}
const mockTenantKBArticle = {
  deleteMany: jest.fn(),
  createMany: jest.fn(),
  findMany: jest.fn(),
}
const mockTenantCustomField = {
  create: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}
const mockTenantAssignment = {
  create: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
}
const mockUser = {
  findUnique: jest.fn(),
}
const mockCategory = {
  findMany: jest.fn(),
}

const mockPrisma = {
  tenant: mockTenant,
  tenantCategory: mockTenantCategory,
  tenantKBArticle: mockTenantKBArticle,
  tenantCustomField: mockTenantCustomField,
  tenantAssignment: mockTenantAssignment,
  user: mockUser,
  category: mockCategory,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

describe('Tenant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTenant', () => {
    it('should create tenant', async () => {
      const mockTenantResult = {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        organizationId: 'org-1',
      }

      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.tenant.create as jest.Mock).mockResolvedValue(mockTenantResult)

      const result = await createTenant({
        name: 'Test Tenant',
        slug: 'test-tenant',
        organizationId: 'org-1',
      })

      expect(result).toEqual(mockTenantResult)
      expect(prisma.tenant.create).toHaveBeenCalled()
    })

    it('should throw error for invalid slug', async () => {
      await expect(
        createTenant({
          name: 'Test',
          slug: 'Invalid Slug!',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('Slug must contain only lowercase letters')
    })

    it('should throw error if slug exists', async () => {
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' })

      await expect(
        createTenant({
          name: 'Test',
          slug: 'existing-slug',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('updateTenant', () => {
    it('should update tenant', async () => {
      const mockTenantResult = {
        id: 'tenant-1',
        name: 'Updated Tenant',
      }

      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.tenant.update as jest.Mock).mockResolvedValue(mockTenantResult)

      const result = await updateTenant('tenant-1', {
        name: 'Updated Tenant',
      })

      expect(result).toEqual(mockTenantResult)
    })

    it('should validate slug if provided', async () => {
      await expect(
        updateTenant('tenant-1', {
          slug: 'Invalid Slug!',
        })
      ).rejects.toThrow('Slug must contain only lowercase letters')
    })
  })

  describe('getTenantBySlug', () => {
    it('should return tenant by slug', async () => {
      const mockTenantResult = {
        id: 'tenant-1',
        slug: 'test-tenant',
      }

      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenantResult)

      const result = await getTenantBySlug('test-tenant')

      expect(result).toEqual(mockTenantResult)
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant', isActive: true },
        include: expect.any(Object),
      })
    })
  })

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      const mockTenantResult = {
        id: 'tenant-1',
        name: 'Test Tenant',
      }

      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenantResult)

      const result = await getTenantById('tenant-1')

      expect(result).toEqual(mockTenantResult)
    })
  })

  describe('listTenants', () => {
    it('should list tenants', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Tenant 1',
        },
      ]

      ;(prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants)

      const result = await listTenants()

      expect(result).toEqual(mockTenants)
    })

    it('should filter by organization for non-global admin', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-1',
      })
      ;(prisma.tenant.findMany as jest.Mock).mockResolvedValue([])

      await listTenants({
        userId: 'user-1',
        userRoles: ['ADMIN'],
      })

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })
  })

  describe('deleteTenant', () => {
    it('should soft delete tenant', async () => {
      ;(prisma.tenant.update as jest.Mock).mockResolvedValue({
        id: 'tenant-1',
        isActive: false,
      })

      const result = await deleteTenant('tenant-1')

      expect(result.isActive).toBe(false)
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: false },
      })
    })
  })

  describe('manageTenantCategories', () => {
    it('should manage tenant categories', async () => {
      const mockCategories = [
        { id: 'tc-1', tenantId: 'tenant-1', category: 'cat-1' },
        { id: 'tc-2', tenantId: 'tenant-1', category: 'cat-2' },
      ]

      ;(prisma.tenantCategory.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.tenantCategory.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.tenantCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const result = await manageTenantCategories('tenant-1', ['cat-1', 'cat-2'])

      expect(result).toEqual(mockCategories)
      expect(prisma.tenantCategory.deleteMany).toHaveBeenCalled()
      expect(prisma.tenantCategory.createMany).toHaveBeenCalled()
    })
  })

  describe('manageTenantKBArticles', () => {
    it('should manage tenant KB articles', async () => {
      const mockArticles = [
        {
          id: 'tka-1',
          tenantId: 'tenant-1',
          articleId: 'article-1',
          article: { id: 'article-1', title: 'Article 1', slug: 'article-1' },
        },
      ]

      ;(prisma.tenantKBArticle.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.tenantKBArticle.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.tenantKBArticle.findMany as jest.Mock).mockResolvedValue(mockArticles)

      const result = await manageTenantKBArticles('tenant-1', ['article-1', 'article-2'])

      expect(result).toEqual(mockArticles)
      expect(prisma.tenantKBArticle.deleteMany).toHaveBeenCalled()
      expect(prisma.tenantKBArticle.createMany).toHaveBeenCalled()
    })
  })

  describe('createCustomField', () => {
    it('should create custom field', async () => {
      const mockField = {
        id: 'field-1',
        label: 'Serial Number',
        fieldType: CustomFieldType.TEXT,
      }

      ;(prisma.tenantCustomField.create as jest.Mock).mockResolvedValue(mockField)

      const result = await createCustomField({
        tenantId: 'tenant-1',
        label: 'Serial Number',
        fieldType: CustomFieldType.TEXT,
      })

      expect(result).toEqual(mockField)
      expect(prisma.tenantCustomField.create).toHaveBeenCalled()
    })
  })

  describe('updateCustomField', () => {
    it('should update custom field', async () => {
      ;(prisma.tenantCustomField.update as jest.Mock).mockResolvedValue({
        id: 'field-1',
        label: 'Updated Label',
      })

      await updateCustomField('field-1', {
        label: 'Updated Label',
      })

      expect(prisma.tenantCustomField.update).toHaveBeenCalled()
    })
  })

  describe('deleteCustomField', () => {
    it('should delete custom field', async () => {
      ;(prisma.tenantCustomField.delete as jest.Mock).mockResolvedValue({ id: 'field-1' })

      await deleteCustomField('field-1')

      expect(prisma.tenantCustomField.delete).toHaveBeenCalledWith({
        where: { id: 'field-1' },
      })
    })
  })

  describe('createAssignment', () => {
    it('should create tenant assignment', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }

      ;(prisma.tenantAssignment.create as jest.Mock).mockResolvedValue(mockAssignment)

      const result = await createAssignment({
        tenantId: 'tenant-1',
        userId: 'user-1',
      })

      expect(result).toEqual(mockAssignment)
      expect(prisma.tenantAssignment.create).toHaveBeenCalled()
    })
  })

  describe('deleteAssignment', () => {
    it('should delete tenant assignment', async () => {
      ;(prisma.tenantAssignment.delete as jest.Mock).mockResolvedValue({ id: 'assignment-1' })

      await deleteAssignment('assignment-1')

      expect(prisma.tenantAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
      })
    })
  })

  describe('getUserTenantAssignments', () => {
    it('should return user tenant assignments', async () => {
      const mockAssignments = [
        {
          id: 'assignment-1',
          tenantId: 'tenant-1',
        },
      ]

      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)

      const result = await getUserTenantAssignments('user-1')

      expect(result).toEqual(mockAssignments)
      expect(prisma.tenantAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('getUserAssignedCategories', () => {
    it('should return user assigned categories', async () => {
      const mockAssignments = [
        {
          tenantId: 'tenant-1',
          category: 'category-1',
          tenant: {
            id: 'tenant-1',
            name: 'Tenant 1',
          },
        },
        {
          tenantId: 'tenant-1',
          category: null,
          tenant: {
            id: 'tenant-1',
            name: 'Tenant 1',
          },
        },
      ]

      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)
      ;(prisma.tenantCategory.findMany as jest.Mock).mockResolvedValue([
        { id: 'tc-1', tenantId: 'tenant-1', category: 'category-1' },
        { id: 'tc-2', tenantId: 'tenant-1', category: 'category-2' },
      ])

      const result = await getUserAssignedCategories('user-1')

      expect(result).toBeInstanceOf(Map)
    })
  })

  describe('canManageTenant', () => {
    it('should return true for global admin', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: 'GLOBAL_ADMIN',
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await canManageTenant('user-1', 'tenant-1')

      expect(result).toBe(true)
    })

    it('should return true for same organization', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: 'ADMIN',
            },
          },
        ],
      }
      const mockTenant = {
        id: 'tenant-1',
        organizationId: 'org-1',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant)

      const result = await canManageTenant('user-1', 'tenant-1')

      expect(result).toBe(true)
    })

    it('should return false for different organization', async () => {
      const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: 'ADMIN',
            },
          },
        ],
      }
      const mockTenant = {
        id: 'tenant-1',
        organizationId: 'org-2',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant)

      const result = await canManageTenant('user-1', 'tenant-1')

      expect(result).toBe(false)
    })
  })
})

