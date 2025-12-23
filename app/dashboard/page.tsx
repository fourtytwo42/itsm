'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TicketStatus, TicketPriority } from '@prisma/client'
import TicketsTable from '@/components/TicketsTable'

interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number
  slaCompliance: number
  ticketsByPriority: Record<string, number>
  ticketsByStatus: Record<string, number>
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  requester?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  requesterEmail?: string | null
  requesterName?: string | null
  assignee?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
}

interface KBArticle {
  id: string
  slug: string
  title: string
  content: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [mttr, setMttr] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (user) {
      const isAgent = user.roles?.some((r: string) => ['AGENT', 'IT_MANAGER', 'ADMIN'].includes(r))
      if (isAgent) {
        loadAssignedTickets()
        loadRecentKBArticles()
      }
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')

      const [metricsRes, mttrRes] = await Promise.all([
        fetch('/api/v1/analytics/metrics', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/analytics/mttr', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ])

      const metricsData = await metricsRes.json()
      const mttrData = await mttrRes.json()

      if (metricsData.success) {
        setMetrics(metricsData.data.metrics)
      }

      if (mttrData.success) {
        setMttr(mttrData.data.mttr)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedTickets = async () => {
    try {
      setTicketsLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(
        `/api/v1/tickets?onlyAssignedToMe=true&excludeStatuses=CLOSED,RESOLVED&limit=20`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      const data = await response.json()
      if (data.success) {
        setTickets(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load assigned tickets:', error)
    } finally {
      setTicketsLoading(false)
    }
  }

  const loadRecentKBArticles = async () => {
    try {
      setKbLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/kb?limit=5', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setKbArticles(data.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load KB articles:', error)
    } finally {
      setKbLoading(false)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const token = localStorage.getItem('accessToken')
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update status')
      }

      // If status is CLOSED or RESOLVED, remove from dashboard
      if (newStatus === 'CLOSED' || newStatus === 'RESOLVED') {
        setTickets(prev => prev.filter(t => t.id !== ticketId))
      } else {
        // Update the ticket status in the list
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      throw error
    }
  }

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/analytics/export?type=${type}&format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const isAgent = user?.roles?.some((r: string) => ['AGENT', 'IT_MANAGER', 'ADMIN'].includes(r))

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => handleExport('tickets')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export Tickets CSV
          </button>
          <Link
            href="/reports"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            View Reports
          </Link>
        </div>
      </div>

      {metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Total Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Open Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'orange' }}>{metrics.openTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Resolved Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'green' }}>{metrics.resolvedTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                SLA Compliance
              </h3>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: metrics.slaCompliance >= 90 ? 'green' : metrics.slaCompliance >= 75 ? 'orange' : 'red',
                }}
              >
                {metrics.slaCompliance.toFixed(1)}%
              </div>
            </div>

            {mttr !== null && (
              <div
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  MTTR (Minutes)
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{mttr}</div>
              </div>
            )}

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Avg Resolution Time
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.averageResolutionTime} min</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Tickets by Priority</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(metrics.ticketsByPriority).map(([priority, count]) => (
                  <div key={priority} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{priority}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Tickets by Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(metrics.ticketsByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{status}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {isAgent && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>My Assigned Tickets</h2>
              <Link href="/tickets" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                View All Tickets
              </Link>
            </div>
            {ticketsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tickets...</div>
            ) : (
              <TicketsTable
                tickets={tickets}
                onStatusChange={handleStatusChange}
                showQuickActions={true}
                onRefresh={loadAssignedTickets}
              />
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Recent Knowledge Base Articles</h2>
              <Link href="/kb" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                View All Articles
              </Link>
            </div>
            {kbLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading articles...</div>
            ) : kbArticles.length > 0 ? (
              <div className="card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {kbArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/kb/${article.slug}`}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                      }}
                    >
                      <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>{article.title}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Updated: {new Date(article.updatedAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No knowledge base articles found.
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Quick Links</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/tickets"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Tickets
          </Link>
          <Link
            href="/assets"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Assets
          </Link>
          <Link
            href="/changes"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Changes
          </Link>
          <Link
            href="/kb"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  )
}
