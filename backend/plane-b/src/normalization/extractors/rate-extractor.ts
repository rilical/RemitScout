/**
 * Rate factor extractor - extracts exchange rate factors from provider responses.
 */

import type { ExtractionContext, ExtractionResult, FactorExtractor } from '../types'
import { parseRate } from '../parse-utils'

export class RateExtractor implements FactorExtractor {
  readonly id = 'rate-extractor'
  readonly name = 'Rate Factor Extractor'
  readonly supportedFactorTypes = ['rate' as const]

  canExtract(context: ExtractionContext): boolean {
    const payload = context.jsonResponse ?? context.rawPayload
    return payload !== undefined && (
      'exchange_rate' in payload ||
      'rate' in payload ||
      'fx_rate' in payload ||
      ('send_amount' in payload && 'receive_amount' in payload)
    )
  }

  async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const start = Date.now()
    const payload = context.jsonResponse ?? context.rawPayload
    const warnings: string[] = []

    const directRate = parseRate(payload.exchange_rate ?? payload.rate ?? payload.fx_rate)
    const sendAmount = parseRate(payload.send_amount)
    const receiveAmount = parseRate(payload.receive_amount)

    let normalizedRate = directRate
    let confidence: 'high' | 'medium' | 'low' | 'none' = directRate !== null ? 'high' : 'none'

    if (normalizedRate === null && sendAmount !== null && receiveAmount !== null) {
      const derived = receiveAmount / sendAmount
      if (Number.isFinite(derived) && derived > 0) {
        normalizedRate = derived
        confidence = 'medium'
      } else {
        warnings.push('Derived rate is invalid (receiveAmount / sendAmount)')
      }
    }

    // Cross-check: if both direct and derived are available, flag divergence
    if (directRate !== null && sendAmount !== null && receiveAmount !== null) {
      const derivedCheck = receiveAmount / sendAmount
      if (Number.isFinite(derivedCheck) && derivedCheck > 0) {
        const divergence = Math.abs(directRate - derivedCheck) / directRate
        if (divergence > 0.01) {
          warnings.push(
            `Rate divergence detected: direct=${directRate}, derived=${derivedCheck.toFixed(6)} (${(divergence * 100).toFixed(2)}%)`,
          )
          confidence = 'low'
        }
      }
    }

    return {
      factors: normalizedRate !== null ? [{
        factorType: 'rate',
        rawValue: directRate ?? receiveAmount,
        normalizedValue: normalizedRate,
        unit: 'receive_per_send',
        confidence,
        source: directRate !== null ? 'direct' : 'derived',
        extractorId: this.id,
        metadata: { sendAmount, receiveAmount, directRate },
      }] : [],
      warnings,
      extractorId: this.id,
      durationMs: Date.now() - start,
    }
  }
}
