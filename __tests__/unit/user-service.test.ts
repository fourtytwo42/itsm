import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignAgentToTenant,
  unassignAgentFromTenant,
  getAgentTenantAssignments,
  canManageAgentInOrganization,
  activateUser,
  deactivateUser,
} from '@/lib/services/user-service'
import { RoleName } from '@prisma/client'

const mockUser = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
}
const mockUserRole = {
  deleteMany: jest.fn(),
}
const mockTenantAssignment = {
  findFirst: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
  findMany: jest.fn(),
}
const mockTenant = {
  findUnique: jest.fn(),
}

const mockPrisma = {
  user: mockUser,
  userRole: mockUserRole,
  tenantAssignment: mockTenantAssignment,
  tenant: mockTenant,
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

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user@example.com',
          roles: [],
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(1)

      const result = await getUsers()

      expect(result.users).toEqual(mockUsers)
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by search', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ search: 'test' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('should filter by organization for non-global admin', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-1',
      })
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({
        userId: 'user-1',
        userRoles: ['ADMIN'],
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should filter by tenant', async () => {
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ])
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ tenantId: 'tenant-1' })

      expect(prisma.tenantAssignment.findMany).toHaveBeenCalled()
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['user-1', 'user-2'] },
          }),
        })
      )
    })
  })

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await getUserById('user-1')

      expect(result.id).toBe('user-1')
      expect(result.email).toBe('user@example.com')
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(getUserById('user-1')).rejects.toThrow('not found')
    })
  })

  describe('createUser', () => {
    it('should create user with default role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const result = await createUser({
        email: 'user@example.com',
        password: 'password123',
      })

      expect(result.email).toBe('user@example.com')
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should throw error if email already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' })

      await expect(
        createUser({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('already exists')
    })
  })

  describe('updateUser', () => {
    it('should update user', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'user@example.com',
        roles: [],
      }
      const updatedUser = {
        id: 'user-1',
        email: 'updated@example.com',
        roles: [],
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await updateUser('user-1', {
        email: 'updated@example.com',
      })

      expect(result.email).toBe('updated@example.com')
    })

    it('should update roles', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'user@example.com',
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
      ;(prisma.userRole.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        roles: [
          {
            role: {
              name: RoleName.AGENT,
            },
          },
        ],
      })

      await updateUser('user-1', {
        roles: [RoleName.AGENT],
      })

      expect(prisma.userRole.deleteMany).toHaveBeenCalled()
      expect(prisma.user.update).toHaveBeenCalled()
    })
  })

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        deletedAt: new Date(),
      })

      const result = await deleteUser('user-1')

      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      })
    })
  })

  describe('assignAgentToTenant', () => {
    it('should assign agent to tenant', async () => {
      const mockManager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.IT_MANAGER,
            },
          },
        ],
      }
      const mockTenant = {
        id: 'tenant-1',
        organizationId: 'org-1',
      }
      const mockAgent = {
        id: 'agent-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.AGENT,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockAgent)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant)
      ;(prisma.tenantAssignment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.tenantAssignment.create as jest.Mock).mockResolvedValue({
        id: 'assignment-1',
        tenantId: 'tenant-1',
        userId: 'agent-1',
      })

      const result = await assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')

      expect(result).toBeDefined()
      expect(prisma.tenantAssignment.create).toHaveBeenCalled()
    })

    it('should throw error if manager not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Manager not found')
    })

    it('should throw error if manager is not authorized', async () => {
      const mockManager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.END_USER,
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockManager)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Only IT Managers or Admins')
    })
  })

  describe('unassignAgentFromTenant', () => {
    it('should unassign agent from tenant', async () => {
      const mockManager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.IT_MANAGER,
            },
          },
        ],
      }
      const mockTenant = {
        id: 'tenant-1',
        organizationId: 'org-1',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockManager)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant)
      ;(prisma.tenantAssignment.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await unassignAgentFromTenant('agent-1', 'tenant-1', 'manager-1')

      expect(result.success).toBe(true)
      expect(prisma.tenantAssignment.deleteMany).toHaveBeenCalled()
    })
  })

  describe('getAgentTenantAssignments', () => {
    it('should return agent tenant assignments', async () => {
      const mockAssignments = [
        {
          id: 'assignment-1',
          tenantId: 'tenant-1',
          tenant: {
            id: 'tenant-1',
            name: 'Tenant 1',
          },
        },
      ]

      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments)

      const result = await getAgentTenantAssignments('agent-1')

      expect(result).toEqual(mockAssignments)
      expect(prisma.tenantAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'agent-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('canManageAgentInOrganization', () => {
    it('should return true if manager can manage agent', async () => {
      const mockManager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.IT_MANAGER,
            },
          },
        ],
      }
      const mockAgent = {
        id: 'agent-1',
        organizationId: 'org-1',
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockAgent)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(true)
    })

    it('should return false if different organizations', async () => {
      const mockManager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [
          {
            role: {
              name: RoleName.IT_MANAGER,
            },
          },
        ],
      }
      const mockAgent = {
        id: 'agent-1',
        organizationId: 'org-2',
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockAgent)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(false)
    })
  })

  describe('activateUser', () => {
    it('should activate user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        isActive: true,
      })

      const result = await activateUser('user-1')

      expect(result.isActive).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: true },
      })
    })
  })

  describe('getUsers edge cases - organization filtering', () => {
    it('should return empty when user has no organization', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: null })

      const result = await getUsers({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(result).toEqual({
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      })
      expect(prisma.user.findMany).not.toHaveBeenCalled()
    })

    it('should filter by user organization when not GLOBAL_ADMIN', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: 'org-1' })
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      })
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should not filter by organization for GLOBAL_ADMIN', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ userId: 'admin-1', userRoles: ['GLOBAL_ADMIN'] })

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            organizationId: expect.anything(),
          }),
        })
      )
    })

    it('should handle organizationId filter directly', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ organizationId: 'org-1' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should handle tenant filter with no assignments', async () => {
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      const result = await getUsers({ tenantId: 'tenant-1' })

      expect(result).toEqual({
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      })
      expect(prisma.user.findMany).not.toHaveBeenCalled()
    })

    it('should handle userIds filter', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ userIds: ['user-1', 'user-2'] })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['user-1', 'user-2'] },
          }),
        })
      )
    })

    it('should handle isActive filter', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ isActive: true })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      )
    })

    it('should handle emailVerified filter', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      await getUsers({ emailVerified: true })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            emailVerified: true,
          }),
        })
      )
    })
  })

  describe('assignAgentToTenant edge cases', () => {
    it('should throw error if tenant not found', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(manager)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Tenant not found')
    })

    it('should throw error if agent not found', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-1' }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(null)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Agent not found')
    })

    it('should throw error if user is not an agent', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-1' }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'END_USER' } }],
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('User is not an agent')
    })

    it('should throw error if agent belongs to different organization than tenant', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-1' }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-2',
        roles: [{ role: { name: 'AGENT' } }],
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)

      await expect(
        assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Agent must belong to the same organization as the tenant')
    })

    it('should return existing assignment if already exists', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-1' }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'AGENT' } }],
      }
      const existingAssignment = {
        id: 'assignment-1',
        tenantId: 'tenant-1',
        userId: 'agent-1',
        category: null,
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)
      ;(prisma.tenantAssignment.findFirst as jest.Mock).mockResolvedValue(existingAssignment)

      const result = await assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')

      expect(result).toEqual(existingAssignment)
      expect(prisma.tenantAssignment.create).not.toHaveBeenCalled()
    })

    it('should allow ADMIN role to assign agents', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'ADMIN' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-1' }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'AGENT' } }],
      }
      const assignment = {
        id: 'assignment-1',
        tenantId: 'tenant-1',
        userId: 'agent-1',
        category: null,
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)
      ;(prisma.tenantAssignment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.tenantAssignment.create as jest.Mock).mockResolvedValue(assignment)

      const result = await assignAgentToTenant('agent-1', 'tenant-1', 'manager-1')

      expect(result).toEqual(assignment)
    })
  })

  describe('unassignAgentFromTenant edge cases', () => {
    it('should throw error if tenant not found', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(manager)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        unassignAgentFromTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('Tenant not found')
    })

    it('should throw error if manager organization does not match tenant organization', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const tenant = { id: 'tenant-1', organizationId: 'org-2' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(manager)
      ;(prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenant)

      await expect(
        unassignAgentFromTenant('agent-1', 'tenant-1', 'manager-1')
      ).rejects.toThrow('You can only manage tenants in your organization')
    })
  })

  describe('canManageAgentInOrganization edge cases', () => {
    it('should return false if manager not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(false)
    })

    it('should return false if manager is not admin or IT manager', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'END_USER' } }],
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(manager)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(false)
    })

    it('should return false if agent not found', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(null)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(false)
    })

    it('should return false if manager and agent are in different organizations', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'IT_MANAGER' } }],
      }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-2',
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(false)
    })

    it('should return true if manager is ADMIN and same organization', async () => {
      const manager = {
        id: 'manager-1',
        organizationId: 'org-1',
        roles: [{ role: { name: 'ADMIN' } }],
      }
      const agent = {
        id: 'agent-1',
        organizationId: 'org-1',
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(manager)
        .mockResolvedValueOnce(agent)

      const result = await canManageAgentInOrganization('manager-1', 'agent-1')

      expect(result).toBe(true)
    })
  })

  describe('updateUser edge cases', () => {
    it('should not update password if not provided', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        roles: [],
      }
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        firstName: 'Updated',
        roles: [],
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await updateUser('user-1', { firstName: 'Updated' })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        })
      )
    })

    it('should handle custom roles in update', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        roles: [],
      }
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        roles: [
          { role: null, customRole: { name: 'Custom Role' } },
        ],
      }
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser)
      ;(prisma.userRole.deleteMany as jest.Mock).mockResolvedValue({})
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await updateUser('user-1', { roles: [RoleName.END_USER] })

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(result.roles).toContain('CUSTOM:Custom Role')
    })
  })


  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        isActive: false,
      })

      const result = await deactivateUser('user-1')

      expect(result.isActive).toBe(false)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      })
    })
  })

  describe('getUsers edge cases', () => {
    beforeEach(() => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue([])
    })

    it('should intersect userIds filter with tenantId filter when both provided', async () => {
      const tenantAssignments = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue(tenantAssignments)

      await getUsers({
        tenantId: 'tenant-1',
        userIds: ['user-2', 'user-3', 'user-4'], // user-4 is not in tenant
      })

      const callArgs = (prisma.user.findMany as jest.Mock).mock.calls[0][0]
      // Should intersect: only user-2 and user-3 should be in the filter
      expect(callArgs.where.id.in).toEqual(['user-2', 'user-3'])
    })

    it('should handle userIds filter without tenantId filter', async () => {
      await getUsers({
        userIds: ['user-1', 'user-2'],
      })

      const callArgs = (prisma.user.findMany as jest.Mock).mock.calls[0][0]
      expect(callArgs.where.id.in).toEqual(['user-1', 'user-2'])
    })

    it('should return empty when userIds filter intersects with empty tenant assignments', async () => {
      ;(prisma.tenantAssignment.findMany as jest.Mock).mockResolvedValue([])

      const result = await getUsers({
        tenantId: 'tenant-1',
        userIds: ['user-1', 'user-2'],
      })

      expect(result.users).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })
})

