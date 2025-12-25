import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use 1 worker to avoid conflicts and make debugging easier
  reporter: 'html',
  timeout: 30000, // 30 seconds per test - fail fast to catch hanging tests
  expect: {
    timeout: 5000, // 5 seconds for assertions - fail fast
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 15000, // 15 seconds for navigation - fail fast if page doesn't load
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300000, // 5 minutes to build and start server (build can take time)
    stdout: 'pipe',
    stderr: 'pipe',
  },
})

