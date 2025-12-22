'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AssetType } from '@prisma/client'
import Link from 'next/link'

interface CustomAssetType {
  id: string
  name: string
  baseType: AssetType
  description?: string
  isActive: boolean
  customFields: CustomField[]
}

interface CustomField {
  id: string
  fieldName: string
  label: string
  fieldType: string
  required: boolean
  defaultValue?: string
  options?: any
  placeholder?: string
  order: number
  isActive: boolean
}

export default function AssetTypesPage() {
  const router = useRouter()
  const [assetTypes, setAssetTypes] = useState<CustomAssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState<CustomAssetType | null>(null)
  const [filterBaseType, setFilterBaseType] = useState<AssetType | ''>('')

  const [formData, setFormData] = useState({
    name: '',
    baseType: 'HARDWARE' as AssetType,
    description: '',
  })

  const [fieldFormData, setFieldFormData] = useState({
    fieldName: '',
    label: '',
    fieldType: 'text' as 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox',
    required: false,
    defaultValue: '',
    placeholder: '',
    options: [] as string[],
    order: 0,
  })

  useEffect(() => {
    loadAssetTypes()
  }, [filterBaseType])

  const loadAssetTypes = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filterBaseType) {
        params.append('baseType', filterBaseType)
      }

      const response = await fetch(`/api/v1/admin/asset-types?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAssetTypes(data.data.assetTypes)
      } else {
        setError(data.error?.message || 'Failed to load asset types')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssetType = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/asset-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setFormData({ name: '', baseType: 'HARDWARE', description: '' })
        loadAssetTypes()
      } else {
        setError(data.error?.message || 'Failed to create asset type')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetType) return

    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/asset-types/${selectedAssetType.id}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...fieldFormData,
          options: fieldFormData.fieldType === 'select' || fieldFormData.fieldType === 'checkbox' ? fieldFormData.options : undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowFieldModal(false)
        setFieldFormData({
          fieldName: '',
          label: '',
          fieldType: 'text',
          required: false,
          defaultValue: '',
          placeholder: '',
          options: [],
          order: 0,
        })
        loadAssetTypes()
      } else {
        setError(data.error?.message || 'Failed to create custom field')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDeleteAssetType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset type?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/asset-types/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        loadAssetTypes()
      } else {
        setError(data.error?.message || 'Failed to delete asset type')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDeleteField = async (assetTypeId: string, fieldId: string) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/asset-types/${assetTypeId}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        loadAssetTypes()
      } else {
        setError(data.error?.message || 'Failed to delete custom field')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading asset types...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Asset Types</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          New Asset Type
        </button>
      </div>

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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Filter by Base Type:</label>
        <select
          value={filterBaseType}
          onChange={(e) => setFilterBaseType(e.target.value as AssetType | '')}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Types</option>
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
          <option value="NETWORK_DEVICE">Network Device</option>
          <option value="CLOUD_RESOURCE">Cloud Resource</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {assetTypes.map((assetType) => (
          <div
            key={assetType.id}
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>{assetType.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Base Type: {assetType.baseType}
                </p>
                {assetType.description && (
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>{assetType.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteAssetType(assetType.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Custom Fields</h3>
                <button
                  onClick={() => {
                    setSelectedAssetType(assetType)
                    setShowFieldModal(true)
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Add Field
                </button>
              </div>

              {assetType.customFields.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No custom fields defined</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {assetType.customFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{field.label}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {field.fieldType} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteField(assetType.id, field.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--error)',
                          border: '1px solid var(--error)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {assetTypes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>No asset types found. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Create Asset Type Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create Asset Type</h2>
            <form onSubmit={handleCreateAssetType} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Laptops, Desktops"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Base Type <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  className="input"
                  value={formData.baseType}
                  onChange={(e) => setFormData({ ...formData, baseType: e.target.value as AssetType })}
                  required
                >
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="NETWORK_DEVICE">Network Device</option>
                  <option value="CLOUD_RESOURCE">Cloud Resource</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Field Modal */}
      {showFieldModal && selectedAssetType && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowFieldModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              Add Custom Field to {selectedAssetType.name}
            </h2>
            <form onSubmit={handleCreateField} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Field Name (Internal) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={fieldFormData.fieldName}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, fieldName: e.target.value })}
                  required
                  placeholder="e.g., screenSize, ram"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Label (Display) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={fieldFormData.label}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                  required
                  placeholder="e.g., Screen Size, RAM"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Field Type <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  className="input"
                  value={fieldFormData.fieldType}
                  onChange={(e) =>
                    setFieldFormData({
                      ...fieldFormData,
                      fieldType: e.target.value as typeof fieldFormData.fieldType,
                      options: e.target.value === 'select' || e.target.value === 'checkbox' ? [] : fieldFormData.options,
                    })
                  }
                  required
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              {(fieldFormData.fieldType === 'select' || fieldFormData.fieldType === 'checkbox') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Options (one per line)
                  </label>
                  <textarea
                    className="input"
                    value={fieldFormData.options.join('\n')}
                    onChange={(e) =>
                      setFieldFormData({
                        ...fieldFormData,
                        options: e.target.value.split('\n').filter((o) => o.trim()),
                      })
                    }
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Placeholder</label>
                <input
                  type="text"
                  className="input"
                  value={fieldFormData.placeholder}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Default Value</label>
                <input
                  type="text"
                  className="input"
                  value={fieldFormData.defaultValue}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="required"
                  checked={fieldFormData.required}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, required: e.target.checked })}
                />
                <label htmlFor="required" style={{ fontWeight: 500 }}>
                  Required Field
                </label>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Order</label>
                <input
                  type="number"
                  className="input"
                  value={fieldFormData.order}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

