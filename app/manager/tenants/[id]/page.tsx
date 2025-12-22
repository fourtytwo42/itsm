'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  requiresLogin: boolean
  isActive: boolean
  categories: Array<{ id: string; category: string }>
  kbArticles: Array<{ id: string; article: { id: string; title: string; slug: string } }>
  customFields: Array<{
    id: string
    label: string
    fieldType: string
    required: boolean
    options?: string[]
    placeholder?: string
    order: number
  }>
  assignments: Array<{
    id: string
    userId: string
    category: string | null
    user: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    }
  }>
}

export default function ManagerTenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTenant()
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/tenants/${tenantId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        setTenant(data.data.tenant || data.data)
      } else {
        setError(data.error?.message || 'Failed to load tenant')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading tenant...</p>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Tenant not found</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{tenant.name}</h1>
        <button
          onClick={() => router.back()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Basic Information</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <strong>Slug:</strong> {tenant.slug}
            </div>
            {tenant.description && (
              <div>
                <strong>Description:</strong> {tenant.description}
              </div>
            )}
            <div>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  backgroundColor: tenant.isActive ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: tenant.isActive ? 'var(--success-text)' : 'var(--error-text)',
                }}
              >
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <strong>Requires Login:</strong> {tenant.requiresLogin ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Statistics</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <strong>Categories:</strong> {tenant.categories.length}
            </div>
            <div>
              <strong>KB Articles:</strong> {tenant.kbArticles.length}
            </div>
            <div>
              <strong>Custom Fields:</strong> {tenant.customFields.length}
            </div>
            <div>
              <strong>Assignments:</strong> {tenant.assignments.length}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Categories</h2>
        {tenant.categories.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No categories configured</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tenant.categories.map((cat) => (
              <span
                key={cat.id}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {cat.category}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Assigned Users</h2>
        {tenant.assignments.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No users assigned</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {tenant.assignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {assignment.user.firstName || assignment.user.lastName
                      ? `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim()
                      : assignment.user.email}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {assignment.user.email}
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {assignment.category || 'All Categories'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link
          href={`/manager/agents/new?tenantId=${tenantId}`}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Register Agent for This Tenant
        </Link>
      </div>
    </div>
  )
}

