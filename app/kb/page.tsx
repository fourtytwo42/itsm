'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Article {
  id: string
  slug: string
  title: string
  tags: string[]
  createdAt: string
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadArticles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = query.trim()
        ? await fetch('/api/v1/kb/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          })
        : await fetch('/api/v1/kb')

      const data = await res.json()
      if (!data.success) {
        setError('Failed to load articles')
        return
      }
      setArticles(data.data)
    } catch (err) {
      setError('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await loadArticles()
  }

  return (
    <div className="container" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Knowledge Base</h1>
      </div>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          className="input"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      {loading && <p>Loading articles...</p>}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {articles.map((article) => (
            <Link key={article.id} href={`/kb/${article.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h3 style={{ margin: 0 }}>{article.title}</h3>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                {article.tags.map((tag) => (
                  <span key={tag} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.15rem 0.5rem' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {articles.length === 0 && <p>No articles found.</p>}
        </div>
      )}
    </div>
  )
}

