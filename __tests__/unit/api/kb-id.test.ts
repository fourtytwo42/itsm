/**
 * @jest-environment node
 */
import { GET, PATCH } from '@/app/api/v1/kb/[id]/route'
import { NextRequest } from 'next/server'
import { getArticleById, updateArticle } from '@/lib/services/kb-service'
import { getAuthContext } from '@/lib/middleware/auth'
import { ArticleStatus } from '@prisma/client'

jest.mock('@/lib/services/kb-service', () => ({
  getArticleById: jest.fn(),
  updateArticle: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/middleware/audit', () => ({
  auditLog: jest.fn(),
}))

const mockGetArticleById = getArticleById as jest.MockedFunction<typeof getArticleById>
const mockUpdateArticle = updateArticle as jest.MockedFunction<typeof updateArticle>
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('GET /api/v1/kb/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validArticleId = '550e8400-e29b-41d4-a716-446655440000'

  it('should return article by id', async () => {
    const mockArticle = {
      id: validArticleId,
      title: 'Test Article',
      slug: 'test-article',
      content: 'Article content',
      status: ArticleStatus.PUBLISHED,
    }

    mockGetArticleById.mockResolvedValue(mockArticle as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/kb/${validArticleId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validArticleId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticle)
  })

  it('should return 404 if article not found', async () => {
    mockGetArticleById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/v1/kb/${validArticleId}`)
    const response = await GET(request, { params: Promise.resolve({ id: validArticleId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /api/v1/kb/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validArticleId = '550e8400-e29b-41d4-a716-446655440000'

  it('should update article', async () => {
    const mockArticle = {
      id: validArticleId,
      title: 'Updated Article',
      slug: 'updated-article',
      status: ArticleStatus.PUBLISHED,
    }

    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['AGENT'],
      },
    })
    mockGetArticleById.mockResolvedValue({
      id: validArticleId,
      title: 'Old Title',
    } as any)
    mockUpdateArticle.mockResolvedValue(mockArticle as any)

    const request = new NextRequest(`http://localhost:3000/api/v1/kb/${validArticleId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Article',
        status: ArticleStatus.PUBLISHED,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: validArticleId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockArticle)
  })

  it('should return 403 if user lacks permissions', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['END_USER'], // Not allowed to update
      },
    })

    const request = new NextRequest(`http://localhost:3000/api/v1/kb/${validArticleId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Article',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: validArticleId }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FORBIDDEN')
  })
})

