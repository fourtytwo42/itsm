import prisma from '@/lib/prisma'
import {
  AssetType,
  AssetStatus,
  RelationshipType,
  TicketAssetRelationType,
} from '@prisma/client'

export interface CreateAssetInput {
  name: string
  type: AssetType
  category?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status?: AssetStatus
  assignedToId?: string
  location?: string
  building?: string
  floor?: string
  room?: string
  purchaseDate?: Date
  purchasePrice?: number
  warrantyExpiry?: Date
  customFields?: Record<string, any>
  createdById?: string
}

export interface UpdateAssetInput {
  name?: string
  type?: AssetType
  category?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status?: AssetStatus
  assignedToId?: string
  location?: string
  building?: string
  floor?: string
  room?: string
  purchaseDate?: Date
  purchasePrice?: number
  warrantyExpiry?: Date
  customFields?: Record<string, any>
}

export interface ListAssetsFilters {
  type?: AssetType
  status?: AssetStatus
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CreateRelationshipInput {
  sourceAssetId: string
  targetAssetId: string
  relationshipType: RelationshipType
  description?: string
  createdById?: string
}

export interface LinkAssetToTicketInput {
  ticketId: string
  assetId: string
  relationType?: TicketAssetRelationType
  createdById?: string
}

function generateAssetNumber(): string {
  const year = new Date().getFullYear()
  const prefix = 'AST'
  return `${prefix}-${year}-0001` // Simplified - in production, query for last number
}

export async function createAsset(input: CreateAssetInput) {
  const assetNumber = generateAssetNumber()

  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      name: input.name,
      type: input.type,
      category: input.category,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNumber: input.serialNumber,
      status: input.status || AssetStatus.ACTIVE,
      assignedToId: input.assignedToId,
      assignedAt: input.assignedToId ? new Date() : null,
      location: input.location,
      building: input.building,
      floor: input.floor,
      room: input.room,
      purchaseDate: input.purchaseDate,
      purchasePrice: input.purchasePrice,
      warrantyExpiry: input.warrantyExpiry,
      customFields: input.customFields,
      createdById: input.createdById,
    },
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

  return asset
}

export async function getAssetById(id: string) {
  const asset = await prisma.asset.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      relationships: {
        include: {
          targetAsset: {
            select: {
              id: true,
              assetNumber: true,
              name: true,
              type: true,
              status: true,
            },
          },
        },
      },
      relatedAssets: {
        include: {
          sourceAsset: {
            select: {
              id: true,
              assetNumber: true,
              name: true,
              type: true,
              status: true,
            },
          },
        },
      },
    },
  })

  return asset
}

export async function listAssets(filters: ListAssetsFilters = {}) {
  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit
  const sort = filters.sort || 'createdAt'
  const order = filters.order || 'desc'

  const where: any = {
    deletedAt: null,
  }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.assignedTo) {
    where.assignedToId = filters.assignedTo
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { assetNumber: { contains: filters.search, mode: 'insensitive' } },
      { manufacturer: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
      { serialNumber: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
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
    }),
    prisma.asset.count({ where }),
  ])

  return {
    assets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateAsset(id: string, input: UpdateAssetInput) {
  const updateData: any = { ...input }

  // Handle assignment
  if (input.assignedToId !== undefined) {
    updateData.assignedToId = input.assignedToId
    updateData.assignedAt = input.assignedToId ? new Date() : null
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: updateData,
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

  return asset
}

export async function deleteAsset(id: string) {
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  return asset
}

export async function createRelationship(input: CreateRelationshipInput) {
  // Prevent self-relationships
  if (input.sourceAssetId === input.targetAssetId) {
    throw new Error('Asset cannot be related to itself')
  }

  const relationship = await prisma.assetRelationship.create({
    data: {
      sourceAssetId: input.sourceAssetId,
      targetAssetId: input.targetAssetId,
      relationshipType: input.relationshipType,
      description: input.description,
      createdById: input.createdById,
    },
    include: {
      sourceAsset: {
        select: {
          id: true,
          assetNumber: true,
          name: true,
        },
      },
      targetAsset: {
        select: {
          id: true,
          assetNumber: true,
          name: true,
        },
      },
    },
  })

  return relationship
}

export async function deleteRelationship(id: string) {
  await prisma.assetRelationship.delete({
    where: { id },
  })
}

export async function linkAssetToTicket(input: LinkAssetToTicketInput) {
  const relation = await prisma.ticketAssetRelation.create({
    data: {
      ticketId: input.ticketId,
      assetId: input.assetId,
      relationType: input.relationType || TicketAssetRelationType.AFFECTED_BY,
      createdById: input.createdById,
    },
    include: {
      asset: {
        select: {
          id: true,
          assetNumber: true,
          name: true,
          type: true,
          status: true,
        },
      },
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
        },
      },
    },
  })

  return relation
}

