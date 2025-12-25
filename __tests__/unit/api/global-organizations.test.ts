/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/global/organizations/route'
import { NextRequest } from 'next/server'
import { listOrganizations, createOrganization } from '@/lib/services/organization-service'
import { getAuthContext, requireAuth, requireRole } from '@/lib/middleware/auth'

jest.mock('@/lib/services/organization-service', () => ({
  listOrganizations: jest.fn(),
  createOrganization: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockListOrganizations = listOrganizations as jest.MockedFunction<typeof listOrganizations>
const mockCreateOrganization = createOrganization as jest.MockedFunction<typeof createOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>

describe('GET /api/v1/global/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockImplementation(() => {}) // Default: allow
    mockRequireRole.mockImplementation(() => {}) // Default: allow
  })

  it('should return organizations for global admin', async () => {
    const mockOrganizations = [
      {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockListOrganizations.mockResolvedValue(mockOrganizations as any)

    const request = new NextRequest('http://localhost:3000/api/v1/global/organizations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('POST /api/v1/global/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockImplementation(() => {}) // Default: allow
    mockRequireRole.mockImplementation(() => {}) // Default: allow
  })

  it('should create organization', async () => {
    const mockOrganization = {
      id: 'org-1',
      name: 'New Organization',
      slug: 'new-org',
    }
    const mockOrgAdmin = {
      email: 'admin@neworg.com',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['GLOBAL_ADMIN'],
        isGlobalAdmin: true,
      },
    })
    mockCreateOrganization.mockResolvedValue({
      organization: mockOrganization,
      orgAdmin: mockOrgAdmin,
      defaultPassword: 'temp-password',
    } as any)

    const request = new NextRequest('http://localhost:3000/api/v1/global/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Organization',
        slug: 'new-org',
        adminEmail: 'admin@neworg.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization).toEqual(mockOrganization)
    expect(data.orgAdmin).toBeDefined()
    expect(data.orgAdmin.defaultPassword).toBeDefined()
  })
})
