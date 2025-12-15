'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Article {
  id: string
  slug: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

export default function KnowledgeBaseArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/v1/kb?slug=${slug}`)
        const data = await res.json()
        if (!data.success || !data.data || !data.data.length) {
          setError('Article not found')
          return
        }
        setArticle(data.data[0])
      } catch (err) {
        setError('Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    if (slug) load()
  }, [slug])

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading article...</div>
  if (error) return <div className="container" style={{ padding: '2rem', color: 'var(--error)' }}>{error}</div>
  if (!article) return null

  return (
    <div className="container" style={{ padding: '2rem', display: 'grid', gap: '1rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>{article.title}</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          {new Date(article.createdAt).toLocaleString()}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0 1rem' }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.15rem 0.5rem', color: 'var(--text-tertiary)' }}>
              #{tag}
            </span>
          ))}
        </div>
        <div style={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{article.content}</div>
      </div>
    </div>
  )
}

