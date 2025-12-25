/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '@/app/api/v1/admin/tenants/[id]/custom-fields/route'
import { NextRequest } from 'next/server'
import { getTenantById, createCustomField, updateCustomField, deleteCustomField } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { CustomFieldType } from '@prisma/client'

jest.mock('@/lib/services/tenant-service', () => ({
  getTenantById: jest.fn(),
  createCustomField: jest.fn(),
  updateCustomField: jest.fn(),
  deleteCustomField: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockGetTenantById = getTenantById as jest.MockedFunction<typeof getTenantById>
const mockCreateCustomField = createCustomField as jest.MockedFunction<typeof createCustomField>
const mockUpdateCustomField = updateCustomField as jest.MockedFunction<typeof updateCustomField>
const mockDeleteCustomField = deleteCustomField as jest.MockedFunction<typeof deleteCustomField>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/tenants/:id/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return tenant custom fields', async () => {
    const mockFields = [
      {
        id: 'field-1',
        label: 'Department',
        fieldType: CustomFieldType.TEXT,
        tenantId: validTenantId,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTenantById.mockResolvedValue({
      id: validTenantId,
      customFields: mockFields,
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/custom-fields`)
    const response = await GET(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockFields)
  })
})

describe('POST /api/v1/admin/tenants/:id/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should create custom field', async () => {
    const mockField = {
      id: 'field-1',
      label: 'Department',
      fieldType: CustomFieldType.TEXT,
      tenantId: validTenantId,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCreateCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/custom-fields`, {
      method: 'POST',
      body: JSON.stringify({
        label: 'Department',
        fieldType: CustomFieldType.TEXT,
        required: false,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockField)
  })
})

describe('PUT /api/v1/admin/tenants/:id/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const validFieldId = '660e8400-e29b-41d4-a716-446655440000'

  it('should update custom field', async () => {
    const mockField = {
      id: validFieldId,
      label: 'Updated Department',
      fieldType: CustomFieldType.TEXT,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockUpdateCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/custom-fields`, {
      method: 'PUT',
      body: JSON.stringify({
        fieldId: validFieldId,
        label: 'Updated Department',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockField)
  })
})

describe('DELETE /api/v1/admin/tenants/:id/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
  const validFieldId = '660e8400-e29b-41d4-a716-446655440000'

  it('should delete custom field', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockDeleteCustomField.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/custom-fields?fieldId=${validFieldId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

