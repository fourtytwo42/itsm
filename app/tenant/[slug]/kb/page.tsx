'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface KBArticle {
  id: string
  title: string
  slug: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  kbArticles: KBArticle[]
}

export default function TenantKBPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadTenant()
  }, [slug])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/tenants/${slug}`)
      const data = await response.json()

      if (data.success) {
        setTenant(data.data)
      } else {
        setError(data.error?.message || 'Tenant not found')
      }
    } catch (err) {
      setError('Failed to load tenant')
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = tenant?.kbArticles.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tenant Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'The tenant you are looking for does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <Link
          href={`/tenant/${slug}`}
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: '2rem',
            display: 'inline-block',
          }}
        >
          ← Back
        </Link>

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Knowledge Base</h1>

        {/* Search */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Articles List */}
        {filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            {search ? 'No articles found matching your search.' : 'No articles available.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/tenant/${slug}/kb/${article.id}`}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  display: 'block',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  e.currentTarget.style.borderColor = 'var(--accent-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{article.title}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

