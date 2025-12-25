import { Page, expect } from '@playwright/test'

/**
 * Demo account credentials for testing
 * These match the demo accounts in app/login/page.tsx
 */
export const DEMO_ACCOUNTS = {
  admin: {
    email: 'global@demo.com', // Global Admin account
    password: 'demo123',
    role: 'ADMIN',
  },
  itManager: {
    email: 'manager@demo.com', // IT Manager account
    password: 'demo123',
    role: 'IT_MANAGER',
  },
  agent: {
    email: 'agent@demo.com',
    password: 'demo123',
    role: 'AGENT',
  },
  endUser: {
    email: 'user@demo.com', // End User account
    password: 'demo123',
    role: 'END_USER',
  },
} as const

export type Role = keyof typeof DEMO_ACCOUNTS

/**
 * Login as a specific role using demo accounts
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
  
  const account = DEMO_ACCOUNTS[role]
  await page.fill('input[type="email"]', account.email, { timeout: 5000 })
  await page.fill('input[type="password"]', account.password, { timeout: 5000 })
  await page.click('button[type="submit"]', { timeout: 5000 })
  
  // Wait for navigation after login (window.location.href redirect)
  // Give it time for the redirect to happen
  await page.waitForTimeout(1000)
  
  // Wait for redirect to dashboard or appropriate page
  // Use waitForFunction to check if URL changed since window.location.href is used
  try {
    await page.waitForFunction(
      () => {
        const url = window.location.href
        return url.includes('/dashboard') || url.includes('/tickets') || url.includes('/admin') || url.includes('/manager') || url.includes('/agent') || url.includes('/assets') || url.includes('/kb') || url.includes('/reports')
      },
      { timeout: 10000 }
    )
  } catch {
    // Fallback: check current URL after waiting
    await page.waitForTimeout(1500)
    const currentUrl = page.url()
    
    // Check if we're on any authenticated page
    const isAuthenticated = currentUrl.includes('/dashboard') || 
                            currentUrl.includes('/tickets') ||
                            currentUrl.includes('/admin') ||
                            currentUrl.includes('/manager') ||
                            currentUrl.includes('/agent') ||
                            currentUrl.includes('/assets') ||
                            currentUrl.includes('/kb') ||
                            currentUrl.includes('/reports')
    
    if (currentUrl.includes('/login') && !isAuthenticated) {
      // Check one more time after a bit more wait
      await page.waitForTimeout(1500)
      const finalUrl = page.url()
      const isAuthenticatedFinal = finalUrl.includes('/dashboard') || 
                                   finalUrl.includes('/tickets') ||
                                   finalUrl.includes('/admin') ||
                                   finalUrl.includes('/manager') ||
                                   finalUrl.includes('/agent') ||
                                   finalUrl.includes('/assets') ||
                                   finalUrl.includes('/kb') ||
                                   finalUrl.includes('/reports')
      
      if (finalUrl.includes('/login') && !isAuthenticatedFinal) {
        throw new Error('Login failed - still on login page')
      }
    }
    // If we're on an authenticated page, login succeeded
  }
}

/**
 * Login with specific credentials
 */
export async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.fill('input[type="email"]', email, { timeout: 5000 })
  await page.fill('input[type="password"]', password, { timeout: 5000 })
  await page.click('button[type="submit"]', { timeout: 5000 })
  
  // Wait for redirect
  await page.waitForURL(/\/(dashboard|tickets)/, { timeout: 10000 }).catch(() => {
    // Prevent hanging if redirect doesn't happen
  })
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button/link (common patterns)
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button[aria-label*="logout" i]').first()
  
  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click({ timeout: 5000 })
    // Wait a moment for the logout action to process
    await page.waitForTimeout(1000)
    // Check if we're redirected to login
    const currentUrl = page.url()
    if (!currentUrl.includes('/login')) {
      // If not redirected, navigate to login page
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 })
    } else {
      // Wait for URL to be fully loaded
      await page.waitForURL(/\/login/, { timeout: 5000 })
    }
  } else {
    // Fallback: clear localStorage and navigate to login page directly
    // The logout endpoint might not redirect, so we'll handle it client-side
    // Wrap in try-catch to handle navigation during evaluate
    try {
      await page.evaluate(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
    } catch (error: any) {
      // If execution context was destroyed due to navigation, that's okay
      if (!error.message?.includes('Execution context was destroyed')) {
        throw error
      }
    }
    // Navigate to login - handle navigation interruptions
    try {
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 })
    } catch (error: any) {
      // If navigation was interrupted, check if we're already on login or another page
      if (error.message?.includes('Navigation interrupted') || error.message?.includes('Navigation to')) {
        // Wait for any ongoing navigation to complete
        await page.waitForTimeout(1000)
        const currentUrl = page.url()
        if (currentUrl.includes('/login')) {
          // Already on login page, continue
        } else if (currentUrl.includes('/dashboard') || currentUrl.includes('/tickets') || currentUrl.includes('/admin')) {
          // We're still on an authenticated page - logout didn't fully work
          // Try to navigate to login again after clearing storage
          await page.evaluate(() => {
            localStorage.clear()
            sessionStorage.clear()
          })
          await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
            // If still fails, that's okay - we'll verify URL below
          })
        } else {
          // Try again after a brief wait
          await page.waitForTimeout(500)
          await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
            // If still fails, that's okay - we'll verify URL below
          })
        }
      } else {
        throw error
      }
    }
  }
  
  // Verify we're on login page (with timeout to prevent hanging)
  await page.waitForTimeout(1000) // Wait for navigation to complete
  const finalUrl = page.url()
  if (!finalUrl.includes('/login')) {
    // Try one more time if we're not on login
    try {
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 })
    } catch (error: any) {
      // If navigation interrupted, check if we're on login now
      await page.waitForTimeout(500)
      const checkUrl = page.url()
      // If we're on an authenticated page, logout didn't fully work, but continue anyway
      // The test will handle re-authentication if needed
      if (!checkUrl.includes('/login') && !checkUrl.includes('/dashboard') && !checkUrl.includes('/tickets') && !checkUrl.includes('/admin')) {
        // Not on login and not on authenticated page - try once more
        await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {
          // If all navigation attempts fail, that's okay - test will handle it
        })
      }
    }
  }
}

/**
 * Check if user is logged in by looking for common authenticated elements
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // First check URL - if we're on dashboard or tickets, we're likely logged in
  const url = page.url()
  if (url.includes('/dashboard') || url.includes('/tickets') || url.includes('/admin')) {
    // Double-check by looking for authenticated indicators
    try {
      // Check if we're NOT on login page (more reliable than checking for specific elements)
      if (!url.includes('/login') && !url.includes('/register')) {
        return true
      }
    } catch {
      // Continue to element-based checks
    }
  }
  
  // Check for common authenticated page elements
  const authenticatedIndicators = [
    page.locator('text=/dashboard|tickets|profile/i'),
    page.locator('[data-testid="user-menu"]'),
    page.locator('button:has-text("Logout")'),
    page.locator('a:has-text("Logout")'),
  ]
  
  for (const indicator of authenticatedIndicators) {
    try {
      if (await indicator.isVisible({ timeout: 2000 })) {
        return true
      }
    } catch {
      continue
    }
  }
  
  return false
}

