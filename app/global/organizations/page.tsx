'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  }
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/global/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading organizations...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Organizations</h1>
        <Link href="/global/organizations/new" className="btn btn-primary">
          Create Organization
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            className="card"
            style={{ padding: '1.5rem', cursor: 'pointer' }}
            onClick={() => router.push(`/global/organizations/${org.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {org.logo && (
                <img
                  src={org.logo}
                  alt={org.name}
                  style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '0.5rem' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{org.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {org.description || 'No description'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>{org._count.users} users</span>
                  <span>{org._count.tenants} tenants</span>
                  <span>{org._count.tickets} tickets</span>
                </div>
              </div>
              <div>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    backgroundColor: org.isActive ? 'var(--success)' : 'var(--error)',
                    color: 'white',
                  }}
                >
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No organizations found. Create your first organization to get started.
        </div>
      )}
    </div>
  )
}

