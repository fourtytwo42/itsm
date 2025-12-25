/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/kb/search/route'
import { NextRequest } from 'next/server'
import { searchArticles } from '@/lib/services/kb-service'

jest.mock('@/lib/services/kb-service', () => ({
  searchArticles: jest.fn(),
}))

const mockSearchArticles = searchArticles as jest.MockedFunction<typeof searchArticles>

describe('POST /api/v1/kb/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should search articles', async () => {
    const mockResults = [
      {
        id: 'article-1',
        title: 'Test Article',
        slug: 'test-article',
        content: 'Article content about test',
      },
    ]

    mockSearchArticles.mockResolvedValue(mockResults as any)

    const request = new NextRequest('http://localhost:3000/api/v1/kb/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockResults)
    expect(mockSearchArticles).toHaveBeenCalledWith('test')
  })

  it('should return validation error for empty query', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/kb/search', {
      method: 'POST',
      body: JSON.stringify({
        query: '',
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

  it('should return validation error for missing query', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/kb/search', {
      method: 'POST',
      body: JSON.stringify({}),
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
})

