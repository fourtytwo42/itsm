import prisma from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export interface CreateArticleInput {
  title: string
  content: string
  tags?: string[]
  status?: ArticleStatus
  slug: string
}

export interface UpdateArticleInput {
  title?: string
  content?: string
  tags?: string[]
  status?: ArticleStatus
}

export async function createArticle(input: CreateArticleInput) {
  return prisma.knowledgeBaseArticle.create({
    data: {
      title: input.title,
      content: input.content,
      slug: input.slug,
      tags: input.tags ?? [],
      status: input.status ?? ArticleStatus.PUBLISHED,
    },
  })
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  return prisma.knowledgeBaseArticle.update({
    where: { id },
    data: {
      title: input.title,
      content: input.content,
      tags: input.tags,
      status: input.status,
    },
  })
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

export async function listArticles(params?: { status?: ArticleStatus; tag?: string }) {
  return prisma.knowledgeBaseArticle.findMany({
    where: {
      status: params?.status,
      tags: params?.tag ? { has: params.tag } : undefined,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function searchArticles(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return prisma.knowledgeBaseArticle.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
      status: ArticleStatus.PUBLISHED,
    },
    orderBy: { createdAt: 'desc' },
  })
}

