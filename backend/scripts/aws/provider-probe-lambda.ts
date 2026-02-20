/**
 * Generic Provider Probe Lambda Handler
 *
 * AWS Lambda wrapper for provider health probes.
 *
 * Required env:
 * - PROVIDER_ID (single-provider mode) OR PROVIDER_IDS (fan-in mode, comma-separated)
 *
 * This handler resolves AWS parameters (DB/Redis) and then runs the generic probe.
 * It is designed so CDK can schedule N providers with one shared code asset,
 * avoiding duplicated `*-probe-lambda.ts` files per provider.
 */

import { createLogger } from '../../shared/logger'
import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { runGenericProbe } from '../lib/generic-probe'
import { formatError } from '../../shared/utils/error-handling'

type ProbeInvocationResult = {
  providerId: string
  success: boolean
  result?: unknown
  error?: string
}

type ProbeLambdaResponse = {
  success: boolean
  result?: unknown
  results?: ProbeInvocationResult[]
  error?: string
}

const parseProviderIds = (): string[] => {
  const providerIdsRaw = (process.env.PROVIDER_IDS || '').trim()
  if (providerIdsRaw) {
    return Array.from(new Set(
      providerIdsRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ))
  }
  const providerId = (process.env.PROVIDER_ID || '').trim()
  return providerId ? [providerId] : []
}

const logger = createLogger('script.provider-probe-lambda')

export const handler = async (): Promise<ProbeLambdaResponse> => {
  const startTime = Date.now()
  const lambdaTimeoutMs = Number(process.env.AWS_LAMBDA_FUNCTION_TIMEOUT) * 1000 || 300000
  const timeoutWarningThreshold = lambdaTimeoutMs * 0.8
  const providerIds = parseProviderIds()
  const probeTimeoutOverride = Number(process.env.PROBE_TIMEOUT_MS)
  const requestedProbeTimeoutMs = Number.isFinite(probeTimeoutOverride) && probeTimeoutOverride > 0
    ? probeTimeoutOverride
    : 300000
  const probeRetries = Number(process.env.PROBE_RETRIES) || 0

  if (providerIds.length === 0) {
    const error = 'Missing PROVIDER_ID or PROVIDER_IDS'
    logger.error('probe_lambda_failed', { error })
    return { success: false, error }
  }

  logger.info('probe_lambda_start', {
    provider_count: providerIds.length,
    provider_ids: providerIds,
  })

  try {
    // Resolve database URL (Plane B)
    try {
      await resolveDatabaseUrl({
        envVar: 'DATABASE_URL_PLANE_B',
        secretArnEnv: 'PLANE_B_DB_SECRET_ARN',
        ssmNameEnv: 'PLANE_B_DB_SSM_NAME',
        hostEnv: 'PLANE_B_DB_HOST',
        portEnv: 'PLANE_B_DB_PORT',
        nameEnv: 'PLANE_B_DB_NAME',
        usernameEnv: 'PLANE_B_DB_USERNAME',
        passwordEnv: 'PLANE_B_DB_PASSWORD',
        requireJson: true,
        required: true,
        sslModeEnv: 'PGSSLMODE',
        jsonKeys: ['url', 'DATABASE_URL_PLANE_B', 'database_url'],
      })

      if (!process.env.DATABASE_URL_PLANE_B) {
        throw new Error('DATABASE_URL_PLANE_B is required but not set after resolution')
      }
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      logger.error('database_url_resolution_failed', {
        job_name: process.env.JOB_NAME || 'provider-probe',
        env_vars_attempted: [
          'DATABASE_URL_PLANE_B',
          'PLANE_B_DB_SECRET_ARN',
          'PLANE_B_DB_SSM_NAME',
          'PLANE_B_DB_HOST',
          'PLANE_B_DB_PORT',
          'PLANE_B_DB_NAME',
        ],
        error: message,
        stack,
      })
      throw new Error(`Failed to resolve database URL: ${message}`)
    }

    // Resolve optional Redis URL
    try {
      await resolveAwsEnv([
        {
          envVar: 'REDIS_URL',
          secretArnEnv: 'REDIS_SECRET_ARN',
          ssmNameEnv: 'REDIS_SSM_NAME',
          jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
          required: false,
        },
      ])
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      logger.error('aws_env_resolution_failed', {
        job_name: process.env.JOB_NAME || 'provider-probe',
        env_vars_attempted: ['REDIS_URL', 'REDIS_SECRET_ARN', 'REDIS_SSM_NAME'],
        error: message,
        stack,
      })
      // Redis is optional for probes.
    }

    const elapsed = Date.now() - startTime
    if (elapsed > timeoutWarningThreshold) {
      logger.warn('lambda_timeout_warning', {
        job_name: 'provider-probe',
        elapsed_ms: elapsed,
        timeout_ms: lambdaTimeoutMs,
        threshold_ms: timeoutWarningThreshold,
      })
    }

    const results: ProbeInvocationResult[] = []
    for (const providerId of providerIds) {
      const elapsedMs = Date.now() - startTime
      const remainingMs = lambdaTimeoutMs - elapsedMs
      if (remainingMs <= 15000) {
        const error = 'Insufficient Lambda time remaining to run probe'
        logger.warn('probe_skipped_insufficient_time', {
          provider_id: providerId,
          remaining_ms: remainingMs,
          duration_ms: elapsedMs,
        })
        results.push({ providerId, success: false, error })
        continue
      }

      const perProbeTimeoutMs = Math.min(
        requestedProbeTimeoutMs,
        Math.max(10000, remainingMs - 5000),
      )

      try {
        const result = await runGenericProbe({
          providerId,
          timeoutMs: perProbeTimeoutMs,
          retries: probeRetries,
          outputFormat: 'json',
        })

        logger.info('probe_lambda_provider_complete', {
          provider_id: providerId,
          success: result.success,
          duration_ms: Date.now() - startTime,
          timeout_ms: perProbeTimeoutMs,
        })
        results.push({ providerId, success: result.success, result })
      } catch (error: unknown) {
        const { message, stack } = formatError(error)
        logger.error('probe_lambda_provider_failed', {
          provider_id: providerId,
          error: message,
          stack,
          duration_ms: Date.now() - startTime,
          timeout_ms: perProbeTimeoutMs,
        })
        results.push({ providerId, success: false, error: message })
      }
    }

    const success = results.every((result) => result.success)
    logger.info('probe_lambda_complete', {
      success,
      provider_count: providerIds.length,
      failures: results.filter((result) => !result.success).map((result) => result.providerId),
      duration_ms: Date.now() - startTime,
    })

    if (providerIds.length === 1) {
      return {
        success,
        result: results[0]?.result,
        results,
      }
    }
    return { success, results }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_lambda_failed', {
      provider_ids: providerIds,
      error: message,
      stack,
      duration_ms: Date.now() - startTime,
    })

    return { success: false, error: message }
  }
}
