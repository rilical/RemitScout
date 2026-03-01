import type { Pool } from 'pg'
import type { JobContext, JobResult } from '../../../shared/types/job'
import { BaseJobHandler } from './base-job-handler'

/**
 * Adapter that wraps existing BaseCollector-based collectors as JobHandlers.
 *
 * This bridges the legacy collector system with the new agent-native job handler
 * architecture. Existing providers continue to use BaseCollector for data collection,
 * while this adapter provides the JobHandler interface for the dispatch queue.
 *
 * The adapter:
 * - Creates a job run record
 * - Delegates to the provider's existing collector
 * - Translates the boolean success/failure to JobResult
 * - Optionally dual-writes observations (behind EMIT_OBSERVATIONS flag)
 */
export class QuoteJobHandlerAdapter extends BaseJobHandler {
  readonly handlerType = 'quote_collection'

  private readonly collectorFactory: CollectorFactory

  constructor(collectorFactory: CollectorFactory) {
    super('plane-b.handlers.quote-adapter')
    this.collectorFactory = collectorFactory
  }

  protected async run(context: JobContext): Promise<JobResult> {
    const pool = context.pool as Pool
    const startedAt = Date.now()

    // Resolve the collector for this module
    const collector = this.collectorFactory(context.moduleId, pool)
    if (!collector) {
      this.logger.error('collector_not_found', { moduleId: context.moduleId })
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        durationMs: Date.now() - startedAt,
        error: new Error(`No collector registered for module: ${context.moduleId}`),
      }
    }

    try {
      // Delegate to the existing collector
      const success = await collector.collect({
        corridors: context.corridors,
        amountBuckets: context.amountBuckets,
        signal: context.signal,
      })

      const durationMs = Date.now() - startedAt

      // Record summary observation if dual-write is enabled
      if (process.env.EMIT_OBSERVATIONS === 'true') {
        const [providerId] = context.moduleId.split(':')
        await this.emitObservation(pool, this.buildObservation(
          context.moduleId,
          providerId,
          'event',
          {
            eventType: 'collection_complete',
            success,
            durationMs,
            corridorCount: context.corridors.length,
            bucketCount: context.amountBuckets.length,
          },
          { ingestionRunId: context.jobRunId },
        ))
      }

      return {
        success,
        itemsProcessed: success ? 1 : 0,
        itemsFailed: success ? 0 : 1,
        durationMs,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 1,
        durationMs: Date.now() - startedAt,
        error,
      }
    }
  }
}

/**
 * Minimal collector interface for the adapter.
 * Matches the subset of BaseCollector that we need.
 */
type CollectorInstance = {
  collect(options: {
    corridors: string[]
    amountBuckets: number[]
    signal?: AbortSignal
  }): Promise<boolean>
}

/**
 * Factory function that creates a collector instance given a module ID and pool.
 * Returns null if the module is not registered.
 */
export type CollectorFactory = (moduleId: string, pool: Pool) => CollectorInstance | null
