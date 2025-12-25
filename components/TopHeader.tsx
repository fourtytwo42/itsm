'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TicketIcon } from '@heroicons/react/24/outline'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
}

export default function TopHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
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
  }, [])

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true)
      try {
        // If on tenant page, get organization from tenant
        if (pathname?.startsWith('/tenant/')) {
          const slug = pathname.split('/tenant/')[1]?.split('/')[0]
          if (slug) {
            const response = await fetch(`/api/v1/tenants/${slug}`)
            const data = await response.json()
            if (data.success && data.data) {
              // Get organization from tenant
              const tenantResponse = await fetch(`/api/v1/tenants/${slug}/organization`)
              if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json()
                if (tenantData.success) {
                  setOrganization(tenantData.data)
                }
              }
            }
          }
        } else {
          // If logged in, get organization from user
          const token = localStorage.getItem('accessToken')
          if (token) {
            const response = await fetch('/api/v1/organizations/me', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (response.ok) {
              const data = await response.json()
              setOrganization(data.organization)
            }
          }
        }

        // Check if registration is enabled (public endpoint)
        const configResponse = await fetch('/api/v1/config/public')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData.success) {
            setRegistrationEnabled(configData.data?.registrationEnabled ?? true)
          }
        }
      } catch (err) {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [pathname])

  // Don't show header on login/register/landing/checkout pages
  // Handle null/undefined pathname during navigation
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/checkout' || pathname.startsWith('/reset-password')) {
    return null
  }

  const isLoggedIn = typeof window !== 'undefined' && !!user && !!localStorage.getItem('accessToken')
  const isTenantPage = pathname?.startsWith('/tenant/')
  const slug = isTenantPage ? pathname.split('/tenant/')[1]?.split('/')[0] : null
  const redirectUrl = isTenantPage ? pathname : '/dashboard'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: isLoggedIn ? 'var(--side-nav-width, 72px)' : 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 999,
        transition: 'left 0.3s ease',
      }}
    >
      {/* Left side - Logo */}
      <Link
        href={isTenantPage && slug ? `/tenant/${slug}` : '/dashboard'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--text-primary)',
        }}
      >
        {organization?.logo ? (
          <img
            src={organization.logo}
            alt={organization.name}
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
        ) : (
          <TicketIcon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
        )}
        {organization && (
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{organization.name}</span>
        )}
      </Link>

      {/* Center - Navigation only for end users (they don't have sidebar) */}
      {((isTenantPage && (!isLoggedIn || (isLoggedIn && user?.roles?.includes('END_USER')))) || 
        (!isTenantPage && isLoggedIn && user?.roles?.includes('END_USER'))) && (
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isTenantPage ? (
            <>
              <Link
                href={`/tenant/${slug}`}
                style={{
                  color: pathname === `/tenant/${slug}` ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname === `/tenant/${slug}` ? 600 : 400,
                }}
              >
                Home
              </Link>
              <Link
                href={`/tenant/${slug}/kb`}
                style={{
                  color: pathname?.includes('/kb') ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname?.includes('/kb') ? 600 : 400,
                }}
              >
                Knowledge Base
              </Link>
              <Link
                href={`/tenant/${slug}/submit`}
                style={{
                  color: pathname?.includes('/submit') ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname?.includes('/submit') ? 600 : 400,
                }}
              >
                Submit Ticket
              </Link>
              {(isLoggedIn || (typeof window !== 'undefined' && localStorage.getItem('publicToken'))) && (
                <Link
                  href={`/tenant/${slug}/tickets`}
                  style={{
                    color: pathname?.includes('/tickets') ? 'var(--accent-primary)' : 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: pathname?.includes('/tickets') ? 600 : 400,
                  }}
                >
                  My Tickets
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                style={{
                  color: pathname === '/dashboard' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname === '/dashboard' ? 600 : 400,
                }}
              >
                Home
              </Link>
              <Link
                href="/kb"
                style={{
                  color: pathname?.includes('/kb') ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname?.includes('/kb') ? 600 : 400,
                }}
              >
                Knowledge Base
              </Link>
              <Link
                href="/tickets/new"
                style={{
                  color: pathname?.includes('/tickets/new') ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname?.includes('/tickets/new') ? 600 : 400,
                }}
              >
                Submit Ticket
              </Link>
              <Link
                href="/tickets"
                style={{
                  color: pathname === '/tickets' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: pathname === '/tickets' ? 600 : 400,
                }}
              >
                My Tickets
              </Link>
            </>
          )}
        </nav>
      )}

      {/* Right side - Login/Register buttons or user menu */}
      {!isLoggedIn ? (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '1px solid var(--border-color)',
            }}
          >
            Login
          </Link>
          {registrationEnabled && (
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Register
            </Link>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.borderColor = 'var(--error)'
              e.currentTarget.style.color = 'var(--error)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  )
}
