'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  requester: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  requesterEmail?: string | null
  requesterName?: string | null
  assignee: {
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
  category?: string | null
  customFields?: Record<string, any> | null
  comments: Array<{
    id: string
    body: string
    createdAt: string
    author: { 
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    }
  }>
}

export default function TenantTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(!!token)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // Invalid user data
      }
    }
  }, [])

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const publicToken = localStorage.getItem('publicToken')
        
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        } else if (publicToken) {
          headers['Authorization'] = `Bearer ${publicToken}`
        } else {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const res = await fetch(`/api/v1/tickets/${ticketId}`, {
          headers,
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error?.message || 'Failed to load ticket')
          return
        }
        setTicket(data.data)
      } catch (err) {
        setError('Failed to load ticket')
      } finally {
        setLoading(false)
      }
    }
    if (ticketId) fetchTicket()
  }, [ticketId])

  const submitComment = async () => {
    if (!comment.trim() || !isAuthenticated) return

    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: comment }),
      })
      const data = await res.json()
      if (data.success) {
        setComment('')
        // Reload ticket to get updated comments
        const ticketRes = await fetch(`/api/v1/tickets/${ticketId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const ticketData = await ticketRes.json()
        if (ticketData.success) {
          setTicket(ticketData.data)
        }
      }
    } catch (err) {
      // Handle error
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!isAuthenticated) return

    setUpdatingStatus(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setTicket(data.data)
      }
    } catch (err) {
      // Handle error
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading ticket...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', color: 'var(--error)' }}>
        {error}
      </div>
    )
  }
  if (!ticket) return null

  const statusOptions = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <Link
          href={`/tenant/${slug}/tickets`}
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: '2rem',
            display: 'inline-block',
          }}
        >
          ← Back to Tickets
        </Link>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{ticket.ticketNumber}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <h1 style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h1>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  p: ({ children }: any) => <p style={{ margin: '0 0 0.5rem 0' }}>{children}</p>,
                  ul: ({ children }: any) => <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>,
                  ol: ({ children }: any) => <ol style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
                  li: ({ children }: any) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                  code: ({ children, className }: any) => (
                    <code
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        padding: '0.15rem 0.3rem',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace',
                      }}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children }: any) => (
                    <pre
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        margin: '0.5rem 0',
                      }}
                    >
                      {children}
                    </pre>
                  ),
                }}
              >
                {ticket.description}
              </ReactMarkdown>
            </div>
            
            {/* Submitter Information */}
            <div style={{ 
              padding: '1rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Submitted By</h3>
              {ticket.requester ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    {ticket.requester.firstName && ticket.requester.lastName
                      ? `${ticket.requester.firstName} ${ticket.requester.lastName}`
                      : ticket.requester.email}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {ticket.requester.email}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    {ticket.requesterName || 'Anonymous'}
                  </p>
                  {ticket.requesterEmail && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ticket.requesterEmail}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status and Priority */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Status
                </label>
                {isAuthenticated && user?.roles?.some((r: string) => ['ADMIN', 'IT_MANAGER', 'AGENT'].includes(r)) ? (
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={updatingStatus}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
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
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Priority
                </label>
                <span style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: 'var(--bg-primary)' }}>
                  {ticket.priority}
                </span>
              </div>
              {ticket.category && (
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Category
                  </label>
                  <span style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: 'var(--bg-primary)' }}>
                    {ticket.category}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Additional Information</h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {Object.entries(ticket.customFields).map(([key, value]) => (
                    <div key={key} style={{ fontSize: '0.875rem' }}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignee */}
            {ticket.assignee && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Assigned To
                </label>
                <span style={{ fontSize: '0.875rem' }}>
                  {ticket.assignee.firstName && ticket.assignee.lastName
                    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                    : ticket.assignee.email}
                </span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Comments</h2>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {ticket.comments.map((comment) => (
                <div key={comment.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.875rem' }}>
                      {comment.author.firstName && comment.author.lastName
                        ? `${comment.author.firstName} ${comment.author.lastName}`
                        : comment.author.email}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({ children }: any) => <p style={{ margin: '0 0 0.5rem 0' }}>{children}</p>,
                        ul: ({ children }: any) => <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>,
                        ol: ({ children }: any) => <ol style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
                        li: ({ children }: any) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                        code: ({ children }: any) => (
                          <code
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              padding: '0.15rem 0.3rem',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              fontFamily: 'monospace',
                            }}
                          >
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {comment.body}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {ticket.comments.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No comments yet.</p>
              )}
            </div>

            {/* Add Comment (only if authenticated) */}
            {isAuthenticated && (
              <div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                    resize: 'vertical',
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={!comment.trim() || saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

