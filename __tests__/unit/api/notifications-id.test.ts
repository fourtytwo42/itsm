/**
 * @jest-environment node
 */
import { PUT, DELETE } from '@/app/api/v1/notifications/[id]/route'
import { NextRequest } from 'next/server'
import { markAsRead, deleteNotification } from '@/lib/services/notification-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/notification-service', () => ({
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockMarkAsRead = markAsRead as jest.MockedFunction<typeof markAsRead>
const mockDeleteNotification = deleteNotification as jest.MockedFunction<typeof deleteNotification>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('PUT /api/v1/notifications/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validNotificationId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should mark notification as read', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockMarkAsRead.mockResolvedValue(true)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        action: 'read',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockMarkAsRead).toHaveBeenCalledWith(validNotificationId, validUserId)
  })

  it('should return 404 if notification not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockMarkAsRead.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        action: 'read',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })

  it('should return 400 for invalid action', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        action: 'invalid-action',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 401 if not authenticated', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        action: 'read',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

describe('DELETE /api/v1/notifications/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validNotificationId = '550e8400-e29b-41d4-a716-446655440000'
  const validUserId = '660e8400-e29b-41d4-a716-446655440000'

  it('should delete notification', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockDeleteNotification.mockResolvedValue(true)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteNotification).toHaveBeenCalledWith(validNotificationId, validUserId)
  })

  it('should return 404 if notification not found', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: validUserId,
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockDeleteNotification.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })

  it('should return 401 if not authenticated', async () => {
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/notifications/${validNotificationId}`, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: validNotificationId }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

