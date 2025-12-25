/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/ai/chat/route'
import { NextRequest } from 'next/server'
import { chatWithTools } from '@/lib/services/ai-service'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/services/ai-service', () => ({
  chatWithTools: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
}))

const mockChatWithTools = chatWithTools as jest.MockedFunction<typeof chatWithTools>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/ai/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle chat request', async () => {
    const mockResponse = {
      message: {
        role: 'assistant' as const,
        content: 'Hello! How can I help you?',
      },
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })
    mockChatWithTools.mockResolvedValue(mockResponse as any)

    const request = new NextRequest('http://localhost:3000/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockResponse)
    expect(mockChatWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello' }],
        requesterId: 'user-1',
      })
    )
  })

  it('should return validation error for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'invalid-role', // Invalid role
            content: 'Hello',
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should work without authentication', async () => {
    const mockResponse = {
      message: {
        role: 'assistant' as const,
        content: 'Hello!',
      },
    }

    mockGetAuthContext.mockResolvedValue(null)
    mockChatWithTools.mockResolvedValue(mockResponse as any)

    const request = new NextRequest('http://localhost:3000/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

