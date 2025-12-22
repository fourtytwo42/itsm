'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgAdmin, setOrgAdmin] = useState<{ email: string; defaultPassword: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/global/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization')
      }

      setOrgAdmin({
        email: data.orgAdmin.email,
        defaultPassword: data.orgAdmin.defaultPassword,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData({ ...formData, slug })
  }

  if (orgAdmin) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ marginBottom: '1rem' }}>Organization Created</h1>
          <p style={{ marginBottom: '1.5rem' }}>
            Organization <strong>{formData.name}</strong> has been created successfully.
          </p>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Organization Admin Credentials</h3>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {orgAdmin.email}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Default Password:</strong> {orgAdmin.defaultPassword}
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Please save these credentials. The admin will be required to change their password on first login.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/global/organizations" className="btn btn-primary">
              View Organizations
            </Link>
            <button
              className="btn"
              onClick={() => {
                setOrgAdmin(null)
                setFormData({ name: '', slug: '', description: '', isActive: true })
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/global/organizations" className="btn">
          ← Back to Organizations
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Create Organization</h1>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="name">
              Organization Name *
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="slug">
              Slug *
            </label>
            <input
              id="slug"
              type="text"
              className="input"
              value={formData.slug}
              onChange={handleSlugChange}
              required
              pattern="[a-z0-9-]+"
              disabled={loading}
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Lowercase letters, numbers, and hyphens only. Used for organization admin email: admin@[slug].demo
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={loading}
              />
              <span>Active</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
            <Link href="/global/organizations" className="btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

