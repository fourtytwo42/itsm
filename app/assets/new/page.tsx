'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AssetType } from '@prisma/client'

interface CustomAssetType {
  id: string
  name: string
  baseType: AssetType
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
}

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customAssetTypes, setCustomAssetTypes] = useState<CustomAssetType[]>([])
  const [selectedCustomAssetType, setSelectedCustomAssetType] = useState<CustomAssetType | null>(null)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    name: '',
    type: 'HARDWARE' as AssetType,
    customAssetTypeId: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'ACTIVE',
    location: '',
    building: '',
    floor: '',
    room: '',
    purchaseDate: '',
    purchasePrice: '',
    warrantyExpiry: '',
  })

  useEffect(() => {
    loadCustomAssetTypes()
  }, [formData.type])

  useEffect(() => {
    if (formData.customAssetTypeId) {
      const assetType = customAssetTypes.find((at) => at.id === formData.customAssetTypeId)
      setSelectedCustomAssetType(assetType || null)
      // Initialize custom field values with default values
      if (assetType) {
        const initialValues: Record<string, any> = {}
        assetType.customFields.forEach((field) => {
          if (field.defaultValue) {
            initialValues[field.fieldName] = field.defaultValue
          }
        })
        setCustomFieldValues(initialValues)
      }
    } else {
      setSelectedCustomAssetType(null)
      setCustomFieldValues({})
    }
  }, [formData.customAssetTypeId, customAssetTypes])

  const loadCustomAssetTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/asset-types?baseType=${formData.type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setCustomAssetTypes(data.data.assetTypes)
      }
    } catch (err) {
      // Silently fail - custom asset types are optional
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          customAssetTypeId: formData.customAssetTypeId || undefined,
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : undefined,
          customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/assets/${data.data.asset.id}`)
      } else {
        setError(data.error?.message || 'Failed to create asset')
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/assets" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          ← Back to Assets
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>Create New Asset</h1>

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

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
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
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Base Type <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value as AssetType, customAssetTypeId: '' })
                setSelectedCustomAssetType(null)
                setCustomFieldValues({})
              }}
              required
              disabled={loading}
            >
              <option value="HARDWARE">Hardware</option>
              <option value="SOFTWARE">Software</option>
              <option value="NETWORK_DEVICE">Network Device</option>
              <option value="CLOUD_RESOURCE">Cloud Resource</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={loading}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="RETIRED">Retired</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        {customAssetTypes.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Asset Type (Optional)
            </label>
            <select
              className="input"
              value={formData.customAssetTypeId}
              onChange={(e) => setFormData({ ...formData, customAssetTypeId: e.target.value })}
              disabled={loading}
            >
              <option value="">None (Use base type only)</option>
              {customAssetTypes.map((at) => (
                <option key={at.id} value={at.id}>
                  {at.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCustomAssetType && selectedCustomAssetType.customFields.length > 0 && (
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              Custom Fields for {selectedCustomAssetType.name}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {selectedCustomAssetType.customFields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      {field.label}
                      {field.required && <span style={{ color: 'var(--error)' }}> *</span>}
                    </label>
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        className="input"
                        value={customFieldValues[field.fieldName] || ''}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.fieldName]: e.target.value })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        disabled={loading}
                      />
                    )}
                    {field.fieldType === 'textarea' && (
                      <textarea
                        className="input"
                        value={customFieldValues[field.fieldName] || ''}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.fieldName]: e.target.value })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={3}
                        disabled={loading}
                      />
                    )}
                    {field.fieldType === 'number' && (
                      <input
                        type="number"
                        className="input"
                        value={customFieldValues[field.fieldName] || ''}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.fieldName]: e.target.value })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        disabled={loading}
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="input"
                        value={customFieldValues[field.fieldName] || ''}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.fieldName]: e.target.value })
                        }
                        required={field.required}
                        disabled={loading}
                      />
                    )}
                    {field.fieldType === 'select' && (
                      <select
                        className="input"
                        value={customFieldValues[field.fieldName] || ''}
                        onChange={(e) =>
                          setCustomFieldValues({ ...customFieldValues, [field.fieldName]: e.target.value })
                        }
                        required={field.required}
                        disabled={loading}
                      >
                        <option value="">Select...</option>
                        {Array.isArray(field.options) &&
                          field.options.map((option: string, idx: number) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                      </select>
                    )}
                    {field.fieldType === 'checkbox' && (
                      <div>
                        {Array.isArray(field.options) &&
                          field.options.map((option: string, idx: number) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={
                                  Array.isArray(customFieldValues[field.fieldName])
                                    ? customFieldValues[field.fieldName].includes(option)
                                    : false
                                }
                                onChange={(e) => {
                                  const current = Array.isArray(customFieldValues[field.fieldName])
                                    ? customFieldValues[field.fieldName]
                                    : []
                                  const updated = e.target.checked
                                    ? [...current, option]
                                    : current.filter((v: string) => v !== option)
                                  setCustomFieldValues({ ...customFieldValues, [field.fieldName]: updated })
                                }}
                                disabled={loading}
                              />
                              {option}
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
            <input
              type="text"
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Manufacturer</label>
            <input
              type="text"
              className="input"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Model</label>
            <input
              type="text"
              className="input"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Serial Number</label>
            <input
              type="text"
              className="input"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Location</label>
          <input
            type="text"
            className="input"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Building</label>
            <input
              type="text"
              className="input"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Floor</label>
            <input
              type="text"
              className="input"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Room</label>
            <input
              type="text"
              className="input"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Purchase Date</label>
            <input
              type="datetime-local"
              className="input"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Purchase Price</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Warranty Expiry</label>
            <input
              type="datetime-local"
              className="input"
              value={formData.warrantyExpiry}
              onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}

