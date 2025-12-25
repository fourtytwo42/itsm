/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/assets/import/route'
import { NextRequest } from 'next/server'
import { importAssetsFromCSV } from '@/lib/services/asset-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/asset-service', () => ({
  importAssetsFromCSV: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

const mockImportAssetsFromCSV = importAssetsFromCSV as jest.MockedFunction<typeof importAssetsFromCSV>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/assets/import', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should import assets from CSV', async () => {
    const mockResult = {
      imported: 5,
      errors: [],
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
      },
    })
    mockImportAssetsFromCSV.mockResolvedValue(mockResult)

    const formData = new FormData()
    const blob = new Blob(['name,customAssetTypeId\nLaptop,type-1'], { type: 'text/csv' })
    const file = new File([blob], 'assets.csv', { type: 'text/csv' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/v1/assets/import', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockResult)
  })

  it('should return 403 for non-agent roles', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const formData = new FormData()
    const blob = new Blob(['name,customAssetTypeId\nLaptop,type-1'], { type: 'text/csv' })
    const file = new File([blob], 'assets.csv', { type: 'text/csv' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/v1/assets/import', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })

  it('should return 400 if no file provided', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'agent@example.com',
        roles: ['AGENT'],
      },
    })

    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/v1/assets/import', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

