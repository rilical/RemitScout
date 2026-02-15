import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { config } from '../../shared/config'

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
  const requireOpsAlertsQueue = config.queues.opsAlerts.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: true,
      requireQueues: requireOpsAlertsQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: false,
      requireAlerts: false,
    },
  })

  const { runOpsAlertsQueueWorkerLoop } = await import('../ops-alerts-queue-worker')
  await runOpsAlertsQueueWorkerLoop()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const logger = createLogger('script.ops-alerts-queue-worker-ecs')
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
