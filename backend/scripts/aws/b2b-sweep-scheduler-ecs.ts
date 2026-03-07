/**
 * B2B Sweep Scheduler ECS Entry Point
 *
 * ECS task entry point for the B2B sweep scheduler.
 * Resolves AWS parameters and runs a single scheduler cycle.
 */

import { createLogger } from '../../shared/logger'
import { resolveDatabaseUrl } from '../../shared/aws-params'
import { formatError } from '../../shared/utils/error-handling'
import { resolveIngestFanoutQueueState } from '../../shared/ingest-fanout-queues'

const logger = createLogger('script.b2b-sweep-scheduler-ecs')

export const handler = async (): Promise<number> => {
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
      job_name: 'b2b-sweep-scheduler',
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

  const { runStartupChecks } = await import('../../shared/startup')
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: true,
      // The sweep scheduler only needs Plane B DB + Redis + ingest-fanout queue.
      // It must not hard-require unrelated queues/buckets (exports, alerts eval, etc).
      requireQueues: false,
      requireStorage: false,
    },
  })

  const ingestMode = process.env.PLANE_B_INGEST_FANOUT_QUEUE_MODE || 'off'
  const queueState = resolveIngestFanoutQueueState({
    mode: ingestMode,
    url: process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL,
    tier1Url: process.env.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL,
    tier2Url: process.env.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL,
  })
  if (ingestMode === 'queue' && queueState.tierMisconfigured) {
    throw new Error('PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL and PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL must both be set when using tiered ingest fanout queues')
  }
  if (ingestMode === 'queue' && !queueState.enabledForQueueProducer) {
    throw new Error('PLANE_B_INGEST_FANOUT_QUEUE_URL or the full tiered pair (PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL + PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL) is required when PLANE_B_INGEST_FANOUT_QUEUE_MODE=queue')
  }

  try {
    const { runB2bSweepScheduler } = await import('../b2b-sweep-dispatch')
    return await runB2bSweepScheduler()
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('b2b_sweep_scheduler_failed', { error: message, stack })
    throw error
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(code => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('b2b_sweep_scheduler_fatal', { error: message, stack })
      process.exit(1)
    })
}
