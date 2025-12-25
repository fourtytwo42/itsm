import {
  getSystemConfig,
  getSetting,
  setSetting,
  setSystemConfig,
  getAllSettings,
  getSettingsByCategory,
  deleteSetting,
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '@/lib/services/config-service'
import { SettingCategory } from '@prisma/client'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    customField: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ticketType: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('Config Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSystemConfig', () => {
    it('should return default config when no settings exist', async () => {
      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue([])

      const config = await getSystemConfig()

      expect(config).toMatchObject({
        registrationEnabled: true,
        passwordResetEnabled: true,
        ssoEnabled: false,
        ldapEnabled: false,
        emailNotificationsEnabled: true,
        emailFromAddress: 'noreply@example.com',
        emailFromName: 'ITSM Helpdesk',
        maxFileSize: 104857600,
        allowedFileTypes: ['*'],
        organizationName: 'ITSM Helpdesk',
        defaultTicketPriority: 'MEDIUM',
        autoAssignEnabled: false,
        maintenanceMode: false,
        sessionTimeout: 1440,
      })
    })

    it('should merge settings with defaults', async () => {
      const mockSettings = [
        {
          id: '1',
          key: 'organizationName',
          category: SettingCategory.BRANDING,
          value: 'My Company',
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'maxFileSize',
          category: SettingCategory.FILE_UPLOAD,
          value: 52428800, // 50MB
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue(mockSettings)

      const config = await getSystemConfig()

      expect(config.organizationName).toBe('My Company')
      expect(config.maxFileSize).toBe(52428800)
      expect(config.registrationEnabled).toBe(true) // Default value
    })

    it('should ignore settings not in DEFAULT_CONFIG', async () => {
      const mockSettings = [
        {
          id: '1',
          key: 'organizationName',
          category: SettingCategory.BRANDING,
          value: 'My Company',
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'unknownSetting',
          category: SettingCategory.SYSTEM,
          value: 'should be ignored',
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue(mockSettings)

      const config = await getSystemConfig()

      expect(config).not.toHaveProperty('unknownSetting')
      expect(config.organizationName).toBe('My Company')
    })
  })

  describe('getSetting', () => {
    it('should return setting value', async () => {
      const mockSetting = {
        id: '1',
        key: 'organizationName',
        category: SettingCategory.BRANDING,
        value: 'My Company',
        description: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.systemSetting.findUnique as jest.Mock).mockResolvedValue(mockSetting)

      const value = await getSetting('organizationName')

      expect(prisma.systemSetting.findUnique).toHaveBeenCalledWith({
        where: { key: 'organizationName' },
      })
      expect(value).toBe('My Company')
    })

    it('should return null if setting not found', async () => {
      ;(prisma.systemSetting.findUnique as jest.Mock).mockResolvedValue(null)

      const value = await getSetting('nonexistent')

      expect(value).toBeNull()
    })
  })

  describe('setSetting', () => {
    it('should create new setting', async () => {
      const mockSetting = {
        id: '1',
        key: 'organizationName',
        category: SettingCategory.BRANDING,
        value: 'My Company',
        description: 'Organization name',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.systemSetting.upsert as jest.Mock).mockResolvedValue(mockSetting)

      await setSetting('organizationName', 'My Company', SettingCategory.BRANDING, 'Organization name', 'user-1')

      expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
        where: { key: 'organizationName' },
        update: {
          value: 'My Company',
          category: SettingCategory.BRANDING,
          description: 'Organization name',
          updatedBy: 'user-1',
          updatedAt: expect.any(Date),
        },
        create: {
          key: 'organizationName',
          value: 'My Company',
          category: SettingCategory.BRANDING,
          description: 'Organization name',
          updatedBy: 'user-1',
        },
      })
    })

    it('should update existing setting', async () => {
      const mockSetting = {
        id: '1',
        key: 'organizationName',
        category: SettingCategory.BRANDING,
        value: 'Updated Company',
        description: 'Organization name',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.systemSetting.upsert as jest.Mock).mockResolvedValue(mockSetting)

      await setSetting('organizationName', 'Updated Company', SettingCategory.BRANDING, 'Organization name', 'user-1')

      expect(prisma.systemSetting.upsert).toHaveBeenCalled()
    })
  })

  describe('setSystemConfig', () => {
    it('should update multiple settings', async () => {
      ;(prisma.systemSetting.upsert as jest.Mock).mockResolvedValue({})

      await setSystemConfig(
        {
          organizationName: 'My Company',
          maxFileSize: 52428800,
          registrationEnabled: false,
        },
        'user-1'
      )

      expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(3)
    })

    it('should categorize settings correctly', async () => {
      ;(prisma.systemSetting.upsert as jest.Mock).mockResolvedValue({})

      await setSystemConfig(
        {
          registrationEnabled: false, // AUTHENTICATION
          emailNotificationsEnabled: false, // EMAIL
          maxFileSize: 52428800, // FILE_UPLOAD
          organizationName: 'My Company', // BRANDING
          defaultTicketPriority: 'HIGH', // TICKET
          maintenanceMode: true, // SYSTEM
        },
        'user-1'
      )

      expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(6)
    })
  })

  describe('getAllSettings', () => {
    it('should return all settings sorted by category and key', async () => {
      const mockSettings = [
        {
          id: '1',
          key: 'organizationName',
          category: SettingCategory.BRANDING,
          value: 'My Company',
          description: 'Organization name',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'maxFileSize',
          category: SettingCategory.FILE_UPLOAD,
          value: 52428800,
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue(mockSettings)

      const settings = await getAllSettings()

      expect(prisma.systemSetting.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      })
      expect(settings).toHaveLength(2)
      expect(settings[0]).toMatchObject({
        key: 'organizationName',
        category: SettingCategory.BRANDING,
        value: 'My Company',
        description: 'Organization name',
      })
    })
  })

  describe('getSettingsByCategory', () => {
    it('should return settings for specific category', async () => {
      const mockSettings = [
        {
          id: '1',
          key: 'organizationName',
          category: SettingCategory.BRANDING,
          value: 'My Company',
          description: null,
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue(mockSettings)

      const settings = await getSettingsByCategory(SettingCategory.BRANDING)

      expect(prisma.systemSetting.findMany).toHaveBeenCalledWith({
        where: { category: SettingCategory.BRANDING },
        orderBy: { key: 'asc' },
      })
      expect(settings).toHaveLength(1)
    })

    it('should return empty array when no settings in category', async () => {
      ;(prisma.systemSetting.findMany as jest.Mock).mockResolvedValue([])

      const settings = await getSettingsByCategory(SettingCategory.BRANDING)

      expect(settings).toEqual([])
    })
  })

  describe('deleteSetting', () => {
    it('should delete setting', async () => {
      ;(prisma.systemSetting.delete as jest.Mock).mockResolvedValue({})

      await deleteSetting('organizationName')

      expect(prisma.systemSetting.delete).toHaveBeenCalledWith({
        where: { key: 'organizationName' },
      })
    })
  })

  describe('getCustomFields', () => {
    it('should return custom fields for entity type', async () => {
      const mockFields = [
        {
          id: '1',
          name: 'custom_field_1',
          label: 'Custom Field 1',
          type: 'text',
          required: false,
          defaultValue: null,
          options: null,
          entityType: 'ticket',
          order: 0,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.customField.findMany as jest.Mock).mockResolvedValue(mockFields)

      const fields = await getCustomFields('ticket')

      expect(prisma.customField.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'ticket',
          active: true,
        },
        orderBy: { order: 'asc' },
      })
      expect(fields).toHaveLength(1)
      expect(fields[0]).toMatchObject({
        id: '1',
        name: 'custom_field_1',
        label: 'Custom Field 1',
        type: 'text',
        required: false,
      })
    })

    it('should include inactive fields when includeInactive is true', async () => {
      const mockFields = [
        {
          id: '1',
          name: 'custom_field_1',
          label: 'Custom Field 1',
          type: 'text',
          required: false,
          defaultValue: null,
          options: null,
          entityType: 'ticket',
          order: 0,
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.customField.findMany as jest.Mock).mockResolvedValue(mockFields)

      const fields = await getCustomFields('ticket', true)

      expect(prisma.customField.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'ticket',
        },
        orderBy: { order: 'asc' },
      })
      expect(fields).toHaveLength(1)
    })
  })

  describe('createCustomField', () => {
    it('should create custom field', async () => {
      const mockField = {
        id: '1',
        name: 'custom_field_1',
        label: 'Custom Field 1',
        type: 'text',
        required: false,
        defaultValue: null,
        options: null,
        entityType: 'ticket',
        order: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.customField.create as jest.Mock).mockResolvedValue(mockField)

      const field = await createCustomField({
        name: 'custom_field_1',
        label: 'Custom Field 1',
        type: 'text',
        entityType: 'ticket',
      })

      expect(prisma.customField.create).toHaveBeenCalledWith({
        data: {
          name: 'custom_field_1',
          label: 'Custom Field 1',
          type: 'text',
          required: false,
          defaultValue: undefined,
          options: undefined,
          entityType: 'ticket',
          order: 0,
        },
      })
      expect(field).toEqual(mockField)
    })
  })

  describe('updateCustomField', () => {
    it('should update custom field', async () => {
      const mockField = {
        id: '1',
        name: 'custom_field_1',
        label: 'Updated Label',
        type: 'text',
        required: true,
        defaultValue: 'default',
        options: null,
        entityType: 'ticket',
        order: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.customField.update as jest.Mock).mockResolvedValue(mockField)

      const field = await updateCustomField('1', {
        label: 'Updated Label',
        required: true,
        defaultValue: 'default',
        order: 1,
      })

      expect(prisma.customField.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          label: 'Updated Label',
          required: true,
          defaultValue: 'default',
          order: 1,
        },
      })
      expect(field).toEqual(mockField)
    })
  })

  describe('deleteCustomField', () => {
    it('should delete custom field', async () => {
      ;(prisma.customField.delete as jest.Mock).mockResolvedValue({})

      await deleteCustomField('1')

      expect(prisma.customField.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })

  describe('getTicketTypes', () => {
    it('should return active ticket types', async () => {
      const mockTypes = [
        {
          id: '1',
          name: 'Incident',
          description: 'Incident ticket type',
          icon: 'bug',
          color: '#ef4444',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.ticketType.findMany as jest.Mock).mockResolvedValue(mockTypes)

      const types = await getTicketTypes()

      expect(prisma.ticketType.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { name: 'asc' },
      })
      expect(types).toHaveLength(1)
      expect(types[0]).toMatchObject({
        id: '1',
        name: 'Incident',
        description: 'Incident ticket type',
        icon: 'bug',
        color: '#ef4444',
      })
    })

    it('should include inactive ticket types when includeInactive is true', async () => {
      const mockTypes = [
        {
          id: '1',
          name: 'Incident',
          description: 'Incident ticket type',
          icon: 'bug',
          color: '#ef4444',
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.ticketType.findMany as jest.Mock).mockResolvedValue(mockTypes)

      const types = await getTicketTypes(true)

      expect(prisma.ticketType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      })
      expect(types).toHaveLength(1)
    })
  })

  describe('createTicketType', () => {
    it('should create ticket type', async () => {
      const mockType = {
        id: '1',
        name: 'Incident',
        description: 'Incident ticket type',
        icon: 'bug',
        color: '#ef4444',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.ticketType.create as jest.Mock).mockResolvedValue(mockType)

      const type = await createTicketType({
        name: 'Incident',
        description: 'Incident ticket type',
        icon: 'bug',
        color: '#ef4444',
      })

      expect(prisma.ticketType.create).toHaveBeenCalledWith({
        data: {
          name: 'Incident',
          description: 'Incident ticket type',
          icon: 'bug',
          color: '#ef4444',
        },
      })
      expect(type).toEqual(mockType)
    })
  })

  describe('updateTicketType', () => {
    it('should update ticket type', async () => {
      const mockType = {
        id: '1',
        name: 'Updated Incident',
        description: 'Updated description',
        icon: 'bug',
        color: '#dc2626',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.ticketType.update as jest.Mock).mockResolvedValue(mockType)

      const type = await updateTicketType('1', {
        name: 'Updated Incident',
        description: 'Updated description',
        color: '#dc2626',
        active: false,
      })

      expect(prisma.ticketType.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Incident',
          description: 'Updated description',
          color: '#dc2626',
          active: false,
        },
      })
      expect(type).toEqual(mockType)
    })
  })

  describe('deleteTicketType', () => {
    it('should delete ticket type', async () => {
      ;(prisma.ticketType.delete as jest.Mock).mockResolvedValue({})

      await deleteTicketType('1')

      expect(prisma.ticketType.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })
})

