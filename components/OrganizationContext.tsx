'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
}

export default function OrganizationContext() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/v1/organizations/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setOrganization(data.organization)
        }
      } catch (err) {
        // Silently fail - organization context is optional
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [])

  if (loading || !organization) {
    return null
  }

  return (
    <div
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
      }}
    >
      {organization.logo && (
        <img
          src={organization.logo}
          alt={organization.name}
          style={{ width: '24px', height: '24px', objectFit: 'contain' }}
        />
      )}
      <span style={{ color: 'var(--text-secondary)' }}>Organization:</span>
      <Link
        href="/organization/settings"
        style={{
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {organization.name}
      </Link>
    </div>
  )
}

