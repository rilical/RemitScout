import { expect, test, type Page } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const authMfaCode = process.env.E2E_AUTH_MFA_CODE || process.env.PLAYWRIGHT_AUTH_MFA_CODE || ''
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)

const completeSignIn = async (page: Page) => {
  await page.goto('/sign-in?redirect=/admin/discovery')

  await page.getByLabel(/email/i).fill(authEmail)
  await page.getByLabel(/password/i).fill(authPassword)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  const mfaInput = page.getByLabel(/authenticator code/i)
  if (await mfaInput.isVisible().catch(() => false)) {
    if (!authMfaCode) {
      throw new Error('Admin discovery smoke requires E2E_AUTH_MFA_CODE when MFA is enabled.')
    }

    await mfaInput.fill(authMfaCode)
    await Promise.all([
      page.waitForURL(/\/admin\/discovery(?:\?|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /^verify$/i }).click(),
    ])
    return
  }

  await page.waitForURL(/\/admin\/discovery(?:\?|$)/, { timeout: 30000 })
}

test.describe('admin discovery control plane', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('renders review/apply lifecycle and certification dashboard', async ({ page }) => {
    let applyAttempt = 0

    const scanState: Record<string, any> = {
      id: 42,
      provider_id: 'remitly',
      scan_type: 'full',
      status: 'completed',
      corridors_discovered: 3,
      delivery_methods_discovered: 2,
      promotions_detected: 0,
      errors_count: 0,
      duration_ms: 2134,
      triggered_by: 'manual',
      correlation_id: 'corr-1',
      review_status: 'pending_review',
      approved_by: null,
      approved_at: null,
      apply_status: 'not_requested',
      applied_at: null,
      apply_errors_json: null,
      apply_result_json: null,
      started_at: '2026-03-05T18:55:00.000Z',
      completed_at: '2026-03-05T18:56:00.000Z',
      created_at: '2026-03-05T18:55:00.000Z',
      diff_json: {
        providerId: 'remitly',
        recommendation: 'review_all',
        corridorDelta: { newSourceCountries: ['US'], newDestinationCountries: ['AL'] },
      },
      result_json: {
        providerId: 'remitly',
        corridors: [{ corridorId: 'US-AL-USD-ALL' }],
        deliveryMethods: [{ corridorId: 'US-AL-USD-ALL', normalizedPayin: 'bank_transfer', normalizedPayout: 'bank_deposit' }],
      },
    }

    const certificationResults = Array.from({ length: 24 }).map((_, index) => ({
      provider_id: `provider-${index + 1}`,
      status: index < 20 ? 'certified' : index < 23 ? 'degraded' : 'blocked',
      evidence_confidence: index < 10 ? 'api' : index < 18 ? 'hybrid' : 'static_fallback',
      evidence_lane: index < 10 ? 'api' : index < 18 ? 'hybrid' : 'static_fallback',
      summary: `provider-${index + 1} summary`,
      drift_reasons: index < 20 ? [] : ['static_fallback_only'],
      artifact_pointers_json: null,
      evidence_json: null,
      discovery_scan_id: null,
      created_at: '2026-03-05T19:00:00.000Z',
    }))

    const certificationRun = {
      run_id: 'cert-run-1',
      environment: 'staging',
      status: 'partial',
      triggered_by: 'manual',
      requested_by: 'ops@remit-scout.com',
      catalog_count: 24,
      provider_count: 24,
      certified_count: 20,
      degraded_count: 3,
      blocked_count: 1,
      review_only: true,
      notes: null,
      created_at: '2026-03-05T19:00:00.000Z',
      completed_at: '2026-03-05T19:01:00.000Z',
    }

    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/pending-reviews(\?.*)?$/, async (route) => {
      await route.fulfill({ json: { scans: [scanState] } })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/scans(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { scans: [scanState] } })
        return
      }
      await route.continue()
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/scans\/42$/, async (route) => {
      await route.fulfill({ json: { scan: scanState } })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/scans\/42\/approve$/, async (route) => {
      scanState.review_status = 'approved'
      scanState.approved_by = authEmail
      scanState.approved_at = '2026-03-05T19:02:00.000Z'
      scanState.apply_status = 'pending_apply'
      await route.fulfill({ json: { approved: true, scan: scanState } })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/scans\/42\/apply$/, async (route) => {
      applyAttempt += 1
      if (applyAttempt === 1) {
        scanState.apply_status = 'failed'
        scanState.apply_errors_json = [{ code: 'apply_failed', message: 'simulated capability conflict' }]
        await route.fulfill({
          json: {
            applied: false,
            idempotent: false,
            result: null,
            scan: scanState,
            errors: scanState.apply_errors_json,
          },
        })
        return
      }

      scanState.apply_status = 'applied'
      scanState.applied_at = '2026-03-05T19:03:00.000Z'
      scanState.apply_errors_json = null
      scanState.apply_result_json = {
        providerId: 'remitly',
        capabilitiesUpserted: 1,
        rightsMatrixUpdated: true,
      }
      await route.fulfill({
        json: {
          applied: true,
          idempotent: false,
          result: scanState.apply_result_json,
          scan: scanState,
          errors: [],
        },
      })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/scans\/42\/dismiss$/, async (route) => {
      scanState.review_status = 'dismissed'
      scanState.apply_status = 'dismissed'
      await route.fulfill({ json: { dismissed: true, scan: scanState } })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/certifications\/runs(\?.*)?$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: { ...certificationRun, results: certificationResults } })
        return
      }
      await route.fulfill({ json: { runs: [certificationRun] } })
    })
    await page.route(/\/api(?:\/v1)?\/admin\/discovery\/certifications\/runs\/cert-run-1$/, async (route) => {
      await route.fulfill({ json: { run: certificationRun, results: certificationResults } })
    })

    await completeSignIn(page)

    await expect(page.getByRole('heading', { name: /provider control plane/i })).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/pending discovery reviews/i)).toBeVisible()
    await expect(page.getByText(/review state is explicit/i)).toBeVisible()

    await page.getByRole('button', { name: /^approve$/i }).click()
    await expect(page.getByText(/scan 42 approved/i)).toBeVisible()

    await page.getByRole('button', { name: /^apply$/i }).click()
    await expect(page.getByText(/retry is available/i)).toBeVisible()
    await expect(page.getByText(/failed/i).first()).toBeVisible()

    await page.getByRole('button', { name: /^apply$/i }).click()
    await expect(page.getByText(/scan 42 applied/i)).toBeVisible()
    await expect(page.getByText(/applied/i).first()).toBeVisible()

    await page.getByRole('button', { name: /run certification/i }).click()
    await expect(page.getByText(/certification run cert-run-1 completed/i)).toBeVisible()
    await expect(page.getByText(/canonical 24-provider certification history/i)).toBeVisible()
    await expect(page.getByText(/certified 20/i)).toBeVisible()
  })
})
