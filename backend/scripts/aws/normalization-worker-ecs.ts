/**
 * ECS entrypoint for the Normalization Queue Worker.
 *
 * Resolves database credentials and starts the normalization worker loop.
 */

import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.normalization-worker-ecs')

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
    logger.error('database_url_resolution_failed', {
      job_name: 'normalization-worker',
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve database URL: ${message}`)
  }

  const { runStartupChecks } = await import('../../shared/startup')
  const { config } = await import('../../shared/config')
  const requireNormalizationQueue = config.queues.normalization.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: false,
      requireQueues: requireNormalizationQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: false,
    },
  })

  const { startHealthServer } = await import('../../shared/health-server')
  await startHealthServer({
    loggerName: 'script.normalization-worker-ecs.health-server',
  })

  const { runNormalizationWorkerLoop } = await import('../normalization-queue-worker')
  return await runNormalizationWorkerLoop()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('normalization_worker_fatal', { error: message, stack })
      process.exit(1)
    })
}
