/**
 * Factor normalization types.
 *
 * A "factor" is a structured data element extracted from raw provider responses.
 * Factors are normalized into a canonical format before entering the silver layer.
 */

export type FactorType = 'fee' | 'rate' | 'delivery_time' | 'promotional'

export type ExtractionConfidence = 'high' | 'medium' | 'low' | 'none'

export type ExtractedFactor = {
  factorType: FactorType
  rawValue: string | number | null
  normalizedValue: number | null
  unit: string
  confidence: ExtractionConfidence
  source: string
  extractorId: string
  metadata: Record<string, unknown>
}

export type ExtractionResult = {
  factors: ExtractedFactor[]
  warnings: string[]
  extractorId: string
  durationMs: number
}

export type ExtractionContext = {
  providerId: string
  corridorId: string
  collectorType: string
  rawPayload: Record<string, unknown>
  htmlSnapshot?: string
  jsonResponse?: Record<string, unknown>
}

/**
 * FactorExtractor interface - each extractor handles a specific data shape.
 */
export interface FactorExtractor {
  readonly id: string
  readonly name: string
  readonly supportedFactorTypes: FactorType[]

  canExtract(context: ExtractionContext): boolean
  extract(context: ExtractionContext): Promise<ExtractionResult>
}
