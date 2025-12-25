/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/config/public/route'
import { NextRequest } from 'next/server'
import { getSystemConfig } from '@/lib/services/config-service'

jest.mock('@/lib/services/config-service', () => ({
  getSystemConfig: jest.fn(),
}))

const mockGetSystemConfig = getSystemConfig as jest.MockedFunction<typeof getSystemConfig>

describe('GET /api/v1/config/public', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return public config', async () => {
    mockGetSystemConfig.mockResolvedValue({
      registrationEnabled: true,
    } as any)

    const request = new NextRequest('http://localhost:3000/api/v1/config/public')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.registrationEnabled).toBe(true)
  })

  it('should default to enabled if config service fails', async () => {
    mockGetSystemConfig.mockRejectedValue(new Error('Config error'))

    const request = new NextRequest('http://localhost:3000/api/v1/config/public')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.registrationEnabled).toBe(true)
  })

  it('should return registration enabled status', async () => {
    mockGetSystemConfig.mockResolvedValue({
      registrationEnabled: false,
    } as any)

    const request = new NextRequest('http://localhost:3000/api/v1/config/public')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.registrationEnabled).toBe(false)
  })
})

