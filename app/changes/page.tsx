'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import OrganizationContext from '@/components/OrganizationContext'

interface ChangeRequest {
  id: string
  changeNumber: string
  title: string
  type: string
  status: string
  priority: string
  requester: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export default function ChangesPage() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    search: '',
  })

  useEffect(() => {
    loadChangeRequests()
  }, [filters])

  const loadChangeRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/v1/changes?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setChangeRequests(data.data.changeRequests)
      }
    } catch (error) {
      console.error('Failed to load change requests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Change Management</h1>
        <Link
          href="/changes/new"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
          }}
        >
          New Change Request
        </Link>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search change requests..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            flex: 1,
            minWidth: '200px',
          }}
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <option value="">All Types</option>
          <option value="STANDARD">Standard</option>
          <option value="NORMAL">Normal</option>
          <option value="EMERGENCY">Emergency</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {loading ? (
        <div>Loading change requests...</div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Change Number</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Priority</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Requester</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {changeRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No change requests found
                  </td>
                </tr>
              ) : (
                changeRequests.map((cr) => (
                  <tr key={cr.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{cr.changeNumber}</td>
                    <td style={{ padding: '1rem' }}>{cr.title}</td>
                    <td style={{ padding: '1rem' }}>{cr.type}</td>
                    <td style={{ padding: '1rem' }}>{cr.status}</td>
                    <td style={{ padding: '1rem' }}>{cr.priority}</td>
                    <td style={{ padding: '1rem' }}>
                      {`${cr.requester.firstName || ''} ${cr.requester.lastName || ''}`.trim() || cr.requester.email}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link
                        href={`/changes/${cr.id}`}
                        style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

