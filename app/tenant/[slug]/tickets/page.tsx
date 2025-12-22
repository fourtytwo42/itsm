'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TenantTicketsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(!!token)
    loadTickets()
  }, [slug])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const publicToken = localStorage.getItem('publicToken')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else if (publicToken) {
        headers['Authorization'] = `Bearer ${publicToken}`
      }

      const response = await fetch(`/api/v1/tenants/${slug}/tickets`, {
        headers,
      })
      const data = await response.json()

      if (data.success) {
        setTickets(data.data)
      } else {
        setError(data.error?.message || 'Failed to load tickets')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading tickets...</p>
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

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Tickets</h1>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', marginBottom: '1rem', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>No tickets found.</p>
            <Link
              href={`/tenant/${slug}/submit`}
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
              }}
            >
              Submit a Ticket
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tenant/${slug}/tickets/${ticket.id}`}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{ticket.subject}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {ticket.ticketNumber}
                    </p>
                  </div>
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
                <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {ticket.description.substring(0, 150)}...
                </p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  {ticket.category && <span>Category: {ticket.category}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

