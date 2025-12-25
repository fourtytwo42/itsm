import { test, expect } from '@playwright/test'
import { loginAs, loginAsUser, logout, DEMO_ACCOUNTS, isLoggedIn } from './helpers/auth'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
  })

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ITSM Helpdesk')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('text=/error|invalid|failed/i')).toBeVisible({ timeout: 5000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await loginAs(page, 'admin')
    
    // Verify we're logged in
    expect(await isLoggedIn(page)).toBe(true)
    await expect(page).toHaveURL(/\/(dashboard|tickets)/, { timeout: 5000 })
  })

  test('should successfully login as different roles', async ({ page }) => {
    // Test admin login
    await loginAs(page, 'admin')
    expect(await isLoggedIn(page)).toBe(true)
    await logout(page)

    // Test agent login
    await loginAs(page, 'agent')
    expect(await isLoggedIn(page)).toBe(true)
    await logout(page)

    // Test end user login
    await loginAs(page, 'endUser')
    expect(await isLoggedIn(page)).toBe(true)
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginAs(page, 'admin')
    expect(await isLoggedIn(page)).toBe(true)
    
    // Logout
    await logout(page)
    
    // Verify we're logged out
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    expect(await isLoggedIn(page)).toBe(false)
  })

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Sign up')
    await expect(page).toHaveURL(/.*register/)
  })

  test('should navigate to reset password page', async ({ page }) => {
    await page.click('text=Forgot password')
    // Note: Reset password page not implemented yet, so this test may need adjustment
  })

  test('should auto-fill demo account credentials', async ({ page }) => {
    // Click on Global Admin demo account button (first button in the list)
    await page.click('button:has-text("Global Admin")')

    // Check that email and password fields are filled
    const emailValue = await page.inputValue('input[type="email"]')
    const passwordValue = await page.inputValue('input[type="password"]')

    expect(emailValue).toBe('global@demo.com')
    expect(passwordValue).toBe('demo123')
  })

  test('should show all demo account buttons', async ({ page }) => {
    // There are 5 demo account buttons: Global Admin, Organization Admin, IT Manager, Agent, End User
    const demoButtons = page.locator('button:has-text("Global Admin"), button:has-text("Organization Admin"), button:has-text("IT Manager"), button:has-text("Agent"), button:has-text("End User")')
    await expect(demoButtons).toHaveCount(5)
  })
})

