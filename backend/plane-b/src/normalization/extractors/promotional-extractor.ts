/**
 * Promotional factor extractor - extracts promotional/discount factors
 * from provider responses (zero-fee offers, boosted rates, limited-time deals).
 */

import type { ExtractionContext, ExtractionResult, FactorExtractor } from '../types'

export class PromotionalExtractor implements FactorExtractor {
  readonly id = 'promotional-extractor'
  readonly name = 'Promotional Factor Extractor'
  readonly supportedFactorTypes = ['promotional' as const]

  canExtract(context: ExtractionContext): boolean {
    const payload = context.jsonResponse ?? context.rawPayload
    return payload !== undefined && (
      'promotion' in payload ||
      'promo_code' in payload ||
      'discount' in payload ||
      'is_promotional' in payload ||
      'promotion_type' in payload
    )
  }

  async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const start = Date.now()
    const payload = context.jsonResponse ?? context.rawPayload
    const warnings: string[] = []

    const isPromotional = Boolean(
      payload.is_promotional
      || payload.promotion
      || payload.promo_code
      || payload.discount,
    )

    if (!isPromotional) {
      return {
        factors: [],
        warnings,
        extractorId: this.id,
        durationMs: Date.now() - start,
      }
    }

    const promoType = String(payload.promotion_type ?? payload.promotion ?? 'unknown')
    const discount = payload.discount
    let normalizedDiscount: number | null = null

    if (discount !== null && discount !== undefined) {
      const num = typeof discount === 'number' ? discount : Number(String(discount).replace(/[^0-9.+-]/g, ''))
      if (Number.isFinite(num) && num >= 0) {
        normalizedDiscount = num
      }
    }

    // If no explicit discount, check for zero-fee promotion
    if (normalizedDiscount === null && payload.fee !== undefined) {
      const fee = typeof payload.fee === 'number' ? payload.fee : Number(payload.fee)
      if (fee === 0) {
        normalizedDiscount = 1 // 100% fee discount
      }
    }

    const confidence = normalizedDiscount !== null ? 'medium' : 'low'

    return {
      factors: [{
        factorType: 'promotional',
        rawValue: promoType,
        normalizedValue: normalizedDiscount ?? 1,
        unit: 'boolean_or_discount_fraction',
        confidence,
        source: 'direct',
        extractorId: this.id,
        metadata: {
          promoType,
          promoCode: payload.promo_code ?? null,
          discount: payload.discount ?? null,
          isZeroFee: payload.fee === 0 || payload.fee === '0',
        },
      }],
      warnings,
      extractorId: this.id,
      durationMs: Date.now() - start,
    }
  }
}
