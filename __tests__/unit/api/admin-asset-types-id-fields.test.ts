/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/admin/asset-types/[id]/fields/route'
import { NextRequest } from 'next/server'
import { getCustomAssetTypeById, listAssetTypeCustomFields, createAssetTypeCustomField } from '@/lib/services/asset-type-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/asset-type-service', () => ({
  getCustomAssetTypeById: jest.fn(),
  listAssetTypeCustomFields: jest.fn(),
  createAssetTypeCustomField: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetCustomAssetTypeById = getCustomAssetTypeById as jest.MockedFunction<typeof getCustomAssetTypeById>
const mockListAssetTypeCustomFields = listAssetTypeCustomFields as jest.MockedFunction<typeof listAssetTypeCustomFields>
const mockCreateAssetTypeCustomField = createAssetTypeCustomField as jest.MockedFunction<typeof createAssetTypeCustomField>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/asset-types/:id/fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetTypeId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return custom fields for asset type', async () => {
    const mockFields = [
      {
        id: 'field-1',
        fieldName: 'serialNumber',
        label: 'Serial Number',
        fieldType: 'text',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue({
      id: validAssetTypeId,
      name: 'Laptop',
    } as any)
    mockListAssetTypeCustomFields.mockResolvedValue(mockFields as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.fields)).toBe(true)
  })

  it('should return 404 if asset type not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields`)
    const response = await GET(request, { params: Promise.resolve({ id: validAssetTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v1/admin/asset-types/:id/fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetTypeId = '550e8400-e29b-41d4-a716-446655440000'

  it('should create custom field', async () => {
    const mockField = {
      id: 'field-1',
      fieldName: 'serialNumber',
      label: 'Serial Number',
      fieldType: 'text',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue({
      id: validAssetTypeId,
      name: 'Laptop',
    } as any)
    mockCreateAssetTypeCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields`, {
      method: 'POST',
      body: JSON.stringify({
        fieldName: 'serialNumber',
        label: 'Serial Number',
        fieldType: 'text',
        required: false,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validAssetTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.field).toEqual(mockField)
  })

  it('should return 400 for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetCustomAssetTypeById.mockResolvedValue({
      id: validAssetTypeId,
      name: 'Laptop',
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields`, {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validAssetTypeId }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

