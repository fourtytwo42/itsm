'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isEndUser, setIsEndUser] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return
      
      const token = localStorage.getItem('accessToken')
      const user = localStorage.getItem('user')
      setIsLoggedIn(!!token && !!user)
      
      // Check if user is END_USER
      let userRoles: string[] = []
      try {
        if (user) {
          const parsed = JSON.parse(user)
          userRoles = parsed.roles || []
        }
      } catch (e) {
        // Invalid user data
      }
      setIsEndUser(userRoles.includes('END_USER'))
    }

    checkAuth()
    setMounted(true)
    
    // Listen for storage changes (e.g., login/logout)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuth)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', checkAuth)
      }
    }
  }, [pathname])

  // Don't apply margins on login/register/landing pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/reset-password')) {
    return <main>{children}</main>
  }

  // Wait for client-side hydration before applying margins
  if (!mounted) {
    return <main>{children}</main>
  }

  // Adjust margin based on login status and user role
  // END_USER should not have side nav, so no left margin
  const marginLeft = (isLoggedIn && !isEndUser) ? 'var(--side-nav-width, 72px)' : '0'
  const marginTop = '64px'

  return (
    <main
      style={{
        marginLeft,
        marginTop,
        transition: 'margin-left 0.3s ease',
      }}
    >
      {children}
    </main>
  )
}

