'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

  const isAgentOrManager = user?.roles?.some((r: string) => ['AGENT', 'IT_MANAGER', 'ADMIN'].includes(r))

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
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{ticket.description}</p>
        
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
              <p>{c.body}</p>
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
    </div>
  )
}

