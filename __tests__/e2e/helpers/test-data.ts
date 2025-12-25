import { Page } from '@playwright/test'

/**
 * Generate unique test data to avoid conflicts
 */
export function generateTestData(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Clean up test data after tests (if needed)
 * This is a placeholder - actual implementation depends on your API
 */
export async function cleanupTestData(page: Page, ids: string[]): Promise<void> {
  // This would call your API to clean up test data
  // Implementation depends on your API structure
  console.log('Cleanup test data:', ids)
}

