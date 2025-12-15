'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTicketPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject, description, priority }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to create ticket')
        setLoading(false)
        return
      }

      router.push(`/tickets/${data.data.id}`)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create Ticket</h1>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input
            id="subject"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={3}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={3}
            rows={6}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            className="input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={loading}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}

