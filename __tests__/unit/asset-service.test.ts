import {
  createAsset,
  getAssetById,
  listAssets,
  updateAsset,
  deleteAsset,
  createRelationship,
  deleteRelationship,
  linkAssetToTicket,
  unlinkAssetFromTicket,
  getAssetsByTicketId,
  importAssetsFromCSV,
  exportAssetsToCSV,
} from '@/lib/services/asset-service'
import { prisma } from '@/lib/prisma'
import { AssetType, AssetStatus, RelationshipType, TicketAssetRelationType } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    asset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    assetRelationship: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    ticketAssetRelation: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('csv-parse/sync', () => ({
  parse: jest.fn(),
}))

describe('Asset Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAsset', () => {
    it('should create an asset with all fields', async () => {
      const mockAsset = {
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Test Laptop',
        type: AssetType.HARDWARE,
        status: AssetStatus.ACTIVE,
        assignedTo: null,
      }

      ;(prisma.asset.create as jest.Mock).mockResolvedValue(mockAsset)

      const result = await createAsset({
        name: 'Test Laptop',
        type: AssetType.HARDWARE,
        createdById: 'user-1',
      })

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Laptop',
          type: AssetType.HARDWARE,
          status: AssetStatus.ACTIVE,
          createdById: 'user-1',
        }),
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    })

    it('should set assignedAt when assignedToId is provided', async () => {
      const mockAsset = {
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Test Laptop',
        assignedTo: { id: 'user-1', email: 'user@example.com' },
      }

      ;(prisma.asset.create as jest.Mock).mockResolvedValue(mockAsset)

      await createAsset({
        name: 'Test Laptop',
        type: AssetType.HARDWARE,
        assignedToId: 'user-1',
      })

      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          assignedToId: 'user-1',
          assignedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('getAssetById', () => {
    it('should return asset with relationships', async () => {
      const mockAsset = {
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Test Laptop',
        relationships: [],
        relatedAssets: [],
      }

      ;(prisma.asset.findFirst as jest.Mock).mockResolvedValue(mockAsset)

      const result = await getAssetById('asset-1')

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'asset-1',
          deletedAt: null,
        },
        include: expect.any(Object),
      })
    })

    it('should return null if asset not found', async () => {
      ;(prisma.asset.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await getAssetById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('listAssets', () => {
    it('should list assets with filters', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          assetNumber: 'AST-2025-0001',
          name: 'Test Laptop',
          type: AssetType.HARDWARE,
        },
      ]

      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue(mockAssets)
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(1)

      const result = await listAssets({
        type: AssetType.HARDWARE,
        status: AssetStatus.ACTIVE,
        page: 1,
        limit: 20,
      })

      expect(result.assets).toEqual(mockAssets)
      expect(result.pagination.total).toBe(1)
      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: AssetType.HARDWARE,
            status: AssetStatus.ACTIVE,
            deletedAt: null,
          }),
        })
      )
    })

    it('should handle search filter', async () => {
      const mockAssets = []
      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue(mockAssets)
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(0)

      await listAssets({ search: 'laptop' })

      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'laptop', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })
  })

  describe('updateAsset', () => {
    it('should update asset', async () => {
      const mockAsset = {
        id: 'asset-1',
        name: 'Updated Laptop',
        status: AssetStatus.INACTIVE,
      }

      ;(prisma.asset.update as jest.Mock).mockResolvedValue(mockAsset)

      const result = await updateAsset('asset-1', {
        name: 'Updated Laptop',
        status: AssetStatus.INACTIVE,
      })

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          name: 'Updated Laptop',
          status: AssetStatus.INACTIVE,
        }),
        include: expect.any(Object),
      })
    })

    it('should set assignedAt when assigning asset', async () => {
      const mockAsset = { id: 'asset-1', assignedToId: 'user-1' }
      ;(prisma.asset.update as jest.Mock).mockResolvedValue(mockAsset)

      await updateAsset('asset-1', { assignedToId: 'user-1' })

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          assignedToId: 'user-1',
          assignedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('deleteAsset', () => {
    it('should soft delete asset', async () => {
      const mockAsset = { id: 'asset-1', deletedAt: new Date() }
      ;(prisma.asset.update as jest.Mock).mockResolvedValue(mockAsset)

      const result = await deleteAsset('asset-1')

      expect(result).toEqual(mockAsset)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: {
          deletedAt: expect.any(Date),
        },
      })
    })
  })

  describe('createRelationship', () => {
    it('should create asset relationship', async () => {
      const mockRelationship = {
        id: 'rel-1',
        sourceAssetId: 'asset-1',
        targetAssetId: 'asset-2',
        relationshipType: RelationshipType.DEPENDS_ON,
      }

      ;(prisma.assetRelationship.create as jest.Mock).mockResolvedValue(mockRelationship)

      const result = await createRelationship({
        sourceAssetId: 'asset-1',
        targetAssetId: 'asset-2',
        relationshipType: RelationshipType.DEPENDS_ON,
      })

      expect(result).toEqual(mockRelationship)
      expect(prisma.assetRelationship.create).toHaveBeenCalled()
    })

    it('should throw error for self-relationship', async () => {
      await expect(
        createRelationship({
          sourceAssetId: 'asset-1',
          targetAssetId: 'asset-1',
          relationshipType: RelationshipType.DEPENDS_ON,
        })
      ).rejects.toThrow('Asset cannot be related to itself')
    })
  })

  describe('deleteRelationship', () => {
    it('should delete relationship', async () => {
      ;(prisma.assetRelationship.delete as jest.Mock).mockResolvedValue({})

      await deleteRelationship('rel-1')

      expect(prisma.assetRelationship.delete).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      })
    })
  })

  describe('linkAssetToTicket', () => {
    it('should link asset to ticket', async () => {
      const mockRelation = {
        id: 'rel-1',
        ticketId: 'ticket-1',
        assetId: 'asset-1',
        relationType: TicketAssetRelationType.AFFECTED_BY,
      }

      ;(prisma.ticketAssetRelation.create as jest.Mock).mockResolvedValue(mockRelation)

      const result = await linkAssetToTicket({
        ticketId: 'ticket-1',
        assetId: 'asset-1',
        relationType: TicketAssetRelationType.AFFECTED_BY,
      })

      expect(result).toEqual(mockRelation)
      expect(prisma.ticketAssetRelation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          assetId: 'asset-1',
          relationType: TicketAssetRelationType.AFFECTED_BY,
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('unlinkAssetFromTicket', () => {
    it('should unlink asset from ticket', async () => {
      ;(prisma.ticketAssetRelation.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      await unlinkAssetFromTicket('ticket-1', 'asset-1')

      expect(prisma.ticketAssetRelation.deleteMany).toHaveBeenCalledWith({
        where: {
          ticketId: 'ticket-1',
          assetId: 'asset-1',
        },
      })
    })
  })

  describe('getAssetsByTicketId', () => {
    it('should get assets linked to ticket', async () => {
      const mockRelations = [
        {
          id: 'rel-1',
          relationType: TicketAssetRelationType.AFFECTED_BY,
          asset: {
            id: 'asset-1',
            assetNumber: 'AST-2025-0001',
            name: 'Test Asset',
          },
        },
      ]

      ;(prisma.ticketAssetRelation.findMany as jest.Mock).mockResolvedValue(mockRelations)

      const result = await getAssetsByTicketId('ticket-1')

      expect(result).toHaveLength(1)
      expect(result[0].relationType).toBe(TicketAssetRelationType.AFFECTED_BY)
      expect(prisma.ticketAssetRelation.findMany).toHaveBeenCalledWith({
        where: { ticketId: 'ticket-1' },
        include: expect.any(Object),
      })
    })
  })

  describe('importAssetsFromCSV', () => {
    it('should import assets from CSV', async () => {
      const csvData = 'name,type,manufacturer\nLaptop,HARDWARE,Dell'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { name: 'Laptop', type: 'HARDWARE', manufacturer: 'Dell' },
      ])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Laptop',
      })

      const result = await importAssetsFromCSV(csvData, 'user-1')

      expect(result.imported).toBe(1)
      expect(result.errors).toHaveLength(0)
      expect(prisma.asset.create).toHaveBeenCalled()
    })

    it('should handle CSV parsing errors', async () => {
      const csvData = 'invalid csv'
      const { parse } = require('csv-parse/sync')

      parse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      const result = await importAssetsFromCSV(csvData)

      expect(result.imported).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle missing required fields', async () => {
      const csvData = 'type,manufacturer\nHARDWARE,Dell'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([{ type: 'HARDWARE', manufacturer: 'Dell' }])

      const result = await importAssetsFromCSV(csvData)

      expect(result.imported).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].error).toContain('Name is required')
    })
  })

  describe('exportAssetsToCSV', () => {
    it('should export assets to CSV', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          assetNumber: 'AST-2025-0001',
          name: 'Test Laptop',
          type: AssetType.HARDWARE,
          status: AssetStatus.ACTIVE,
          assignedTo: null,
          createdAt: new Date('2025-01-01'),
        },
      ]

      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue(mockAssets)
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(1)

      const result = await exportAssetsToCSV()

      expect(result).toContain('Asset Number')
      expect(result).toContain('AST-2025-0001')
      expect(result).toContain('Test Laptop')
    })

    it('should handle empty assets list', async () => {
      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(0)

      const result = await exportAssetsToCSV()

      // Should return at least headers or empty string
      expect(typeof result).toBe('string')
    })

    it('should export assets with assigned user', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          assetNumber: 'AST-2025-0001',
          name: 'Test Laptop',
          type: AssetType.HARDWARE,
          status: AssetStatus.ACTIVE,
          assignedTo: {
            id: 'user-1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: new Date('2025-01-01'),
        },
      ]

      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue(mockAssets)
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(1)

      const result = await exportAssetsToCSV()

      expect(result).toContain('John Doe')
    })
  })

  describe('listAssets edge cases', () => {
    it('should handle default pagination', async () => {
      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(0)

      await listAssets()

      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      )
    })

    it('should handle custom pagination', async () => {
      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(0)

      await listAssets({ page: 2, limit: 10 })

      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })

    it('should handle assignedTo filter', async () => {
      ;(prisma.asset.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.asset.count as jest.Mock).mockResolvedValue(0)

      await listAssets({ assignedTo: 'user-1' })

      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: 'user-1',
          }),
        })
      )
    })
  })

  describe('updateAsset edge cases', () => {
    it('should handle null assignedToId', async () => {
      const mockAsset = { id: 'asset-1', assignedToId: null }
      ;(prisma.asset.update as jest.Mock).mockResolvedValue(mockAsset)

      await updateAsset('asset-1', { assignedToId: null })

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          assignedToId: null,
          assignedAt: null,
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('importAssetsFromCSV edge cases', () => {
    it('should handle different CSV column formats', async () => {
      const csvData = 'Name,Type,Serial Number\nLaptop,HARDWARE,SN123'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { Name: 'Laptop', Type: 'HARDWARE', 'Serial Number': 'SN123' },
      ])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
        name: 'Laptop',
      })

      const result = await importAssetsFromCSV(csvData)

      expect(result.imported).toBe(1)
    })

    it('should handle purchase date parsing', async () => {
      const csvData = 'name,type,Purchase Date\nLaptop,HARDWARE,2025-01-01'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { name: 'Laptop', type: 'HARDWARE', 'Purchase Date': '2025-01-01' },
      ])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
      })

      await importAssetsFromCSV(csvData)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchaseDate: expect.any(Date),
          }),
        })
      )
    })

    it('should handle purchase_price column format', async () => {
      const csvData = 'name,type,purchase_price\nLaptop,HARDWARE,999.99'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { name: 'Laptop', type: 'HARDWARE', purchase_price: '999.99' },
      ])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
      })

      await importAssetsFromCSV(csvData)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchasePrice: 999.99,
          }),
        })
      )
    })

    it('should handle warranty_expiry column format', async () => {
      const csvData = 'name,type,warranty_expiry\nLaptop,HARDWARE,2026-01-01'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { name: 'Laptop', type: 'HARDWARE', warranty_expiry: '2026-01-01' },
      ])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
      })

      await importAssetsFromCSV(csvData)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            warrantyExpiry: expect.any(Date),
          }),
        })
      )
    })

    it('should handle missing optional date fields', async () => {
      const csvData = 'name,type\nLaptop,HARDWARE'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([{ name: 'Laptop', type: 'HARDWARE' }])

      ;(prisma.asset.create as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-2025-0001',
      })

      await importAssetsFromCSV(csvData)

      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchaseDate: undefined,
            warrantyExpiry: undefined,
          }),
        })
      )
    })

    it('should handle multiple rows with some errors', async () => {
      const csvData = 'name,type\nLaptop,HARDWARE\n,SOFTWARE'
      const { parse } = require('csv-parse/sync')

      parse.mockReturnValue([
        { name: 'Laptop', type: 'HARDWARE' },
        { name: '', type: 'SOFTWARE' },
      ])

      ;(prisma.asset.create as jest.Mock)
        .mockResolvedValueOnce({
          id: 'asset-1',
          assetNumber: 'AST-2025-0001',
        })
        .mockRejectedValueOnce(new Error('Name is required'))

      const result = await importAssetsFromCSV(csvData)

      expect(result.imported).toBe(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})

