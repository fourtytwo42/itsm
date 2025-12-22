'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface KBArticle {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function TenantKBArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const articleId = params?.id as string

  const [article, setArticle] = useState<KBArticle | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadArticle()
  }, [slug, articleId])

  const loadArticle = async () => {
    try {
      setLoading(true)
      
      // Load tenant first
      const tenantRes = await fetch(`/api/v1/tenants/${slug}`)
      const tenantData = await tenantRes.json()
      if (tenantData.success) {
        setTenant(tenantData.data)
      }

      // Load article
      const token = localStorage.getItem('accessToken')
      const articleRes = await fetch(`/api/v1/kb/${articleId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const articleData = await articleRes.json()

      if (articleData.success) {
        setArticle(articleData.data)
      } else {
        setError(articleData.error?.message || 'Article not found')
      }
    } catch (err) {
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Article Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'The article you are looking for does not exist.'}</p>
          {slug && (
            <Link
              href={`/tenant/${slug}/kb`}
              style={{
                marginTop: '1rem',
                display: 'inline-block',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
              }}
            >
              Back to Knowledge Base
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <Link
          href={`/tenant/${slug}/kb`}
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: '2rem',
            display: 'inline-block',
          }}
        >
          ← Back to Knowledge Base
        </Link>

        <article
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{article.title}</h1>
          
          {article.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              lineHeight: '1.75',
              color: 'var(--text-primary)',
            }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Last updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
          </div>
        </article>
      </div>
    </div>
  )
}

