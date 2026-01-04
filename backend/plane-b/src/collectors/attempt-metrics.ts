import type { Pool } from 'pg'

import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import { AttemptMetricsRepository } from '../repositories'

const logger = createLogger('plane-b.attempt-metrics')

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export const loadAttemptMetrics = async (
  pool: Pool,
  providerId: string,
  locale: string,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('attempt_metrics_invalid_provider_id', { provider_id: providerId })
    return { avgAttemptSeconds: null, sampleCount: 0 }
  }

  if (!locale || typeof locale !== 'string' || locale.trim().length === 0) {
    logger.warn('attempt_metrics_invalid_locale', { locale })
    return { avgAttemptSeconds: null, sampleCount: 0 }
  }

  try {
    const repo = new AttemptMetricsRepository(pool)
    const row = await repo.getMetrics(providerId, locale)
    const avgAttemptSeconds = isPositiveNumber(row?.avg_attempt_seconds)
      ? row.avg_attempt_seconds
      : null
    const sampleCount = isPositiveNumber(row?.sample_count)
      ? Math.floor(row.sample_count)
      : 0

    logger.debug('attempt_metrics_loaded', {
      provider_id: providerId,
      locale,
      avg_attempt_seconds: avgAttemptSeconds,
      sample_count: sampleCount,
    })

    return {
      avgAttemptSeconds,
      sampleCount,
    }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('attempt_metrics_load_failed', {
      provider_id: providerId,
      locale,
      error: message,
      stack,
    })
    // Return default values on error
    return {
      avgAttemptSeconds: null,
      sampleCount: 0,
    }
  }
}

export const persistAttemptMetrics = async (
  pool: Pool,
  providerId: string,
  locale: string,
  avgAttemptSeconds: number,
  sampleCount: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('attempt_metrics_invalid_provider_id', { provider_id: providerId })
    return
  }

  if (!locale || typeof locale !== 'string' || locale.trim().length === 0) {
    logger.warn('attempt_metrics_invalid_locale', { locale })
    return
  }

  if (!isPositiveNumber(avgAttemptSeconds) || !isPositiveNumber(sampleCount)) {
    logger.warn('attempt_metrics_validation_failed', {
      provider_id: providerId,
      locale,
      avg_attempt_seconds: avgAttemptSeconds,
      sample_count: sampleCount,
    })
    return
  }

  try {
    const repo = new AttemptMetricsRepository(pool)
    await repo.upsertMetrics({
      providerId,
      locale,
      avgAttemptSeconds,
      sampleCount: Math.floor(sampleCount),
    })

    logger.debug('attempt_metrics_persisted', {
      provider_id: providerId,
      locale,
      avg_attempt_seconds: avgAttemptSeconds,
      sample_count: sampleCount,
    })
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('attempt_metrics_persist_failed', {
      provider_id: providerId,
      locale,
      avg_attempt_seconds: avgAttemptSeconds,
      sample_count: sampleCount,
      error: message,
      stack,
    })
    // Don't throw - allow collector to continue even if metrics save fails
  }
}
