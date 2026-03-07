import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.ingest-fanout-worker-ecs')

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
      job_name: 'ingest-fanout-worker',
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

  try {
    await resolveAwsEnv([
      {
        envVar: 'REDIS_URL',
        secretArnEnv: 'REDIS_SECRET_ARN',
        ssmNameEnv: 'REDIS_SSM_NAME',
        jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
        required: true,
      },
    ])
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('aws_env_resolution_failed', {
      job_name: 'ingest-fanout-worker',
      env_vars_attempted: ['REDIS_URL', 'REDIS_SECRET_ARN', 'REDIS_SSM_NAME'],
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve AWS environment variables: ${message}`)
  }

  const { runStartupChecks } = await import('../../shared/startup')
  const { config } = await import('../../shared/config')
  const requireIngestFanoutQueue = config.queues.ingestFanout.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      // Redis dependency is advisory for ingest fanout worker startup.
      // If Redis is degraded, continue processing with reduced capabilities.
      requireRedis: false,
      requireQueues: requireIngestFanoutQueue,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: false,
    },
  })

  const { startHealthServer } = await import('../../shared/health-server')
  await startHealthServer({
    loggerName: 'script.ingest-fanout-worker-ecs.health-server',
  })

  // ECS wrapper already owns the health server (started above).
  // Prevent the inner worker from starting a duplicate on the same port.
  process.env.WORKER_HEALTH_ENABLED = '0'

  const { runIngestFanoutWorkerLoop } = await import('../ingest-fanout-worker')
  return await runIngestFanoutWorkerLoop()
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(code => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('ingest_fanout_worker_fatal', {
        error: message,
        stack,
      })
      process.exit(1)
    })
}
