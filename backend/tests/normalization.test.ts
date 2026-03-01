import { describe, it, expect } from 'vitest'
import { FeeExtractor } from '../plane-b/src/normalization/extractors/fee-extractor'
import { RateExtractor } from '../plane-b/src/normalization/extractors/rate-extractor'
import { DeliveryTimeExtractor } from '../plane-b/src/normalization/extractors/delivery-time-extractor'
import { PromotionalExtractor } from '../plane-b/src/normalization/extractors/promotional-extractor'
import { FactorExtractionRouter } from '../plane-b/src/normalization/router'
import type { ExtractionContext } from '../plane-b/src/normalization/types'

const makeContext = (payload: Record<string, unknown>): ExtractionContext => ({
  providerId: 'test-provider',
  corridorId: 'USD-INR',
  collectorType: 'http_collector',
  rawPayload: payload,
})

describe('Factor Normalization', () => {
  describe('FeeExtractor', () => {
    const extractor = new FeeExtractor()

    it('extracts direct fee with high confidence', async () => {
      const ctx = makeContext({ fee: 4.99 })
      expect(extractor.canExtract(ctx)).toBe(true)

      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].factorType).toBe('fee')
      expect(result.factors[0].normalizedValue).toBe(4.99)
      expect(result.factors[0].confidence).toBe('high')
      expect(result.factors[0].source).toBe('direct')
    })

    it('derives fee from total_debit - send_amount', async () => {
      const ctx = makeContext({ total_debit_amount: 104.99, send_amount: 100 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].normalizedValue).toBeCloseTo(4.99)
      expect(result.factors[0].confidence).toBe('medium')
      expect(result.factors[0].source).toBe('derived')
    })

    it('handles negative derived fee', async () => {
      const ctx = makeContext({ total_debit_amount: 95, send_amount: 100 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].normalizedValue).toBe(0)
      expect(result.factors[0].confidence).toBe('low')
      expect(result.warnings).toHaveLength(1)
    })

    it('returns empty factors for unrecognized payload', async () => {
      const ctx = makeContext({ unrelated_field: 'value' })
      expect(extractor.canExtract(ctx)).toBe(false)
    })

    it('parses string fee values', async () => {
      const ctx = makeContext({ fee: '$4.99' })
      const result = await extractor.extract(ctx)
      expect(result.factors[0].normalizedValue).toBe(4.99)
    })
  })

  describe('RateExtractor', () => {
    const extractor = new RateExtractor()

    it('extracts direct exchange rate', async () => {
      const ctx = makeContext({ exchange_rate: 83.42 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].normalizedValue).toBe(83.42)
      expect(result.factors[0].confidence).toBe('high')
    })

    it('derives rate from send/receive amounts', async () => {
      const ctx = makeContext({ send_amount: 100, receive_amount: 8342 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].normalizedValue).toBeCloseTo(83.42)
      expect(result.factors[0].confidence).toBe('medium')
    })

    it('flags rate divergence', async () => {
      const ctx = makeContext({ exchange_rate: 83.42, send_amount: 100, receive_amount: 8500 })
      const result = await extractor.extract(ctx)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('divergence')
      expect(result.factors[0].confidence).toBe('low')
    })

    it('rejects zero or negative rates', async () => {
      const ctx = makeContext({ exchange_rate: 0 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(0)
    })
  })

  describe('DeliveryTimeExtractor', () => {
    const extractor = new DeliveryTimeExtractor()

    it('extracts numeric delivery time', async () => {
      const ctx = makeContext({ delivery_time: 30 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].normalizedValue).toBe(30)
      expect(result.factors[0].unit).toBe('minutes')
    })

    it('parses speed labels', async () => {
      const ctx = makeContext({ delivery_speed: 'instant' })
      const result = await extractor.extract(ctx)
      expect(result.factors[0].normalizedValue).toBe(0)
    })

    it('parses "1-2 days" label', async () => {
      const ctx = makeContext({ delivery_time: '1-2 days' })
      const result = await extractor.extract(ctx)
      expect(result.factors[0].normalizedValue).toBe(2160)
    })

    it('parses hour string formats', async () => {
      const ctx = makeContext({ delivery_time: '2 hours' })
      const result = await extractor.extract(ctx)
      expect(result.factors[0].normalizedValue).toBe(120)
    })
  })

  describe('PromotionalExtractor', () => {
    const extractor = new PromotionalExtractor()

    it('detects promotional flag', async () => {
      const ctx = makeContext({ is_promotional: true, promotion_type: 'zero_fee' })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].factorType).toBe('promotional')
    })

    it('detects zero-fee promotion', async () => {
      const ctx = makeContext({ promotion: true, fee: 0 })
      const result = await extractor.extract(ctx)
      expect(result.factors).toHaveLength(1)
    })

    it('returns empty for non-promotional payloads', async () => {
      const ctx = makeContext({ fee: 4.99, exchange_rate: 83.42 })
      expect(extractor.canExtract(ctx)).toBe(false)
    })
  })

  describe('FactorExtractionRouter', () => {
    it('dispatches to matching extractor', async () => {
      const router = new FactorExtractionRouter()
      router.register(new FeeExtractor())
      router.register(new RateExtractor())

      const ctx = makeContext({ fee: 4.99 })
      const result = await router.extract(ctx)
      expect(result.factors).toHaveLength(1)
      expect(result.factors[0].factorType).toBe('fee')
    })

    it('returns empty when no extractor matches', async () => {
      const router = new FactorExtractionRouter()
      router.register(new FeeExtractor())

      const ctx = makeContext({ unrelated: 'data' })
      const result = await router.extract(ctx)
      expect(result.factors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
    })

    it('prevents duplicate extractor registration', () => {
      const router = new FactorExtractionRouter()
      const fee = new FeeExtractor()
      router.register(fee)
      router.register(fee) // duplicate
      expect(router.getRegisteredExtractors()).toHaveLength(1)
    })

    it('handles extractor errors gracefully', async () => {
      const router = new FactorExtractionRouter()
      const badExtractor = {
        id: 'bad',
        name: 'Bad Extractor',
        supportedFactorTypes: ['fee' as const],
        canExtract: () => true,
        extract: async () => { throw new Error('boom') },
      }
      router.register(badExtractor)

      const ctx = makeContext({ fee: 1 })
      const result = await router.extract(ctx)
      expect(result.factors).toHaveLength(0)
      expect(result.warnings[0]).toContain('boom')
    })
  })
})
