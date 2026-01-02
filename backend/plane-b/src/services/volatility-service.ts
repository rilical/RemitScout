import type { Pool } from 'pg'

import { createLogger } from '../../../../shared/logger'
import { CorridorVolatilityRepository } from '../repositories'

const logger = createLogger('plane-b.volatility-service')

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

export type VolatilityTier = 'tier1' | 'tier2' | 'tier3'

export type CacheTtlResult = {
  ttlSeconds: number
  tier: VolatilityTier
  volatilityScore: number | null
  hasData: boolean
}

export class VolatilityService {
  constructor(private readonly pool: Pool) {}

  async getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult> {
    const repo = new CorridorVolatilityRepository(this.pool)

    let volatilityRecord = await repo.getVolatilityScore(corridorId)

    if (!volatilityRecord) {
      try {
        volatilityRecord = await repo.calculateVolatilityScore(corridorId)
      } catch (error) {
        logger.error('volatility_calculation_failed', {
          corridor_id: corridorId,
          error: error as Error,
        })
      }
    }

    if (!volatilityRecord) {
      return {
        ttlSeconds: CACHE_TTL_SECONDS.default,
        tier: 'tier2',
        volatilityScore: null,
        hasData: false,
      }
    }

    const score = volatilityRecord.volatility_score

    if (score >= VOLATILITY_TIER_THRESHOLDS.tier1High) {
      return {
        ttlSeconds: CACHE_TTL_SECONDS.tier1,
        tier: 'tier1',
        volatilityScore: score,
        hasData: true,
      }
    }

    if (score >= VOLATILITY_TIER_THRESHOLDS.tier2Moderate) {
      return {
        ttlSeconds: CACHE_TTL_SECONDS.tier2,
        tier: 'tier2',
        volatilityScore: score,
        hasData: true,
      }
    }

    return {
      ttlSeconds: CACHE_TTL_SECONDS.tier3,
      tier: 'tier3',
      volatilityScore: score,
      hasData: true,
    }
  }

  async getCacheTtlForCorridors(
    corridorIds: string[],
  ): Promise<Map<string, CacheTtlResult>> {
    const repo = new CorridorVolatilityRepository(this.pool)
    const volatilityMap = await repo.getVolatilityScores(corridorIds)

    const missingCorridorIds = corridorIds.filter(id => !volatilityMap.has(id))

    if (missingCorridorIds.length > 0) {
      const calculationPromises = missingCorridorIds.map(async (corridorId) => {
        try {
          const calculated = await repo.calculateVolatilityScore(corridorId)
          if (calculated) {
            volatilityMap.set(corridorId, calculated)
          }
        } catch (error) {
          logger.error('volatility_calculation_failed', {
            corridor_id: corridorId,
            error: error as Error,
          })
        }
      })

      await Promise.all(calculationPromises)
    }

    const resultMap = new Map<string, CacheTtlResult>()

    for (const corridorId of corridorIds) {
      const record = volatilityMap.get(corridorId)

      if (!record) {
        resultMap.set(corridorId, {
          ttlSeconds: CACHE_TTL_SECONDS.default,
          tier: 'tier2',
          volatilityScore: null,
          hasData: false,
        })
        continue
      }

      const score = record.volatility_score

      if (score >= VOLATILITY_TIER_THRESHOLDS.tier1High) {
        resultMap.set(corridorId, {
          ttlSeconds: CACHE_TTL_SECONDS.tier1,
          tier: 'tier1',
          volatilityScore: score,
          hasData: true,
        })
      } else if (score >= VOLATILITY_TIER_THRESHOLDS.tier2Moderate) {
        resultMap.set(corridorId, {
          ttlSeconds: CACHE_TTL_SECONDS.tier2,
          tier: 'tier2',
          volatilityScore: score,
          hasData: true,
        })
      } else {
        resultMap.set(corridorId, {
          ttlSeconds: CACHE_TTL_SECONDS.tier3,
          tier: 'tier3',
          volatilityScore: score,
          hasData: true,
        })
      }
    }

    return resultMap
  }
}

