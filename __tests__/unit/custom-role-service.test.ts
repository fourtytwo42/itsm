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

    it('should return only system roles when organization has no custom roles', async () => {
      ;(prisma.customRole.findMany as jest.Mock).mockResolvedValue([])

      const result = await getAvailableRolesForEscalation('org-1')

      expect(result.length).toBe(2) // AGENT and IT_MANAGER
      expect(result.every((r) => r.type === 'system')).toBe(true)
      expect(result.some((r) => r.id === RoleName.AGENT)).toBe(true)
      expect(result.some((r) => r.id === RoleName.IT_MANAGER)).toBe(true)
    })

    it('should combine system and custom roles correctly', async () => {
      ;(prisma.customRole.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'custom-1',
          name: 'support-lead',
          displayName: 'Support Lead',
        },
        {
          id: 'custom-2',
          name: 'senior-agent',
          displayName: 'Senior Agent',
        },
      ])

      const result = await getAvailableRolesForEscalation('org-1')

      expect(result.length).toBe(4) // 2 system + 2 custom
      expect(result.filter((r) => r.type === 'system').length).toBe(2)
      expect(result.filter((r) => r.type === 'custom').length).toBe(2)
      expect(result.find((r) => r.displayName === 'Support Lead')).toBeDefined()
      expect(result.find((r) => r.displayName === 'Senior Agent')).toBeDefined()
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
              customRole: null,
            },
          ],
          tenantAssignments: [],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      expect(result.length).toBe(1)
      expect(result[0].email).toBe('agent@example.com')
      expect(result[0].roles).toContain('AGENT')
      expect(result[0].displayName).toBe('Agent Name')
      expect(prisma.user.findMany).toHaveBeenCalled()
    })

    it('should filter by tenant if provided', async () => {
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
              customRole: null,
            },
          ],
          tenantAssignments: [{ tenantId: 'tenant-1', category: null }],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1', 'tenant-1')

      expect(result.length).toBe(1)
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            tenantAssignments: expect.objectContaining({
              where: { tenantId: 'tenant-1', category: null },
            }),
          }),
        })
      )
    })

    it('should filter out ADMIN and END_USER roles (Prisma query handles filtering)', async () => {
      // Prisma's NOT clause filters at query level, so only eligible users are returned
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
              customRole: null,
            },
          ],
          tenantAssignments: [],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      // Prisma query excludes ADMIN/END_USER, so only AGENT is returned
      expect(result.length).toBe(1)
      expect(result[0].email).toBe('agent@example.com')
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: expect.objectContaining({
              roles: expect.any(Object),
            }),
          }),
        })
      )
    })

    it('should include users with only custom roles', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'custom@example.com',
          firstName: 'Custom',
          lastName: 'User',
          roles: [
            {
              role: null,
              customRole: {
                name: 'support-lead',
                displayName: 'Support Lead',
              },
            },
          ],
          tenantAssignments: [],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      expect(result.length).toBe(1)
      expect(result[0].roles).toContain('CUSTOM:support-lead')
      expect(result[0].primaryRole).toBe('Support Lead')
    })

    it('should include users with mixed system and custom roles', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'mixed@example.com',
          firstName: 'Mixed',
          lastName: 'User',
          roles: [
            {
              role: {
                name: RoleName.AGENT,
              },
              customRole: null,
            },
            {
              role: null,
              customRole: {
                name: 'senior-agent',
                displayName: 'Senior Agent',
              },
            },
          ],
          tenantAssignments: [],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      expect(result.length).toBe(1)
      expect(result[0].roles).toContain('AGENT')
      expect(result[0].roles).toContain('CUSTOM:senior-agent')
      expect(result[0].primaryRole).toBe('AGENT') // System role takes precedence
    })

    it('should use email as displayName when firstName/lastName not available', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'agent@example.com',
          firstName: null,
          lastName: null,
          roles: [
            {
              role: {
                name: RoleName.AGENT,
              },
              customRole: null,
            },
          ],
          tenantAssignments: [],
          tenantId: null,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1')

      expect(result[0].displayName).toBe('agent@example.com')
    })

    it('should filter users by tenant assignment when tenantId provided', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'assigned@example.com',
          firstName: 'Assigned',
          lastName: 'User',
          roles: [
            {
              role: {
                name: RoleName.AGENT,
              },
              customRole: null,
            },
          ],
          tenantAssignments: [{ tenantId: 'tenant-1', category: null }],
          tenantId: null,
        },
        {
          id: 'user-2',
          email: 'not-assigned@example.com',
          firstName: 'Not',
          lastName: 'Assigned',
          roles: [
            {
              role: {
                name: RoleName.AGENT,
              },
              customRole: null,
            },
          ],
          tenantAssignments: [],
          tenantId: 'tenant-2', // Different tenant
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getAvailableUsersForEscalation('org-1', 'tenant-1')

      // Should only return user with tenant assignment or org-wide user
      expect(result.length).toBe(1)
      expect(result[0].email).toBe('assigned@example.com')
    })
  })
})

