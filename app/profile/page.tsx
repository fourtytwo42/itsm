'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // Invalid user data
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading profile...</div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Profile</h1>
      
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2rem',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Name
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'Not set'}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Email
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
              {user.email}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Roles
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user.roles?.map((role: string) => (
                <span
                  key={role}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Status
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
              {user.isActive ? (
                <span style={{ color: 'var(--success)' }}>Active</span>
              ) : (
                <span style={{ color: 'var(--error)' }}>Inactive</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

