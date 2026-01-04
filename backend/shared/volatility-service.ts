import { createLogger } from './logger'

export type VolatilityTier = 'tier1' | 'tier2' | 'tier3'

export type CacheTtlResult = {
  ttlSeconds: number
  tier: VolatilityTier
  volatilityScore: number | null
  hasData: boolean
}

export type VolatilityRecord = {
  corridor_id: string
  volatility_score: number
  sample_count: number
  mean_rate: number
  stddev_rate: number
  calculated_at: Date
}

export type VolatilityStats = {
  meanRate: number | null
  stddevRate: number | null
  sampleCount: number
}

export type VolatilityRepository = {
  getVolatilityScore(corridorId: string): Promise<VolatilityRecord | null>
  calculateVolatilityScore(corridorId: string): Promise<VolatilityRecord | null>
}

const VOLATILITY_TIER_THRESHOLDS = {
  tier1High: 0.15,
  tier2Moderate: 0.08,
} as const

const CACHE_TTL_SECONDS = {
  tier1: 30 * 60,
  tier2: 60 * 60,
  tier3: 4 * 60 * 60,
  default: 2 * 60 * 60,
} as const

export const computeVolatilityScore = (stats: VolatilityStats): number | null => {
  const meanRate = stats.meanRate
  const stddevRate = stats.stddevRate
  const sampleCount = stats.sampleCount

  if (
    meanRate === null ||
    stddevRate === null ||
    !Number.isFinite(meanRate) ||
    !Number.isFinite(stddevRate) ||
    meanRate === 0 ||
    sampleCount < 10
  ) {
    return null
  }

  const coefficientOfVariation = stddevRate / meanRate
  return Math.min(1.0, Math.max(0.0, coefficientOfVariation))
}

export const buildCacheTtlResult = (
  volatilityScore: number | null,
  hasData: boolean,
): CacheTtlResult => {
  if (volatilityScore === null || !Number.isFinite(volatilityScore)) {
    return {
      ttlSeconds: CACHE_TTL_SECONDS.default,
      tier: 'tier2',
      volatilityScore: null,
      hasData: false,
    }
  }

  if (volatilityScore >= VOLATILITY_TIER_THRESHOLDS.tier1High) {
    return {
      ttlSeconds: CACHE_TTL_SECONDS.tier1,
      tier: 'tier1',
      volatilityScore,
      hasData,
    }
  }

  if (volatilityScore >= VOLATILITY_TIER_THRESHOLDS.tier2Moderate) {
    return {
      ttlSeconds: CACHE_TTL_SECONDS.tier2,
      tier: 'tier2',
      volatilityScore,
      hasData,
    }
  }

  return {
    ttlSeconds: CACHE_TTL_SECONDS.tier3,
    tier: 'tier3',
    volatilityScore,
    hasData,
  }
}

export class VolatilityService {
  private readonly logger = createLogger('shared.volatility-service')

  constructor(private readonly repo: VolatilityRepository) {}

  async getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult> {
    let volatilityRecord = await this.repo.getVolatilityScore(corridorId)

    if (!volatilityRecord) {
      try {
        volatilityRecord = await this.repo.calculateVolatilityScore(corridorId)
      } catch (error) {
        this.logger.error('volatility_calculation_failed', {
          corridor_id: corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (!volatilityRecord) {
      return buildCacheTtlResult(null, false)
    }

    return buildCacheTtlResult(volatilityRecord.volatility_score, true)
  }
}
