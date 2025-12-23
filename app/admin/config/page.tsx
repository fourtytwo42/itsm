'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

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

          {activeTab === 'custom-fields' && <CustomFieldsTab />}

          {activeTab === 'ticket-types' && <TicketTypesTab />}
        </div>
      </div>
    </div>
  )
}

// Custom Fields Component
function CustomFieldsTab() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)
  const [entityType, setEntityType] = useState('ticket')
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    defaultValue: '',
    options: [] as string[],
    order: 0,
  })

  useEffect(() => {
    loadFields()
  }, [entityType])

  const loadFields = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/config/custom-fields?entityType=${entityType}&includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setFields(data.data.fields)
      } else {
        setError(data.error?.message || 'Failed to load custom fields')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken')
      const payload = {
        ...formData,
        entityType,
        options: ['select', 'checkbox'].includes(formData.type) && formData.options.length > 0 ? formData.options : null,
        ...(editingField && { active: editingField.active !== false }),
      }

      const response = await fetch('/api/v1/admin/config/custom-fields', {
        method: editingField ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingField ? { id: editingField.id, ...payload } : payload),
      })

      const data = await response.json()
      if (data.success) {
        setShowModal(false)
        setEditingField(null)
        setFormData({
          name: '',
          label: '',
          type: 'text',
          required: false,
          defaultValue: '',
          options: [],
          order: 0,
        })
        loadFields()
        setError('')
      } else {
        setError(data.error?.message || 'Failed to save custom field')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/config/custom-fields?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        loadFields()
      } else {
        setError(data.error?.message || 'Failed to delete custom field')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const openEditModal = (field: any) => {
    setEditingField({ ...field, active: field.active !== false })
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue || '',
      options: field.options && Array.isArray(field.options) ? field.options : [],
      order: field.order,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingField(null)
    setFormData({
      name: '',
      label: '',
      type: 'text',
      required: false,
      defaultValue: '',
      options: [],
      order: fields.length,
    })
    setShowModal(true)
  }

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'checkbox', label: 'Checkbox' },
  ]

  const entityTypes = [
    { value: 'ticket', label: 'Ticket' },
    { value: 'asset', label: 'Asset' },
    { value: 'change', label: 'Change Request' },
    { value: 'user', label: 'User' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Custom Fields</h2>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="input"
            style={{ padding: '0.5rem', minWidth: '150px' }}
          >
            {entityTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusIcon className="w-5 h-5" />
          Add Custom Field
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          color: 'var(--error)',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading custom fields...</div>
      ) : fields.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No custom fields defined for {entityType}s. Click "Add Custom Field" to create one.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Label</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Type</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Required</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Default Value</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Order</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{field.label}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{field.type}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: field.required ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                      color: field.required ? 'rgb(34, 197, 94)' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}>
                      {field.required ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{field.defaultValue || '-'}</td>
                  <td style={{ padding: '1rem' }}>{field.order}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: field.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: field.active ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}>
                      {field.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(field)}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'var(--error)' }}
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</h2>
              <button onClick={() => setShowModal(false)} className="icon-button">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Field Name (Internal) *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., custom_field_name"
                  required
                  disabled={!!editingField}
                />
                <small style={{ color: 'var(--text-secondary)' }}>Internal identifier (lowercase, underscores only)</small>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Field Label (Display) *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Custom Field Name"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Field Type *</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, options: [] })}
                  required
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {['select', 'checkbox'].includes(formData.type) && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Options (one per line) *</label>
                  <textarea
                    className="input"
                    value={formData.options.join('\n')}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value.split('\n').filter(o => o.trim()) })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>Enter each option on a new line</small>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Default Value</label>
                <input
                  type={formData.type === 'number' ? 'number' : formData.type === 'date' ? 'date' : 'text'}
                  className="input"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  placeholder="Optional default value"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Display Order</label>
                <input
                  type="number"
                  className="input"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  />
                  <span>Required Field</span>
                </label>
              </div>

              {editingField && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingField.active !== false}
                      onChange={(e) => setEditingField({ ...editingField, active: e.target.checked })}
                    />
                    <span>Active</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingField ? 'Update' : 'Create'} Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Ticket Types Component
function TicketTypesTab() {
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    active: true,
  })

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/config/ticket-types?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setTypes(data.data.types)
      } else {
        setError(data.error?.message || 'Failed to load ticket types')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/config/ticket-types', {
        method: editingType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingType ? { id: editingType.id, ...formData } : formData),
      })

      const data = await response.json()
      if (data.success) {
        setShowModal(false)
        setEditingType(null)
        setFormData({
          name: '',
          description: '',
          icon: '',
          color: '#3b82f6',
          active: true,
        })
        loadTypes()
        setError('')
      } else {
        setError(data.error?.message || 'Failed to save ticket type')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket type?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/config/ticket-types?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        loadTypes()
      } else {
        setError(data.error?.message || 'Failed to delete ticket type')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const openEditModal = (type: any) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      icon: type.icon || '',
      color: type.color || '#3b82f6',
      active: type.active !== false,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingType(null)
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6',
      active: true,
    })
    setShowModal(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Ticket Types</h2>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusIcon className="w-5 h-5" />
          Add Ticket Type
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          color: 'var(--error)',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading ticket types...</div>
      ) : types.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No ticket types defined. Click "Add Ticket Type" to create one.
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Name</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Description</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Icon</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Color</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{type.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{type.description || '-'}</td>
                  <td style={{ padding: '1rem' }}>{type.icon || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    {type.color && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: type.color,
                            border: '1px solid var(--border-color)',
                          }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{type.color}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: type.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: type.active ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}>
                      {type.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(type)}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'var(--error)' }}
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{editingType ? 'Edit Ticket Type' : 'Add Ticket Type'}</h2>
              <button onClick={() => setShowModal(false)} className="icon-button">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Incident, Request, Problem"
                  required
                  disabled={!!editingType}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this ticket type"
                  rows={3}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Icon (Identifier)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., bug, question, exclamation"
                />
                <small style={{ color: 'var(--text-secondary)' }}>Icon identifier for UI display</small>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    className="input"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{ width: '80px', height: '40px', padding: '0.25rem' }}
                  />
                  <input
                    type="text"
                    className="input"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {editingType && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span>Active</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingType ? 'Update' : 'Create'} Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

