import {
  createArticle,
  getArticleById,
  getArticleBySlug,
  listArticles,
  searchArticles,
  updateArticle,
} from '@/lib/services/kb-service'
import { prisma } from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    knowledgeBaseArticle: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('KB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('createArticle should create with defaults', async () => {
    const mock = { id: '1', title: 'A' }
    ;(prisma.knowledgeBaseArticle.create as jest.Mock).mockResolvedValue(mock)

    const result = await createArticle({ title: 'A', content: 'C', slug: 'a' })
    expect(prisma.knowledgeBaseArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'A',
          content: 'C',
          slug: 'a',
          status: ArticleStatus.PUBLISHED,
        }),
      })
    )
    expect(result).toEqual(mock)
  })

  it('updateArticle should update fields', async () => {
    const mock = { id: '1', title: 'Updated' }
    ;(prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue(mock)

    const result = await updateArticle('1', { title: 'Updated' })
    expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ title: 'Updated' }),
      })
    )
    expect(result).toEqual(mock)
  })

  it('getArticleById should fetch by id', async () => {
    const mock = { id: '1' }
    ;(prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mock)
    const result = await getArticleById('1')
    expect(prisma.knowledgeBaseArticle.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
    expect(result).toEqual(mock)
  })

  it('getArticleBySlug should fetch by slug', async () => {
    const mock = { slug: 'a' }
    ;(prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mock)
    const result = await getArticleBySlug('a')
    expect(prisma.knowledgeBaseArticle.findUnique).toHaveBeenCalledWith({ where: { slug: 'a' } })
    expect(result).toEqual(mock)
  })

  it('listArticles should pass filters', async () => {
    const mock = [{ id: '1' }]
    ;(prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue(mock)
    const result = await listArticles({ status: ArticleStatus.PUBLISHED, tag: 'vpn' })
    expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ArticleStatus.PUBLISHED,
          tags: { has: 'vpn' },
        }),
      })
    )
    expect(result).toEqual(mock)
  })

  it('searchArticles should search title/content/tags', async () => {
    const mock = [{ id: '1' }]
    ;(prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue(mock)
    const result = await searchArticles('vpn')
    expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          status: ArticleStatus.PUBLISHED,
        }),
      })
    )
    expect(result).toEqual(mock)
  })

  it('searchArticles should return empty for blank query', async () => {
    const result = await searchArticles('   ')
    expect(result).toEqual([])
  })
})

