'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const AUDIT_EVENT_TYPES = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'USER_PASSWORD_RESET',
  'USER_ROLE_CHANGED',
  'ORGANIZATION_CREATED',
  'ORGANIZATION_UPDATED',
  'ORGANIZATION_DELETED',
  'TENANT_CREATED',
  'TENANT_UPDATED',
  'TENANT_DELETED',
  'TENANT_USER_ASSIGNED',
  'TENANT_USER_UNASSIGNED',
  'TICKET_CREATED',
  'TICKET_UPDATED',
  'TICKET_DELETED',
  'TICKET_ASSIGNED',
  'TICKET_STATUS_CHANGED',
  'TICKET_PRIORITY_CHANGED',
  'TICKET_COMMENT_ADDED',
  'KB_ARTICLE_CREATED',
  'KB_ARTICLE_UPDATED',
  'KB_ARTICLE_DELETED',
  'ASSET_CREATED',
  'ASSET_UPDATED',
  'ASSET_DELETED',
  'ASSET_ASSIGNED',
  'CHANGE_CREATED',
  'CHANGE_UPDATED',
  'CHANGE_DELETED',
  'CHANGE_APPROVED',
  'CHANGE_REJECTED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
]

interface AuditConfig {
  id: string
  organizationId: string
  enabled: boolean
  events: string[]
  retentionDays?: number
}

function AuditConfigPageContent() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')

  const [config, setConfig] = useState<AuditConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [organizationId])

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (organizationId) {
        params.append('organizationId', organizationId)
      }

      const response = await fetch(`/api/v1/organizations/audit/config?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audit config')
      }

      const data = await response.json()
      setConfig(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEvent = (eventType: string) => {
    if (!config) return

    const events = config.events.includes(eventType)
      ? config.events.filter((e) => e !== eventType)
      : [...config.events, eventType]

    setConfig({ ...config, events })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/organizations/audit/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: organizationId || config.organizationId,
          enabled: config.enabled,
          events: config.events,
          retentionDays: config.retentionDays || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update audit config')
      }

      setSuccess('Audit configuration updated successfully')
      setConfig(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading audit configuration...</div>
  }

  if (!config) {
    return <div>Audit configuration not found</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Audit Configuration</h1>

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

      {success && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--success)',
          }}
        >
          {success}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                disabled={saving}
              />
              <span>Enable Audit Logging</span>
            </label>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" htmlFor="retentionDays">
              Retention Days (leave empty for forever)
            </label>
            <input
              id="retentionDays"
              type="number"
              className="input"
              value={config.retentionDays || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  retentionDays: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              min="1"
              disabled={saving}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Events to Track</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.5rem',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
              }}
            >
              {AUDIT_EVENT_TYPES.map((eventType) => (
                <label
                  key={eventType}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={config.events.includes(eventType)}
                    onChange={() => handleToggleEvent(eventType)}
                    disabled={saving || !config.enabled}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{eventType}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AuditConfigPage() {
  return (
    <Suspense fallback={<div>Loading audit configuration...</div>}>
      <AuditConfigPageContent />
    </Suspense>
  )
}

