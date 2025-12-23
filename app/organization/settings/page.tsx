'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmailProtocol, EmailEncryption } from '@prisma/client'

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
  const [activeTab, setActiveTab] = useState<'details' | 'email'>('details')
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailFormData, setEmailFormData] = useState<{
    providerName: string
    protocol: EmailProtocol
    host: string
    port: number
    username: string
    password: string
    encryption: EmailEncryption
    pollingIntervalMinutes: number
  }>({
    providerName: '',
    protocol: EmailProtocol.SMTP,
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: EmailEncryption.TLS,
    pollingIntervalMinutes: 5,
  })

  useEffect(() => {
    fetchOrganization()
    if (activeTab === 'email') {
      fetchEmailConfig()
    }
  }, [activeTab])

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

  const fetchEmailConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/organizations/email-config', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No email config exists yet, that's fine
          setEmailConfig(null)
          return
        }
        throw new Error('Failed to fetch email configuration')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setEmailConfig(data.data)
        setEmailFormData({
          providerName: data.data.providerName || '',
          protocol: data.data.protocol,
          host: data.data.host || '',
          port: data.data.port || 587,
          username: data.data.username || '',
          password: '', // Don't populate password
          encryption: data.data.encryption || EmailEncryption.TLS,
          pollingIntervalMinutes: data.data.pollingIntervalMinutes || 5,
        })
      } else {
        setEmailConfig(null)
      }
    } catch (err: any) {
      console.error('Error fetching email config:', err)
      setEmailConfig(null)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEmail(true)
    setEmailError('')
    setEmailSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/organizations/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save email configuration')
      }

      setEmailSuccess('Email configuration saved successfully')
      setEmailConfig(data.data)
    } catch (err: any) {
      setEmailError(err.message)
    } finally {
      setSavingEmail(false)
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
      const response = await fetch('/api/v1/organizations/me', {
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
      setOrganization(data.organization || data)
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
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Organization Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'details' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            color: activeTab === 'details' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'details' ? 600 : 400,
          }}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('email')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'email' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            color: activeTab === 'email' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'email' ? 600 : 400,
          }}
        >
          Email (SMTP)
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

      {activeTab === 'details' && (
        <>
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
        </>
      )}

      {activeTab === 'email' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>SMTP Email Configuration</h2>

          {emailError && (
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
              {emailError}
            </div>
          )}

          {emailSuccess && (
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
              {emailSuccess}
            </div>
          )}

          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="providerName">
                Provider Name (Optional)
              </label>
              <input
                id="providerName"
                type="text"
                className="input"
                value={emailFormData.providerName}
                onChange={(e) => setEmailFormData({ ...emailFormData, providerName: e.target.value })}
                placeholder="e.g., Gmail, SendGrid, AWS SES"
                disabled={savingEmail}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="protocol">
                Protocol *
              </label>
              <select
                id="protocol"
                className="input"
                value={emailFormData.protocol}
                onChange={(e) => setEmailFormData({ ...emailFormData, protocol: e.target.value as EmailProtocol })}
                required
                disabled={savingEmail}
              >
                <option value={EmailProtocol.SMTP}>SMTP</option>
                <option value={EmailProtocol.IMAP}>IMAP</option>
                <option value={EmailProtocol.POP3}>POP3</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="host">
                SMTP Host *
              </label>
              <input
                id="host"
                type="text"
                className="input"
                value={emailFormData.host}
                onChange={(e) => setEmailFormData({ ...emailFormData, host: e.target.value })}
                placeholder="e.g., smtp.gmail.com, smtp.sendgrid.net"
                required
                disabled={savingEmail}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="port">
                Port *
              </label>
              <input
                id="port"
                type="number"
                className="input"
                value={emailFormData.port}
                onChange={(e) => setEmailFormData({ ...emailFormData, port: parseInt(e.target.value) || 587 })}
                min="1"
                max="65535"
                required
                disabled={savingEmail}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
              </small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="username">
                Username / Email *
              </label>
              <input
                id="username"
                type="text"
                className="input"
                value={emailFormData.username}
                onChange={(e) => setEmailFormData({ ...emailFormData, username: e.target.value })}
                placeholder="your-email@example.com"
                required
                disabled={savingEmail}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={emailFormData.password}
                onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                placeholder={emailConfig ? 'Leave blank to keep current password' : 'Enter SMTP password'}
                required={!emailConfig}
                disabled={savingEmail}
              />
              {emailConfig && (
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Leave blank to keep the current password
                </small>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="encryption">
                Encryption *
              </label>
              <select
                id="encryption"
                className="input"
                value={emailFormData.encryption}
                onChange={(e) => setEmailFormData({ ...emailFormData, encryption: e.target.value as EmailEncryption })}
                required
                disabled={savingEmail}
              >
                <option value={EmailEncryption.NONE}>None</option>
                <option value={EmailEncryption.SSL}>SSL</option>
                <option value={EmailEncryption.TLS}>TLS</option>
              </select>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                Recommended: TLS (port 587) or SSL (port 465)
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="pollingIntervalMinutes">
                Polling Interval (Minutes)
              </label>
              <input
                id="pollingIntervalMinutes"
                type="number"
                className="input"
                value={emailFormData.pollingIntervalMinutes}
                onChange={(e) => setEmailFormData({ ...emailFormData, pollingIntervalMinutes: parseInt(e.target.value) || 5 })}
                min="1"
                max="60"
                disabled={savingEmail}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                How often to check for new emails (for IMAP/POP3)
              </small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingEmail}>
              {savingEmail ? 'Saving...' : emailConfig ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

