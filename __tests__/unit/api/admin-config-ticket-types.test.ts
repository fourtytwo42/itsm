/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '@/app/api/v1/admin/config/ticket-types/route'
import { NextRequest } from 'next/server'
import { getTicketTypes, createTicketType, updateTicketType, deleteTicketType } from '@/lib/services/config-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/config-service', () => ({
  getTicketTypes: jest.fn(),
  createTicketType: jest.fn(),
  updateTicketType: jest.fn(),
  deleteTicketType: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockGetTicketTypes = getTicketTypes as jest.MockedFunction<typeof getTicketTypes>
const mockCreateTicketType = createTicketType as jest.MockedFunction<typeof createTicketType>
const mockUpdateTicketType = updateTicketType as jest.MockedFunction<typeof updateTicketType>
const mockDeleteTicketType = deleteTicketType as jest.MockedFunction<typeof deleteTicketType>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/config/ticket-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return ticket types for admin', async () => {
    const mockTypes = [
      {
        id: 'type-1',
        name: 'Bug Report',
        isActive: true,
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetTicketTypes.mockResolvedValue(mockTypes as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/ticket-types')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.types).toEqual(mockTypes)
  })
})

describe('POST /api/v1/admin/config/ticket-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create ticket type', async () => {
    const mockType = {
      id: 'type-1',
      name: 'New Type',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockCreateTicketType.mockResolvedValue(mockType as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/ticket-types', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Type',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.type).toEqual(mockType)
  })
})

describe('PUT /api/v1/admin/config/ticket-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update ticket type', async () => {
    const mockType = {
      id: 'type-1',
      name: 'Updated Type',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockUpdateTicketType.mockResolvedValue(mockType as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/ticket-types', {
      method: 'PUT',
      body: JSON.stringify({
        id: 'type-1',
        name: 'Updated Type',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.type).toEqual(mockType)
  })
})

describe('DELETE /api/v1/admin/config/ticket-types', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete ticket type', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockDeleteTicketType.mockResolvedValue()

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config/ticket-types?id=type-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

