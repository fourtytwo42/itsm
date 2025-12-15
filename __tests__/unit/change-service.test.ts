import {
  createChangeRequest,
  getChangeRequestById,
  listChangeRequests,
  updateChangeRequest,
  deleteChangeRequest,
  submitChangeRequest,
  createApproval,
  approveChange,
  startImplementation,
  completeImplementation,
} from '@/lib/services/change-service'
import { prisma } from '@/lib/prisma'
import {
  ChangeType,
  ChangeStatus,
  ChangePriority,
  RiskLevel,
  ApprovalStatus,
} from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    changeRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    changeApproval: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Change Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createChangeRequest', () => {
    it('should create a change request with all fields', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        changeNumber: 'CHG-2025-0001',
        title: 'Test Change',
        type: ChangeType.NORMAL,
        status: ChangeStatus.DRAFT,
        priority: ChangePriority.MEDIUM,
        requester: { id: 'user-1', email: 'user@example.com' },
        approvals: [],
      }

      ;(prisma.changeRequest.create as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await createChangeRequest({
        title: 'Test Change',
        description: 'Test description',
        type: ChangeType.NORMAL,
        requestedById: 'user-1',
      })

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Change',
          description: 'Test description',
          type: ChangeType.NORMAL,
          priority: ChangePriority.MEDIUM,
          status: ChangeStatus.DRAFT,
          requestedById: 'user-1',
        }),
        include: expect.any(Object),
      })
    })

    it('should create change request with optional fields', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        changeNumber: 'CHG-2025-0001',
        title: 'Test Change',
        type: ChangeType.EMERGENCY,
        priority: ChangePriority.CRITICAL,
        riskLevel: RiskLevel.HIGH,
        requester: { id: 'user-1', email: 'user@example.com' },
        approvals: [],
      }

      ;(prisma.changeRequest.create as jest.Mock).mockResolvedValue(mockChangeRequest)

      await createChangeRequest({
        title: 'Test Change',
        description: 'Test description',
        type: ChangeType.EMERGENCY,
        priority: ChangePriority.CRITICAL,
        riskLevel: RiskLevel.HIGH,
        requestedById: 'user-1',
      })

      expect(prisma.changeRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ChangeType.EMERGENCY,
          priority: ChangePriority.CRITICAL,
          riskLevel: RiskLevel.HIGH,
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('getChangeRequestById', () => {
    it('should return change request with approvals', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        changeNumber: 'CHG-2025-0001',
        title: 'Test Change',
        approvals: [],
      }

      ;(prisma.changeRequest.findFirst as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await getChangeRequestById('change-1')

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'change-1',
          deletedAt: null,
        },
        include: expect.any(Object),
      })
    })

    it('should return null if change request not found', async () => {
      ;(prisma.changeRequest.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await getChangeRequestById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('listChangeRequests', () => {
    it('should list change requests with filters', async () => {
      const mockChangeRequests = [
        {
          id: 'change-1',
          changeNumber: 'CHG-2025-0001',
          title: 'Test Change',
          type: ChangeType.NORMAL,
        },
      ]

      ;(prisma.changeRequest.findMany as jest.Mock).mockResolvedValue(mockChangeRequests)
      ;(prisma.changeRequest.count as jest.Mock).mockResolvedValue(1)

      const result = await listChangeRequests({
        type: ChangeType.NORMAL,
        status: ChangeStatus.DRAFT,
        page: 1,
        limit: 20,
      })

      expect(result.changeRequests).toEqual(mockChangeRequests)
      expect(result.pagination.total).toBe(1)
      expect(prisma.changeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ChangeType.NORMAL,
            status: ChangeStatus.DRAFT,
            deletedAt: null,
          }),
        })
      )
    })

    it('should handle search filter', async () => {
      ;(prisma.changeRequest.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.changeRequest.count as jest.Mock).mockResolvedValue(0)

      await listChangeRequests({ search: 'test' })

      expect(prisma.changeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })
  })

  describe('updateChangeRequest', () => {
    it('should update change request', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        title: 'Updated Change',
        status: ChangeStatus.SUBMITTED,
      }

      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await updateChangeRequest('change-1', {
        title: 'Updated Change',
      })

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: expect.objectContaining({
          title: 'Updated Change',
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('deleteChangeRequest', () => {
    it('should soft delete change request', async () => {
      const mockChangeRequest = { id: 'change-1', deletedAt: new Date() }
      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await deleteChangeRequest('change-1')

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          deletedAt: expect.any(Date),
        },
      })
    })
  })

  describe('submitChangeRequest', () => {
    it('should submit change request', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        status: ChangeStatus.SUBMITTED,
        approvals: [],
      }

      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await submitChangeRequest('change-1')

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.SUBMITTED,
        },
        include: {
          approvals: true,
        },
      })
    })
  })

  describe('createApproval', () => {
    it('should create approval', async () => {
      const mockApproval = {
        id: 'approval-1',
        changeRequestId: 'change-1',
        approverId: 'user-1',
        stage: 1,
        status: ApprovalStatus.PENDING,
      }

      ;(prisma.changeApproval.create as jest.Mock).mockResolvedValue(mockApproval)

      const result = await createApproval({
        changeRequestId: 'change-1',
        approverId: 'user-1',
        stage: 1,
      })

      expect(result).toEqual(mockApproval)
      expect(prisma.changeApproval.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changeRequestId: 'change-1',
          approverId: 'user-1',
          stage: 1,
          status: ApprovalStatus.PENDING,
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('approveChange', () => {
    it('should handle approval when not all stage approvals are complete', async () => {
      const mockApproval = {
        id: 'approval-1',
        changeRequestId: 'change-1',
        status: ApprovalStatus.APPROVED,
        changeRequest: {
          id: 'change-1',
          approvals: [
            { id: 'approval-1', stage: 1, status: ApprovalStatus.APPROVED },
            { id: 'approval-2', stage: 1, status: ApprovalStatus.PENDING },
          ],
        },
      }

      ;(prisma.changeApproval.update as jest.Mock).mockResolvedValue(mockApproval)

      const result = await approveChange({
        changeRequestId: 'change-1',
        approverId: 'user-1',
        stage: 1,
        approved: true,
      })

      expect(result).toEqual(mockApproval)
      // Should not update change request status yet
      expect(prisma.changeRequest.update).not.toHaveBeenCalled()
    })

    it('should approve change and update status when rejected', async () => {
      const mockApproval = {
        id: 'approval-1',
        changeRequestId: 'change-1',
        status: ApprovalStatus.REJECTED,
        changeRequest: {
          id: 'change-1',
          approvals: [],
        },
      }

      ;(prisma.changeApproval.update as jest.Mock).mockResolvedValue(mockApproval)
      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        id: 'change-1',
        status: ChangeStatus.REJECTED,
      })

      const result = await approveChange({
        changeRequestId: 'change-1',
        approverId: 'user-1',
        stage: 1,
        approved: false,
      })

      expect(result).toEqual(mockApproval)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.REJECTED,
        },
      })
    })

    it('should approve change and move to next stage', async () => {
      const mockApproval = {
        id: 'approval-1',
        changeRequestId: 'change-1',
        status: ApprovalStatus.APPROVED,
        changeRequest: {
          id: 'change-1',
          approvals: [
            { id: 'approval-1', stage: 1, status: ApprovalStatus.APPROVED },
            { id: 'approval-2', stage: 2, status: ApprovalStatus.PENDING },
          ],
        },
      }

      ;(prisma.changeApproval.update as jest.Mock).mockResolvedValue(mockApproval)
      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        id: 'change-1',
        status: ChangeStatus.IN_REVIEW,
      })

      const result = await approveChange({
        changeRequestId: 'change-1',
        approverId: 'user-1',
        stage: 1,
        approved: true,
      })

      expect(result).toEqual(mockApproval)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.IN_REVIEW,
        },
      })
    })

    it('should approve change and mark as approved when all stages complete', async () => {
      const mockApproval = {
        id: 'approval-2',
        changeRequestId: 'change-1',
        status: ApprovalStatus.APPROVED,
        changeRequest: {
          id: 'change-1',
          approvals: [
            { id: 'approval-1', stage: 1, status: ApprovalStatus.APPROVED },
            { id: 'approval-2', stage: 1, status: ApprovalStatus.APPROVED },
          ],
        },
      }

      ;(prisma.changeApproval.update as jest.Mock).mockResolvedValue(mockApproval)
      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        id: 'change-1',
        status: ChangeStatus.APPROVED,
      })

      const result = await approveChange({
        changeRequestId: 'change-1',
        approverId: 'user-2',
        stage: 1,
        approved: true,
      })

      expect(result).toEqual(mockApproval)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.APPROVED,
        },
      })
    })
  })

  describe('startImplementation', () => {
    it('should start implementation', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        status: ChangeStatus.IMPLEMENTED,
        actualStartDate: new Date(),
      }

      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await startImplementation('change-1')

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.IMPLEMENTED,
          actualStartDate: expect.any(Date),
        },
      })
    })
  })

  describe('completeImplementation', () => {
    it('should complete implementation', async () => {
      const mockChangeRequest = {
        id: 'change-1',
        status: ChangeStatus.CLOSED,
        actualEndDate: new Date(),
        implementationNotes: 'Completed successfully',
      }

      ;(prisma.changeRequest.update as jest.Mock).mockResolvedValue(mockChangeRequest)

      const result = await completeImplementation('change-1', 'Completed successfully')

      expect(result).toEqual(mockChangeRequest)
      expect(prisma.changeRequest.update).toHaveBeenCalledWith({
        where: { id: 'change-1' },
        data: {
          status: ChangeStatus.CLOSED,
          actualEndDate: expect.any(Date),
          implementationNotes: 'Completed successfully',
        },
      })
    })
  })
})

