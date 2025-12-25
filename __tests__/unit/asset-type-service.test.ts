import {
  createCustomAssetType,
  listCustomAssetTypes,
  getCustomAssetTypeById,
  updateCustomAssetType,
  deleteCustomAssetType,
  createAssetTypeCustomField,
  listAssetTypeCustomFields,
  getAssetTypeCustomFieldById,
  updateAssetTypeCustomField,
  deleteAssetTypeCustomField,
} from '@/lib/services/asset-type-service'

const mockCustomAssetType = {
  create: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  updateMany: jest.fn(),
}
const mockAssetTypeCustomField = {
  create: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
}

const mockPrisma = {
  customAssetType: mockCustomAssetType,
  assetTypeCustomField: mockAssetTypeCustomField,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

describe('Asset Type Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCustomAssetType', () => {
    it('should create custom asset type', async () => {
      const mockType = {
        id: 'type-1',
        name: 'Laptop',
        organizationId: 'org-1',
        customFields: [],
      }

      ;(prisma.customAssetType.create as jest.Mock).mockResolvedValue(mockType)

      const result = await createCustomAssetType({
        name: 'Laptop',
        organizationId: 'org-1',
        description: 'Laptop computers',
      })

      expect(result).toEqual(mockType)
      expect(prisma.customAssetType.create).toHaveBeenCalledWith({
        data: {
          name: 'Laptop',
          organizationId: 'org-1',
          description: 'Laptop computers',
        },
        include: expect.any(Object),
      })
    })
  })

  describe('listCustomAssetTypes', () => {
    it('should list custom asset types for organization', async () => {
      const mockTypes = [
        {
          id: 'type-1',
          name: 'Laptop',
          organizationId: 'org-1',
          customFields: [],
        },
      ]

      ;(prisma.customAssetType.findMany as jest.Mock).mockResolvedValue(mockTypes)

      const result = await listCustomAssetTypes('org-1')

      expect(result).toEqual(mockTypes)
      expect(prisma.customAssetType.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          isActive: true,
        },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('getCustomAssetTypeById', () => {
    it('should return custom asset type by id', async () => {
      const mockType = {
        id: 'type-1',
        name: 'Laptop',
        organizationId: 'org-1',
        customFields: [],
      }

      ;(prisma.customAssetType.findFirst as jest.Mock).mockResolvedValue(mockType)

      const result = await getCustomAssetTypeById('type-1', 'org-1')

      expect(result).toEqual(mockType)
      expect(prisma.customAssetType.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'type-1',
          organizationId: 'org-1',
        },
        include: expect.any(Object),
      })
    })
  })

  describe('updateCustomAssetType', () => {
    it('should update custom asset type', async () => {
      ;(prisma.customAssetType.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await updateCustomAssetType('type-1', 'org-1', {
        name: 'Updated Laptop',
        description: 'Updated description',
      })

      expect(prisma.customAssetType.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'type-1',
          organizationId: 'org-1',
        },
        data: {
          name: 'Updated Laptop',
          description: 'Updated description',
        },
      })
    })
  })

  describe('deleteCustomAssetType', () => {
    it('should soft delete custom asset type', async () => {
      ;(prisma.customAssetType.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await deleteCustomAssetType('type-1', 'org-1')

      expect(prisma.customAssetType.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'type-1',
          organizationId: 'org-1',
        },
        data: {
          isActive: false,
        },
      })
    })
  })

  describe('createAssetTypeCustomField', () => {
    it('should create custom field for asset type', async () => {
      const mockField = {
        id: 'field-1',
        fieldName: 'serial_number',
        label: 'Serial Number',
        fieldType: 'text',
      }

      ;(prisma.assetTypeCustomField.create as jest.Mock).mockResolvedValue(mockField)

      const result = await createAssetTypeCustomField({
        customAssetTypeId: 'type-1',
        fieldName: 'serial_number',
        label: 'Serial Number',
        fieldType: 'text',
        required: true,
      })

      expect(result).toEqual(mockField)
      expect(prisma.assetTypeCustomField.create).toHaveBeenCalled()
    })
  })

  describe('updateAssetTypeCustomField', () => {
    it('should update custom field', async () => {
      ;(prisma.assetTypeCustomField.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await updateAssetTypeCustomField('field-1', 'type-1', {
        label: 'Updated Label',
        required: false,
      })

      expect(prisma.assetTypeCustomField.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'field-1',
          customAssetTypeId: 'type-1',
        },
        data: {
          label: 'Updated Label',
          required: false,
        },
      })
    })
  })

  describe('deleteAssetTypeCustomField', () => {
    it('should soft delete custom field', async () => {
      ;(prisma.assetTypeCustomField.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await deleteAssetTypeCustomField('field-1', 'type-1')

      expect(prisma.assetTypeCustomField.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'field-1',
          customAssetTypeId: 'type-1',
        },
        data: { isActive: false },
      })
    })
  })

  describe('createAssetTypeCustomField edge cases', () => {
    it('should use default values for required and order', async () => {
      const mockField = {
        id: 'field-1',
        fieldName: 'serial_number',
        label: 'Serial Number',
        fieldType: 'text',
        required: false,
        order: 0,
      }

      ;(prisma.assetTypeCustomField.create as jest.Mock).mockResolvedValue(mockField)

      await createAssetTypeCustomField({
        customAssetTypeId: 'type-1',
        fieldName: 'serial_number',
        label: 'Serial Number',
        fieldType: 'text',
      })

      expect(prisma.assetTypeCustomField.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          required: false,
          order: 0,
        }),
      })
    })
  })

  describe('getCustomAssetTypeById edge cases', () => {
    it('should return null when asset type not found', async () => {
      ;(prisma.customAssetType.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await getCustomAssetTypeById('non-existent', 'org-1')

      expect(result).toBeNull()
    })
  })

  describe('getAssetTypeCustomFieldById', () => {
    it('should return custom field by id', async () => {
      const mockField = {
        id: 'field-1',
        fieldName: 'serial_number',
        label: 'Serial Number',
        fieldType: 'text',
      }

      ;(prisma.assetTypeCustomField.findFirst as jest.Mock).mockResolvedValue(mockField)

      const result = await getAssetTypeCustomFieldById('field-1', 'type-1')

      expect(result).toEqual(mockField)
      expect(prisma.assetTypeCustomField.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'field-1',
          customAssetTypeId: 'type-1',
        },
      })
    })

    it('should return null when field not found', async () => {
      ;(prisma.assetTypeCustomField.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await getAssetTypeCustomFieldById('non-existent', 'type-1')

      expect(result).toBeNull()
    })
  })

  describe('listAssetTypeCustomFields', () => {
    it('should list custom fields for asset type', async () => {
      const mockFields = [
        {
          id: 'field-1',
          fieldName: 'serial_number',
          label: 'Serial Number',
          fieldType: 'text',
          order: 0,
        },
      ]

      ;(prisma.assetTypeCustomField.findMany as jest.Mock).mockResolvedValue(mockFields)

      const result = await listAssetTypeCustomFields('type-1')

      expect(result).toEqual(mockFields)
      expect(prisma.assetTypeCustomField.findMany).toHaveBeenCalledWith({
        where: {
          customAssetTypeId: 'type-1',
          isActive: true,
        },
        orderBy: { order: 'asc' },
      })
    })

    it('should return empty array when no fields exist', async () => {
      ;(prisma.assetTypeCustomField.findMany as jest.Mock).mockResolvedValue([])

      const result = await listAssetTypeCustomFields('type-1')

      expect(result).toEqual([])
    })
  })
})

