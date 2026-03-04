/**
 * Generic Provider Probe - Provider-agnostic health probe implementation.
 * 
 * This module eliminates code duplication across provider-specific probe files.
 * All provider-specific configuration is passed as parameters.
 */

import { createLogger } from '../../shared/logger'
import { getHealthCorridors, type ProviderId } from '../../shared/health-corridors'
import { getProvider, providerRegistry } from '../../plane-b/src/providers'
import { createProbeRunner, outputProbeResult, type ProbeResult } from './probe-utils'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { formatError } from '../../shared/utils/error-handling'

export type GenericProbeOptions = {
  providerId: string
  timeoutMs?: number
  retries?: number
  retryBaseDelayMs?: number
  outputFormat?: 'json' | 'text'
  amountBuckets?: number[]
  payinMethod?: string
  payoutMethod?: string
  locale?: string
}

/**
 * Runs a generic provider health probe.
 */
export const runGenericProbe = async (options: GenericProbeOptions): Promise<ProbeResult> => {
  const logger = createLogger(`script.probe.${options.providerId}`)
  const providerId = options.providerId
  const provider = getProvider(providerId)

  if (!provider) {
    const error = `Provider not found: ${providerId}. Available providers: ${providerRegistry.map(p => p.providerId).join(', ')}`
    logger.error('provider_not_found', {
      provider_id: providerId,
      available_providers: providerRegistry.map(p => p.providerId),
    })
    throw new Error(error)
  }

  const corridors = [...getHealthCorridors(providerId as ProviderId)]
  const maxCorridors = Number(process.env.PROBE_MAX_CORRIDORS)
  const limitedCorridors = Number.isFinite(maxCorridors) && maxCorridors > 0
    ? corridors.slice(0, maxCorridors)
    : corridors
  const timeoutMs = options.timeoutMs ?? (Number(process.env.PROBE_TIMEOUT_MS) || 300000)
  const retries = options.retries ?? (Number(process.env.PROBE_RETRIES) || 3)
  const retryBaseDelayMs = options.retryBaseDelayMs ?? (Number(process.env.PROBE_RETRY_BASE_DELAY_MS) || 1000)
  const amountBucketsEnv = process.env.PROBE_AMOUNT_BUCKETS
  const parsedAmountBuckets = amountBucketsEnv
    ? amountBucketsEnv
      .split(',')
      .map(value => Number(value.trim()))
      .filter(value => Number.isFinite(value) && value > 0)
    : null
  const amountBuckets = options.amountBuckets ?? parsedAmountBuckets ?? [100]
  const payinMethod = options.payinMethod ?? process.env.PROBE_PAYIN_METHOD ?? 'bank_transfer'
  const payoutMethod = options.payoutMethod ?? process.env.PROBE_PAYOUT_METHOD ?? 'bank_deposit'
  const locale = options.locale ?? process.env.PROBE_LOCALE ?? 'en-US'

  const runner = createProbeRunner({
    providerId,
      corridors: limitedCorridors,
    timeoutMs,
    retries,
    retryBaseDelayMs,
  })

  const pool = createPool(config.db.planeBUrl)

  try {
    const result = await runner.run(async () => {
      return await provider.run({
        pool,
        collectorType: 'health_probe',
      corridors: limitedCorridors,
        amountBuckets,
        payinMethod,
        payoutMethod,
        locale,
        rpmOverride: provider.baseRates.rpm,
        perCorridorRpmOverride: provider.baseRates.perCorridorRpm,
      })
    })

    outputProbeResult(result, options.outputFormat ?? (process.env.PROBE_OUTPUT_FORMAT === 'text' ? 'text' : 'json'))
    logger.info('probe_complete', result)

    return result
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_failed', {
      provider_id: providerId,
      error: message,
      stack,
    })
    throw error
  } finally {
    await pool.end()
  }
}
