/**
 * ECS entrypoint for the Stress Responder.
 *
 * Polls the agent-stress SQS queue for CorridorStressSignal messages
 * and passes them to StressResponder.processStressSignals().
 */

import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.stress-responder-ecs')

const resolveLlmConnector = (): 'anthropic' | 'bedrock' => {
  const connector = (process.env.AGENT_LLM_CONNECTOR || process.env.AGENT_LLM_PROVIDER || '')
    .trim()
    .toLowerCase()
  if (connector === 'bedrock' || connector === 'anthropic') {
    return connector
  }
  return 'bedrock'
}

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
      job_name: 'stress-responder',
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve database URL: ${message}`)
  }

  const { runStartupChecks } = await import('../../shared/startup')
  const { config } = await import('../../shared/config')
  if (!process.env.AGENT_LLM_PROMPT_VERSION) {
    process.env.AGENT_LLM_PROMPT_VERSION = 'v1'
  }
  logger.info('llm_runtime_contract', {
    connector: resolveLlmConnector(),
    model: process.env.AGENT_LLM_MODEL || '',
    promptVersion: process.env.AGENT_LLM_PROMPT_VERSION || '',
    bedrockRegionPresent: Boolean(process.env.AGENT_BEDROCK_REGION?.trim()),
    bedrockModelPresent: Boolean(process.env.AGENT_BEDROCK_MODEL_ID?.trim()),
    anthropicSecretArnPresent: Boolean(process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN?.trim()),
  })
  const requireStressQueue = config.queues.agentStress.mode !== 'off'
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: false,
      requireQueues: requireStressQueue,
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

  const { setTimeout: sleep } = await import('timers/promises')
  const { createPool } = await import('../../shared/db')
  const { initErrorTracking } = await import('../../shared/error-tracker')
  const { initTracing } = await import('../../shared/tracing')
  const { startHealthServer } = await import('../../shared/health-server')
  const { receiveJsonMessages, deleteMessages, sendToDLQ } = await import('../../shared/sqs')
  const { recordWorkerMetric } = await import('../../shared/worker-metrics')
  const { createShutdownHandler } = await import('../../shared/shutdown')
  const { StressResponder } = await import('../../plane-b/src/agents/stress-responder')
  type CorridorStressSignal = import('../../plane-b/src/agents/stress-responder').CorridorStressSignal

  initTracing('stress-responder')
  await initErrorTracking('stress-responder')

  const pool = createPool(config.db.planeBUrl)
  const queueUrl = config.queues.agentStress.url
  const responder = new StressResponder(pool)

  // Health server
  const healthPort = Number(process.env.HEALTH_PORT) || 8080
  if (!config.runtime.isLambda) {
    startHealthServer({ port: healthPort, pool })
  }

  const shutdown = createShutdownHandler({
    name: 'stress-responder',
    logger,
    timeoutMs: 30_000,
    exitOnSignal: false,
  })

  const BATCH_SIZE = 5
  const IDLE_SLEEP_MS = 2_000

  logger.info('stress_responder_starting', { queueUrl })

  while (!shutdown.isShuttingDown()) {
    const { messages, error } = await receiveJsonMessages<CorridorStressSignal>(queueUrl, BATCH_SIZE)

    if (error) {
      logger.error('stress_responder_receive_error', { error: error.message })
      await sleep(IDLE_SLEEP_MS)
      continue
    }

    if (messages.length === 0) {
      await sleep(IDLE_SLEEP_MS)
      continue
    }

    const signals: CorridorStressSignal[] = []
    const toDelete: string[] = []

    for (const msg of messages) {
      if (msg.payload?.corridorId && typeof msg.payload.stressScore === 'number') {
        signals.push(msg.payload)
        toDelete.push(msg.receiptHandle)
      } else {
        await sendToDLQ(queueUrl, msg, new Error('Invalid stress signal format'))
        toDelete.push(msg.receiptHandle)
        recordWorkerMetric('stress-responder', 'message_failed').catch(() => {})
      }
    }

    if (signals.length > 0) {
      try {
        await responder.processStressSignals(signals)
        recordWorkerMetric('stress-responder', 'message_processed', signals.length).catch(() => {})
      } catch (err) {
        logger.error('stress_responder_process_error', {
          error: err instanceof Error ? err.message : String(err),
          signalCount: signals.length,
        })
        recordWorkerMetric('stress-responder', 'message_failed', signals.length).catch(() => {})
      }
    }

    if (toDelete.length > 0) {
      await deleteMessages(queueUrl, toDelete)
    }
  }

  await pool.end()
  logger.info('stress_responder_stopped')
  return 0
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('stress_responder_fatal', { error: message, stack })
      process.exit(1)
    })
}
