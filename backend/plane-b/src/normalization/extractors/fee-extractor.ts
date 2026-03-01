/**
 * Fee factor extractor - extracts fee-related factors from provider responses.
 */

import type { ExtractionContext, ExtractionResult, FactorExtractor } from '../types'

const parseAmount = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.+-]/g, ''))
  return Number.isFinite(num) ? num : null
}

export class FeeExtractor implements FactorExtractor {
  readonly id = 'fee-extractor'
  readonly name = 'Fee Factor Extractor'
  readonly supportedFactorTypes = ['fee' as const]

  canExtract(context: ExtractionContext): boolean {
    const payload = context.jsonResponse ?? context.rawPayload
    return payload !== undefined && (
      'fee' in payload ||
      'fee_amount' in payload ||
      'transfer_fee' in payload ||
      'total_debit_amount' in payload
    )
  }

  async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const start = Date.now()
    const payload = context.jsonResponse ?? context.rawPayload
    const warnings: string[] = []

    const feeAmount = parseAmount(payload.fee ?? payload.fee_amount ?? payload.transfer_fee)
    const totalDebit = parseAmount(payload.total_debit_amount)
    const sendAmount = parseAmount(payload.send_amount)

    let normalizedFee = feeAmount
    let confidence: 'high' | 'medium' | 'low' | 'none' = feeAmount !== null ? 'high' : 'none'

    if (normalizedFee === null && totalDebit !== null && sendAmount !== null) {
      const derived = totalDebit - sendAmount
      if (Number.isFinite(derived) && derived >= 0) {
        normalizedFee = derived
        confidence = 'medium'
      } else if (Number.isFinite(derived) && derived < 0) {
        warnings.push('Derived fee is negative (total_debit < send_amount)')
        normalizedFee = 0
        confidence = 'low'
      }
    }

    return {
      factors: normalizedFee !== null ? [{
        factorType: 'fee',
        rawValue: feeAmount ?? totalDebit,
        normalizedValue: normalizedFee,
        unit: 'send_currency',
        confidence,
        source: feeAmount !== null ? 'direct' : 'derived',
        extractorId: this.id,
        metadata: { totalDebit, sendAmount },
      }] : [],
      warnings,
      extractorId: this.id,
      durationMs: Date.now() - start,
    }
  }
}
