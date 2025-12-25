/**
 * @jest-environment node
 */
import { PUT, DELETE } from '@/app/api/v1/admin/asset-types/[id]/fields/[fieldId]/route'
import { NextRequest } from 'next/server'
import { getCustomAssetTypeById, getAssetTypeCustomFieldById, updateAssetTypeCustomField, deleteAssetTypeCustomField } from '@/lib/services/asset-type-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/asset-type-service', () => ({
  getCustomAssetTypeById: jest.fn(),
  getAssetTypeCustomFieldById: jest.fn(),
  updateAssetTypeCustomField: jest.fn(),
  deleteAssetTypeCustomField: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetCustomAssetTypeById = getCustomAssetTypeById as jest.MockedFunction<typeof getCustomAssetTypeById>
const mockGetAssetTypeCustomFieldById = getAssetTypeCustomFieldById as jest.MockedFunction<typeof getAssetTypeCustomFieldById>
const mockUpdateAssetTypeCustomField = updateAssetTypeCustomField as jest.MockedFunction<typeof updateAssetTypeCustomField>
const mockDeleteAssetTypeCustomField = deleteAssetTypeCustomField as jest.MockedFunction<typeof deleteAssetTypeCustomField>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('PUT /api/v1/admin/asset-types/:id/fields/:fieldId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetTypeId = '550e8400-e29b-41d4-a716-446655440000'
  const validFieldId = '660e8400-e29b-41d4-a716-446655440000'

  it('should update custom field', async () => {
    const mockField = {
      id: validFieldId,
      label: 'Updated Serial Number',
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
    mockGetAssetTypeCustomFieldById
      .mockResolvedValueOnce({
        id: validFieldId,
        label: 'Serial Number',
      } as any)
      .mockResolvedValueOnce(mockField as any)
    mockUpdateAssetTypeCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields/${validFieldId}`, {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Updated Serial Number',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validAssetTypeId, fieldId: validFieldId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.field).toEqual(mockField)
  })

  it('should return 404 if field not found', async () => {
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
    mockGetAssetTypeCustomFieldById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields/${validFieldId}`, {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Updated Serial Number',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validAssetTypeId, fieldId: validFieldId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v1/admin/asset-types/:id/fields/:fieldId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validAssetTypeId = '550e8400-e29b-41d4-a716-446655440000'
  const validFieldId = '660e8400-e29b-41d4-a716-446655440000'

  it('should delete custom field', async () => {
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
    mockGetAssetTypeCustomFieldById.mockResolvedValue({
      id: validFieldId,
      label: 'Serial Number',
    } as any)
    mockDeleteAssetTypeCustomField.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/asset-types/${validAssetTypeId}/fields/${validFieldId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validAssetTypeId, fieldId: validFieldId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

