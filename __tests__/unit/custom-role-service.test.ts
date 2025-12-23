import {
  createCustomRole,
  getCustomRoleById,
  listCustomRoles,
  updateCustomRole,
  deleteCustomRole,
  getAvailableRolesForEscalation,
  getAvailableUsersForEscalation,
} from '@/lib/services/custom-role-service'
import { RoleName } from '@prisma/client'

const mockCustomRole = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}
const mockUserRole = {
  count: jest.fn(),
}
const mockUser = {
  findMany: jest.fn(),
}

const mockPrisma = {
  customRole: mockCustomRole,
  userRole: mockUserRole,
  user: mockUser,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

describe('Custom Role Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCustomRole', () => {
    it('should create custom role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'support-lead',
        displayName: 'Support Lead',
        organizationId: 'org-1',
      }

      ;(prisma.customRole.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.customRole.create as jest.Mock).mockResolvedValue(mockRole)

      const result = await createCustomRole({
        name: 'support-lead',
        displayName: 'Support Lead',
        organizationId: 'org-1',
      })

      expect(result).toEqual(mockRole)
      expect(prisma.customRole.create).toHaveBeenCalled()
    })

    it('should throw error if role name already exists', async () => {
      ;(prisma.customRole.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-role' })

      await expect(
        createCustomRole({
          name: 'existing-role',
          displayName: 'Existing Role',
          organizationId: 'org-1',
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('getCustomRoleById', () => {
    it('should return custom role by id', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'support-lead',
        organization: { id: 'org-1' },
        userRoles: [],
      }

      ;(prisma.customRole.findUnique as jest.Mock).mockResolvedValue(mockRole)

      const result = await getCustomRoleById('role-1')

      expect(result).toEqual(mockRole)
      expect(prisma.customRole.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('listCustomRoles', () => {
    it('should list custom roles for organization', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'support-lead',
          organizationId: 'org-1',
          _count: { userRoles: 2 },
        },
      ]

      ;(prisma.customRole.findMany as jest.Mock).mockResolvedValue(mockRoles)

      const result = await listCustomRoles('org-1')

      expect(result).toEqual(mockRoles)
      expect(prisma.customRole.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { displayName: 'asc' },
        include: expect.any(Object),
      })
    })

    it('should filter by isActive', async () => {
      ;(prisma.customRole.findMany as jest.Mock).mockResolvedValue([])

      await listCustomRoles('org-1', { isActive: true })

      expect(prisma.customRole.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isActive: true },
        orderBy: { displayName: 'asc' },
        include: expect.any(Object),
      })
    })
  })

  describe('updateCustomRole', () => {
    it('should update custom role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'support-lead',
        organizationId: 'org-1',
      }

      ;(prisma.customRole.findUnique as jest.Mock).mockResolvedValue(mockRole)
      ;(prisma.customRole.update as jest.Mock).mockResolvedValue({
        ...mockRole,
        displayName: 'Updated Support Lead',
      })

      const result = await updateCustomRole('role-1', {
        displayName: 'Updated Support Lead',
      })

      expect(result.displayName).toBe('Updated Support Lead')
      expect(prisma.customRole.update).toHaveBeenCalled()
    })

    it('should throw error if role not found', async () => {
      ;(prisma.customRole.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        updateCustomRole('role-1', {
          displayName: 'Updated',
        })
      ).rejects.toThrow('not found')
    })

    it('should throw error if name conflicts', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'support-lead',
        organizationId: 'org-1',
      }

      ;(prisma.customRole.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce({ id: 'different-role' })

      await expect(
        updateCustomRole('role-1', {
          name: 'conflicting-name',
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('deleteCustomRole', () => {
    it('should delete custom role if no users assigned', async () => {
      ;(prisma.userRole.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.customRole.delete as jest.Mock).mockResolvedValue({ id: 'role-1' })

      await deleteCustomRole('role-1')

      expect(prisma.customRole.delete).toHaveBeenCalledWith({
        where: { id: 'role-1' },
      })
    })

    it('should throw error if users are assigned', async () => {
      ;(prisma.userRole.count as jest.Mock).mockResolvedValue(5)

      await expect(deleteCustomRole('role-1')).rejects.toThrow('Cannot delete')
    })
  })

  describe('getAvailableRolesForEscalation', () => {
    it('should return system roles and custom roles', async () => {
      ;(prisma.customRole.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'custom-1',
          name: 'custom-role',
          displayName: 'Custom Role',
        },
      ])

      const result = await getAvailableRolesForEscalation('org-1')

      expect(result.length).toBeGreaterThan(0)
      expect(result.some((r) => r.type === 'system')).toBe(true)
      expect(result.some((r) => r.type === 'custom')).toBe(true)
    })
  })

  describe('getAvailableUsersForEscalation', () => {
    it('should return eligible users for escalation', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'agent@example.com',
          firstName: 'Agent',
          lastName: 'Name',
          roles: [
            {
              role: {
                name: RoleName.AGENT,
              },
            },
          ],
          tenantAssignments: [],
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      expect(result.length).toBeGreaterThan(0)
      expect(prisma.user.findMany).toHaveBeenCalled()
    })

    it('should filter by tenant if provided', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

      await getAvailableUsersForEscalation('org-1', 'tenant-1')

      expect(prisma.user.findMany).toHaveBeenCalled()
    })
  })
})

