import { describe, expect, it } from 'vitest'
import {
  evaluateMeChecks,
  readSmokeMeExpectations,
  resolveSmokeApiBaseUrl,
  resolveSmokeRootBaseUrl,
} from '../scripts/ci/alerts-watchlists-smoke'

describe('alerts/watchlists smoke helpers', () => {
  it('derives root and api base URLs from PUBLIC_API_BASE values', () => {
    expect(resolveSmokeRootBaseUrl('https://staging-api.remit-scout.com/api/v1')).toBe(
      'https://staging-api.remit-scout.com',
    )
    expect(resolveSmokeApiBaseUrl('https://staging-api.remit-scout.com/api/v1')).toBe(
      'https://staging-api.remit-scout.com/api/v1',
    )
    expect(resolveSmokeRootBaseUrl('https://staging-api.remit-scout.com/api')).toBe(
      'https://staging-api.remit-scout.com',
    )
    expect(resolveSmokeApiBaseUrl('https://staging-api.remit-scout.com')).toBe(
      'https://staging-api.remit-scout.com/api/v1',
    )
  })

  it('reads Omar superadmin expectations from env', () => {
    expect(readSmokeMeExpectations({
      SMOKE_EXPECTED_EMAIL: 'omar@remit-scout.com',
      SMOKE_EXPECTED_IS_ADMIN: '1',
      SMOKE_EXPECTED_APP_ROLE: 'super_admin',
      SMOKE_EXPECTED_EFFECTIVE_PLAN_CODE: 'enterprise',
      SMOKE_EXPECT_ENTERPRISE_ENTITLEMENTS: 'true',
    })).toEqual({
      email: 'omar@remit-scout.com',
      isAdmin: true,
      appRole: 'super_admin',
      effectivePlanCode: 'enterprise',
      requireEnterpriseEntitlements: true,
    })
  })

  it('accepts enterprise /me payload when expected entitlements are present', () => {
    const checks = evaluateMeChecks(200, {
      success: true,
      user: {
        email: 'omar@remit-scout.com',
        app_role: 'super_admin',
        is_admin: true,
      },
      plan_effective: {
        plan_code: 'enterprise',
      },
      entitlements: {
        pulse_access: 'full',
        exports_enabled: true,
        watchlist_items: null,
        alerts_max: null,
        history_max_days: null,
        api_access: true,
        api_tier: 2,
      },
    }, {
      email: 'omar@remit-scout.com',
      isAdmin: true,
      appRole: 'super_admin',
      effectivePlanCode: 'enterprise',
      requireEnterpriseEntitlements: true,
    })

    expect(checks.every(check => check.ok)).toBe(true)
  })
})
