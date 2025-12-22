'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Agent {
  id: string
  email: string
  firstName?: string
  lastName?: string
  isActive: boolean
  roles: string[]
}

export default function ManagerAgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
  })

  useEffect(() => {
    loadAgent()
  }, [agentId])

  const loadAgent = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        setAgent(data.data.agent || data.data)
        setFormData({
          email: data.data.agent?.email || data.data.email,
          firstName: data.data.agent?.firstName || data.data.firstName || '',
          lastName: data.data.agent?.lastName || data.data.lastName || '',
          isActive: data.data.agent?.isActive ?? data.data.isActive ?? true,
        })
      } else {
        setError(data.error?.message || 'Failed to load agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        loadAgent()
      } else {
        setError(data.error?.message || 'Failed to update agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this agent\'s password? A temporary password will be generated.')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setTempPassword(data.data.temporaryPassword)
      } else {
        setError(data.error?.message || 'Failed to reset password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDisable = async () => {
    if (!confirm(`Are you sure you want to ${formData.isActive ? 'disable' : 'enable'} this agent?`)) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${agentId}/disable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: formData.isActive }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({ ...formData, isActive: !formData.isActive })
        loadAgent()
      } else {
        setError(data.error?.message || 'Failed to update agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async () => {
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
        router.push('/manager/agents')
      } else {
        setError(data.error?.message || 'Failed to delete agent')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading agent...</p>
      </div>
    )
  }

  if (!agent) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Agent not found</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Manage Agent</h1>
        <button
          onClick={() => router.back()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Back
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

      {tempPassword && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-text)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Temporary Password Generated:</p>
          <p style={{ margin: '0.5rem 0 0 0', fontFamily: 'monospace', fontSize: '1.25rem' }}>
            {tempPassword}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Share this password with the agent. They should change it after logging in.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span>Active</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={handleResetPassword}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Reset Password
        </button>

        <button
          onClick={handleDisable}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: formData.isActive ? 'var(--warning-bg)' : 'var(--success-bg)',
            color: formData.isActive ? 'var(--warning-text)' : 'var(--success-text)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {formData.isActive ? 'Disable' : 'Enable'}
        </button>

        <button
          onClick={handleDelete}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Delete Agent
        </button>
      </div>
    </div>
  )
}

