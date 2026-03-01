import type { Pool } from 'pg'

import {
  VolatilityService as SharedVolatilityService,
  buildCacheTtlResult,
  type CacheTtlResult,
  type VolatilityTier,
} from '../../../shared/volatility-service'
import { createLogger } from '../../../shared/logger'
import { CorridorVolatilityRepository } from '../repositories'

const logger = createLogger('plane-b.volatility-service')

export class VolatilityService {
  private readonly service: SharedVolatilityService
  private readonly repo: CorridorVolatilityRepository

  constructor(pool: Pool) {
    this.repo = new CorridorVolatilityRepository(pool)
    this.service = new SharedVolatilityService(this.repo)
  }

  getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult> {
    return this.service.getCacheTtlForCorridor(corridorId)
  }

  async getCacheTtlForCorridors(
    corridorIds: string[],
  ): Promise<Map<string, CacheTtlResult>> {
    const volatilityMap = await this.repo.getVolatilityScores(corridorIds)
    const { config } = await import('../../../shared/config')
    const allowOnDemand = config.volatility.cacheOnDemand
    const missingCorridorIds = allowOnDemand
      ? corridorIds.filter(id => !volatilityMap.has(id))
      : []

    if (missingCorridorIds.length > 0) {
      const calculationPromises = missingCorridorIds.map(async (corridorId) => {
        try {
          const calculated = await this.repo.calculateVolatilityScore(corridorId)
          if (calculated) {
            volatilityMap.set(corridorId, calculated)
          }
        } catch (error) {
          logger.error('volatility_calculation_failed', {
            corridor_id: corridorId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })

      await Promise.all(calculationPromises)
    }

    const resultMap = new Map<string, CacheTtlResult>()

    for (const corridorId of corridorIds) {
      const record = volatilityMap.get(corridorId)
      if (!record) {
        resultMap.set(corridorId, buildCacheTtlResult(null, false))
        continue
      }

      resultMap.set(
        corridorId,
        buildCacheTtlResult(record.volatility_score, true),
      )
    }

    return resultMap
  }

  async refreshCacheForCorridors(corridorIds: string[]): Promise<number> {
    return this.repo.upsertVolatilityForCorridors(corridorIds)
  }
}

export type { CacheTtlResult, VolatilityTier }
