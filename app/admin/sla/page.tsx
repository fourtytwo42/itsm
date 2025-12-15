'use client'

import { useState, useEffect } from 'react'

interface SLAPolicy {
  id: string
  name: string
  description?: string
  priority: string
  firstResponseTime: number
  resolutionTime: number
  active: boolean
}

interface ComplianceStats {
  total: number
  firstResponseBreached: number
  resolutionBreached: number
  firstResponseMet: number
  resolutionMet: number
  firstResponseCompliance: number
  resolutionCompliance: number
}

export default function SLAPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')

      const [policiesRes, statsRes] = await Promise.all([
        fetch('/api/v1/sla/policies', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/sla/compliance', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ])

      const policiesData = await policiesRes.json()
      const statsData = await statsRes.json()

      if (policiesData.success) {
        setPolicies(policiesData.data.policies)
      }

      if (statsData.success) {
        setStats(statsData.data.stats)
      }
    } catch (error) {
      console.error('Failed to load SLA data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading SLA data...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>SLA Management</h1>

      {stats && (
        <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Total Tickets</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>First Response Compliance</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.firstResponseCompliance >= 90 ? 'green' : 'orange' }}>
              {stats.firstResponseCompliance.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {stats.firstResponseMet} met, {stats.firstResponseBreached} breached
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
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Resolution Compliance</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.resolutionCompliance >= 90 ? 'green' : 'orange' }}>
              {stats.resolutionCompliance.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {stats.resolutionMet} met, {stats.resolutionBreached} breached
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>SLA Policies</h2>
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
                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Priority</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>First Response (min)</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Resolution (min)</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No SLA policies found
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{policy.name}</td>
                    <td style={{ padding: '1rem' }}>{policy.priority}</td>
                    <td style={{ padding: '1rem' }}>{policy.firstResponseTime}</td>
                    <td style={{ padding: '1rem' }}>{policy.resolutionTime}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: policy.active ? 'green' : 'gray',
                          color: 'white',
                          fontSize: '0.875rem',
                        }}
                      >
                        {policy.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

