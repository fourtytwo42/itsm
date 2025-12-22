import prisma from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export interface CreateArticleInput {
  title: string
  content: string
  tags?: string[]
  status?: ArticleStatus
  slug: string
  organizationId?: string | null // Article belongs to an organization
  tenantIds?: string[] | null // Array of tenant IDs, or null for "all tenants"
}

export interface UpdateArticleInput {
  title?: string
  content?: string
  tags?: string[]
  status?: ArticleStatus
  tenantIds?: string[] | null // Array of tenant IDs, or null for "all tenants"
}

export async function createArticle(input: CreateArticleInput) {
  // Create the article
  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      title: input.title,
      content: input.content,
      slug: input.slug,
      tags: input.tags ?? [],
      status: input.status ?? ArticleStatus.PUBLISHED,
      organizationId: input.organizationId || null,
    },
  })

  // If tenantIds is provided (not null), link the article to those tenants
  // If tenantIds is null, the article is available to all tenants in the organization
  if (input.tenantIds !== null && input.tenantIds && input.tenantIds.length > 0) {
    await prisma.tenantKBArticle.createMany({
      data: input.tenantIds.map((tenantId) => ({
        tenantId,
        articleId: article.id,
      })),
      skipDuplicates: true,
    })
  }

  return article
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  // Update the article
  const article = await prisma.knowledgeBaseArticle.update({
    where: { id },
    data: {
      title: input.title,
      content: input.content,
      tags: input.tags,
      status: input.status,
    },
  })

  // If tenantIds is provided, update the tenant associations
  if (input.tenantIds !== undefined) {
    // Remove all existing tenant associations
    await prisma.tenantKBArticle.deleteMany({
      where: { articleId: id },
    })

    // If tenantIds is not null and has values, create new associations
    if (input.tenantIds !== null && input.tenantIds.length > 0) {
      await prisma.tenantKBArticle.createMany({
        data: input.tenantIds.map((tenantId) => ({
          tenantId,
          articleId: id,
        })),
        skipDuplicates: true,
      })
    }
  }

  return article
}

export async function getArticleById(id: string) {
  return prisma.knowledgeBaseArticle.findUnique({
    where: { id },
  })
}

export async function getArticleBySlug(slug: string) {
  return prisma.knowledgeBaseArticle.findUnique({
    where: { slug },
  })
}

export async function listArticles(params?: { status?: ArticleStatus; tag?: string; tenantId?: string; organizationId?: string; userId?: string; userRoles?: string[] }) {
  const where: any = {
    status: params?.status,
    tags: params?.tag ? { has: params.tag } : undefined,
  }

  // Filter by organization - if user is not GLOBAL_ADMIN, filter by their organization
  if (params?.userId && params?.userRoles) {
    if (!params.userRoles.includes('GLOBAL_ADMIN')) {
      // Get user's organization
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { organizationId: true },
      })
      if (user?.organizationId) {
        where.organizationId = user.organizationId
      } else {
        // User has no organization, return empty
        return []
      }
    }
  }

  if (params?.organizationId) {
    where.organizationId = params.organizationId
  }

  // Filter by tenant using the join table
  if (params?.tenantId) {
    where.tenantKBArticles = {
      some: {
        tenantId: params.tenantId,
      },
    }
  }

  return prisma.knowledgeBaseArticle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function searchArticles(query: string, tenantId?: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  
  const where: any = {
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { tags: { has: query } },
    ],
    status: ArticleStatus.PUBLISHED,
  }

  // Filter by tenant if provided
  if (tenantId) {
    where.tenantKBArticles = {
      some: {
        tenantId,
      },
    }
  }

  return prisma.knowledgeBaseArticle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

