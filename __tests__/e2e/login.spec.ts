import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
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

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Sign up')
    await expect(page).toHaveURL(/.*register/)
  })

  test('should navigate to reset password page', async ({ page }) => {
    await page.click('text=Forgot password')
    // Note: Reset password page not implemented yet, so this test may need adjustment
  })

  test('should auto-fill demo account credentials', async ({ page }) => {
    // Click on Admin demo account button
    await page.click('button:has-text("Admin")')

    // Check that email and password fields are filled
    const emailValue = await page.inputValue('input[type="email"]')
    const passwordValue = await page.inputValue('input[type="password"]')

    expect(emailValue).toBe('admin@demo.com')
    expect(passwordValue).toBe('demo123')
  })

  test('should show all demo account buttons', async ({ page }) => {
    const demoButtons = page.locator('button:has-text("Admin"), button:has-text("IT Manager"), button:has-text("Agent"), button:has-text("End User")')
    await expect(demoButtons).toHaveCount(4)
  })
})

