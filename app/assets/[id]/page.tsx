'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AssetStatus } from '@prisma/client'

interface Asset {
  id: string
  assetNumber: string
  name: string
  type: string
  status: string
  assignedTo?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  customAssetType?: {
    id: string
    name: string
    fields: Field[]
  }
  customFields?: Record<string, any>
  relationships?: Array<{
    id: string
    relationshipType: string
    targetAsset: {
      id: string
      assetNumber: string
      name: string
    }
  }>
  relatedAssets?: Array<{
    id: string
    relationshipType: string
    sourceAsset: {
      id: string
      assetNumber: string
      name: string
    }
  }>
}

interface Field {
  id: string
  fieldName: string
  label: string
  fieldType: string
  required: boolean
  defaultValue?: string
  options?: any
  placeholder?: string
  order: number
}

interface AuditLog {
  id: string
  eventType: string
  description: string
  userEmail: string
  createdAt: string
  metadata?: any
  user?: {
    firstName?: string
    lastName?: string
  }
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  createdAt: string
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; email: string; firstName?: string; lastName?: string }>>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Editable fields state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})

  useEffect(() => {
    if (params.id) {
      loadAsset(params.id as string)
      loadUsers()
      loadHistory(params.id as string)
      loadTickets(params.id as string)
    }
  }, [params.id])

  const loadAsset = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAsset(data.data.asset)
        // Initialize edit values
        setEditValues({
          assignedToId: data.data.asset.assignedTo?.id || '',
        })
      }
    } catch (error) {
      console.error('Failed to load asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        const usersList = data.data?.users || data.data || []
        setUsers(usersList)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadHistory = async (assetId: string) => {
    try {
      setLoadingHistory(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/organizations/audit?entityType=Asset&entityId=${assetId}&limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadTickets = async (assetId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets/${assetId}/tickets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success && data.data) {
        setTickets(data.data)
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    }
  }

  const handleSaveField = async (field: string) => {
    if (!asset) return

    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken')
      
      const updateData: any = {}
      
      if (field === 'assignedToId') {
        updateData.assignedToId = editValues[field] || null
      } else if (field === 'name') {
        updateData.name = editValues[field]
      } else if (field === 'status') {
        updateData.status = editValues[field]
      } else if (field.startsWith('customField_')) {
        // Custom field update
        const fieldName = field.replace('customField_', '')
        const currentCustomFields = asset.customFields || {}
        updateData.customFields = {
          ...currentCustomFields,
          [fieldName]: editValues[field],
        }
      }

      const response = await fetch(`/api/v1/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      if (data.success) {
        await loadAsset(asset.id)
        await loadHistory(asset.id)
        setEditingField(null)
      } else {
        alert(data.error?.message || 'Failed to update asset')
      }
    } catch (err) {
      alert('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditValues({ ...editValues, [field]: currentValue })
  }

  const cancelEditing = () => {
    setEditingField(null)
  }

  const formatChangeDetails = (log: AuditLog): string => {
    if (!log.metadata) return log.description

    const meta = log.metadata
    
    // Handle assignment changes
    if (log.eventType === 'ASSET_ASSIGNED' && (meta.oldAssigneeId || meta.newAssigneeId)) {
      const oldUser = meta.oldAssigneeId ? users.find(u => u.id === meta.oldAssigneeId) : null
      const newUser = meta.newAssigneeId ? users.find(u => u.id === meta.newAssigneeId) : null
      const oldName = oldUser ? (oldUser.firstName || oldUser.lastName ? `${oldUser.firstName || ''} ${oldUser.lastName || ''}`.trim() : oldUser.email) : 'Unassigned'
      const newName = newUser ? (newUser.firstName || newUser.lastName ? `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() : newUser.email) : 'Unassigned'
      return `Assignment changed from "${oldName}" to "${newName}"`
    }

    // Handle general updates with changes object
    if (meta.changes && typeof meta.changes === 'object') {
      const changes: string[] = []
      Object.keys(meta.changes).forEach(key => {
        const change = meta.changes[key]
        if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
          const oldValue = change.old === null || change.old === undefined ? 'empty' : String(change.old)
          const newValue = change.new === null || change.new === undefined ? 'empty' : String(change.new)
          const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
          changes.push(`${fieldLabel}: "${oldValue}" → "${newValue}"`)
        } else if (change !== undefined && change !== null) {
          const oldValue = asset && (asset as any)[key] !== undefined ? String((asset as any)[key]) : 'empty'
          const newValue = String(change)
          const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
          if (oldValue !== newValue) {
            changes.push(`${fieldLabel}: "${oldValue}" → "${newValue}"`)
          }
        }
      })
      if (changes.length > 0) {
        return changes.join(' | ')
      }
    }

    return log.description
  }

  const renderFieldInput = (field: Field, value: any, isEditing: boolean) => {
    if (!isEditing) {
      return null
    }

    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            className="input"
            value={editValues[`customField_${field.fieldName}`] || value || ''}
            onChange={(e) => setEditValues({ ...editValues, [`customField_${field.fieldName}`]: e.target.value })}
            disabled={saving}
            rows={4}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          />
        )
      case 'select':
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <select
            className="input"
            value={editValues[`customField_${field.fieldName}`] || value || ''}
            onChange={(e) => setEditValues({ ...editValues, [`customField_${field.fieldName}`]: e.target.value })}
            disabled={saving}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          >
            <option value="">Select...</option>
            {options.map((option: string, idx: number) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        const checkboxOptions = Array.isArray(field.options) ? field.options : []
        const currentValues = Array.isArray(editValues[`customField_${field.fieldName}`] || value) 
          ? editValues[`customField_${field.fieldName}`] || value 
          : []
        return (
          <div>
            {checkboxOptions.map((option: string, idx: number) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={currentValues.includes(option)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option)
                    setEditValues({ ...editValues, [`customField_${field.fieldName}`]: updated })
                  }}
                  disabled={saving}
                />
                {option}
              </label>
            ))}
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            className="input"
            value={editValues[`customField_${field.fieldName}`] || (value ? new Date(value).toISOString().split('T')[0] : '')}
            onChange={(e) => setEditValues({ ...editValues, [`customField_${field.fieldName}`]: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            disabled={saving}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            className="input"
            value={editValues[`customField_${field.fieldName}`] || value || ''}
            onChange={(e) => setEditValues({ ...editValues, [`customField_${field.fieldName}`]: e.target.value })}
            disabled={saving}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          />
        )
      default:
        return (
          <input
            type="text"
            className="input"
            value={editValues[`customField_${field.fieldName}`] || value || ''}
            onChange={(e) => setEditValues({ ...editValues, [`customField_${field.fieldName}`]: e.target.value })}
            disabled={saving}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          />
        )
    }
  }

  const InlineField = ({ 
    label, 
    field, 
    value, 
    type = 'text',
    options,
    readOnly = false 
  }: { 
    label: string
    field: string
    value: any
    type?: 'text' | 'select' | 'date' | 'number'
    options?: Array<{ value: string; label: string }>
    readOnly?: boolean
  }) => {
    const isEditing = editingField === field
    const displayValue = value || (type === 'date' ? '' : 'Not set')

    if (readOnly) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
          <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}:</strong>
          <span style={{ fontSize: '0.875rem' }}>{displayValue}</span>
        </div>
      )
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '1rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}:</strong>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {type === 'select' && options ? (
              <select
                className="input"
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                disabled={saving}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              >
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : type === 'date' ? (
              <input
                type="date"
                className="input"
                value={editValues[field] ? new Date(editValues[field]).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value ? new Date(e.target.value).toISOString() : null })}
                disabled={saving}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              />
            ) : type === 'number' ? (
              <input
                type="number"
                step="0.01"
                className="input"
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                disabled={saving}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              />
            ) : (
              <input
                type="text"
                className="input"
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                disabled={saving}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              />
            )}
            <button
              className="btn btn-primary"
              onClick={() => handleSaveField(field)}
              disabled={saving}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={cancelEditing}
              disabled={saving}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', flex: 1 }}>{displayValue}</span>
            <button
              onClick={() => startEditing(field, value)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading asset...</div>
  }

  if (!asset) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Asset not found</p>
        <Link href="/assets">Back to Assets</Link>
      </div>
    )
  }

  const customFields = asset.customFields || {}
  const assetTypeFields = asset.customAssetType?.fields || []

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/assets" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to Assets
        </Link>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Asset Number: <strong>{asset.assetNumber}</strong>
        </div>
      </div>

      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>{asset.name}</h1>

      {/* Default Fields */}
      <div
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Asset Information</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <InlineField label="Asset Number" field="assetNumber" value={asset.assetNumber} readOnly />
          <InlineField label="Name" field="name" value={asset.name} />
          <InlineField 
            label="Type" 
            field="type" 
            value={asset.customAssetType?.name || asset.type || 'N/A'} 
            readOnly 
          />
          <InlineField 
            label="Status" 
            field="status" 
            value={asset.status} 
            type="select"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'RETIRED', label: 'Retired' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '1rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Assigned To:</strong>
            {editingField === 'assignedToId' ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="input"
                  value={editValues.assignedToId || ''}
                  onChange={(e) => setEditValues({ ...editValues, assignedToId: e.target.value })}
                  disabled={saving}
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
                >
                  <option value="">Unassigned</option>
                  {users
                    .filter((user: any) => user.role === 'END_USER' || user.roles?.includes('END_USER'))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : user.email}
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSaveField('assignedToId')}
                  disabled={saving}
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', flex: 1 }}>
                  {asset.assignedTo
                    ? `${asset.assignedTo.firstName || ''} ${asset.assignedTo.lastName || ''}`.trim() || asset.assignedTo.email
                    : 'Unassigned'}
                </span>
                <button
                  onClick={() => startEditing('assignedToId', asset.assignedTo?.id || '')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Type Fields */}
      {assetTypeFields.length > 0 && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
            {asset.customAssetType?.name} Fields
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {assetTypeFields
              .sort((a, b) => a.order - b.order)
              .map((field) => {
                const fieldKey = `customField_${field.fieldName}`
                const isEditing = editingField === fieldKey
                const value = customFields[field.fieldName]

                return (
                  <div key={field.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '1rem', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {field.label}
                        {field.required && <span style={{ color: 'var(--error)' }}> *</span>}
                      </strong>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            {renderFieldInput(field, value, true)}
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSaveField(fieldKey)}
                            disabled={saving}
                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={cancelEditing}
                            disabled={saving}
                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', flex: 1 }}>
                            {field.fieldType === 'checkbox' && Array.isArray(value)
                              ? value.join(', ')
                              : field.fieldType === 'date' && value
                              ? new Date(value).toLocaleDateString()
                              : value || 'Not set'}
                          </span>
                          <button
                            onClick={() => startEditing(fieldKey, value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              color: 'var(--accent-primary)',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Relationships */}
      {(asset.relationships && asset.relationships.length > 0) ||
      (asset.relatedAssets && asset.relatedAssets.length > 0) ? (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Relationships</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {asset.relationships?.map((rel) => (
              <div key={rel.id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px' }}>
                <strong style={{ fontSize: '0.875rem' }}>{rel.relationshipType}:</strong>{' '}
                <Link href={`/assets/${rel.targetAsset.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  {rel.targetAsset.assetNumber} - {rel.targetAsset.name}
                </Link>
              </div>
            ))}
            {asset.relatedAssets?.map((rel) => (
              <div key={rel.id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px' }}>
                <strong style={{ fontSize: '0.875rem' }}>{rel.relationshipType}:</strong>{' '}
                <Link href={`/assets/${rel.sourceAsset.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  {rel.sourceAsset.assetNumber} - {rel.sourceAsset.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Related Tickets */}
      {tickets.length > 0 && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Related Tickets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tickets.map((ticket) => (
              <div key={ticket.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)' }}>
                <Link href={`/tickets/${ticket.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  {ticket.ticketNumber} - {ticket.subject}
                </Link>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Status: {ticket.status} | Priority: {ticket.priority} | Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Change History</h2>
        {loadingHistory ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : auditLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {log.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </strong>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      By: {log.user?.firstName || log.user?.lastName 
                        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()
                        : log.userEmail}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
                  {formatChangeDetails(log)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No history available</div>
        )}
      </div>
    </div>
  )
}
