import type { Pool } from 'pg'
import { query } from '../../../shared/db'
import { evaluatePublisherGates } from './publisher-gates'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-c.gold-publisher')

export type AggregatedData = {
  corridorId: string
  timestampBucket: Date
  providerCount: number
  avgRate: number
  minRate: number
  maxRate: number
  topProviderShare: number
  topTwoShare: number
  contributorCount: number
  metadata?: Record<string, unknown>
}

export type GateResult = {
  allowed: boolean
  reasons: string[]
}

export type PublisherResult = {
  published: number
  withheld: number
  errors: number
}

type QuoteRecord = {
  provider_id: string
  implied_fx_rate: number
  collected_at: Date
}

export class GoldPublisher {
  constructor(private readonly pool: Pool) {}

  async aggregateCorridorData(corridorId: string): Promise<AggregatedData | null> {
    const timestampBucket = this.getCurrent4HourBucket()

    const result = await query<QuoteRecord>(
      `SELECT provider_id, implied_fx_rate, collected_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND status = 'ok'
          AND collected_at >= $2::timestamptz - INTERVAL '4 hours'
          AND collected_at < $2::timestamptz + INTERVAL '4 hours'`,
      [corridorId, timestampBucket],
      this.pool,
    )

    if (result.rows.length === 0) {
      return null
    }

    const providerRates = new Map<string, number[]>()
    for (const row of result.rows) {
      const rates = providerRates.get(row.provider_id) || []
      rates.push(Number(row.implied_fx_rate))
      providerRates.set(row.provider_id, rates)
    }

    const providerAverages = new Map<string, number>()
    for (const [providerId, rates] of providerRates.entries()) {
      const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      providerAverages.set(providerId, avg)
    }

    const allRates = result.rows.map((row) => Number(row.implied_fx_rate))
    const avgRate = allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length
    const minRate = Math.min(...allRates)
    const maxRate = Math.max(...allRates)

    const providerCount = providerAverages.size
    const contributorCount = providerCount

    const sortedProviders = Array.from(providerAverages.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)

    let topProviderShare = 0
    let topTwoShare = 0

    if (providerCount > 0 && result.rows.length > 0) {
      const topProviderQuotes = providerRates.get(sortedProviders[0])?.length || 0
      topProviderShare = topProviderQuotes / result.rows.length

      if (providerCount >= 2) {
        const topTwoQuotes =
          (providerRates.get(sortedProviders[0])?.length || 0) +
          (providerRates.get(sortedProviders[1])?.length || 0)
        topTwoShare = topTwoQuotes / result.rows.length
      }
    }

    return {
      corridorId,
      timestampBucket,
      providerCount,
      avgRate,
      minRate,
      maxRate,
      topProviderShare,
      topTwoShare,
      contributorCount,
      metadata: {
        provider_ids: sortedProviders,
      },
    }
  }

  applyPublisherGates(data: AggregatedData): GateResult {
    return evaluatePublisherGates({
      contributor_count: data.contributorCount,
      top_provider_share: data.topProviderShare,
      top_two_share: data.topTwoShare,
    })
  }

  async publishToGoldExport(data: AggregatedData): Promise<void> {
    await query(
      `INSERT INTO gold_export.corridor_rates (
         corridor_id,
         timestamp_bucket,
         provider_count,
         avg_rate,
         min_rate,
         max_rate,
         top_provider_share,
         top_two_share,
         contributor_count,
         metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (corridor_id, timestamp_bucket)
       DO UPDATE SET
         provider_count = EXCLUDED.provider_count,
         avg_rate = EXCLUDED.avg_rate,
         min_rate = EXCLUDED.min_rate,
         max_rate = EXCLUDED.max_rate,
         top_provider_share = EXCLUDED.top_provider_share,
         top_two_share = EXCLUDED.top_two_share,
         contributor_count = EXCLUDED.contributor_count,
         metadata = EXCLUDED.metadata,
         created_at = NOW()`,
      [
        data.corridorId,
        data.timestampBucket,
        data.providerCount,
        data.avgRate,
        data.minRate,
        data.maxRate,
        data.topProviderShare > 0 ? data.topProviderShare : null,
        data.topTwoShare > 0 ? data.topTwoShare : null,
        data.contributorCount,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
      this.pool,
    )
  }

  async processAllCorridors(): Promise<PublisherResult> {
    const corridorResult = await query<{ corridor_id: string }>(
      `SELECT DISTINCT corridor_id
         FROM silver.corridor
        ORDER BY corridor_id`,
      [],
      this.pool,
    )

    const corridors = corridorResult.rows.map((row) => row.corridor_id)
    const result: PublisherResult = {
      published: 0,
      withheld: 0,
      errors: 0,
    }

    // Process corridors in parallel batches of 10
    const batchSize = 10
    for (let i = 0; i < corridors.length; i += batchSize) {
      const batch = corridors.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(async (corridorId) => {
          try {
            const aggregatedData = await this.aggregateCorridorData(corridorId)

            if (!aggregatedData) {
              return { published: false, withheld: false }
            }

            const gateResult = this.applyPublisherGates(aggregatedData)

            if (gateResult.allowed) {
              await this.publishToGoldExport(aggregatedData)
              logger.info('corridor_published', {
                corridor_id: corridorId,
                provider_count: aggregatedData.providerCount,
                contributor_count: aggregatedData.contributorCount,
              })
              return { published: true, withheld: false }
            } else {
              logger.info('corridor_withheld', {
                corridor_id: corridorId,
                reasons: gateResult.reasons,
                provider_count: aggregatedData.providerCount,
                contributor_count: aggregatedData.contributorCount,
              })
              return { published: false, withheld: true }
            }
          } catch (error) {
            logger.error('corridor_processing_error', {
              corridor_id: corridorId,
              error: error instanceof Error ? error.message : String(error),
            })
            throw error
          }
        }),
      )

      // Aggregate batch results
      for (const batchResult of batchResults) {
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value.published) {
            result.published++
          } else if (batchResult.value.withheld) {
            result.withheld++
          }
        } else {
          result.errors++
        }
      }

      // Log connection pool stats periodically
      if (i % (batchSize * 5) === 0) {
        const poolStats = {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        }
        logger.debug('publisher_pool_stats', poolStats)
      }
    }

    return result
  }

  private getCurrent4HourBucket(): Date {
    const now = new Date()
    const hours = now.getUTCHours()
    const bucketHour = Math.floor(hours / 4) * 4
    const bucket = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), bucketHour, 0, 0, 0))
    return bucket
  }
}

