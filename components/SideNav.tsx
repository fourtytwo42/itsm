'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  TicketIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  TicketIcon as TicketIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ComputerDesktopIcon as ComputerDesktopIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ClockIcon as ClockIconSolid,
} from '@heroicons/react/24/solid'

interface NavItem {
  href: string
  label: string
  icon: any
  iconSolid: any
  roles?: string[]
}

const ICON_COLUMN_WIDTH = 72

export default function SideNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showText, setShowText] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // Invalid user data
      }
    }

    const savedExpanded = localStorage.getItem('sideNavExpanded')
    if (savedExpanded === 'true') {
      setIsExpanded(true)
      setShowText(true)
    }
  }, [])

  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  // Calculate nav width (needed for CSS variable, must be before conditional returns)
  const navWidth = isExpanded ? 240 : ICON_COLUMN_WIDTH

  // Set CSS variable for nav width (must be before conditional returns)
  useEffect(() => {
    document.documentElement.style.setProperty('--side-nav-width', `${navWidth}px`)
  }, [navWidth])

  // Hide on login/register/landing pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/reset-password')) {
    return null
  }

  // Hide if user is not logged in
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (!token || !user) {
    return null
  }

  // Hide for END_USER role - they use header navigation instead
  if (user?.roles?.includes('END_USER')) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Use window.location for full page reload to prevent client-side errors
    window.location.href = '/login'
  }

  const toggleExpand = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    localStorage.setItem('sideNavExpanded', String(newExpanded))

    if (!newExpanded) {
      setShowUserMenu(false)
    }

    if (newExpanded) {
      setShowText(true)
    } else {
      setTimeout(() => {
        setShowText(false)
      }, 300)
    }
  }

  const isGlobalAdmin = user?.roles?.includes('GLOBAL_ADMIN')
  const isAdmin = user?.roles?.includes('ADMIN')
  const isManager = user?.roles?.includes('IT_MANAGER')
  const isAgent = user?.roles?.includes('AGENT')

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
    { href: '/tickets', label: 'Tickets', icon: TicketIcon, iconSolid: TicketIconSolid },
    { href: '/kb', label: 'Knowledge Base', icon: BookOpenIcon, iconSolid: BookOpenIconSolid },
    { href: '/assets', label: 'Assets', icon: ComputerDesktopIcon, iconSolid: ComputerDesktopIconSolid, roles: ['AGENT', 'IT_MANAGER', 'ADMIN'] },
    { href: '/changes', label: 'Changes', icon: ArrowsRightLeftIcon, iconSolid: ArrowsRightLeftIconSolid, roles: ['AGENT', 'IT_MANAGER', 'ADMIN'] },
    { href: '/reports', label: 'Reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, roles: ['IT_MANAGER', 'ADMIN'] },
  ]

  const managerItems: NavItem[] = [
    { href: '/manager/tenants', label: 'My Tenants', icon: UsersIcon, iconSolid: UsersIconSolid },
    { href: '/manager/users', label: 'Users', icon: UsersIcon, iconSolid: UsersIconSolid, roles: ['IT_MANAGER'] },
    { href: '/manager/agents', label: 'My Agents', icon: UsersIcon, iconSolid: UsersIconSolid },
  ]

  const globalAdminItems: NavItem[] = [
    { href: '/global/organizations', label: 'Organizations', icon: UsersIcon, iconSolid: UsersIconSolid, roles: ['GLOBAL_ADMIN'] },
  ]

  const adminItems: NavItem[] = [
    { href: '/admin/users', label: 'Users', icon: UsersIcon, iconSolid: UsersIconSolid },
    { href: '/admin/tenants', label: 'Tenants', icon: UsersIcon, iconSolid: UsersIconSolid },
    { href: '/admin/asset-types', label: 'Asset Types', icon: ComputerDesktopIcon, iconSolid: ComputerDesktopIconSolid },
    { href: '/admin/config', label: 'Configuration', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
    { href: '/admin/sla', label: 'SLA Management', icon: ClockIcon, iconSolid: ClockIconSolid },
    { href: '/organization/settings', label: 'Organization Settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
    { href: '/organization/audit', label: 'Audit Logs', icon: ClockIcon, iconSolid: ClockIconSolid },
  ]

  const agentItems: NavItem[] = [
    { href: '/agent/users', label: 'Users', icon: UsersIcon, iconSolid: UsersIconSolid },
  ]

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true
    if (!user?.roles) return false
    return item.roles.some((role: string) => user.roles.includes(role))
  }

  const filteredNavItems = navItems.filter(canAccess)
  const filteredGlobalAdminItems = globalAdminItems.filter(canAccess)
  const filteredManagerItems = managerItems.filter(() => isManager)
  const filteredAdminItems = adminItems.filter(canAccess)
  const filteredAgentItems = agentItems.filter(() => isAgent)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href)
    const Icon = active ? item.iconSolid : item.icon
    const isHovered = hoveredItem === item.href

    return (
      <div key={item.href} style={{ position: 'relative' }}>
        <Link
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '0.75rem 0',
            textDecoration: 'none',
            color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
            transition: 'all 0.2s',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!isExpanded) {
              setHoveredItem(item.href)
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltipPosition({
                top: rect.top + rect.height / 2,
                left: navWidth + 12,
              })
            }
          }}
          onMouseLeave={() => {
            if (!isExpanded) {
              setHoveredItem(null)
              setTooltipPosition(null)
            }
          }}
        >
          {/* Icon Column - Always 72px, always centered */}
          <div
            style={{
              width: `${ICON_COLUMN_WIDTH}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          </div>

          {/* Text Label - Only shown when expanded */}
          {showText && (
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                paddingRight: '1rem',
                opacity: 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {item.label}
            </span>
          )}
        </Link>

        {/* Tooltip when collapsed */}
        {!isExpanded && isHovered && tooltipPosition && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
              transform: 'translateY(-50%)',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
              pointerEvents: 'none',
            }}
          >
            {item.label}
            <div
              style={{
                position: 'absolute',
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                border: '6px solid transparent',
                borderRightColor: 'var(--bg-tertiary)',
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${navWidth}px`,
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'width 0.3s ease',
        overflow: 'visible',
      }}
    >
      {/* Expand/Collapse Button */}
      <button
        onClick={toggleExpand}
        style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
          e.currentTarget.style.borderColor = 'var(--accent-primary)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          e.currentTarget.style.borderColor = 'var(--border-color)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
        }}
        aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>

      {/* Header - Ticket Icon */}
      <div
        style={{
          height: '64px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${ICON_COLUMN_WIDTH}px`,
            textDecoration: 'none',
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}
        >
          <TicketIcon
            className="w-6 h-6"
            style={{
              width: '24px',
              height: '24px',
            }}
          />
        </Link>
      </div>

      {/* Navigation Items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0.5rem 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filteredNavItems.map(renderNavItem)}
        {isGlobalAdmin && filteredGlobalAdminItems.length > 0 && (
          <>
            <div
              style={{
                padding: '0.5rem 0',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            />
            {filteredGlobalAdminItems.map(renderNavItem)}
          </>
        )}
        {isManager && filteredManagerItems.length > 0 && (
          <>
            <div
              style={{
                padding: '0.5rem 0',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            />
            {filteredManagerItems.map(renderNavItem)}
          </>
        )}
        {isAdmin && filteredAdminItems.length > 0 && (
          <>
            <div
              style={{
                padding: '0.5rem 0',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            />
            {filteredAdminItems.map(renderNavItem)}
          </>
        )}
        {isAgent && filteredAgentItems.length > 0 && (
          <>
            <div
              style={{
                padding: '0.5rem 0',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            />
            {filteredAgentItems.map(renderNavItem)}
          </>
        )}
      </div>

      {/* User Menu */}
      <div
        data-user-menu
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '0.5rem 0',
          position: 'relative',
        }}
      >
        {user && (
          <>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!showUserMenu) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!showUserMenu) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {/* Avatar in Icon Column */}
              <div
                style={{
                  width: `${ICON_COLUMN_WIDTH}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              </div>

              {/* User Info - Only shown when expanded */}
              {showText && (
                <>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'User'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ paddingRight: '1rem' }}>
                      {showUserMenu ? (
                        <ChevronUpIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                  )}
                </>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                ref={(el) => {
                  if (userMenuRef) {
                    (userMenuRef as any).current = el
                  }
                  if (el && navRef.current && !isExpanded) {
                    const navRect = navRef.current.getBoundingClientRect()
                    const menuHeight = el.offsetHeight || 100
                    const menuWidth = 32
                    const sidebarCenter = navRect.left + ICON_COLUMN_WIDTH / 2
                    const buttonEl = el.previousElementSibling as HTMLElement
                    if (buttonEl) {
                      const buttonRect = buttonEl.getBoundingClientRect()
                      el.style.top = `${buttonRect.top - menuHeight - 8}px`
                      el.style.left = `${sidebarCenter - menuWidth / 2}px`
                    }
                  }
                }}
                style={{
                  position: isExpanded ? 'absolute' : 'fixed',
                  bottom: isExpanded ? '100%' : 'auto',
                  width: isExpanded ? '100%' : 'auto',
                  marginBottom: isExpanded ? '0.5rem' : '0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  zIndex: 10000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isExpanded ? '0.25rem' : '0.5rem',
                  padding: isExpanded ? '0' : '0',
                  alignItems: isExpanded ? 'stretch' : 'center',
                }}
              >
                {isExpanded ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        textDecoration: 'none',
                        color: pathname === '/profile' ? 'var(--accent-primary)' : 'var(--text-primary)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: `${ICON_COLUMN_WIDTH}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <UserCircleIcon className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: pathname === '/profile' ? 600 : 400,
                          paddingRight: '1rem',
                        }}
                      >
                        Profile
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: `${ICON_COLUMN_WIDTH}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          paddingRight: '1rem',
                        }}
                      >
                        Log out
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'background-color 0.2s',
                        margin: '0 auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      title="Profile"
                    >
                      <UserCircleIcon className="w-6 h-6" />
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        margin: '0 auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.color = 'var(--error)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                      title="Log out"
                    >
                      <ArrowRightOnRectangleIcon className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
