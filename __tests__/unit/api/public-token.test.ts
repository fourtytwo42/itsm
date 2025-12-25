/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/public/token/route'
import { NextRequest } from 'next/server'
import { signPublicToken } from '@/lib/jwt'

jest.mock('@/lib/jwt', () => ({
  signPublicToken: jest.fn(),
}))

const mockSignPublicToken = signPublicToken as jest.MockedFunction<typeof signPublicToken>

describe('POST /api/v1/public/token', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate public token', async () => {
    mockSignPublicToken.mockReturnValue('mock-public-token')

    const request = new NextRequest('http://localhost:3000/api/v1/public/token', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.token).toBe('mock-public-token')
    expect(data.data.publicId).toBeDefined()
    expect(mockSignPublicToken).toHaveBeenCalled()
  })

  it('should generate token without tenantId', async () => {
    mockSignPublicToken.mockReturnValue('mock-public-token')

    const request = new NextRequest('http://localhost:3000/api/v1/public/token', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.token).toBeDefined()
    expect(data.data.publicId).toBeDefined()
  })

  it('should handle errors gracefully', async () => {
    mockSignPublicToken.mockImplementation(() => {
      throw new Error('Token generation failed')
    })

    const request = new NextRequest('http://localhost:3000/api/v1/public/token', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})

