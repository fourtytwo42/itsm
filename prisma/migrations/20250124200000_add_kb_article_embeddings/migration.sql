-- CreateTable
CREATE TABLE IF NOT EXISTS "KBArticleEmbedding" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "chunkText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KBArticleEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KBArticleEmbedding_articleId_idx" ON "KBArticleEmbedding"("articleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KBArticleEmbedding_chunkIndex_idx" ON "KBArticleEmbedding"("chunkIndex");

-- CreateIndex for vector similarity search (HNSW index)
CREATE INDEX IF NOT EXISTS kb_article_embedding_vector_idx ON "KBArticleEmbedding" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- AddForeignKey
ALTER TABLE "KBArticleEmbedding" ADD CONSTRAINT "KBArticleEmbedding_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeBaseArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

