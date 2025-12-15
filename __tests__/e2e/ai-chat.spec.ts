import { test, expect } from '@playwright/test'

test.describe('AI Chat Widget', () => {
  test.setTimeout(30000) // 30 seconds per test

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login', { timeout: 30000, waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'admin@example.com', { timeout: 10000 })
    await page.fill('input[type="password"]', 'Admin123!', { timeout: 10000 })
    await page.click('button[type="submit"]', { timeout: 10000 })
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should open and close chat widget', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 30000, waitUntil: 'networkidle' })

    // Check that chat button is visible
    const chatButton = page.locator('button[aria-label="Open chat"]')
    await expect(chatButton).toBeVisible({ timeout: 10000 })

    // Open chat widget
    await chatButton.click({ timeout: 10000 })

    // Check that chat widget is visible
    const chatWidget = page.locator('text=AI Assistant')
    await expect(chatWidget).toBeVisible({ timeout: 10000 })

    // Close chat widget
    const closeButton = page.locator('button[aria-label="Close chat"]')
    await closeButton.click({ timeout: 10000 })

    // Check that chat button is visible again
    await expect(chatButton).toBeVisible({ timeout: 10000 })
  })

  test('should display initial message', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 30000, waitUntil: 'networkidle' })

    // Open chat widget
    await page.click('button[aria-label="Open chat"]', { timeout: 10000 })

    // Check initial message
    await expect(
      page.locator('text=Hello! I can help you find answers')
    ).toBeVisible({ timeout: 10000 })
  })

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 30000, waitUntil: 'networkidle' })

    // Mock the API response
    await page.route('/api/v1/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            reply: 'This is a test response from the AI assistant.',
            toolCalls: [],
          },
        }),
      })
    })

    // Open chat widget
    await page.click('button[aria-label="Open chat"]', { timeout: 10000 })

    // Type and send a message
    const input = page.locator('input[placeholder="Type your message..."]')
    await input.fill('How do I reset my password?', { timeout: 10000 })
    await input.press('Enter', { timeout: 10000 })

    // Wait for response
    await expect(
      page.locator('text=This is a test response from the AI assistant.')
    ).toBeVisible({ timeout: 10000 })
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 30000, waitUntil: 'networkidle' })

    // Mock API error
    await page.route('/api/v1/ai/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'AI_ERROR',
            message: 'AI service unavailable',
          },
        }),
      })
    })

    // Open chat widget
    await page.click('button[aria-label="Open chat"]', { timeout: 10000 })

    // Send a message
    const input = page.locator('input[placeholder="Type your message..."]')
    await input.fill('Test message', { timeout: 10000 })
    await input.press('Enter', { timeout: 10000 })

    // Check error message
    await expect(
      page.locator('text=Sorry, I encountered an error')
    ).toBeVisible({ timeout: 10000 })
  })

  test('should disable input while loading', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 30000, waitUntil: 'networkidle' })

    // Mock delayed API response
    await page.route('/api/v1/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            reply: 'Response',
            toolCalls: [],
          },
        }),
      })
    })

    // Open chat widget
    await page.click('button[aria-label="Open chat"]', { timeout: 10000 })

    const input = page.locator('input[placeholder="Type your message..."]')
    await input.fill('Test message', { timeout: 10000 })
    await input.press('Enter', { timeout: 10000 })

    // Check that input is disabled while loading
    await expect(input).toBeDisabled({ timeout: 10000 })

    // Wait for response
    await expect(page.locator('text=Response')).toBeVisible({ timeout: 10000 })

    // Check that input is enabled again
    await expect(input).toBeEnabled({ timeout: 10000 })
  })
})

