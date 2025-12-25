/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/admin/config/route'
import { NextRequest } from 'next/server'
import { getSystemConfig, setSystemConfig, getAllSettings, getSettingsByCategory } from '@/lib/services/config-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { SettingCategory } from '@prisma/client'

jest.mock('@/lib/services/config-service', () => ({
  getSystemConfig: jest.fn(),
  setSystemConfig: jest.fn(),
  getAllSettings: jest.fn(),
  getSettingsByCategory: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockGetSystemConfig = getSystemConfig as jest.MockedFunction<typeof getSystemConfig>
const mockSetSystemConfig = setSystemConfig as jest.MockedFunction<typeof setSystemConfig>
const mockGetAllSettings = getAllSettings as jest.MockedFunction<typeof getAllSettings>
const mockGetSettingsByCategory = getSettingsByCategory as jest.MockedFunction<typeof getSettingsByCategory>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/admin/config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return config and settings for admin', async () => {
    const mockConfig = { registrationEnabled: true }
    const mockSettings = [{ key: 'setting1', value: 'value1' }]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetSystemConfig.mockResolvedValue(mockConfig as any)
    mockGetAllSettings.mockResolvedValue(mockSettings as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.config).toEqual(mockConfig)
    expect(data.data.settings).toEqual(mockSettings)
  })

  it('should filter settings by category', async () => {
    const mockSettings = [{ key: 'setting1', value: 'value1' }]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockGetSettingsByCategory.mockResolvedValue(mockSettings as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config?category=SYSTEM')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockGetSettingsByCategory).toHaveBeenCalledWith(SettingCategory.SYSTEM)
  })

  it('should return 403 for non-admin users', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })
})

describe('PUT /api/v1/admin/config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update config for admin', async () => {
    const mockUpdatedConfig = { registrationEnabled: false }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })
    mockSetSystemConfig.mockResolvedValue()
    mockGetSystemConfig.mockResolvedValue(mockUpdatedConfig as any)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config', {
      method: 'PUT',
      body: JSON.stringify({
        config: { registrationEnabled: false },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.config).toEqual(mockUpdatedConfig)
  })

  it('should return 400 for invalid config format', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/admin/config', {
      method: 'PUT',
      body: JSON.stringify({
        config: 'invalid',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

