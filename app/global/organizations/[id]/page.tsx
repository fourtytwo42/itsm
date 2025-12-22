'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    tenants: number
    tickets: number
    kbArticles: number
    assets: number
    changes: number
  }
}

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
    }
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/global/organizations/${organizationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      setOrganization(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading organization...</div>
  }

  if (error || !organization) {
    return <div>Error: {error || 'Organization not found'}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/global/organizations" className="btn">
          ← Back to Organizations
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {organization.logo && (
            <img
              src={organization.logo}
              alt={organization.name}
              style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>{organization.name}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{organization.slug}</p>
          </div>
          <span
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: organization.isActive ? 'var(--success)' : 'var(--error)',
              color: 'white',
            }}
          >
            {organization.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {organization.description && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{organization.description}</p>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.users}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Users</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.tenants}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Tenants</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.tickets}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Tickets</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.kbArticles}</div>
              <div style={{ color: 'var(--text-secondary)' }}>KB Articles</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.assets}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Assets</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{organization._count.changes}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Changes</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href={`/admin/tenants?organizationId=${organization.id}`} className="btn btn-primary">
            View Tenants
          </Link>
          <Link href={`/admin/users?organizationId=${organization.id}`} className="btn btn-primary">
            View Users
          </Link>
          <Link href={`/organization/audit?organizationId=${organization.id}`} className="btn">
            View Audit Logs
          </Link>
        </div>
      </div>
    </div>
  )
}

