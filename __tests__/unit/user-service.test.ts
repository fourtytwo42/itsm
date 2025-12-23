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
})

