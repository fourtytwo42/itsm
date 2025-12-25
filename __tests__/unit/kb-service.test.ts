import {
  createArticle,
  getArticleById,
  getArticleBySlug,
  listArticles,
  searchArticles,
  updateArticle,
} from '@/lib/services/kb-service'
import { ArticleStatus } from '@prisma/client'

const mockKnowledgeBaseArticle = {
  create: jest.fn(),
  update: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
}

const mockTenantKBArticle = {
  createMany: jest.fn(),
  deleteMany: jest.fn(),
}

const mockUser = {
  findUnique: jest.fn(),
}

const mockPrisma = {
  knowledgeBaseArticle: mockKnowledgeBaseArticle,
  tenantKBArticle: mockTenantKBArticle,
  user: mockUser,
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))

const prisma = mockPrisma as any

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

  describe('createArticle edge cases', () => {
    it('should link article to specific tenants when tenantIds provided', async () => {
      const mockArticle = { id: '1', title: 'A' }
      ;(prisma.knowledgeBaseArticle.create as jest.Mock).mockResolvedValue(mockArticle)
      ;(mockTenantKBArticle.createMany as jest.Mock).mockResolvedValue({ count: 2 })

      await createArticle({
        title: 'A',
        content: 'C',
        slug: 'a',
        tenantIds: ['tenant-1', 'tenant-2'],
      })

      expect(mockTenantKBArticle.createMany).toHaveBeenCalledWith({
        data: [
          { tenantId: 'tenant-1', articleId: '1' },
          { tenantId: 'tenant-2', articleId: '1' },
        ],
        skipDuplicates: true,
      })
    })

    it('should not link to tenants when tenantIds is null (all tenants)', async () => {
      const mockArticle = { id: '1', title: 'A' }
      ;(prisma.knowledgeBaseArticle.create as jest.Mock).mockResolvedValue(mockArticle)

      await createArticle({
        title: 'A',
        content: 'C',
        slug: 'a',
        tenantIds: null,
      })

      expect(mockTenantKBArticle.createMany).not.toHaveBeenCalled()
    })

    it('should not link to tenants when tenantIds is empty array', async () => {
      const mockArticle = { id: '1', title: 'A' }
      ;(prisma.knowledgeBaseArticle.create as jest.Mock).mockResolvedValue(mockArticle)

      await createArticle({
        title: 'A',
        content: 'C',
        slug: 'a',
        tenantIds: [],
      })

      expect(mockTenantKBArticle.createMany).not.toHaveBeenCalled()
    })
  })

  describe('updateArticle edge cases', () => {
    it('should update tenant associations when tenantIds provided', async () => {
      const mockArticle = { id: '1', title: 'Updated' }
      ;(prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue(mockArticle)
      ;(mockTenantKBArticle.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(mockTenantKBArticle.createMany as jest.Mock).mockResolvedValue({ count: 1 })

      await updateArticle('1', { tenantIds: ['tenant-1'] })

      expect(mockTenantKBArticle.deleteMany).toHaveBeenCalledWith({
        where: { articleId: '1' },
      })
      expect(mockTenantKBArticle.createMany).toHaveBeenCalledWith({
        data: [{ tenantId: 'tenant-1', articleId: '1' }],
        skipDuplicates: true,
      })
    })

    it('should remove all tenant associations when tenantIds is null', async () => {
      const mockArticle = { id: '1', title: 'Updated' }
      ;(prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue(mockArticle)
      ;(mockTenantKBArticle.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })

      await updateArticle('1', { tenantIds: null })

      expect(mockTenantKBArticle.deleteMany).toHaveBeenCalledWith({
        where: { articleId: '1' },
      })
      expect(mockTenantKBArticle.createMany).not.toHaveBeenCalled()
    })

    it('should not update tenant associations when tenantIds is undefined', async () => {
      const mockArticle = { id: '1', title: 'Updated' }
      ;(prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue(mockArticle)

      await updateArticle('1', { title: 'Updated' })

      expect(mockTenantKBArticle.deleteMany).not.toHaveBeenCalled()
      expect(mockTenantKBArticle.createMany).not.toHaveBeenCalled()
    })
  })

  describe('listArticles edge cases - organization filtering', () => {
    beforeEach(() => {
      ;(prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue([])
    })

    it('should return empty when user has no organization', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: null })

      const result = await listArticles({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(result).toEqual([])
      expect(prisma.knowledgeBaseArticle.findMany).not.toHaveBeenCalled()
    })

    it('should filter by user organization when not GLOBAL_ADMIN', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ organizationId: 'org-1' })

      await listArticles({ userId: 'user-1', userRoles: ['END_USER'] })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { organizationId: true },
      })
      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should not filter by organization for GLOBAL_ADMIN', async () => {
      await listArticles({ userId: 'admin-1', userRoles: ['GLOBAL_ADMIN'] })

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            organizationId: expect.anything(),
          }),
        })
      )
    })

    it('should handle organizationId filter directly', async () => {
      await listArticles({ organizationId: 'org-1' })

      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
          }),
        })
      )
    })

    it('should filter by tenantId using join table', async () => {
      await listArticles({ tenantId: 'tenant-1' })

      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantKBArticles: {
              some: {
                tenantId: 'tenant-1',
              },
            },
          }),
        })
      )
    })
  })

  describe('searchArticles edge cases', () => {
    it('should filter by tenantId when provided', async () => {
      ;(prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue([])

      await searchArticles('query', 'tenant-1')

      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantKBArticles: {
              some: {
                tenantId: 'tenant-1',
              },
            },
          }),
        })
      )
    })

    it('should not filter by tenant when tenantId not provided', async () => {
      ;(prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue([])

      await searchArticles('query')

      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            tenantKBArticles: expect.anything(),
          }),
        })
      )
    })
  })
})

