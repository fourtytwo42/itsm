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
  comments: Array<{
    id: string
    body: string
    createdAt: string
    author: { email: string }
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

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/v1/tickets/${ticketId}`)
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

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading ticket...</div>
  if (error) return <div className="container" style={{ padding: '2rem', color: 'var(--error)' }}>{error}</div>
  if (!ticket) return null

  return (
    <div className="container" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>{ticket.ticketNumber}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        <h1 style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{ticket.description}</p>
        <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span>Status: {ticket.status}</span>
          <span>Priority: {ticket.priority}</span>
        </div>
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

