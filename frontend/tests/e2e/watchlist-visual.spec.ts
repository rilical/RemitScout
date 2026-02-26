import { test, expect } from '@playwright/test'

test.describe('Watchlist button - Visual documentation', () => {
  test('documents the full watchlist button flow with screenshots', async ({ page }) => {
    // Navigate to a corridor page
    await page.goto('/send-money/united-states-to-philippines')

    // Wait for the watchlist button to appear
    const watchlistButton = page.getByRole('button', { name: /add to watchlist|save/i }).first()
    await expect(watchlistButton).toBeVisible({ timeout: 15000 })

    // 1. Capture the initial state
    await page.screenshot({
      path: 'test-results/watchlist-flow-1-initial.png',
      fullPage: true,
    })
    console.log('📸 Screenshot 1: Initial page state')

    // Check authentication state
    const signInButton = page.getByRole('link', { name: /sign in/i }).first()
    const isLoggedOut = await signInButton.isVisible().catch(() => false)

    if (isLoggedOut) {
      console.log('🔓 User is LOGGED OUT')

      // 2. Highlight the watchlist button area before clicking
      await page.screenshot({
        path: 'test-results/watchlist-flow-2-button-before-click.png',
      })
      console.log('📸 Screenshot 2: Watchlist button visible (before click)')

      // 3. Click the button
      console.log('👆 Clicking "Add to watchlist" button...')
      await watchlistButton.click()

      // Wait for modal animation
      await page.waitForTimeout(500)

      // 4. Capture the auth modal that appears
      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible({ timeout: 3000 })

      await page.screenshot({
        path: 'test-results/watchlist-flow-3-auth-modal.png',
        fullPage: true,
      })
      console.log('📸 Screenshot 3: Auth modal appeared')

      // Verify modal content
      await expect(modal.getByText(/sign in to save/i)).toBeVisible()
      console.log('✅ Auth modal contains expected messaging')

      // Check for sign in buttons in the modal
      const modalSignInButton = modal.getByRole('link', { name: /sign in/i }).first()
      const modalCreateAccountButton = modal.getByRole('link', { name: /create.*account/i }).first()

      const hasSignIn = await modalSignInButton.isVisible().catch(() => false)
      const hasCreateAccount = await modalCreateAccountButton.isVisible().catch(() => false)

      if (hasSignIn) console.log('✅ Modal has "Sign in" button')
      if (hasCreateAccount) console.log('✅ Modal has "Create account" button')
    }
 else {
      console.log('🔐 User is LOGGED IN')

	      // Check for user name in header
	      const header = page.locator('header').first()
	      const headerText = (await header.textContent().catch(() => '')) ?? ''
	      console.log(`📋 Header content sample: ${headerText.substring(0, 100)}...`)

      // 2. Capture before clicking
      await page.screenshot({
        path: 'test-results/watchlist-flow-2-logged-in-before-click.png',
      })
      console.log('📸 Screenshot 2: Page before clicking (logged in)')

      // 3. Click the button
      console.log('👆 Clicking "Add to watchlist" button...')
      await watchlistButton.click()

      // Wait for toast
      await page.waitForTimeout(1000)

      // 4. Capture the toast notification
      const toast = page.locator('[role="status"], [role="alert"]').first()
      await expect(toast).toBeVisible({ timeout: 3000 })

      await page.screenshot({
        path: 'test-results/watchlist-flow-3-toast-notification.png',
        fullPage: true,
      })
      console.log('📸 Screenshot 3: Toast notification appeared')

	      // Verify toast content
	      await expect(toast.getByText(/watchlist/i)).toBeVisible()
	      const toastText = (await toast.textContent().catch(() => '')) ?? ''
	      console.log(`✅ Toast message: "${toastText.trim()}"`)
	    }

    console.log('✅ Test complete - check test-results/ folder for screenshots')
  })
})
