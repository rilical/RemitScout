/**
 * Generic Provider Probe Lambda Handler
 *
 * AWS Lambda wrapper for provider health probes.
 *
 * Required env:
 * - PROVIDER_ID
 *
 * This handler resolves AWS parameters (DB/Redis) and then runs the generic probe.
 * It is designed so CDK can schedule N providers with one shared code asset,
 * avoiding duplicated `*-probe-lambda.ts` files per provider.
 */

import { createLogger } from '../../shared/logger'
import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { runGenericProbe } from '../lib/generic-probe'
import { formatError } from '../../shared/utils/error-handling'

const providerId = (process.env.PROVIDER_ID || '').trim()
const logger = createLogger(`script.provider-probe-lambda.${providerId || 'unknown'}`)

export const handler = async (): Promise<{ success: boolean; result?: unknown; error?: string }> => {
  const startTime = Date.now()
  const lambdaTimeoutMs = Number(process.env.AWS_LAMBDA_FUNCTION_TIMEOUT) * 1000 || 300000
  const timeoutWarningThreshold = lambdaTimeoutMs * 0.8

  if (!providerId) {
    const error = 'Missing PROVIDER_ID'
    logger.error('probe_lambda_failed', { error })
    return { success: false, error }
  }

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
        job_name: `${providerId}-probe`,
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
        job_name: `${providerId}-probe`,
        env_vars_attempted: ['REDIS_URL', 'REDIS_SECRET_ARN', 'REDIS_SSM_NAME'],
        error: message,
        stack,
      })
      // Redis is optional for probes.
    }

    const elapsed = Date.now() - startTime
    if (elapsed > timeoutWarningThreshold) {
      logger.warn('lambda_timeout_warning', {
        job_name: `${providerId}-probe`,
        elapsed_ms: elapsed,
        timeout_ms: lambdaTimeoutMs,
        threshold_ms: timeoutWarningThreshold,
      })
    }

    const result = await runGenericProbe({
      providerId,
      timeoutMs: Math.min(Number(process.env.PROBE_TIMEOUT_MS) || 300000, lambdaTimeoutMs - 10000),
      retries: Number(process.env.PROBE_RETRIES) || 0,
      outputFormat: 'json',
    })

    logger.info('probe_lambda_complete', {
      provider_id: providerId,
      success: result.success,
      duration_ms: Date.now() - startTime,
    })

    return { success: result.success, result }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_lambda_failed', {
      provider_id: providerId,
      error: message,
      stack,
      duration_ms: Date.now() - startTime,
    })

    return { success: false, error: message }
  }
}

