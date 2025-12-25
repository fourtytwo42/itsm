'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  escalatedToRoleId?: string | null
  escalatedToSystemRole?: string | null
  escalatedAt?: string | null
  escalatedBy?: string | null
  escalationNote?: string | null
  escalatedByUser?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  escalatedToCustomRole?: {
    id: string
    name: string
    displayName: string
  } | null
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

interface EscalationRole {
  type: 'system' | 'custom'
  id: string
  name: string
  displayName: string
}

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showEscalationModal, setShowEscalationModal] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<EscalationRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [escalationData, setEscalationData] = useState({
    escalatedToRoleId: '',
    escalatedToSystemRole: '',
    escalationNote: '',
  })
  const [escalating, setEscalating] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
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
        const res = await fetch(`/api/v1/tickets/${ticketId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (!data.success) {
          setError('Failed to load ticket')
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
    if (!comment.trim()) return
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body: comment }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to add comment')
        setSaving(false)
        return
      }
      setTicket((prev) =>
        prev
          ? { ...prev, comments: [...prev.comments, { ...data.data, author: data.data.author }] }
          : prev
      )
      setComment('')
    } catch (err) {
      setError('Failed to add comment')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to update status')
        setUpdatingStatus(false)
        return
      }
      setTicket((prev) => (prev ? { ...prev, status: data.data.status } : null))
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const isAgentOrManager = user?.roles?.some((r: string) => 
    ['AGENT', 'IT_MANAGER', 'ADMIN'].includes(r) || r.startsWith('CUSTOM:')
  )

  const canEscalate = isAgentOrManager

  const loadAvailableRoles = async () => {
    setLoadingRoles(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}/escalate`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setAvailableRoles(data.data.availableRoles)
      }
    } catch (err) {
      console.error('Failed to load escalation roles:', err)
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleEscalate = async () => {
    if (!escalationData.escalatedToRoleId && !escalationData.escalatedToSystemRole) {
      setError('Please select a role to escalate to')
      return
    }

    setEscalating(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/tickets/${ticketId}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          escalatedToRoleId: escalationData.escalatedToRoleId || undefined,
          escalatedToSystemRole: escalationData.escalatedToSystemRole || undefined,
          escalationNote: escalationData.escalationNote || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to escalate ticket')
        setEscalating(false)
        return
      }
      // Refresh ticket data
      const ticketRes = await fetch(`/api/v1/tickets/${ticketId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const ticketData = await ticketRes.json()
      if (ticketData.success) {
        setTicket(ticketData.data)
      }
      setShowEscalationModal(false)
      setEscalationData({ escalatedToRoleId: '', escalatedToSystemRole: '', escalationNote: '' })
    } catch (err) {
      setError('Failed to escalate ticket')
    } finally {
      setEscalating(false)
    }
  }

  useEffect(() => {
    if (showEscalationModal && canEscalate) {
      loadAvailableRoles()
    }
  }, [showEscalationModal, canEscalate])

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading ticket...</div>
  if (error) return <div className="container" style={{ padding: '2rem', color: 'var(--error)' }}>{error}</div>
  if (!ticket) return null

  const statusOptions = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

  return (
    <div className="container" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <div className="card">
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
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Submitted By</h3>
          <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem' }}>
            <div>
              <strong>Name:</strong> {ticket.requester
                ? (ticket.requester.firstName && ticket.requester.lastName
                    ? `${ticket.requester.firstName} ${ticket.requester.lastName}`
                    : 'Not provided')
                : (ticket.requesterName || 'Not provided')}
            </div>
            <div>
              <strong>Email:</strong> {ticket.requester?.email || ticket.requesterEmail || 'Not provided'}
            </div>
            {ticket.tenant && (
              <div>
                <strong>Tenant:</strong> {ticket.tenant.name}
              </div>
            )}
            {ticket.category && (
              <div>
                <strong>Category:</strong> {ticket.category}
              </div>
            )}
          </div>
        </div>

        {/* Escalation Information */}
        {ticket.escalatedAt && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--warning)' }}>
              ⚠ Escalated
            </h3>
            <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Escalated to:</strong>{' '}
                {ticket.escalatedToCustomRole
                  ? ticket.escalatedToCustomRole.displayName
                  : ticket.escalatedToSystemRole?.replace('_', ' ') || 'Unknown'}
              </div>
              {ticket.escalatedByUser && (
                <div>
                  <strong>Escalated by:</strong>{' '}
                  {ticket.escalatedByUser.firstName && ticket.escalatedByUser.lastName
                    ? `${ticket.escalatedByUser.firstName} ${ticket.escalatedByUser.lastName}`
                    : ticket.escalatedByUser.email}
                </div>
              )}
              <div>
                <strong>Escalated at:</strong> {new Date(ticket.escalatedAt).toLocaleString()}
              </div>
              {ticket.escalationNote && (
                <div>
                  <strong>Note:</strong> {ticket.escalationNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status and Priority */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong>Status:</strong>
            {isAgentOrManager ? (
              <select
                value={ticket.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updatingStatus}
                style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: updatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                {ticket.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div>
            <strong>Priority:</strong> <span style={{ color: 'var(--text-secondary)' }}>{ticket.priority}</span>
          </div>
          {ticket.assignee && (
            <div>
              <strong>Assigned to:</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {ticket.assignee.firstName && ticket.assignee.lastName
                  ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                  : ticket.assignee.email}
              </span>
            </div>
          )}
          {canEscalate && !ticket.escalatedAt && (
            <button
              onClick={() => setShowEscalationModal(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                color: 'var(--warning)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Escalate Ticket
            </button>
          )}
        </div>
        {error && <p style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Comments</h3>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
          {ticket.comments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No comments yet.</p>}
          {ticket.comments.map((c) => (
            <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{c.author?.email ?? 'Unknown'}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ lineHeight: 1.5 }}>
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
                  {c.body}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <textarea
            className="input"
            rows={3}
            placeholder="Add a comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={saving}
          />
          <button className="btn btn-primary" onClick={submitComment} disabled={saving}>
            {saving ? 'Adding...' : 'Add Comment'}
          </button>
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalationModal && (
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
          onClick={() => !escalating && setShowEscalationModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Escalate Ticket</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Escalate to Role <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                {loadingRoles ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading roles...</p>
                ) : (
                  <select
                    className="input"
                    value={escalationData.escalatedToSystemRole || escalationData.escalatedToRoleId}
                    onChange={(e) => {
                      const selectedRole = availableRoles.find(r => 
                        (r.type === 'system' ? r.id : r.id) === e.target.value
                      )
                      if (selectedRole) {
                        if (selectedRole.type === 'system') {
                          setEscalationData({
                            ...escalationData,
                            escalatedToSystemRole: selectedRole.id,
                            escalatedToRoleId: '',
                          })
                        } else {
                          setEscalationData({
                            ...escalationData,
                            escalatedToRoleId: selectedRole.id,
                            escalatedToSystemRole: '',
                          })
                        }
                      }
                    }}
                    required
                    disabled={escalating}
                  >
                    <option value="">Select a role...</option>
                    {availableRoles.map((role) => (
                      <option key={`${role.type}-${role.id}`} value={role.id}>
                        {role.displayName} {role.type === 'custom' ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Escalation Note (Optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Add a note about why this ticket is being escalated..."
                  value={escalationData.escalationNote}
                  onChange={(e) => setEscalationData({ ...escalationData, escalationNote: e.target.value })}
                  disabled={escalating}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEscalationModal(false)}
                  disabled={escalating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: escalating ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEscalate}
                  disabled={escalating || (!escalationData.escalatedToRoleId && !escalationData.escalatedToSystemRole)}
                  style={{
                    backgroundColor: escalating ? 'var(--text-secondary)' : 'var(--warning)',
                  }}
                >
                  {escalating ? 'Escalating...' : 'Escalate Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

