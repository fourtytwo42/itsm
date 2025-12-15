'use client'

import { useState, useEffect } from 'react'

interface AgentPerformance {
  id: string
  name: string
  email: string
  ticketsResolved: number
  ticketsAssigned: number
  averageResolutionTime: number
  slaCompliance: number
  firstResponseTime: number
}

export default function ReportsPage() {
  const [agents, setAgents] = useState<AgentPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadAgentPerformance()
  }, [filters])

  const loadAgentPerformance = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/v1/analytics/agents?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAgents(data.data.agents)
      }
    } catch (error) {
      console.error('Failed to load agent performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      params.append('type', type)
      params.append('format', 'csv')
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/v1/analytics/export?${params.toString()}`, {
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Reports</h1>
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
            Export Tickets
          </button>
          <button
            onClick={() => handleExport('agents')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export Agents
          </button>
          <button
            onClick={() => handleExport('sla')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export SLA
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="date"
          placeholder="Start Date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        />
        <input
          type="date"
          placeholder="End Date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Agent Performance</h2>
        {loading ? (
          <div>Loading agent performance...</div>
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
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Agent</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Tickets Resolved</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Tickets Assigned</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Avg Resolution (min)</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Avg First Response (min)</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>SLA Compliance</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No agent performance data found
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{agent.name}</td>
                      <td style={{ padding: '1rem' }}>{agent.ticketsResolved}</td>
                      <td style={{ padding: '1rem' }}>{agent.ticketsAssigned}</td>
                      <td style={{ padding: '1rem' }}>{agent.averageResolutionTime}</td>
                      <td style={{ padding: '1rem' }}>{agent.firstResponseTime}</td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            color: agent.slaCompliance >= 90 ? 'green' : agent.slaCompliance >= 75 ? 'orange' : 'red',
                          }}
                        >
                          {agent.slaCompliance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

