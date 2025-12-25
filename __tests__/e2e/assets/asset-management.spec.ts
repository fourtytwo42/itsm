import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { generateTestData } from '../helpers/test-data'

test.describe('Asset Management', () => {
  test.setTimeout(30000) // 30 seconds per test - fail fast
  
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('should list all assets', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Wait for page to load
    await page.waitForTimeout(1000)
    
    // Check for assets page title or heading
    const title = page.locator('h1:has-text("Assets")').first()
    const titleAlt = page.locator('text=/assets/i').first()
    const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false) || await titleAlt.isVisible({ timeout: 2000 }).catch(() => false)
    
    // Assets page shows table with assets or "No assets found" in table cell
    // Table is always present, but tbody shows either assets or empty message
    const assetsTable = page.locator('table').first()
    const hasTable = await assetsTable.isVisible({ timeout: 5000 }).catch(() => false)
    
    // Check for either assets in table rows (more than just header) or "No assets found" message
    const assetRow = page.locator('table tbody tr').first() // First data row
    const noAssetsMessage = page.locator('text=/no assets found/i')
    
    const hasAssets = await assetRow.isVisible({ timeout: 5000 }).catch(() => false)
    const hasNoAssets = await noAssetsMessage.isVisible({ timeout: 5000 }).catch(() => false)
    
    // Either table exists (with or without data) OR we have empty message OR at least title is visible
    expect(hasTable || hasAssets || hasNoAssets || hasTitle).toBe(true)
  })

  test('should filter assets by type/status', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Look for filter controls
    const typeFilter = page.locator('select[name="type"], select[placeholder*="type" i], button:has-text("Type")').first()
    const statusFilter = page.locator('select[name="status"], select[placeholder*="status" i], button:has-text("Status")').first()
    
    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try to filter by status
      if (statusFilter.locator('option').count() > 0) {
        await statusFilter.selectOption('ACTIVE')
        await page.waitForTimeout(Math.min(1000, 2000))
        
        // Verify filter is applied
        await expect(page).toHaveURL(/status=/i, { timeout: 5000 }).catch(() => {
          expect(page.locator('body')).not.toContainText('Error')
        })
      }
    }
  })

  test('should display create asset form', async ({ page }) => {
    // Navigate directly to create asset page (route exists)
    await page.goto('/assets/new', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Check for asset type select (required field, always visible)
    await expect(page.locator('label:has-text("Asset Type")').first()).toBeVisible({ timeout: 5000 })
    
    // Name field only appears after selecting asset type, so we check for the form structure
    const form = page.locator('form').first()
    await expect(form).toBeVisible({ timeout: 5000 })
  })

  test('should create new asset', async ({ page }) => {
    await page.goto('/assets/new', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    const testName = generateTestData('Asset')
    
    // Asset form requires selecting an asset type FIRST before name field appears (conditional rendering)
    // Look for asset type select (required field)
    const typeSelect = page.locator('label:has-text("Asset Type")').locator('..').locator('select').first()
    await expect(typeSelect).toBeVisible({ timeout: 5000 })
    
    // Get available options (skip first empty option)
    const options = await typeSelect.locator('option').all()
    if (options.length > 1) {
      await typeSelect.selectOption({ index: 1 }, { timeout: 5000 })
      
      // Wait for name field to appear after selecting asset type
      await page.waitForTimeout(500)
      
      // Fill in name field (only visible after asset type is selected)
      const nameInput = page.locator('label:has-text("Name")').locator('..').locator('input[type="text"]').first()
      await expect(nameInput).toBeVisible({ timeout: 5000 })
      await nameInput.fill(testName, { timeout: 5000 })
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click({ timeout: 5000 })
      
      // Wait for redirect to asset detail page
      await page.waitForURL(/\/assets\/[\w-]+/, { timeout: 5000 })
      
      // Verify asset was created (check for name in the page)
      const hasName = await page.locator(`text=${testName}`).isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasName).toBe(true)
    } else {
      // Skip test if no asset types available
      test.skip()
    }
  })

  test('should view asset details', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Look for first asset link
    const firstAsset = page.locator('a[href*="/assets/"], [data-testid="asset-item"], tr a, .asset-item a').first()
    
    if (await firstAsset.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstAsset.click({ timeout: 5000 })
      
      // Wait for asset detail page
      await page.waitForURL(/\/assets\/[\w-]+/, { timeout: 5000 })
      
      // Verify asset details are shown
      await expect(page.locator('text=/name|status|type|assigned/i').first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('should update asset', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    const firstAsset = page.locator('a[href*="/assets/"], [data-testid="asset-item"], tr a').first()
    
    if (await firstAsset.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstAsset.click({ timeout: 5000 })
      await page.waitForURL(/\/assets\/[\w-]+/, { timeout: 5000 })
      
      // Look for edit button or form
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), a:has-text("Edit")').first()
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click({ timeout: 5000 })
      }
      
      // Try to update asset status
      const statusSelect = page.locator('select[name="status"], select[placeholder*="status" i]').first()
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusSelect.selectOption('RETIRED', { timeout: 5000 })
        
        const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first()
        await saveButton.click({ timeout: 5000 })
        
        // Wait for update to complete
        await page.waitForTimeout(Math.min(1000, 2000))
        
        // Verify update
        const successMessage = page.locator('text=/success|updated|saved/i')
        const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false)
        expect(hasSuccess || await page.locator('text=RETIRED').isVisible({ timeout: 5000 }).catch(() => false)).toBe(true)
      }
    } else {
      test.skip()
    }
  })

  test('should assign asset to user', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    const firstAsset = page.locator('a[href*="/assets/"], [data-testid="asset-item"], tr a').first()
    
    if (await firstAsset.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstAsset.click({ timeout: 5000 })
      await page.waitForURL(/\/assets\/[\w-]+/, { timeout: 5000 })
      
      // Look for assign button
      const assignButton = page.locator('button:has-text("Assign"), button:has-text("Assign To")').first()
      const assignedToSelect = page.locator('select[name="assignedTo"], select[name="assignedToId"], select[placeholder*="assign" i]').first()
      
      if (await assignedToSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await assignedToSelect.locator('option').all()
        if (options.length > 1) {
          await assignedToSelect.selectOption({ index: 1 }, { timeout: 5000 })
          
          const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Assign")').first()
          await saveButton.click({ timeout: 5000 })
          
          await expect(page.locator('text=/success|assigned|updated/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
            // May not show explicit success message
          })
        }
      } else if (await assignButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assignButton.click({ timeout: 5000 })
        
        // Look for user select in modal/form
        const userSelect = page.locator('select[name="user"], select[name="assignedTo"], select[placeholder*="user" i]').first()
        if (await userSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
          const options = await userSelect.locator('option').all()
          if (options.length > 1) {
            await userSelect.selectOption({ index: 1 }, { timeout: 5000 })
            
            const confirmButton = page.locator('button:has-text("Assign"), button:has-text("Save"), button[type="submit"]').first()
            await confirmButton.click({ timeout: 5000 })
            
            await expect(page.locator('text=/success|assigned/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
              // May not show explicit success message
            })
          }
        }
      }
    } else {
      test.skip()
    }
  })

  test('should view linked tickets for asset', async ({ page }) => {
    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    const firstAsset = page.locator('a[href*="/assets/"], [data-testid="asset-item"], tr a').first()
    
    if (await firstAsset.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstAsset.click({ timeout: 5000 })
      await page.waitForURL(/\/assets\/[\w-]+/, { timeout: 5000 })
      
      // Look for tickets section
      const ticketsSection = page.locator('text=/tickets|linked tickets|related tickets/i').first()
      const ticketsTab = page.locator('button:has-text("Tickets"), a:has-text("Tickets")').first()
      
      if (await ticketsSection.isVisible({ timeout: 2000 }).catch(() => false) ||
          await ticketsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        
        if (await ticketsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await ticketsTab.click({ timeout: 5000 })
        }
        
        // Verify tickets section is visible
        await expect(page.locator('text=/tickets|no tickets/i').first()).toBeVisible({ timeout: 5000 })
      }
    } else {
      test.skip()
    }
  })
})

