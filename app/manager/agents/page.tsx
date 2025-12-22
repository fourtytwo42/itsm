'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Agent {
  id: string
  email: string
  firstName?: string
  lastName?: string
  isActive: boolean
  roles: string[]
  tenant?: {
    id: string
    name: string
    slug: string
  }
  tenantAssignments?: Array<{
    tenant: {
      id: string
      name: string
      slug: string
    }
  }>
}

export default function ManagerAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/manager/agents', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        setAgents(data.data.agents || data.data || [])
      } else {
        setError(data.error?.message || 'Failed to load agents')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async (agentId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this agent?`)) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}/disable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: currentStatus }),
      })

      const data = await response.json()

      if (data.success) {
        loadAgents()
      } else {
        setError(data.error?.message || 'Failed to update agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        loadAgents()
      } else {
        setError(data.error?.message || 'Failed to delete agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const filteredAgents = agents.filter((agent) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      agent.email.toLowerCase().includes(search) ||
      agent.firstName?.toLowerCase().includes(search) ||
      agent.lastName?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading agents...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>My Agents</h1>
        <button
          onClick={() => router.push('/manager/agents/new')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Register Agent
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search agents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {filteredAgents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>No agents found. Register your first agent to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  {agent.firstName || agent.lastName
                    ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim()
                    : agent.email}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {agent.email}
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      backgroundColor: agent.isActive ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: agent.isActive ? 'var(--success-text)' : 'var(--error-text)',
                    }}
                  >
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {agent.roles.join(', ')}
                  </span>
                  {agent.tenantAssignments && agent.tenantAssignments.length > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {agent.tenantAssignments.length} tenant(s)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  href={`/manager/agents/${agent.id}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleDisable(agent.id, agent.isActive)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: agent.isActive ? 'var(--warning-bg)' : 'var(--success-bg)',
                    color: agent.isActive ? 'var(--warning-text)' : 'var(--success-text)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {agent.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--error-bg)',
                    color: 'var(--error-text)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

