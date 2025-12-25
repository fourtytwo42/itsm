/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/notifications/preferences/route'
import { NextRequest } from 'next/server'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/services/notification-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/notification-service', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockGetNotificationPreferences = getNotificationPreferences as jest.MockedFunction<typeof getNotificationPreferences>
const mockUpdateNotificationPreferences = updateNotificationPreferences as jest.MockedFunction<typeof updateNotificationPreferences>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/notifications/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return notification preferences', async () => {
    const mockPreferences = {
      id: 'pref-1',
      userId: 'user-1',
      emailEnabled: true,
      pushEnabled: true,
      ticketCreated: true,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetNotificationPreferences.mockResolvedValue(mockPreferences as any)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications/preferences')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.preferences).toEqual(mockPreferences)
  })

  it('should return 401 if not authenticated', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications/preferences')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

describe('PUT /api/v1/notifications/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update notification preferences', async () => {
    const mockPreferences = {
      id: 'pref-1',
      userId: 'user-1',
      emailEnabled: false,
      pushEnabled: true,
      ticketCreated: true,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockUpdateNotificationPreferences.mockResolvedValue(mockPreferences as any)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        emailEnabled: false,
        pushEnabled: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.preferences).toEqual(mockPreferences)
  })

  it('should return 401 if not authenticated', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        emailEnabled: false,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

