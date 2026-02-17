import { test, expect } from '@playwright/test'
import fs from 'node:fs'

test('Debug watchlist button click behavior', async ({ page }) => {
  await page.goto('/send-money/us-to-gt')
  
  // Wait for watchlist button
  const watchlistButton = page.getByRole('button', { name: /add to watchlist/i }).first()
  await expect(watchlistButton).toBeVisible({ timeout: 15000 })
  
  console.log('\n=== BEFORE CLICK ===')
  
  // Check for "Sign in" button
  const signInLink = page.getByRole('link', { name: /sign in/i })
  const signInCount = await signInLink.count()
  console.log(`Sign in links found: ${signInCount}`)
  
  // Take screenshot before
  await page.screenshot({ path: 'test-results/debug-before.png', fullPage: false })
  console.log('Screenshot saved: debug-before.png')
  
  // Click the button
  console.log('\n=== CLICKING BUTTON ===')
  await watchlistButton.click()
  
  // Wait for any UI changes
  await page.waitForTimeout(2000)
  
  console.log('\n=== AFTER CLICK ===')
  
  // Check what appeared
  const allElements = await page.locator('body *[class*="modal"], body *[role="dialog"], body *[class*="toast"]').all()
  console.log(`Elements with modal/toast classes or roles: ${allElements.length}`)
  
  for (const el of allElements) {
    const tag = await el.evaluate((e) => e.tagName)
    const classes = await el.getAttribute('class').catch(() => '')
    const role = await el.getAttribute('role').catch(() => '')
    const isVisible = await el.isVisible().catch(() => false)
    console.log(`  - ${tag} class="${classes}" role="${role}" visible=${isVisible}`)
  }
  
  // Check for any fixed positioned elements (modals/toasts are often fixed)
  const fixedElements = await page.locator('*').evaluateAll((elements) => {
    return elements
      .filter((el) => {
        const style = window.getComputedStyle(el)
        return style.position === 'fixed' && style.display !== 'none'
      })
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        text: el.textContent?.substring(0, 100),
        zIndex: window.getComputedStyle(el).zIndex
      }))
  })
  
  console.log(`\nFixed positioned elements: ${fixedElements.length}`)
  fixedElements.forEach((el, i) => {
    console.log(`  ${i + 1}. ${el.tag} z-index="${el.zIndex}" class="${el.class}"`)
    console.log(`     text: "${el.text?.trim()}"`)
  })
  
  // Take screenshot after
  await page.screenshot({ path: 'test-results/debug-after.png', fullPage: false })
  console.log('\nScreenshot saved: debug-after.png')
  
  // Save full page HTML
  const html = await page.content()
  fs.writeFileSync('test-results/debug-after.html', html)
  console.log('HTML saved: debug-after.html')
})
