/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/v1/notifications/route'
import { NextRequest } from 'next/server'
import { getNotifications, getUnreadCount, markAllAsRead } from '@/lib/services/notification-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/notification-service', () => ({
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAllAsRead: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockGetNotifications = getNotifications as jest.MockedFunction<typeof getNotifications>
const mockGetUnreadCount = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>
const mockMarkAllAsRead = markAllAsRead as jest.MockedFunction<typeof markAllAsRead>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return notifications and unread count', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'TICKET_CREATED',
        message: 'New ticket created',
      },
    ]

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetNotifications.mockResolvedValue(mockNotifications as any)
    mockGetUnreadCount.mockResolvedValue(5)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.notifications).toEqual(mockNotifications)
    expect(data.data.unreadCount).toBe(5)
  })

  it('should filter unread only', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockGetNotifications.mockResolvedValue([])
    mockGetUnreadCount.mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications?unreadOnly=true')
    await GET(request)

    expect(mockGetNotifications).toHaveBeenCalledWith('user-1', {
      limit: 50,
      unreadOnly: true,
    })
  })

  it('should return 401 if not authenticated', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/notifications')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

describe('PUT /api/v1/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should mark all as read', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockMarkAllAsRead.mockResolvedValue()

    const request = new NextRequest('http://localhost:3000/api/v1/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'markAllAsRead',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockMarkAllAsRead).toHaveBeenCalledWith('user-1')
  })

  it('should return 400 for invalid action', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'invalid-action',
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

  describe('error handling', () => {
    it('should return 500 on internal server error in GET', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['AGENT'],
        },
      })
      mockGetNotifications.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOTIFICATIONS_ERROR')
    })
  })
})

