'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  isActive: boolean
}

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/organizations/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      setOrganization(data.organization)
      if (data.organization?.logo) {
        setLogoPreview(data.organization.logo)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadLogo = async () => {
    if (!logoFile || !organization) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('file', logoFile)
      formData.append('organizationId', organization.id)

      const response = await fetch('/api/v1/organizations/upload-logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }

      setSuccess('Logo uploaded successfully')
      setLogoFile(null)
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl)
        setOrganization({ ...organization, logo: data.logoUrl })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/global/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: organization.name,
          description: organization.description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization')
      }

      setSuccess('Organization updated successfully')
      setOrganization(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading organization settings...</div>
  }

  if (!organization) {
    return <div>Organization not found</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Organization Settings</h1>

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

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Logo</h2>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Organization logo"
              style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ marginBottom: '1rem' }}
              disabled={saving}
            />
            {logoFile && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUploadLogo}
                disabled={saving}
              >
                {saving ? 'Uploading...' : 'Upload Logo'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Organization Details</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="name">
              Organization Name
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              required
              disabled={saving}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              type="text"
              className="input"
              value={organization.slug}
              disabled
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Slug cannot be changed after creation
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input"
              value={organization.description || ''}
              onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
              rows={4}
              disabled={saving}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

