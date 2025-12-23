import prisma from '@/lib/prisma'
import {
  AssetType,
  AssetStatus,
  RelationshipType,
  TicketAssetRelationType,
} from '@prisma/client'

export interface CreateAssetInput {
  name: string
  customAssetTypeId: string // Required - must select an asset type
  status?: AssetStatus
  assignedToId?: string
  customFields?: Record<string, any>
  createdById?: string
  tenantId?: string
  organizationId?: string | null // Asset belongs to an organization
}

export interface UpdateAssetInput {
  name?: string
  status?: AssetStatus
  assignedToId?: string | null
  customFields?: Record<string, any>
}

export interface ListAssetsFilters {
  type?: AssetType
  status?: AssetStatus
  assignedTo?: string
  search?: string
  tenantId?: string
  organizationId?: string // Filter by organization
  userId?: string // For filtering by user's organization
  userRoles?: string[] // User's roles
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

async function generateAssetNumber(organizationId?: string | null, maxRetries: number = 10): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = 'AST'
  const pattern = `${prefix}-${year}-`
  
  // Build where clause to find assets for this year
  const where: any = {
    deletedAt: null,
  }
  
  // Optionally filter by organization if provided
  if (organizationId) {
    where.organizationId = organizationId
  }
  
  // Get all assets for this year to find the max sequence
  const assets = await prisma.asset.findMany({
    where,
    select: {
      assetNumber: true,
    },
  })
  
  // Filter assets that match the pattern and extract sequence numbers
  const sequenceNumbers = assets
    .map((asset) => {
      if (asset.assetNumber.startsWith(pattern)) {
        const parts = asset.assetNumber.split('-')
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10)
          if (!isNaN(seq)) {
            return seq
          }
        }
      }
      return 0
    })
    .filter((seq) => seq > 0)
  
  // Find the maximum sequence number
  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0
  
  // Try to generate a unique asset number with retry logic
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const sequence = maxSequence + attempt + 1
    const sequenceStr = sequence.toString().padStart(4, '0')
    const assetNumber = `${prefix}-${year}-${sequenceStr}`
    
    // Check if this asset number already exists
    const existing = await prisma.asset.findUnique({
      where: { assetNumber },
      select: { id: true },
    })
    
    if (!existing) {
      return assetNumber
    }
  }
  
  // If all retries failed, throw an error
  throw new Error('Failed to generate unique asset number after multiple attempts')
}

export async function createAsset(input: CreateAssetInput) {
  const assetNumber = await generateAssetNumber(input.organizationId)

  // Verify the asset type exists
  const assetType = await prisma.customAssetType.findUnique({
    where: { id: input.customAssetTypeId },
    select: { id: true },
  })

  if (!assetType) {
    throw new Error('Asset type not found')
  }

  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      name: input.name,
      type: null, // No longer using baseType, type is optional
      customAssetTypeId: input.customAssetTypeId,
      status: input.status || AssetStatus.ACTIVE,
      assignedToId: input.assignedToId,
      assignedAt: input.assignedToId ? new Date() : null,
      customFields: input.customFields,
      createdById: input.createdById,
      tenantId: input.tenantId,
      organizationId: input.organizationId || null,
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
      customAssetType: {
        include: {
          customFields: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
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

  // Filter by organization - if user is not GLOBAL_ADMIN, filter by their organization
  if (filters.userId && filters.userRoles) {
    if (!filters.userRoles.includes('GLOBAL_ADMIN')) {
      // Get user's organization
      const user = await prisma.user.findUnique({
        where: { id: filters.userId },
        select: { organizationId: true },
      })
      if (user?.organizationId) {
        where.organizationId = user.organizationId
      } else {
        // User has no organization, return empty
        return { assets: [], total: 0, page, limit, totalPages: 0 }
      }
    }
  }

  if (filters.organizationId) {
    where.organizationId = filters.organizationId
  }

  if (filters.tenantId) {
    where.tenantId = filters.tenantId
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
        customAssetType: {
          select: {
            id: true,
            name: true,
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
        // CSV import requires customAssetTypeId - skip rows without it
        if (!row.customAssetTypeId && !row['Custom Asset Type ID'] && !row.custom_asset_type_id) {
          throw new Error('Custom Asset Type ID is required. Please ensure your CSV includes a customAssetTypeId column.')
        }

        const customAssetTypeId = row.customAssetTypeId || row['Custom Asset Type ID'] || row.custom_asset_type_id

        // Build custom fields from CSV columns that aren't standard fields
        const standardFields = ['name', 'Name', 'customAssetTypeId', 'Custom Asset Type ID', 'custom_asset_type_id', 'status', 'Status', 'assignedToId', 'Assigned To ID', 'assigned_to_id']
        const customFields: Record<string, any> = {}
        Object.keys(row).forEach(key => {
          if (!standardFields.includes(key)) {
            customFields[key] = row[key]
          }
        })

        const assetData: CreateAssetInput = {
          name: row.name || row.Name || '',
          customAssetTypeId: customAssetTypeId,
          status: (row.status || row.Status || 'ACTIVE') as AssetStatus,
          assignedToId: row.assignedToId || row['Assigned To ID'] || row.assigned_to_id || undefined,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
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

