/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/organizations/upload-logo/route'
import { NextRequest } from 'next/server'
import { updateOrganization } from '@/lib/services/organization-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/organization-service', () => ({
  updateOrganization: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireAnyRole: jest.fn(),
}))

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}))

const mockUpdateOrganization = updateOrganization as jest.MockedFunction<typeof updateOrganization>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/organizations/upload-logo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should upload organization logo', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })
    mockUpdateOrganization.mockResolvedValue({
      id: 'org-1',
      logo: '/uploads/organization-logos/org-1-1234567890.png',
    } as any)

    const formData = new FormData()
    const blob = new Blob(['fake image data'], { type: 'image/png' })
    const file = new File([blob], 'logo.png', { type: 'image/png' })
    formData.append('file', file)
    formData.append('organizationId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.logoUrl).toBeDefined()
  })

  it('should return 400 if no file provided', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })

    const formData = new FormData()
    formData.append('organizationId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })

  it('should return 400 for invalid file type', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        organizationId: 'org-1',
        isGlobalAdmin: false,
      },
    })

    const formData = new FormData()
    const blob = new Blob(['fake file data'], { type: 'application/pdf' })
    const file = new File([blob], 'document.pdf', { type: 'application/pdf' })
    formData.append('file', file)
    formData.append('organizationId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/v1/organizations/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid file type')
  })
})

