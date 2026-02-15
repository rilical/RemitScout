import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { config } from '../../shared/config'

export const handler = async (): Promise<void> => {
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_A',
    secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
    hostEnv: 'PLANE_A_DB_HOST',
    portEnv: 'PLANE_A_DB_PORT',
    nameEnv: 'PLANE_A_DB_NAME',
    usernameEnv: 'PLANE_A_DB_USERNAME',
    passwordEnv: 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_A', 'database_url'],
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
  const requireAlertEvaluationQueue = config.alerts.evaluation.enabled
  await runStartupChecks({
    requirements: {
      requirePlaneA: true,
      requireRedis: true,
      requireQueues: requireAlertEvaluationQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue,
      requireStorage: false,
      requireAlerts: false,
    },
  })

  const { runAlertEvaluationWorker } = await import('../alert-evaluation-worker')
  await runAlertEvaluationWorker()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const logger = createLogger('script.alert-evaluation-worker-ecs')
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
