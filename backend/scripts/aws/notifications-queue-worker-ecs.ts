import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'

export const handler = async (): Promise<void> => {
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

  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
      required: true,
    },
  ])

  const { runStartupChecks } = await import('../../shared/startup')
  const { config } = await import('../../shared/config')
  const requireNotificationsQueue = config.queues.notifications.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: true,
      requireQueues: requireNotificationsQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: false,
    },
  })

  const { startHealthServer } = await import('../../shared/health-server')
  await startHealthServer({
    loggerName: 'script.notifications-queue-worker-ecs.health-server',
    enableDatabaseCheck: false,
  })

  const { runNotificationsQueueWorkerLoop } = await import('../notifications-queue-worker')
  await runNotificationsQueueWorkerLoop()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const logger = createLogger('script.notifications-queue-worker-ecs')
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
