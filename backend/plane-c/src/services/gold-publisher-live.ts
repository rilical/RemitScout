/**
 * Gold Publisher Live - Real-time publisher for event-driven Gold updates.
 *
 * Unlike the batch GoldPublisher, this uses:
 * - Separate pools for Silver (reads) and Gold (writes)
 * - Rolling 4-hour windows instead of strict bucket boundaries
 * - Optimized for single-corridor updates
 * - B2B collector filter (ir.collector_type LIKE 'b2b_%')
 * - Rights matrix enforcement (allowed_resell_b2b, status = 'production')
 * - USD-normalized amount bucket conversion
 */

import type { Pool, PoolClient } from 'pg'
import { query } from '../../../shared/db'
import { evaluatePublisherGates } from './publisher-gates'
import { createLogger } from '../../../shared/logger'
import { getB2bAmountBucket } from '../../../shared/amount-bucket'
import { buildB2bEffectiveRateSql } from '../../../shared/quote-rate'
import type { AggregatedData, GateResult, PublisherResult } from './publisher-types'

const logger = createLogger('plane-c.gold-publisher-live')

type QuoteRecord = {
  provider_id: string
  effective_fx_rate: number
  collected_at: Date
}

export class GoldPublisherLive {
  constructor(
    private readonly silverPool: Pool,
    private readonly goldPool: Pool,
  ) {}

  async aggregateCorridorData(corridorId: string): Promise<AggregatedData | null> {
    const timestampBucket = this.getCurrent4HourBucket()
    const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const amountBucket = getB2bAmountBucket(corridorId)
    const payoutMethod = 'bank_deposit'
    const payinMethods = ['bank_transfer', 'debit_card']
    const effectiveRateSql = buildB2bEffectiveRateSql('qr')

    const result = await query<QuoteRecord>(
      `SELECT qr.provider_id, ${effectiveRateSql} AS effective_fx_rate, qr.collected_at
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
          AND (${effectiveRateSql}) IS NOT NULL
          AND (${effectiveRateSql}) > 0
          AND qr.collected_at >= $5::timestamptz`,
      [corridorId, amountBucket, payoutMethod, payinMethods, windowStart],
      this.silverPool,
    )

    if (result.rows.length === 0) {
      return null
    }

    const providerRates = new Map<string, number[]>()
    for (const row of result.rows) {
      const rates = providerRates.get(row.provider_id) || []
      rates.push(Number(row.effective_fx_rate))
      providerRates.set(row.provider_id, rates)
    }

    const providerAverages = new Map<string, number>()
    for (const [providerId, rates] of providerRates.entries()) {
      const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      providerAverages.set(providerId, avg)
    }

    const allRates = result.rows.map((row) => Number(row.effective_fx_rate))
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
      corridor_id: data.corridorId,
      contributor_count: data.contributorCount,
      top_provider_share: data.topProviderShare,
      top_two_share: data.topTwoShare,
    })
  }

  async publishToGoldExport(data: AggregatedData): Promise<void> {
    const client: PoolClient = await this.goldPool.connect()
    try {
      await client.query('BEGIN')

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
        client,
      )

      await client.query('COMMIT')
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        logger.warn('gold_export_live_rollback_failed', {
          corridor_id: data.corridorId,
          error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
        })
      }
      throw error
    } finally {
      client.release()
    }
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

    const failedCorridors: string[] = []

    const batchSize = 10
    for (let i = 0; i < corridors.length; i += batchSize) {
      const batch = corridors.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(async (corridorId) => {
          try {
            const aggregatedData = await this.aggregateCorridorData(corridorId)

            if (!aggregatedData) {
              return { published: false, withheld: false, corridorId }
            }

            const gateResult = this.applyPublisherGates(aggregatedData)

            if (gateResult.allowed) {
              await this.publishToGoldExport(aggregatedData)
              logger.debug('corridor_published_live', {
                corridor_id: corridorId,
                provider_count: aggregatedData.providerCount,
              })
              return { published: true, withheld: false, corridorId }
            } else {
              logger.debug('corridor_withheld_live', {
                corridor_id: corridorId,
                reasons: gateResult.reasons,
              })
              return { published: false, withheld: true, corridorId }
            }
          } catch (error) {
            logger.error('corridor_processing_error_live', {
              corridor_id: corridorId,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            })
            throw error
          }
        }),
      )

      for (let j = 0; j < batchResults.length; j++) {
        const batchResult = batchResults[j]
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value.published) {
            result.published++
          } else if (batchResult.value.withheld) {
            result.withheld++
          }
        } else {
          result.errors++
          failedCorridors.push(batch[j])
        }
      }
    }

    if (failedCorridors.length > 0) {
      logger.warn('live_publish_partial_failure', {
        total_corridors: corridors.length,
        failed_count: failedCorridors.length,
        published_count: result.published,
        failed_corridors: failedCorridors.slice(0, 20),
      })
    }

    return result
  }

  private getCurrent4HourBucket(): Date {
    const now = new Date()
    const hours = now.getUTCHours()
    const bucketHour = Math.floor(hours / 4) * 4
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), bucketHour, 0, 0, 0))
  }
}
