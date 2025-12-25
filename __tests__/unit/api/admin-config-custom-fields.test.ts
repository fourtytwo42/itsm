/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '@/app/api/v1/admin/config/custom-fields/route'
import { NextRequest } from 'next/server'
import { getCustomFields, createCustomField, updateCustomField, deleteCustomField } from '@/lib/services/config-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/config-service', () => ({
  getCustomFields: jest.fn(),
  createCustomField: jest.fn(),
  updateCustomField: jest.fn(),
  deleteCustomField: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockGetCustomFields = getCustomFields as jest.MockedFunction<typeof getCustomFields>
const mockCreateCustomField = createCustomField as jest.MockedFunction<typeof createCustomField>
const mockUpdateCustomField = updateCustomField as jest.MockedFunction<typeof updateCustomField>
const mockDeleteCustomField = deleteCustomField as jest.MockedFunction<typeof deleteCustomField>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/config/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return custom fields for admin', async () => {
    const mockFields = [
      {
        id: 'field-1',
        name: 'Custom Field',
        type: 'TEXT',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetCustomFields.mockResolvedValue(mockFields as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/custom-fields')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.fields).toEqual(mockFields)
  })

  it('should filter by entityType', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetCustomFields.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/custom-fields?entityType=asset')
    await GET(request)

    expect(mockGetCustomFields).toHaveBeenCalledWith('asset', false)
  })
})

describe('POST /api/v1/admin/config/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create custom field', async () => {
    const mockField = {
      id: 'field-1',
      name: 'New Field',
      type: 'TEXT',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCreateCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/custom-fields', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Field',
        type: 'TEXT',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.field).toEqual(mockField)
  })
})

describe('PUT /api/v1/admin/config/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update custom field', async () => {
    const mockField = {
      id: 'field-1',
      name: 'Updated Field',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockUpdateCustomField.mockResolvedValue(mockField as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/custom-fields', {
      method: 'PUT',
      body: JSON.stringify({
        id: 'field-1',
        name: 'Updated Field',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.field).toEqual(mockField)
  })
})

describe('DELETE /api/v1/admin/config/custom-fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete custom field', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockDeleteCustomField.mockResolvedValue()

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/custom-fields?id=field-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteCustomField).toHaveBeenCalledWith('field-1')
  })
})

