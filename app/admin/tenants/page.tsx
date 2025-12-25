'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  requiresLogin: boolean
  isActive: boolean
  createdAt: string
  _count?: {
    tickets: number
    assignments: number
  }
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
  })

  useEffect(() => {
    loadTenants()
  }, [filters])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.isActive !== '') params.append('isActive', filters.isActive)

      const response = await fetch(`/api/v1/admin/tenants?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        // Handle both array response and object with tenants array
        const tenantsList = Array.isArray(data.data) ? data.data : (data.data?.tenants || [])
        setTenants(tenantsList)
      } else {
        setError(data.error?.message || 'Failed to load tenants')
        console.error('Failed to load tenants:', data.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this tenant?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        loadTenants()
      } else {
        setError(data.error?.message || 'Failed to delete tenant')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const getTenantUrl = (slug: string) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/tenant/${slug}`
  }

  const copyToClipboard = async (slug: string) => {
    const url = getTenantUrl(slug)
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed:', err)
        }
        document.body.removeChild(textArea)
      }
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show error to user
      setError('Failed to copy URL to clipboard')
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading tenants...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Tenant Management</h1>
        <button
          onClick={() => router.push('/admin/tenants/new')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Create Tenant
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Search tenants..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        />
        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {tenants.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No tenants found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Slug</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Public URL</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Requires Login</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Tickets</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {tenant.logo && (
                        <img
                          src={tenant.logo}
                          alt={tenant.name}
                          style={{ width: '32px', height: '32px', borderRadius: '4px' }}
                        />
                      )}
                      <span style={{ fontWeight: 500 }}>{tenant.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{tenant.slug}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: 'var(--accent-primary)',
                          flex: 1,
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={getTenantUrl(tenant.slug)}
                      >
                        {getTenantUrl(tenant.slug)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tenant.slug)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: copiedSlug === tenant.slug ? 'var(--success)' : 'var(--text-primary)',
                        }}
                        title="Copy URL"
                      >
                        {copiedSlug === tenant.slug ? (
                          <CheckIcon style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />
                        )}
                      </button>
                      <a
                        href={`/tenant/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem',
                        }}
                        title="Open in new tab"
                      >
                        Open
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: tenant.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: tenant.isActive ? 'var(--success)' : 'var(--error)',
                      }}
                    >
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {tenant.requiresLogin ? (
                      <span style={{ color: 'var(--text-secondary)' }}>Yes</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>No</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {tenant._count?.tickets || 0}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--error)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

