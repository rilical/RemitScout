/**
 * Delivery time factor extractor - extracts delivery/settlement time factors
 * from provider responses.
 */

import type { ExtractionContext, ExtractionResult, FactorExtractor } from '../types'

/** Known delivery speed labels mapped to approximate minutes. */
const SPEED_LABEL_MINUTES: Record<string, number> = {
  instant: 0,
  minutes: 15,
  'within minutes': 15,
  'same day': 720,
  '1 day': 1440,
  '1-2 days': 2160,
  '2-3 days': 3600,
  '3-5 days': 5760,
  '1 week': 10080,
}

const parseMinutes = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  const str = String(value).trim().toLowerCase()

  // Check known labels
  if (str in SPEED_LABEL_MINUTES) return SPEED_LABEL_MINUTES[str]

  // Try parsing "X hours" / "X minutes" / "X days"
  const hoursMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:hour|hr|h)s?$/i)
  if (hoursMatch) return Number(hoursMatch[1]) * 60

  const minsMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:minute|min|m)s?$/i)
  if (minsMatch) return Number(minsMatch[1])

  const daysMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:day|d)s?$/i)
  if (daysMatch) return Number(daysMatch[1]) * 1440

  // Plain numeric (assume minutes)
  const num = Number(str)
  return Number.isFinite(num) && num >= 0 ? num : null
}

export class DeliveryTimeExtractor implements FactorExtractor {
  readonly id = 'delivery-time-extractor'
  readonly name = 'Delivery Time Factor Extractor'
  readonly supportedFactorTypes = ['delivery_time' as const]

  canExtract(context: ExtractionContext): boolean {
    const payload = context.jsonResponse ?? context.rawPayload
    return payload !== undefined && (
      'delivery_time' in payload ||
      'delivery_speed' in payload ||
      'settlement_time' in payload ||
      'eta_minutes' in payload ||
      'delivery_estimate' in payload
    )
  }

  async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const start = Date.now()
    const payload = context.jsonResponse ?? context.rawPayload
    const warnings: string[] = []

    const rawValue = payload.delivery_time
      ?? payload.delivery_speed
      ?? payload.settlement_time
      ?? payload.eta_minutes
      ?? payload.delivery_estimate

    const minutes = parseMinutes(rawValue)
    let confidence: 'high' | 'medium' | 'low' | 'none' = 'none'

    if (minutes !== null) {
      if (typeof rawValue === 'number') {
        confidence = 'high'
      } else if (typeof rawValue === 'string' && rawValue.trim().toLowerCase() in SPEED_LABEL_MINUTES) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }
    }

    return {
      factors: minutes !== null ? [{
        factorType: 'delivery_time',
        rawValue: rawValue as string | number,
        normalizedValue: minutes,
        unit: 'minutes',
        confidence,
        source: 'direct',
        extractorId: this.id,
        metadata: { originalUnit: typeof rawValue === 'string' ? rawValue : 'numeric' },
      }] : [],
      warnings,
      extractorId: this.id,
      durationMs: Date.now() - start,
    }
  }
}
