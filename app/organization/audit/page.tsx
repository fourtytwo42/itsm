'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface AuditLog {
  id: string
  eventType: string
  entityType: string
  entityId?: string
  userId: string
  userEmail: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  organization?: {
    id: string
    name: string
  }
}

function AuditLogPageContent() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    eventType: '',
    entityType: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [page, filters, organizationId])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (organizationId) {
        params.append('organizationId', organizationId)
      }
      if (filters.eventType) {
        params.append('eventType', filters.eventType)
      }
      if (filters.entityType) {
        params.append('entityType', filters.entityType)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }

      const response = await fetch(`/api/v1/organizations/audit?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  if (loading) {
    return <div>Loading audit logs...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Audit Logs</h1>

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

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="label" htmlFor="eventType">
              Event Type
            </label>
            <input
              id="eventType"
              type="text"
              className="input"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              placeholder="e.g., USER_CREATED"
            />
          </div>
          <div>
            <label className="label" htmlFor="entityType">
              Entity Type
            </label>
            <input
              id="entityType"
              type="text"
              className="input"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              placeholder="e.g., User, Ticket"
            />
          </div>
          <div>
            <label className="label" htmlFor="startDate">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="endDate">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Event</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Entity</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    <code style={{ fontSize: '0.75rem' }}>{log.eventType}</code>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {log.entityType}
                    {log.entityId && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({log.entityId.slice(0, 8)}...)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {log.user.firstName} {log.user.lastName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {log.userEmail}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{log.description}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No audit logs found
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuditLogPage() {
  return (
    <Suspense fallback={<div>Loading audit logs...</div>}>
      <AuditLogPageContent />
    </Suspense>
  )
}

