/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/v1/kb/route'
import { NextRequest } from 'next/server'
import { listArticles, createArticle } from '@/lib/services/kb-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { ArticleStatus } from '@prisma/client'

jest.mock('@/lib/services/kb-service', () => ({
  listArticles: jest.fn(),
  createArticle: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockListArticles = listArticles as jest.MockedFunction<typeof listArticles>
const mockCreateArticle = createArticle as jest.MockedFunction<typeof createArticle>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/kb', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should list articles', async () => {
    const mockArticles = [
      {
        id: 'article-1',
        title: 'Test Article',
        slug: 'test-article',
        status: ArticleStatus.PUBLISHED,
      },
    ]

    mockListArticles.mockResolvedValue(mockArticles as any)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/kb')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticles)
  })

  it('should filter articles by status', async () => {
    mockListArticles.mockResolvedValue([])
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/kb?status=PUBLISHED')
    await GET(request)

    expect(mockListArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ArticleStatus.PUBLISHED,
      })
    )
  })

  it('should work without authentication', async () => {
    mockListArticles.mockResolvedValue([])
    mockGetAuthContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/v1/kb')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

describe('POST /api/v1/kb', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create article', async () => {
    const mockArticle = {
      id: 'article-1',
      title: 'New Article',
      slug: 'new-article',
      status: ArticleStatus.DRAFT,
    }

    mockCreateArticle.mockResolvedValue(mockArticle as any)
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/kb', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Article',
        content: 'Article content',
        slug: 'new-article',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticle)
  })

  it('should return validation error for invalid input', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/kb', {
      method: 'POST',
      body: JSON.stringify({
        title: 'AB', // Too short
        content: 'Test',
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

  describe('error handling', () => {
    it('should return 500 on internal server error in GET', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['AGENT'],
        },
      })
      mockListArticles.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/kb')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 500 on internal server error in POST', async () => {
      mockGetAuthContext.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles: ['ADMIN'],
        },
      })
      mockCreateArticle.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/kb', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Article',
          content: 'Test content',
          slug: 'test-article',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

