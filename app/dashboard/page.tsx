'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import OrganizationContext from '@/components/OrganizationContext'

interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionTime: number
  slaCompliance: number
  ticketsByPriority: Record<string, number>
  ticketsByStatus: Record<string, number>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [mttr, setMttr] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')

      const [metricsRes, mttrRes] = await Promise.all([
        fetch('/api/v1/analytics/metrics', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/analytics/mttr', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ])

      const metricsData = await metricsRes.json()
      const mttrData = await mttrRes.json()

      if (metricsData.success) {
        setMetrics(metricsData.data.metrics)
      }

      if (mttrData.success) {
        setMttr(mttrData.data.mttr)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/analytics/export?type=${type}&format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => handleExport('tickets')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export Tickets CSV
          </button>
          <Link
            href="/reports"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            View Reports
          </Link>
        </div>
      </div>

      {metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Total Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Open Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'orange' }}>{metrics.openTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Resolved Tickets
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'green' }}>{metrics.resolvedTickets}</div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                SLA Compliance
              </h3>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: metrics.slaCompliance >= 90 ? 'green' : metrics.slaCompliance >= 75 ? 'orange' : 'red',
                }}
              >
                {metrics.slaCompliance.toFixed(1)}%
              </div>
            </div>

            {mttr !== null && (
              <div
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  MTTR (Minutes)
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{mttr}</div>
              </div>
            )}

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Avg Resolution Time
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.averageResolutionTime} min</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Tickets by Priority</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(metrics.ticketsByPriority).map(([priority, count]) => (
                  <div key={priority} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{priority}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Tickets by Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(metrics.ticketsByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{status}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Quick Links</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/tickets"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Tickets
          </Link>
          <Link
            href="/assets"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Assets
          </Link>
          <Link
            href="/changes"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            View Changes
          </Link>
          <Link
            href="/kb"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            Knowledge Base
          </Link>
          <Link
            href="/admin/sla"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            SLA Management
          </Link>
          <Link
            href="/admin/config"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            Configuration
          </Link>
          <Link
            href="/admin/users"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            User Management
          </Link>
        </div>
      </div>
    </div>
  )
}
