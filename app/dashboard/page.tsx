'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TicketStatus, TicketPriority } from '@prisma/client'
import TicketsTable from '@/components/TicketsTable'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number
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

interface DashboardSection {
  id: string
  label: string
  roles?: string[] // If specified, only show for these roles
}

const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: 'metrics', label: 'Metrics Cards' },
  { id: 'ticketsByPriority', label: 'Tickets by Priority' },
  { id: 'ticketsByStatus', label: 'Tickets by Status' },
  { id: 'assignedTickets', label: 'My Assigned Tickets', roles: ['AGENT', 'IT_MANAGER'] },
  { id: 'kbArticles', label: 'Recent Knowledge Base Articles', roles: ['AGENT', 'IT_MANAGER'] },
  { id: 'quickLinks', label: 'Quick Links' },
]

interface DashboardSettings {
  [sectionId: string]: boolean
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
  const [ticketSortField, setTicketSortField] = useState<string>('createdAt')
  const [ticketSortOrder, setTicketSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSettings, setShowSettings] = useState(false)
  const [sectionVisibility, setSectionVisibility] = useState<DashboardSettings>({})

  // Load user and dashboard settings
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        
        // Load dashboard settings for this user
        const settingsKey = `dashboardSettings_${userData.id}`
        const savedSettings = localStorage.getItem(settingsKey)
        
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            setSectionVisibility(parsed)
          } catch (e) {
            console.error('Failed to parse dashboard settings')
          }
        } else {
          // Initialize with all sections visible (based on user role)
          const defaultSettings: DashboardSettings = {}
          DASHBOARD_SECTIONS.forEach(section => {
            // Only include sections the user has permission for
            if (!section.roles || section.roles.some(role => userData.roles?.includes(role))) {
              defaultSettings[section.id] = true
            }
          })
          setSectionVisibility(defaultSettings)
          localStorage.setItem(settingsKey, JSON.stringify(defaultSettings))
        }
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
    loadDashboardData()
  }, [])


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
      const params = new URLSearchParams()
      params.append('onlyAssignedToMe', 'true')
      params.append('excludeStatuses', 'CLOSED,RESOLVED')
      params.append('limit', '20')
      params.append('sortBy', ticketSortField)
      params.append('sortOrder', ticketSortOrder)
      
      const response = await fetch(`/api/v1/tickets?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

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

  useEffect(() => {
    if (user) {
      // Only agents and IT managers have assigned tickets, not admins
      const isAgentOrManager = user.roles?.some((r: string) => ['AGENT', 'IT_MANAGER'].includes(r))
      if (isAgentOrManager) {
        loadAssignedTickets()
        loadRecentKBArticles()
      }
    }
  }, [user, ticketSortField, ticketSortOrder])

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

  const handleSaveSettings = () => {
    if (user?.id) {
      const settingsKey = `dashboardSettings_${user.id}`
      localStorage.setItem(settingsKey, JSON.stringify(sectionVisibility))
      setShowSettings(false)
    }
  }

  const handleToggleSection = (sectionId: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const isSectionVisible = (sectionId: string): boolean => {
    return sectionVisibility[sectionId] !== false // Default to true if not set
  }

  const getAvailableSections = (): DashboardSection[] => {
    if (!user) return []
    return DASHBOARD_SECTIONS.filter(section => {
      // Only show sections the user has permission for
      if (!section.roles) return true
      return section.roles.some(role => user.roles?.includes(role))
    })
  }

  // Only agents and IT managers have assigned tickets, not admins
  const isAgentOrManager = user?.roles?.some((r: string) => ['AGENT', 'IT_MANAGER'].includes(r))

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dashboard Settings"
          >
            <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
          </button>
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

      {metrics && isSectionVisible('metrics') && (
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

          {(isSectionVisible('ticketsByPriority') || isSectionVisible('ticketsByStatus')) && (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: isSectionVisible('ticketsByPriority') && isSectionVisible('ticketsByStatus') 
                  ? '1fr 1fr' 
                  : '1fr',
                gap: '2rem', 
                marginBottom: '2rem' 
              }}
            >
              {isSectionVisible('ticketsByPriority') && (
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
              )}

              {isSectionVisible('ticketsByStatus') && (
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
              )}
            </div>
          )}
        </>
      )}

      {isAgentOrManager && isSectionVisible('assignedTickets') && (
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
                disableClientSort={true}
                onSortChange={(field, order) => {
                  setTicketSortField(field)
                  setTicketSortOrder(order)
                }}
                currentSortField={ticketSortField}
                currentSortOrder={ticketSortOrder}
              />
            )}
          </div>

          {isSectionVisible('kbArticles') && (
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
          )}
        </>
      )}

      {isSectionVisible('quickLinks') && (
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
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Dashboard Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Select which sections to display on your dashboard:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {getAvailableSections().map((section) => (
                <label
                  key={section.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSectionVisible(section.id)}
                    onChange={() => handleToggleSection(section.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                  <span>{section.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
