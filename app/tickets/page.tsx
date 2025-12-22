'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import OrganizationContext from '@/components/OrganizationContext'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  createdAt: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/v1/tickets')
        const data = await res.json()
        if (!data.success) {
          setError('Failed to load tickets')
          return
        }
        setTickets(data.data)
      } catch (err) {
        setError('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [])

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <OrganizationContext />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Tickets</h1>
        <Link href="/tickets/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      {loading && <p>Loading tickets...</p>}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{ticket.ticketNumber}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>{ticket.subject}</h3>
              <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Status: {ticket.status}</span>
                <span>Priority: {ticket.priority}</span>
              </div>
            </Link>
          ))}
          {tickets.length === 0 && <p>No tickets yet.</p>}
        </div>
      )}
    </div>
  )
}

