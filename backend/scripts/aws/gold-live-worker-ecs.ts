/**
 * Gold Live Worker ECS Entry Point
 *
 * Resolves both Plane B (Silver) and Plane C (Gold) database URLs before starting the worker.
 */

import { resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.gold-live-worker-ecs')

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
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('plane_b_database_url_resolution_failed', {
      job_name: 'gold-live-worker',
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
    throw new Error(`Failed to resolve Plane B database URL: ${message}`)
  }

  try {
    await resolveDatabaseUrl({
      envVar: 'DATABASE_URL_PLANE_C',
      secretArnEnv: 'PLANE_C_DB_SECRET_ARN',
      ssmNameEnv: 'PLANE_C_DB_SSM_NAME',
      hostEnv: 'PLANE_C_DB_HOST',
      portEnv: 'PLANE_C_DB_PORT',
      nameEnv: 'PLANE_C_DB_NAME',
      usernameEnv: 'PLANE_C_DB_USERNAME',
      passwordEnv: 'PLANE_C_DB_PASSWORD',
      requireJson: true,
      required: true,
      sslModeEnv: 'PGSSLMODE',
      jsonKeys: ['url', 'DATABASE_URL_PLANE_C', 'database_url'],
    })
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('plane_c_database_url_resolution_failed', {
      job_name: 'gold-live-worker',
      env_vars_attempted: [
        'DATABASE_URL_PLANE_C',
        'PLANE_C_DB_SECRET_ARN',
        'PLANE_C_DB_SSM_NAME',
        'PLANE_C_DB_HOST',
        'PLANE_C_DB_PORT',
        'PLANE_C_DB_NAME',
      ],
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve Plane C database URL: ${message}`)
  }

  const { runStartupChecks } = await import('../../shared/startup')
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requirePlaneCDb: true,
      requireRedis: true,
      // Gold-live only needs Plane B + Plane C + Redis + gold-live queue.
      // Do not hard-require every queue/bucket (exports, alerts eval, etc).
      requireQueues: false,
      requireStorage: false,
    },
  })

  const { startHealthServer } = await import('../../shared/health-server')
  await startHealthServer({
    loggerName: 'script.gold-live-worker-ecs.health-server',
  })

  const goldLiveMode = process.env.GOLD_LIVE_QUEUE_MODE || 'off'
  if (goldLiveMode === 'queue' && !process.env.GOLD_LIVE_QUEUE_URL) {
    throw new Error('GOLD_LIVE_QUEUE_URL required when GOLD_LIVE_QUEUE_MODE=queue')
  }

  const { runGoldLiveWorker } = await import('../gold-live-worker')
  return await runGoldLiveWorker()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('gold_live_worker_fatal', {
        error: message,
        stack,
      })
      process.exit(1)
    })
}
