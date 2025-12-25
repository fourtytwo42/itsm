/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/organizations/me/route'
import { NextRequest } from 'next/server'
import { getOrganizationById, updateOrganization } from '@/lib/services/organization-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/organization-service', () => ({
  getOrganizationById: jest.fn(),
  updateOrganization: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireAnyRole: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetOrganizationById = getOrganizationById as jest.MockedFunction<typeof getOrganizationById>
const mockUpdateOrganization = updateOrganization as jest.MockedFunction<typeof updateOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/organizations/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user organization', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'Test Organization',
      slug: 'test-org',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockGetOrganizationById.mockResolvedValue(mockOrg as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization).toEqual(mockOrg)
  })

  it('should return null if user has no organization', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
        organizationId: undefined,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/me')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization).toBeNull()
  })
})

describe('PUT /api/v1/organizations/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update organization', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'Updated Organization',
      description: 'Updated description',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
      },
    })
    mockUpdateOrganization.mockResolvedValue(mockOrg as any)

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Organization',
        description: 'Updated description',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization).toEqual(mockOrg)
  })

  it('should return 400 if user has no organization', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['ADMIN'],
        organizationId: undefined,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Organization',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

