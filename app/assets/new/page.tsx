'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AssetType {
  id: string
  name: string
  description?: string
  customFields?: Field[]
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

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null)
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; email: string; firstName?: string; lastName?: string; role?: string; roles?: string[] }>>([])
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    name: '',
    tenantId: '',
    customAssetTypeId: '',
    assignedToId: '',
    status: 'ACTIVE',
  })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; firstName?: string; lastName?: string } | null>(null)

  useEffect(() => {
    loadTenants()
    loadAssetTypes()
    loadUsers()
  }, [])

  useEffect(() => {
    if (formData.customAssetTypeId) {
      const assetType = assetTypes.find((at) => at.id === formData.customAssetTypeId)
      setSelectedAssetType(assetType || null)
      // Initialize field values with default values
      if (assetType && assetType.customFields) {
        const initialValues: Record<string, any> = {}
        assetType.customFields.forEach((field) => {
          if (field.defaultValue) {
            initialValues[field.fieldName] = field.defaultValue
          }
        })
        setFieldValues(initialValues)
      }
    } else {
      setSelectedAssetType(null)
      setFieldValues({})
    }
  }, [formData.customAssetTypeId, assetTypes])

  const loadTenants = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        const tenantsList = data.data?.tenants || data.data || []
        setTenants(tenantsList)
      }
    } catch (err) {
      console.error('Failed to load tenants:', err)
    }
  }

  const loadAssetTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/asset-types?isActive=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAssetTypes(data.data.assetTypes)
      }
    } catch (err) {
      console.error('Failed to load asset types:', err)
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
        // Filter to only END_USER roles
        const endUsers = usersList.filter((user: any) => 
          user.role === 'END_USER' || user.roles?.includes('END_USER')
        )
        setUsers(endUsers)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  useEffect(() => {
    if (formData.assignedToId && users.length > 0) {
      const user = users.find(u => u.id === formData.assignedToId)
      if (user) {
        setSelectedUser(user)
        setUserSearchQuery(user.firstName || user.lastName 
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
          : user.email)
      }
    } else if (!formData.assignedToId) {
      setSelectedUser(null)
      setUserSearchQuery('')
    }
  }, [formData.assignedToId, users])

  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery) return false
    const query = userSearchQuery.toLowerCase()
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
    const email = user.email.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  const handleUserSelect = (user: { id: string; email: string; firstName?: string; lastName?: string }) => {
    setSelectedUser(user)
    setFormData({ ...formData, assignedToId: user.id })
    setUserSearchQuery(user.firstName || user.lastName 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
      : user.email)
    setShowUserSuggestions(false)
  }

  const handleUserRemove = () => {
    setSelectedUser(null)
    setFormData({ ...formData, assignedToId: '' })
    setUserSearchQuery('')
    setShowUserSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.customAssetTypeId) {
      setError('Please select an asset type')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          tenantId: formData.tenantId || undefined,
          customAssetTypeId: formData.customAssetTypeId,
          assignedToId: formData.assignedToId || undefined,
          status: formData.status,
          customFields: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
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

  const renderField = (field: Field) => {
    const value = fieldValues[field.fieldName] || field.defaultValue || ''

    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            className="input"
            value={value}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            disabled={loading}
            rows={4}
          />
        )
      case 'select':
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <select
            className="input"
            value={value}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value })}
            required={field.required}
            disabled={loading}
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
        return (
          <div>
            {checkboxOptions.map((option: string, idx: number) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(fieldValues[field.fieldName]) ? fieldValues[field.fieldName].includes(option) : false}
                  onChange={(e) => {
                    const current = Array.isArray(fieldValues[field.fieldName]) ? fieldValues[field.fieldName] : []
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter((v: string) => v !== option)
                    setFieldValues({ ...fieldValues, [field.fieldName]: updated })
                  }}
                  disabled={loading}
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
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            required={field.required}
            disabled={loading}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            className="input"
            value={value}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            disabled={loading}
          />
        )
      default:
        return (
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            disabled={loading}
          />
        )
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

      {assetTypes.length === 0 && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            No asset types found. Please{' '}
            <Link href="/admin/asset-types" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
              create an asset type
            </Link>{' '}
            first before creating assets.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Tenant (Optional)
          </label>
          <select
            className="input"
            value={formData.tenantId}
            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
            disabled={loading}
          >
            <option value="">No tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Asset Type <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <select
            className="input"
            value={formData.customAssetTypeId}
            onChange={(e) => setFormData({ ...formData, customAssetTypeId: e.target.value })}
            required
            disabled={loading || assetTypes.length === 0}
          >
            <option value="">Select an asset type...</option>
            {assetTypes.map((at) => (
              <option key={at.id} value={at.id}>
                {at.name}
              </option>
            ))}
          </select>
          {selectedAssetType?.description && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {selectedAssetType.description}
            </p>
          )}
        </div>

        {selectedAssetType && (
          <>
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

              <div style={{ position: 'relative' }} data-user-search>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assign To User (Optional)</label>
                {selectedUser ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <span>
                      {selectedUser.firstName || selectedUser.lastName
                        ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                        : selectedUser.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleUserRemove}
                      disabled={loading}
                      style={{
                        marginLeft: 'auto',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '1.25rem',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove user"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="input"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value)
                        setShowUserSuggestions(true)
                        setFormData({ ...formData, assignedToId: '' })
                      }}
                      onFocus={() => setShowUserSuggestions(true)}
                      placeholder="Type to search for a user..."
                      disabled={loading}
                    />
                    {showUserSuggestions && userSearchQuery && filteredUsers.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : user.email}
                            </div>
                            {(user.firstName || user.lastName) && (
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {user.email}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedAssetType.customFields && selectedAssetType.customFields.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedAssetType.customFields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        {field.label}
                        {field.required && <span style={{ color: 'var(--error)' }}> *</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

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
          <button type="submit" className="btn btn-primary" disabled={loading || !selectedAssetType}>
            {loading ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}
