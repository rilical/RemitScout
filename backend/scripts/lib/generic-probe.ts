/**
 * Generic Provider Probe - Provider-agnostic health probe implementation.
 * 
 * This module eliminates code duplication across provider-specific probe files.
 * All provider-specific configuration is passed as parameters.
 */

import { createLogger } from '../../shared/logger'
import { getHealthCorridors } from '../../shared/health-corridors'
import { getProvider, providerRegistry } from '../../plane-b/src/providers'
import { createProbeRunner, outputProbeResult, type ProbeResult } from './probe-utils'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { formatError } from '../../shared/utils/error-handling'

export type GenericProbeOptions = {
  providerId: string
  timeoutMs?: number
  retries?: number
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

  const corridors = [...getHealthCorridors(providerId)]
  const runner = createProbeRunner({
    providerId,
    corridors,
    timeoutMs: options.timeoutMs ?? Number(process.env.PROBE_TIMEOUT_MS) || 300000,
    retries: options.retries ?? Number(process.env.PROBE_RETRIES) || 0,
  })

  const pool = createPool(config.db.planeBUrl)

  try {
    const result = await runner.run(async () => {
      return await provider.run({
        pool,
        collectorType: 'health_probe',
        corridors,
        amountBuckets: options.amountBuckets ?? [100],
        payinMethod: options.payinMethod ?? 'bank_transfer',
        payoutMethod: options.payoutMethod ?? 'bank_deposit',
        locale: options.locale ?? 'en-US',
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


