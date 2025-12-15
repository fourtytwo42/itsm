'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SystemConfig {
  registrationEnabled: boolean
  passwordResetEnabled: boolean
  ssoEnabled: boolean
  ssoProvider?: 'oauth2' | 'saml'
  ssoConfig?: Record<string, any>
  ldapEnabled: boolean
  ldapConfig?: Record<string, any>
  emailNotificationsEnabled: boolean
  emailFromAddress: string
  emailFromName: string
  maxFileSize: number
  allowedFileTypes: string[]
  organizationName: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  faviconUrl?: string
  defaultTicketPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  autoAssignEnabled: boolean
  autoAssignMethod?: 'round-robin' | 'least-busy' | 'random'
  maintenanceMode: boolean
  maintenanceMessage?: string
  sessionTimeout: number
}

export default function ConfigPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'email' | 'files' | 'branding' | 'tickets' | 'custom-fields' | 'ticket-types'>('general')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')

    if (!storedUser || !token) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)

      if (!userData.roles.includes('ADMIN')) {
        router.push('/dashboard')
        return
      }

      loadConfig()
    } catch (err) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/v1/admin/config', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to load configuration')
      }

      const data = await res.json()
      if (data.success) {
        setConfig(data.data.config)
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/v1/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      })

      if (!res.ok) {
        throw new Error('Failed to save configuration')
      }

      alert('Configuration saved successfully!')
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<SystemConfig>) => {
    if (!config) return
    setConfig({ ...config, ...updates })
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!user || !config) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>System Configuration</h1>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            {(['general', 'auth', 'email', 'files', 'branding', 'tickets', 'custom-fields', 'ticket-types'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {activeTab === 'general' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>General Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={config.organizationName}
                    onChange={(e) => updateConfig({ organizationName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.maintenanceMode}
                      onChange={(e) => updateConfig({ maintenanceMode: e.target.checked })}
                    />
                    Maintenance Mode
                  </label>
                </div>
                {config.maintenanceMode && (
                  <div>
                    <label>Maintenance Message</label>
                    <textarea
                      value={config.maintenanceMessage || ''}
                      onChange={(e) => updateConfig({ maintenanceMessage: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', minHeight: '100px' }}
                    />
                  </div>
                )}
                <div>
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => updateConfig({ sessionTimeout: parseInt(e.target.value) || 1440 })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Authentication Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.registrationEnabled}
                      onChange={(e) => updateConfig({ registrationEnabled: e.target.checked })}
                    />
                    Enable User Registration
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.passwordResetEnabled}
                      onChange={(e) => updateConfig({ passwordResetEnabled: e.target.checked })}
                    />
                    Enable Password Reset
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.ssoEnabled}
                      onChange={(e) => updateConfig({ ssoEnabled: e.target.checked })}
                    />
                    Enable SSO
                  </label>
                </div>
                {config.ssoEnabled && (
                  <>
                    <div>
                      <label>SSO Provider</label>
                      <select
                        value={config.ssoProvider || 'oauth2'}
                        onChange={(e) => updateConfig({ ssoProvider: e.target.value as 'oauth2' | 'saml' })}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                      >
                        <option value="oauth2">OAuth2</option>
                        <option value="saml">SAML</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.ldapEnabled}
                      onChange={(e) => updateConfig({ ldapEnabled: e.target.checked })}
                    />
                    Enable LDAP/Active Directory
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Email Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.emailNotificationsEnabled}
                      onChange={(e) => updateConfig({ emailNotificationsEnabled: e.target.checked })}
                    />
                    Enable Email Notifications
                  </label>
                </div>
                <div>
                  <label>From Address</label>
                  <input
                    type="email"
                    value={config.emailFromAddress}
                    onChange={(e) => updateConfig({ emailFromAddress: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label>From Name</label>
                  <input
                    type="text"
                    value={config.emailFromName}
                    onChange={(e) => updateConfig({ emailFromName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>File Upload Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Max File Size (bytes)</label>
                  <input
                    type="number"
                    value={config.maxFileSize}
                    onChange={(e) => updateConfig({ maxFileSize: parseInt(e.target.value) || 104857600 })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Current: {(config.maxFileSize / 1024 / 1024).toFixed(2)} MB
                  </small>
                </div>
                <div>
                  <label>Allowed File Types (comma-separated, * for all)</label>
                  <input
                    type="text"
                    value={config.allowedFileTypes.join(', ')}
                    onChange={(e) =>
                      updateConfig({
                        allowedFileTypes: e.target.value.split(',').map((t) => t.trim()),
                      })
                    }
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Branding</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Logo URL</label>
                  <input
                    type="url"
                    value={config.logoUrl || ''}
                    onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label>Primary Color (hex)</label>
                  <input
                    type="color"
                    value={config.primaryColor || '#3b82f6'}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label>Secondary Color (hex)</label>
                  <input
                    type="color"
                    value={config.secondaryColor || '#8b5cf6'}
                    onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label>Favicon URL</label>
                  <input
                    type="url"
                    value={config.faviconUrl || ''}
                    onChange={(e) => updateConfig({ faviconUrl: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Ticket Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Default Ticket Priority</label>
                  <select
                    value={config.defaultTicketPriority}
                    onChange={(e) => updateConfig({ defaultTicketPriority: e.target.value as any })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={config.autoAssignEnabled}
                      onChange={(e) => updateConfig({ autoAssignEnabled: e.target.checked })}
                    />
                    Enable Auto-Assignment
                  </label>
                </div>
                {config.autoAssignEnabled && (
                  <div>
                    <label>Auto-Assignment Method</label>
                    <select
                      value={config.autoAssignMethod || 'round-robin'}
                      onChange={(e) => updateConfig({ autoAssignMethod: e.target.value as any })}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    >
                      <option value="round-robin">Round Robin</option>
                      <option value="least-busy">Least Busy</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'custom-fields' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Custom Fields</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Custom fields functionality will be available in the next update.
              </p>
            </div>
          )}

          {activeTab === 'ticket-types' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Ticket Types</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Ticket types functionality will be available in the next update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

