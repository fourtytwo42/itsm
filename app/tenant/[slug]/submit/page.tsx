'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  slug: string
  requiresLogin: boolean
  categories: string[]
  customFields: Array<{
    id: string
    label: string
    fieldType: string
    required: boolean
    options?: string[]
    placeholder?: string
  }>
}

export default function SubmitTicketPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    description: '',
    customFields: {} as Record<string, any>,
  })

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')
    setIsAuthenticated(!!token)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        setFormData((prev) => ({
          ...prev,
          name: parsed.firstName && parsed.lastName ? `${parsed.firstName} ${parsed.lastName}` : parsed.email?.split('@')[0] || '',
          email: parsed.email || '',
        }))
      } catch (e) {
        // Invalid user data
      }
    }

    loadTenant()
  }, [slug])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/tenants/${slug}`)
      const data = await response.json()

      if (data.success) {
        setTenant(data.data)

        // Check if login is required
        if (data.data.requiresLogin && !isAuthenticated) {
          router.push(`/login?redirect=/tenant/${slug}/submit`)
        }
      } else {
        setError(data.error?.message || 'Tenant not found')
      }
    } catch (err) {
      setError('Failed to load tenant')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const publicToken = localStorage.getItem('publicToken')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else if (publicToken) {
        headers['Authorization'] = `Bearer ${publicToken}`
      } else {
        // Generate public token if we don't have one
        const tokenResponse = await fetch('/api/v1/public/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenant?.id }),
        })
        const tokenData = await tokenResponse.json()
        if (tokenData.success) {
          localStorage.setItem('publicToken', tokenData.data.token)
          localStorage.setItem('publicTokenId', tokenData.data.publicId)
          headers['Authorization'] = `Bearer ${tokenData.data.token}`
        }
      }

      const response = await fetch(`/api/v1/tenants/${slug}/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          name: formData.name,
          email: formData.email,
          customFields: formData.customFields,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTicketNumber(data.data.ticketNumber)
        setSuccess(true)
      } else {
        setError(data.error?.message || 'Failed to submit ticket')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const renderCustomField = (field: Tenant['customFields'][0]) => {
    switch (field.fieldType) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
        return (
          <input
            type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
            required={field.required}
            value={formData.customFields[field.id] || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customFields: { ...formData.customFields, [field.id]: e.target.value },
              })
            }
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        )
      case 'TEXTAREA':
        return (
          <textarea
            required={field.required}
            value={formData.customFields[field.id] || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customFields: { ...formData.customFields, [field.id]: e.target.value },
              })
            }
            placeholder={field.placeholder}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        )
      case 'NUMBER':
        return (
          <input
            type="number"
            required={field.required}
            value={formData.customFields[field.id] || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customFields: { ...formData.customFields, [field.id]: e.target.value },
              })
            }
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        )
      case 'DATE':
        return (
          <input
            type="date"
            required={field.required}
            value={formData.customFields[field.id] || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customFields: { ...formData.customFields, [field.id]: e.target.value },
              })
            }
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        )
      case 'SELECT':
        return (
          <select
            required={field.required}
            value={formData.customFields[field.id] || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                customFields: { ...formData.customFields, [field.id]: e.target.value },
              })
            }
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case 'CHECKBOX':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.customFields[field.id] || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customFields: { ...formData.customFields, [field.id]: e.target.checked },
                })
              }
              style={{ width: '18px', height: '18px' }}
            />
            <span>{field.placeholder || 'Yes'}</span>
          </label>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tenant Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--success)' }}>Ticket Submitted!</h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your ticket number is:</p>
            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                marginBottom: '2rem',
              }}
            >
              {ticketNumber}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              We've received your request and will get back to you soon.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link
                href={`/tenant/${slug}`}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <Link
          href={`/tenant/${slug}`}
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: '2rem',
            display: 'inline-block',
          }}
        >
          ← Back
        </Link>

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Submit a Support Ticket</h1>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isAuthenticated}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                opacity: isAuthenticated ? 0.6 : 1,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isAuthenticated}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                opacity: isAuthenticated ? 0.6 : 1,
              }}
            />
          </div>

          {tenant && tenant.categories.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Select a category...</option>
                {tenant.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Subject *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide details about your issue..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Custom Fields */}
          {tenant &&
            tenant.customFields.map((field) => (
              <div key={field.id}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {field.label} {field.required && '*'}
                </label>
                {renderCustomField(field)}
              </div>
            ))}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <Link
              href={`/tenant/${slug}`}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                display: 'inline-block',
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

