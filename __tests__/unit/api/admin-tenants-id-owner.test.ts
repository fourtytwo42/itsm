/**
 * @jest-environment node
 */
import { PUT } from '@/app/api/v1/admin/tenants/[id]/owner/route'
import { NextRequest } from 'next/server'
import { updateTenant } from '@/lib/services/tenant-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/tenant-service', () => ({
  updateTenant: jest.fn(),
}))

const mockRequireRole = jest.fn()
jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: (...args: any[]) => mockRequireRole(...args),
}))

const mockUpdateTenant = updateTenant as jest.MockedFunction<typeof updateTenant>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('PUT /api/v1/admin/tenants/:id/owner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireRole.mockImplementation(() => {}) // Default: allow
  })

  const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update tenant owner', async () => {
    const mockTenant = {
      id: validTenantId,
      name: 'Test Tenant',
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockUpdateTenant.mockResolvedValue(mockTenant as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/admin/tenants/${validTenantId}/owner`, {
      method: 'PUT',
      body: JSON.stringify({
        managerId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format required
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validTenantId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.tenant).toEqual(mockTenant)
  })
})

