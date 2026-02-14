import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'
import { createShutdownHandler } from '../../shared/shutdown'

const logger = createLogger('script.plane-b-ingest-ecs')

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const resolveLoopIntervalMs = () => {
  const rawSeconds = process.env.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS
  const seconds = rawSeconds ? Number(rawSeconds) : NaN
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.floor(seconds * 1000)
  }
  return 60_000
}

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
  const requireIngestFanoutQueue = config.queues.ingestFanout.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: true,
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

  const shutdown = createShutdownHandler({
    name: 'plane-b-ingest-ecs',
    logger,
    timeoutMs: 30_000,
    exitOnSignal: false,
  })

  // Use TS source when available (dev/tsx), fall back to built output in prod.
  const candidates = [
    '../../plane-b/src/ingest',
    '../../plane-b/ingest',
    '../../dist/plane-b/ingest',
  ] as const
  let runIngestion: typeof import('../../plane-b/src/ingest').runIngestion | undefined
  let lastError: unknown
  for (const candidate of candidates) {
    try {
      ({ runIngestion } = await import(candidate))
      break
    } catch (error) {
      lastError = error
    }
  }
  if (!runIngestion) {
    const message = lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(
      `Failed to load plane-b ingestion module (tried ${candidates.join(', ')}): ${message}`,
    )
  }

  const loopEnabled = process.env.PLANE_B_INGEST_LOOP === '1'
  if (!loopEnabled) {
    await runIngestion()
    return
  }

  const loopIntervalMs = resolveLoopIntervalMs()
  logger.info('ingest_loop_started', { interval_ms: loopIntervalMs })

  while (!shutdown.isShuttingDown()) {
    const startedAt = Date.now()
    try {
      await runIngestion()
    } catch (error) {
      const { message, stack } = formatError(error)
      logger.error('ingest_run_failed', { error: message, stack })
    }

    if (shutdown.isShuttingDown()) break
    const elapsed = Date.now() - startedAt
    const sleepMs = Math.max(0, loopIntervalMs - elapsed)
    logger.info('ingest_loop_sleep', { sleep_ms: sleepMs })
    if (sleepMs > 0) {
      await sleep(sleepMs)
    }
  }

  if (shutdown.isShuttingDown()) {
    await shutdown.shutdown('shutdown_requested')
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      const { message, stack } = formatError(error)
      logger.error('ingest_loop_fatal', { error: message, stack })
      process.exit(1)
    })
}
