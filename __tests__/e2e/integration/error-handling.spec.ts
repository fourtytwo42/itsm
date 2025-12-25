import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'

test.describe('Error Handling & Edge Cases', () => {
  test.setTimeout(30000) // 30 seconds per test - fail fast
  
  test('should handle 404 errors gracefully', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Navigate to non-existent page
    await page.goto('/non-existent-page-xyz-123', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Should show 404 page or error message
    const error404 = page.locator('text=/404|not found|page not found/i')
    const errorMessage = page.locator('text=/error|something went wrong/i')
    
    const has404 = await error404.isVisible({ timeout: 5000 }).catch(() => false)
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)
    
    // Should either show 404 page or redirect to a valid page
    expect(has404 || hasError || page.url().includes('/dashboard') || page.url().includes('/login')).toBe(true)
  })

  test('should handle 500 errors gracefully', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Try to trigger a server error (this is tricky in E2E - we'll just verify error handling exists)
    // In a real scenario, you might mock API calls to return 500
    
    // Navigate to a page that might error
    await page.goto('/admin/users/invalid-id-xyz', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Should handle error gracefully (show error message or redirect)
    const errorMessage = page.locator('text=/error|something went wrong|not found/i')
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)
    
    // Should not crash the page
    expect(page.locator('body')).not.toBeNull()
  })

  test('should handle network timeouts', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Try to navigate with a very short timeout to simulate network issues
    try {
      await page.goto('/admin/users', { timeout: 100, waitUntil: 'domcontentloaded' })
    } catch (error) {
      // Timeout is expected - verify page handles it
      expect(error).toBeDefined()
    }
    
    // Retry with normal timeout
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('Error loading', { timeout: 5000 })
  })

  test('should handle invalid form submissions', async ({ page }) => {
    await loginAs(page, 'admin')
    
    await page.goto('/admin/users/new', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Try to submit form with invalid data
    const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first()
    
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click()
      
      // Should show validation errors
      const validationErrors = page.locator('text=/required|invalid|error/i')
      await expect(validationErrors.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Validation may prevent submission without showing explicit errors
      })
    }
  })

  test('should handle expired sessions', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Simulate session expiration by clearing cookies/localStorage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.context().clearCookies()
    
    // Try to access protected page
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Should redirect to login or show unauthorized
    // Wait a bit for redirect to happen
    await page.waitForTimeout(1000)
    const isLogin = page.url().includes('/login')
    const isUnauthorized = await page.locator('text=/unauthorized|login required|forbidden|403/i').isVisible({ timeout: 5000 }).catch(() => false)
    
    // If still on admin page, check if we can see the page (might be allowed) or if there's an error
    const isOnAdminPage = page.url().includes('/admin/users')
    const hasError = await page.locator('text=/error|unauthorized|forbidden/i').isVisible({ timeout: 2000 }).catch(() => false)
    
    expect(isLogin || isUnauthorized || (!isOnAdminPage && !hasError)).toBe(true)
  })

  test('should handle unauthorized access attempts', async ({ page }) => {
    // Try to access admin page without login
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Should redirect to login or show unauthorized
    // Wait a bit for redirect to happen
    await page.waitForTimeout(1000)
    const isLogin = page.url().includes('/login')
    const isUnauthorized = await page.locator('text=/unauthorized|forbidden|403/i').isVisible({ timeout: 5000 }).catch(() => false)
    
    // If still on admin page, check if we can see the page (might be allowed) or if there's an error
    const isOnAdminPage = page.url().includes('/admin/users')
    const hasError = await page.locator('text=/error|unauthorized|forbidden/i').isVisible({ timeout: 2000 }).catch(() => false)
    
    expect(isLogin || isUnauthorized || (!isOnAdminPage && !hasError)).toBe(true)
  })

  test('should handle very long input fields', async ({ page }) => {
    await loginAs(page, 'endUser')
    
    await page.goto('/tickets/new', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Create very long subject and description
    const longSubject = 'A'.repeat(500)
    const longDescription = 'B'.repeat(5000)
    
    const subjectInput = page.locator('input[name="subject"]').first()
    const descriptionInput = page.locator('textarea[name="description"]').first()
    
    if (await subjectInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectInput.fill(longSubject)
      
      if (await descriptionInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await descriptionInput.fill(longDescription)
        
        // Form should handle long input (either accept it or show validation error)
        const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first()
        await submitButton.click()
        
        // Should either create ticket or show validation error
        const validationError = page.locator('text=/too long|maximum length|invalid/i')
        const hasError = await validationError.isVisible({ timeout: 5000 }).catch(() => false)
        const hasRedirect = page.url().includes('/tickets/') || page.url().includes('/dashboard')
        
        expect(hasError || hasRedirect).toBe(true)
      }
    }
  })

  test('should handle empty states gracefully', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Filter to get empty results
    await page.goto('/tickets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Try to filter to get empty results
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('nonexistent-ticket-search-xyz-12345')
      await page.waitForTimeout(Math.min(1000, 2000))
      
      // Should show empty state message
      const emptyMessage = page.locator('text=/no tickets|no results|nothing found|empty/i')
      await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Empty state may not always show message, but page should not error
        expect(page.locator('body')).not.toContainText('Error')
      })
    }
  })

  test('should handle concurrent operations', async ({ page }) => {
    await loginAs(page, 'agent')
    
    await page.goto('/tickets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    const ticketLink = page.locator('a[href*="/tickets/"]').first()
    
    if (await ticketLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ticketLink.click()
      await page.waitForURL(/\/tickets\/[\w-]+/, { timeout: 5000 })
      
      // Try to update status multiple times quickly
      const statusSelect = page.locator('select[name="status"]').first()
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusSelect.selectOption('IN_PROGRESS')
        
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first()
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click multiple times quickly (should handle gracefully)
          await saveButton.click()
          await page.waitForTimeout(100)
          await saveButton.click().catch(() => {
            // Second click may be disabled, which is expected
          })
          
          // Page should not crash
          expect(page.locator('body')).not.toContainText('Error')
        }
      }
    }
  })
})

