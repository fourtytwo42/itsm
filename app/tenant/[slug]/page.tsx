'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import TenantChatWidget from '@/components/TenantChatWidget'

interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  requiresLogin: boolean
  categories: string[]
  kbArticles: Array<{
    id: string
    title: string
    slug: string
  }>
  customFields: Array<{
    id: string
    label: string
    fieldType: string
    required: boolean
    options?: string[]
    placeholder?: string
  }>
}

export default function TenantPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [publicToken, setPublicToken] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(!!token)

    // Get or create public token if not logged in
    if (!token) {
      const storedPublicToken = localStorage.getItem('publicToken')
      if (storedPublicToken) {
        setPublicToken(storedPublicToken)
      } else {
        // Generate new public token
        generatePublicToken()
      }
    }

    loadTenant()
  }, [slug])

  useEffect(() => {
    // Load tickets when tenant or auth state changes
    if (tenant) {
      loadTickets()
    }
  }, [tenant, isAuthenticated, publicToken])

  const generatePublicToken = async (tenantId?: string) => {
    try {
      const response = await fetch('/api/v1/public/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenantId || null }),
      })
      const data = await response.json()
      if (data.success) {
        localStorage.setItem('publicToken', data.data.token)
        localStorage.setItem('publicTokenId', data.data.publicId)
        setPublicToken(data.data.token)
      }
    } catch (err) {
      // Silently fail
    }
  }

  useEffect(() => {
    // Update public token with tenant ID after tenant loads
    if (tenant && !isAuthenticated) {
      if (!publicToken) {
        generatePublicToken(tenant.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, isAuthenticated])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/tenants/${slug}`)
      const data = await response.json()

      if (data.success) {
        setTenant(data.data)

        // Check if login is required
        if (data.data.requiresLogin && !isAuthenticated) {
          router.push(`/login?redirect=/tenant/${slug}`)
        }
      } else {
        setError(data.error?.message || 'Tenant not found')
      }
    } catch (err) {
      setError('Failed to load tenant')
    } finally {
      setLoading(false)
    }
  }

  const loadTickets = async () => {
    try {
      setLoadingTickets(true)
      const token = localStorage.getItem('accessToken')
      const publicTokenToUse = publicToken || localStorage.getItem('publicToken')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else if (publicTokenToUse) {
        headers['Authorization'] = `Bearer ${publicTokenToUse}`
      }

      const response = await fetch(`/api/v1/tenants/${slug}/tickets`, {
        headers,
      })
      const data = await response.json()

      if (data.success) {
        setTickets(data.data)
        // Store tickets in localStorage for offline access
        if (data.data.length > 0) {
          localStorage.setItem(`tickets_${slug}`, JSON.stringify(data.data))
        }
      }
    } catch (err) {
      // Try to load from localStorage as fallback
      const storedTickets = localStorage.getItem(`tickets_${slug}`)
      if (storedTickets) {
        try {
          setTickets(JSON.parse(storedTickets))
        } catch (e) {
          // Invalid stored data
        }
      }
    } finally {
      setLoadingTickets(false)
    }
  }

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
      {/* Header */}
      <header
        style={{
          padding: '2rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {tenant.logo && (
            <img src={tenant.logo} alt={tenant.name} style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
          )}
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{tenant.name}</h1>
            {tenant.description && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{tenant.description}</p>}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
          <Link
            href={`/tenant/${slug}`}
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Home
          </Link>
          <Link
            href={`/tenant/${slug}/kb`}
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Knowledge Base
          </Link>
          <Link
            href={`/tenant/${slug}/submit`}
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Submit Ticket
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div>
          {/* Left Column */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Welcome to {tenant.name} Support</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              We're here to help! Browse our knowledge base or submit a support ticket.
            </p>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <Link
                href={`/tenant/${slug}/submit`}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  display: 'block',
                }}
              >
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Submit a Ticket</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Get help with your issue
                </p>
              </Link>
              <Link
                href={`/tenant/${slug}/kb`}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  display: 'block',
                }}
              >
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Knowledge Base</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Browse articles and FAQs
                </p>
              </Link>
            </div>

            {/* My Tickets (if logged in or has public token) */}
            {(isAuthenticated || publicToken || localStorage.getItem('publicToken')) && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>My Tickets</h3>
                  {tickets.length > 5 && (
                    <Link
                      href={`/tenant/${slug}/tickets`}
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--accent-primary)',
                        textDecoration: 'none',
                      }}
                    >
                      View All
                    </Link>
                  )}
                </div>
                {loadingTickets ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading tickets...</p>
                ) : tickets.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {tickets.slice(0, 5).map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tenant/${slug}/tickets/${ticket.id}`}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          display: 'block',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{ticket.ticketNumber}</span>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor:
                                ticket.status === 'OPEN' || ticket.status === 'NEW'
                                  ? 'rgba(59, 130, 246, 0.1)'
                                  : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(156, 163, 175, 0.1)',
                              color:
                                ticket.status === 'OPEN' || ticket.status === 'NEW'
                                  ? 'rgb(59, 130, 246)'
                                  : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                                  ? 'rgb(16, 185, 129)'
                                  : 'rgb(156, 163, 175)',
                            }}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{ticket.subject}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No tickets yet. Submit a ticket to get started!</p>
                )}
              </div>
            )}

            {/* Recent KB Articles */}
            {tenant.kbArticles.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Popular Articles</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {tenant.kbArticles.slice(0, 5).map((article) => (
                    <Link
                      key={article.id}
                      href={`/tenant/${slug}/kb/${article.id}`}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Chat Widget - Fixed position */}
      <TenantChatWidget tenantId={tenant.id} />
    </div>
  )
}

