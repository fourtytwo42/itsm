'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

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

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Use window.location for full page reload to prevent client-side errors
    window.location.href = '/login'
  }

  // Don't show navigation on login/register/landing pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/reset-password')) {
    return null
  }

  const isAdmin = user?.roles?.includes('ADMIN')
  const isManager = user?.roles?.includes('IT_MANAGER')
  const isAgent = user?.roles?.includes('AGENT')

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/tickets', label: 'Tickets', icon: '🎫' },
    { href: '/kb', label: 'Knowledge Base', icon: '📚' },
    { href: '/assets', label: 'Assets', icon: '💻', roles: ['AGENT', 'IT_MANAGER', 'ADMIN'] },
    { href: '/changes', label: 'Changes', icon: '🔄', roles: ['AGENT', 'IT_MANAGER', 'ADMIN'] },
    { href: '/reports', label: 'Reports', icon: '📈', roles: ['IT_MANAGER', 'ADMIN'] },
  ]

  const adminItems = [
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/config', label: 'Configuration', icon: '⚙️' },
    { href: '/admin/sla', label: 'SLA Management', icon: '⏱️' },
  ]

  const canAccess = (item: any) => {
    if (!item.roles) return true
    if (!user?.roles) return false
    return item.roles.some((role: string) => user.roles.includes(role))
  }

  const filteredNavItems = navItems.filter(canAccess)
  const filteredAdminItems = adminItems.filter(canAccess)

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo/Brand */}
          <Link href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          }}>
            <span>🎫</span>
            <span>ITSM Helpdesk</span>
          </Link>

          {/* Desktop Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            marginLeft: '2rem',
          }} className="desktop-nav">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '0.5rem 1rem',
                  textDecoration: 'none',
                  color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-primary)',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  backgroundColor: pathname === item.href ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  fontWeight: pathname === item.href ? 600 : 400,
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Admin Dropdown */}
            {isAdmin && filteredAdminItems.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: pathname?.startsWith('/admin') ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: 'none',
                    color: pathname?.startsWith('/admin') ? 'var(--accent-primary)' : 'var(--text-primary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: pathname?.startsWith('/admin') ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>⚙️</span>
                  <span>Admin</span>
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    padding: '0.5rem',
                  }}>
                    {filteredAdminItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          textDecoration: 'none',
                          color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-primary)',
                          borderRadius: '6px',
                          backgroundColor: pathname === item.href ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        }}
                      >
                        <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
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
                  }}
                >
                  <span>👤</span>
                  <span style={{ fontSize: '0.875rem' }}>
                    {user.firstName || user.email?.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    padding: '0.5rem',
                  }}>
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-color)',
                      marginBottom: '0.5rem',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {user.email}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        {user.roles?.map((role: string) => (
                          <span
                            key={role}
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--bg-primary)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              marginRight: '0.25rem',
                            }}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.color = 'var(--error)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'none',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.5rem',
              }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          style={{
            display: showMobileMenu ? 'block' : 'none',
            padding: '1rem 0',
            borderTop: '1px solid var(--border-color)',
          }}
          className="mobile-nav"
        >
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowMobileMenu(false)}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                textDecoration: 'none',
                color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-primary)',
                borderRadius: '6px',
                marginBottom: '0.5rem',
                backgroundColor: pathname === item.href ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {isAdmin && filteredAdminItems.length > 0 && (
            <>
              <div style={{
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginTop: '1rem',
              }}>
                Admin
              </div>
              {filteredAdminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-primary)',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    backgroundColor: pathname === item.href ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                >
                  <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}

