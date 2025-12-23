'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TicketStatus, TicketPriority } from '@prisma/client'
import TicketsTable from '@/components/TicketsTable'
import OrganizationContext from '@/components/OrganizationContext'

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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, searchQuery, sortBy, sortOrder, page])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await fetch(`/api/v1/tickets?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to load tickets')
        return
      }
      setTickets(data.data || [])
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
        setTotal(data.pagination.total || 0)
      }
    } catch (err) {
      setError('Failed to load tickets')
      console.error(err)
    } finally {
      setLoading(false)
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

      // Refresh tickets
      fetchTickets()
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      throw error
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on search
    fetchTickets()
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <OrganizationContext />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Tickets</h1>
        <Link href="/tickets/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="label" htmlFor="statusFilter">
              Status
            </label>
            <select
              id="statusFilter"
              className="input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div style={{ flex: 2, minWidth: '250px' }}>
            <label className="label" htmlFor="search">
              Search (Username, Email, or Problem)
            </label>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="search"
                type="text"
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, email, or problem text..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(1)
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label className="label" htmlFor="sortBy">
              Sort By
            </label>
            <select
              id="sortBy"
              className="input"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="ticketNumber">Ticket Number</option>
              <option value="subject">Subject</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="requester">Requester</option>
              <option value="assignee">Assignee</option>
            </select>
          </div>

          <div style={{ minWidth: '120px' }}>
            <label className="label" htmlFor="sortOrder">
              Order
            </label>
            <select
              id="sortOrder"
              className="input"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc')
                setPage(1)
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {total > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total} tickets
          </div>
        )}
      </div>

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

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tickets...</div>
      ) : (
        <>
          <TicketsTable
            tickets={tickets}
            onStatusChange={handleStatusChange}
            showQuickActions={true}
            onRefresh={fetchTickets}
            disableClientSort={true}
            onSortChange={(field, order) => {
              setSortBy(field)
              setSortOrder(order)
              setPage(1)
            }}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
