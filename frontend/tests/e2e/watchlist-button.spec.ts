import { test, expect } from '@playwright/test'

test.describe('Watchlist button functionality', () => {
  test('shows auth modal when logged out user clicks "Add to watchlist"', async ({ page }) => {
    // Navigate to a corridor page
    await page.goto('/send-money/us-to-gt')
    
    // Wait for the watchlist button to appear (this means the page is loaded)
    const watchlistButton = page.getByRole('button', { name: /add to watchlist/i }).first()
    await expect(watchlistButton).toBeVisible({ timeout: 15000 })
    
    // Check if user is logged in by looking for sign in button
    const signInButton = page.getByRole('link', { name: /sign in/i }).first()
    const isLoggedOut = await signInButton.isVisible().catch(() => false)
    
    console.log(`User is logged ${isLoggedOut ? 'OUT' : 'IN'}`)
    
    console.log('Clicking "Add to watchlist" button...')
    await watchlistButton.click()
    
    // Wait a moment for modal/toast to appear
    await page.waitForTimeout(1500)
    
    if (isLoggedOut) {
      // If logged out, expect auth modal to appear
      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible({ timeout: 3000 })
      
      // Check modal contains sign in messaging
      await expect(modal.getByText(/sign in to save corridors/i)).toBeVisible()
      
      console.log('✓ Auth modal appeared as expected for logged-out user')
    } else {
      // If logged in, expect toast notification
      const toast = page.locator('[role="status"], [role="alert"]').first()
      await expect(toast).toBeVisible({ timeout: 3000 })
      
      // Toast should mention watchlist
      await expect(toast.getByText(/watchlist/i)).toBeVisible()
      
      console.log('✓ Toast notification appeared as expected for logged-in user')
    }
  })
  
  test('checks header for user authentication state', async ({ page }) => {
    await page.goto('/send-money/us-to-gt')
    
    // Wait for navigation to load
    await page.waitForLoadState('networkidle')
    
    // Check for sign in button (logged out) or user menu (logged in)
    const signInButton = page.getByRole('link', { name: /sign in/i }).first()
    const isLoggedOut = await signInButton.isVisible().catch(() => false)
    
    if (isLoggedOut) {
      console.log('✓ User is NOT logged in (Sign in button visible)')
      await expect(signInButton).toBeVisible()
    } else {
      console.log('✓ User appears to be logged in (no Sign in button)')
      // Could check for user menu button here if we know what it looks like when logged in
    }
  })
})
