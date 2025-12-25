import prisma from '@/lib/prisma'

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensions

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return key
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI Embedding API error: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

/**
 * Chunk text into smaller pieces for embedding
 * Returns array of chunks with their text
 */
export function chunkText(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      // If paragraph itself is too long, split it
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/[.!?]+\s+/)
        let sentenceChunk = ''
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 2 <= maxChunkSize) {
            sentenceChunk += (sentenceChunk ? '. ' : '') + sentence
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk)
            sentenceChunk = sentence
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk
      } else {
        currentChunk = paragraph
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * Generate and store embeddings for a KB article
 */
export async function generateArticleEmbeddings(articleId: string): Promise<void> {
  const article = await prisma.knowledgeBaseArticle.findUnique({
    where: { id: articleId },
  })

  if (!article) {
    throw new Error(`Article ${articleId} not found`)
  }

  // Delete existing embeddings
  await prisma.$executeRawUnsafe(`DELETE FROM "KBArticleEmbedding" WHERE "articleId" = $1`, articleId)

  // Create text to embed (title + content)
  const textToEmbed = `${article.title}\n\n${article.content}`
  const chunks = chunkText(textToEmbed)

  // Generate embeddings for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await generateEmbedding(chunk)

    // Store embedding using raw SQL since Prisma doesn't support vector type directly
    const embeddingStr = `[${embedding.join(',')}]`
    await prisma.$executeRawUnsafe(
      `INSERT INTO "KBArticleEmbedding" ("id", "articleId", "embedding", "chunkIndex", "chunkText", "createdAt")
       VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, NOW())`,
      articleId,
      embeddingStr,
      i,
      chunk
    )
  }
}

/**
 * Semantic search for KB articles using vector similarity
 */
export async function semanticSearchArticles(
  query: string,
  options: {
    tenantId?: string
    organizationId?: string
    limit?: number
    userId?: string
    userRoles?: string[]
  } = {}
): Promise<any[]> {
  if (!query.trim()) return []

  const limit = options.limit || 5

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)
  const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`

  // Build WHERE conditions
  const conditions: string[] = ["a.status = 'PUBLISHED'"]
  const params: any[] = [queryEmbeddingStr, limit]

  // Filter by tenant if provided
  if (options.tenantId) {
    const paramIndex = params.length + 1
    conditions.push(`EXISTS (
      SELECT 1 FROM "TenantKBArticle" tka 
      WHERE tka."articleId" = a.id AND tka."tenantId" = $${paramIndex}
    )`)
    params.push(options.tenantId)
  }

  // Filter by organization if provided (and user is not GLOBAL_ADMIN)
  if (options.organizationId && !options.userRoles?.includes('GLOBAL_ADMIN')) {
    const paramIndex = params.length + 1
    conditions.push(`a."organizationId" = $${paramIndex}`)
    params.push(options.organizationId)
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ')

  // Perform vector similarity search
  const sql = `SELECT 
      a.*,
      1 - (e.embedding <=> $1::vector) as similarity
    FROM "KnowledgeBaseArticle" a
    INNER JOIN "KBArticleEmbedding" e ON e."articleId" = a.id
    ${whereClause}
    ORDER BY similarity DESC
    LIMIT $2`

  const results = await prisma.$queryRawUnsafe<any[]>(sql, ...params)

  return results
}
