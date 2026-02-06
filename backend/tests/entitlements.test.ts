import { describe, it, expect } from 'vitest'
import { getEntitlementsForPlan } from '../plane-a/src/services/entitlements'

describe('entitlements', () => {
  describe('getEntitlementsForPlan', () => {
    it('returns free plan entitlements for free plan', () => {
      const entitlements = getEntitlementsForPlan('free')

      expect(entitlements).toEqual({
        pulse_access: 'none',
        exports_enabled: false,
        alerts_max: 1,
        history_max_days: 30,
        watchlist_items: 3,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
      })
    })

    it('returns plus plan entitlements for plus plan', () => {
      const entitlements = getEntitlementsForPlan('plus')

      expect(entitlements).toEqual({
        pulse_access: 'full',
        exports_enabled: true,
        alerts_max: 16,
        history_max_days: 365,
        watchlist_items: 16,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
      })
    })

    it('returns enterprise plan entitlements for enterprise plan', () => {
      const entitlements = getEntitlementsForPlan('enterprise')

      expect(entitlements).toEqual({
        pulse_access: 'full',
        exports_enabled: true,
        alerts_max: null,
        history_max_days: null,
        watchlist_items: null,
        api_access: true,
        api_tier: 2,
        bulk_export: true,
        indices_api: true,
      })
    })

    it('returns free plan entitlements for invalid plan code', () => {
      const entitlements = getEntitlementsForPlan('invalid')

      expect(entitlements).toEqual({
        pulse_access: 'none',
        exports_enabled: false,
        alerts_max: 1,
        history_max_days: 30,
        watchlist_items: 3,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
      })
    })

    it('returns free plan entitlements for undefined plan code', () => {
      const entitlements = getEntitlementsForPlan(undefined)

      expect(entitlements).toEqual({
        pulse_access: 'none',
        exports_enabled: false,
        alerts_max: 1,
        history_max_days: 30,
        watchlist_items: 3,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
      })
    })

    it('returns free plan entitlements for empty string', () => {
      const entitlements = getEntitlementsForPlan('')

      expect(entitlements).toEqual({
        pulse_access: 'none',
        exports_enabled: false,
        alerts_max: 1,
        history_max_days: 30,
        watchlist_items: 3,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
      })
    })

    it('validates pulse_access values', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(free.pulse_access).toBe('none')
      expect(plus.pulse_access).toBe('full')
      expect(enterprise.pulse_access).toBe('full')
    })

    it('validates exports_enabled values', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(free.exports_enabled).toBe(false)
      expect(plus.exports_enabled).toBe(true)
      expect(enterprise.exports_enabled).toBe(true)
    })

    it('validates alerts_max values', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(free.alerts_max).toBe(1)
      expect(plus.alerts_max).toBe(16)
      expect(enterprise.alerts_max).toBeNull()
    })

    it('validates history_max_days values', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(free.history_max_days).toBe(30)
      expect(plus.history_max_days).toBe(365)
      expect(enterprise.history_max_days).toBeNull()
    })

    it('validates watchlist_items values', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(free.watchlist_items).toBe(3)
      expect(plus.watchlist_items).toBe(16)
      expect(enterprise.watchlist_items).toBeNull()
    })

    it('returns consistent structure for all plans', () => {
      const free = getEntitlementsForPlan('free')
      const plus = getEntitlementsForPlan('plus')
      const enterprise = getEntitlementsForPlan('enterprise')

      expect(Object.keys(free)).toEqual([
        'pulse_access',
        'exports_enabled',
        'alerts_max',
        'history_max_days',
        'watchlist_items',
        'api_access',
        'api_tier',
        'bulk_export',
        'indices_api',
      ])
      expect(Object.keys(plus)).toEqual([
        'pulse_access',
        'exports_enabled',
        'alerts_max',
        'history_max_days',
        'watchlist_items',
        'api_access',
        'api_tier',
        'bulk_export',
        'indices_api',
      ])
      expect(Object.keys(enterprise)).toEqual([
        'pulse_access',
        'exports_enabled',
        'alerts_max',
        'history_max_days',
        'watchlist_items',
        'api_access',
        'api_tier',
        'bulk_export',
        'indices_api',
      ])
    })
  })
})
