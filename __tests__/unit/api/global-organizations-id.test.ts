/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/v1/global/organizations/[id]/route'
import { NextRequest } from 'next/server'
import { getOrganizationById, updateOrganization, deleteOrganization } from '@/lib/services/organization-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/organization-service', () => ({
  getOrganizationById: jest.fn(),
  updateOrganization: jest.fn(),
  deleteOrganization: jest.fn(),
}))

const mockRequireAnyRole = jest.fn()
jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireAnyRole: (...args: any[]) => mockRequireAnyRole(...args),
}))

const mockGetOrganizationById = getOrganizationById as jest.MockedFunction<typeof getOrganizationById>
const mockUpdateOrganization = updateOrganization as jest.MockedFunction<typeof updateOrganization>
const mockDeleteOrganization = deleteOrganization as jest.MockedFunction<typeof deleteOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/global/organizations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockImplementation(() => {}) // Default: allow
  })

  const validOrgId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return organization for global admin', async () => {
    const mockOrganization = {
      id: validOrgId,
      name: 'Test Organization',
      slug: 'test-org',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockGetOrganizationById.mockResolvedValue(mockOrganization as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/global/organizations/${validOrgId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validOrgId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockOrganization)
  })

  it('should return 404 if organization not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockGetOrganizationById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/global/organizations/${validOrgId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validOrgId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Organization not found')
  })
})

describe('PUT /api/v1/global/organizations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockImplementation(() => {}) // Default: allow
  })

  const validOrgId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update organization', async () => {
    const mockOrganization = {
      id: validOrgId,
      name: 'Updated Organization',
      slug: 'updated-org',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockUpdateOrganization.mockResolvedValue(mockOrganization as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/global/organizations/${validOrgId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Organization',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validOrgId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockOrganization)
  })
})

describe('DELETE /api/v1/global/organizations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockImplementation(() => {}) // Default: allow
  })

  const validOrgId = '550e8400-e29b-41d4-a716-446655440000'

  it('should delete organization', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockGetOrganizationById.mockResolvedValue({
      id: validOrgId,
      name: 'Test Organization',
    } as any)
    mockDeleteOrganization.mockResolvedValue()

    const request = new NextRequest(`http://localhost:3000/api/v1/global/organizations/${validOrgId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validOrgId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

