import type { Pool } from 'pg'
import { query } from '../../../shared/db'
import { evaluatePublisherGates } from './publisher-gates'
import { createLogger } from '../../../shared/logger'
import { getB2bAmountBucket } from '../../../shared/amount-bucket'
import type { AggregatedData, GateResult, PublisherResult } from './publisher-types'

const logger = createLogger('plane-c.gold-publisher')

type QuoteRecord = {
  provider_id: string
  implied_fx_rate: number
  collected_at: Date
}

export class GoldPublisher {
  constructor(
    private readonly silverPool: Pool,
    private readonly goldPool: Pool = silverPool,
  ) {}

  async aggregateCorridorData(corridorId: string): Promise<AggregatedData | null> {
    const timestampBucket = this.getCurrent4HourBucket()
    const bucketEnd = new Date(timestampBucket.getTime() + 4 * 60 * 60 * 1000)
    const amountBucket = getB2bAmountBucket(corridorId)
    const payoutMethod = 'bank_deposit'
    const payinMethods = ['bank_transfer', 'debit_card']

    const result = await query<QuoteRecord>(
      `SELECT qr.provider_id, qr.implied_fx_rate, qr.collected_at
         FROM silver.quote_record qr
         JOIN silver.ingestion_run ir
           ON ir.run_id = qr.ingestion_run_id
         JOIN silver.rights_matrix rm
           ON rm.provider_id = qr.provider_id
         JOIN silver.provider_corridor_capability pcc
           ON pcc.provider_id = qr.provider_id
          AND pcc.corridor_id = qr.corridor_id
        WHERE qr.corridor_id = $1
          AND qr.status = 'ok'
          AND qr.amount_bucket = $2
          AND qr.payout = $3
          AND qr.payin = ANY($4)
          AND ir.collector_type LIKE 'b2b_%'
          AND ir.status = 'success'
          AND rm.allowed_collect = true
          AND rm.allowed_b2b = true
          AND rm.allowed_resell_b2b = true
          AND rm.status = 'production'
          AND rm.stoplist_status = 'active'
          AND pcc.is_supported = true
          AND qr.collected_at >= $5::timestamptz
          AND qr.collected_at < $6::timestamptz`,
      [corridorId, amountBucket, payoutMethod, payinMethods, timestampBucket, bucketEnd],
      this.silverPool,
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

    const providerAverageRates = Array.from(providerAverages.values())
    const avgRate = providerAverageRates.reduce((sum, rate) => sum + rate, 0) / providerAverageRates.length
    const minRate = Math.min(...providerAverageRates)
    const maxRate = Math.max(...providerAverageRates)

    const providerCount = providerAverages.size
    const contributorCount = providerCount

    const sortedProviders = Array.from(providerAverages.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)

    let topProviderShare = 0
    let topTwoShare = 0

    if (providerCount > 0) {
      topProviderShare = 1 / providerCount
      topTwoShare = providerCount >= 2 ? Math.min(1, 2 / providerCount) : topProviderShare
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
        provider_quote_counts: Object.fromEntries(
          sortedProviders.map((providerId) => [providerId, providerRates.get(providerId)?.length ?? 0]),
        ),
      },
    }
  }

  applyPublisherGates(data: AggregatedData): GateResult {
    return evaluatePublisherGates({
      corridor_id: data.corridorId,
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
      this.goldPool,
    )
  }

  async processAllCorridors(): Promise<PublisherResult> {
    const corridorResult = await query<{ corridor_id: string }>(
      `SELECT DISTINCT corridor_id
         FROM silver.corridor
        ORDER BY corridor_id`,
      [],
      this.silverPool,
    )

    const corridors = corridorResult.rows.map((row) => row.corridor_id)
    return this.processCorridorList(corridors)
  }

  async processCorridors(corridors: string[]): Promise<PublisherResult> {
    const uniqueCorridors = Array.from(
      new Set(corridors.map((corridor) => corridor.trim()).filter(Boolean)),
    )
    if (uniqueCorridors.length === 0) {
      return { published: 0, withheld: 0, errors: 0 }
    }
    return this.processCorridorList(uniqueCorridors)
  }

  private async processCorridorList(corridors: string[]): Promise<PublisherResult> {
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
          total: this.silverPool.totalCount,
          idle: this.silverPool.idleCount,
          waiting: this.silverPool.waitingCount,
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