export async function unlinkAssetFromTicket(
  ticketId: string,
  assetId: string,
  relationType?: TicketAssetRelationType
) {
  const where: any = {
    ticketId,
    assetId,
  }

  if (relationType) {
    where.relationType = relationType
  }

  await prisma.ticketAssetRelation.deleteMany({
    where,
  })
}

export async function getAssetsByTicketId(ticketId: string) {
  const relations = await prisma.ticketAssetRelation.findMany({
    where: { ticketId },
    include: {
      asset: {
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
      },
    },
  })

  return relations.map((r) => ({
    ...r.asset,
    relationType: r.relationType,
  }))
}

export interface CSVImportResult {
  imported: number
  errors: Array<{ row: number; error: string }>
}

export async function importAssetsFromCSV(
  csvData: string,
  createdById?: string
): Promise<CSVImportResult> {
  const { parse } = require('csv-parse/sync')
  const result: CSVImportResult = {
    imported: 0,
    errors: [],
  }

  try {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNumber = i + 2 // +2 because CSV has header and 0-indexed

      try {
        const assetData: CreateAssetInput = {
          name: row.name || row.Name || '',
          type: (row.type || row.Type || 'HARDWARE') as AssetType,
          category: row.category || row.Category,
          manufacturer: row.manufacturer || row.Manufacturer,
          model: row.model || row.Model,
          serialNumber: row.serialNumber || row['Serial Number'] || row.serial_number,
          status: (row.status || row.Status || 'ACTIVE') as AssetStatus,
          location: row.location || row.Location,
          building: row.building || row.Building,
          floor: row.floor || row.Floor,
          room: row.room || row.Room,
          purchaseDate: row.purchaseDate || row['Purchase Date'] || row.purchase_date
            ? new Date(row.purchaseDate || row['Purchase Date'] || row.purchase_date)
            : undefined,
          purchasePrice: row.purchasePrice || row['Purchase Price'] || row.purchase_price
            ? parseFloat(row.purchasePrice || row['Purchase Price'] || row.purchase_price)
            : undefined,
          warrantyExpiry: row.warrantyExpiry || row['Warranty Expiry'] || row.warranty_expiry
            ? new Date(row.warrantyExpiry || row['Warranty Expiry'] || row.warranty_expiry)
            : undefined,
          createdById,
        }

        if (!assetData.name) {
          throw new Error('Name is required')
        }

        await createAsset(assetData)
        result.imported++
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  } catch (error) {
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'CSV parsing error',
    })
  }

  return result
}

export async function exportAssetsToCSV(filters: ListAssetsFilters = {}): Promise<string> {
  // Get all assets (no pagination for export)
  const { assets } = await listAssets({
    ...filters,
    limit: 10000, // Large limit for export
  })

  const csvData = assets.map((asset) => ({
    'Asset Number': asset.assetNumber,
    Name: asset.name,
    Type: asset.type,
    Category: asset.category || '',
    Manufacturer: asset.manufacturer || '',
    Model: asset.model || '',
    'Serial Number': asset.serialNumber || '',
    Status: asset.status,
    'Assigned To': asset.assignedTo
      ? `${asset.assignedTo.firstName || ''} ${asset.assignedTo.lastName || ''}`.trim() ||
        asset.assignedTo.email
      : '',
    Location: asset.location || '',
    Building: asset.building || '',
    Floor: asset.floor || '',
    Room: asset.room || '',
    'Purchase Date': asset.purchaseDate?.toISOString().split('T')[0] || '',
    'Purchase Price': asset.purchasePrice?.toString() || '',
    'Warranty Expiry': asset.warrantyExpiry?.toISOString().split('T')[0] || '',
    'Created At': asset.createdAt.toISOString(),
  }))

  const csvString = [
    Object.keys(csvData[0] || {}).join(','),
    ...csvData.map((row) =>
      Object.values(row)
        .map((val) => (val ? `"${String(val).replace(/"/g, '""')}"` : ''))
        .join(',')
    ),
  ].join('\n')

  return csvString
}

