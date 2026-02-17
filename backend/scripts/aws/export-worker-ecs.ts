import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'

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

  const { config } = await import('../../shared/config')
  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
      required: true,
    },
    {
      envVar: 'EXPORT_JOB_QUEUE_URL',
      secretArnEnv: 'EXPORT_JOB_QUEUE_SECRET_ARN',
      ssmNameEnv: 'EXPORT_JOB_QUEUE_SSM_NAME',
      jsonKeys: ['url', 'EXPORT_JOB_QUEUE_URL'],
      required: config.queues.exports.mode !== 'off',
    },
    {
      envVar: 'EXPORTS_S3_BUCKET',
      secretArnEnv: 'EXPORTS_S3_BUCKET_SECRET_ARN',
      ssmNameEnv: 'EXPORTS_S3_BUCKET_SSM_NAME',
      jsonKeys: ['bucket', 'EXPORTS_S3_BUCKET'],
      required: true,
    },
  ])

  const { runStartupChecks } = await import('../../shared/startup')
  const requireExportJobQueue = config.queues.exports.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneA: true,
      requireRedis: true,
      requireQueues: requireExportJobQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: true,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: true,
      requireExportsBucket: true,
      requireBronzeBucket: false,
    },
  })

  const { runExportWorker } = await import('../export-worker')
  await runExportWorker()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const logger = createLogger('script.export-worker-ecs')
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
