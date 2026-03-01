/**
 * ECS entrypoint for the Agent Orchestrator.
 *
 * Resolves database/Redis credentials via AWS SSM/Secrets Manager,
 * runs startup checks, then starts the AgentOrchestrator loop.
 */

import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.agent-orchestrator-ecs')

const isProdLikeEnv = (): boolean => {
  const envName = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').trim().toLowerCase()
  return envName === 'staging' || envName === 'prod' || envName === 'production'
}

export const resolveLlmConnector = (): 'anthropic' | 'bedrock' => {
  const connector = (process.env.AGENT_LLM_CONNECTOR || process.env.AGENT_LLM_PROVIDER || '')
    .trim()
    .toLowerCase()
  if (connector === 'bedrock' || connector === 'anthropic') {
    return connector
  }
  return isProdLikeEnv() ? 'bedrock' : 'anthropic'
}

export const validateResolvedLlmConfig = (): void => {
  const connector = resolveLlmConnector()
  const missing: string[] = []
  const prodLike = isProdLikeEnv()

  if (!process.env.AGENT_LLM_MODEL?.trim()) {
    missing.push('AGENT_LLM_MODEL')
  }
  if (!process.env.AGENT_LLM_PROMPT_VERSION?.trim()) {
    missing.push('AGENT_LLM_PROMPT_VERSION')
  }

  if (connector === 'anthropic') {
    const hasApiKey = Boolean(process.env.AGENT_ANTHROPIC_API_KEY?.trim())
    const hasSecretArn = Boolean(process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN?.trim())
    if (prodLike && !hasSecretArn) {
      missing.push('AGENT_ANTHROPIC_API_KEY_SECRET_ARN')
    }
    if (!hasApiKey) {
      missing.push('AGENT_ANTHROPIC_API_KEY')
    }
  }

  if (connector === 'bedrock') {
    if (!process.env.AGENT_BEDROCK_REGION?.trim()) {
      missing.push('AGENT_BEDROCK_REGION')
    }
    if (!process.env.AGENT_BEDROCK_MODEL_ID?.trim() && !process.env.AGENT_LLM_MODEL?.trim()) {
      missing.push('AGENT_BEDROCK_MODEL_ID')
    }
  }

  logger.info('llm_startup_validation', {
    connector,
    model: process.env.AGENT_LLM_MODEL || '',
    promptVersion: process.env.AGENT_LLM_PROMPT_VERSION || '',
    bedrockRegionPresent: Boolean(process.env.AGENT_BEDROCK_REGION?.trim()),
    bedrockModelPresent: Boolean(process.env.AGENT_BEDROCK_MODEL_ID?.trim()),
    anthropicKeyPresent: Boolean(process.env.AGENT_ANTHROPIC_API_KEY?.trim()),
    anthropicSecretArnPresent: Boolean(process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN?.trim()),
    missing,
    prodLike,
  })

  if (missing.length > 0 && prodLike) {
    throw new Error(`LLM startup validation failed: ${missing.join(', ')}`)
  }
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
      job_name: 'agent-orchestrator',
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
        required: false,
      },
      {
        envVar: 'AGENT_ANTHROPIC_API_KEY',
        secretArnEnv: 'AGENT_ANTHROPIC_API_KEY_SECRET_ARN',
        jsonKeys: ['apiKey', 'AGENT_ANTHROPIC_API_KEY', 'anthropic_api_key'],
        required: false,
      },
      {
        envVar: 'AGENT_BEDROCK_REGION',
        secretArnEnv: 'AGENT_BEDROCK_SECRET_ARN',
        jsonKeys: ['region', 'AGENT_BEDROCK_REGION', 'bedrock_region'],
        required: false,
      },
      {
        envVar: 'AGENT_BEDROCK_MODEL_ID',
        secretArnEnv: 'AGENT_BEDROCK_SECRET_ARN',
        jsonKeys: ['modelId', 'AGENT_BEDROCK_MODEL_ID', 'bedrock_model_id'],
        required: false,
      },
    ])
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('redis_resolution_failed', { error: message })
  }

  // Backward-compatible env aliasing.
  if (!process.env.AGENT_LLM_CONNECTOR && process.env.AGENT_LLM_PROVIDER) {
    process.env.AGENT_LLM_CONNECTOR = process.env.AGENT_LLM_PROVIDER
  }
  if (!process.env.AGENT_ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY) {
    process.env.AGENT_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  }
  if (!process.env.AGENT_LLM_MODEL && process.env.AGENT_BEDROCK_MODEL_ID) {
    process.env.AGENT_LLM_MODEL = process.env.AGENT_BEDROCK_MODEL_ID
  }
  if (!process.env.AGENT_LLM_PROMPT_VERSION) {
    process.env.AGENT_LLM_PROMPT_VERSION = 'v1'
  }
  validateResolvedLlmConfig()

  const { runStartupChecks } = await import('../../shared/startup')
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: false,
      requireQueues: false,
      requireQuoteRefreshQueue: false,
      requireFxRateRefreshQueue: false,
      requireExportJobQueue: false,
      requireIngestFanoutQueue: false,
      requireNotificationsQueue: false,
      requireOpsAlertsQueue: false,
      requireGoldLiveQueue: false,
      requireAlertEvaluationQueue: false,
      requireStorage: false,
      requireAgentLlm: true,
    },
  })

  const { createPool } = await import('../../shared/db')
  const { config } = await import('../../shared/config')
  const { initErrorTracking } = await import('../../shared/error-tracker')
  const { initTracing } = await import('../../shared/tracing')
  const { startHealthServer } = await import('../../shared/health-server')
  const { AgentOrchestrator } = await import('../../plane-b/src/agents/orchestrator')
  const { ParserHandler } = await import('../../plane-b/src/handlers/parser')
  const { ContractTestHandler } = await import('../../plane-b/src/handlers/contract-test')

  initTracing('agent-orchestrator')
  await initErrorTracking('agent-orchestrator')

  const pool = createPool(config.db.planeBUrl)

  const orchestrator = new AgentOrchestrator(pool)

  // Register built-in handlers
  orchestrator.registerHandler('agent-patch-propose', new ParserHandler())
  orchestrator.registerHandler('agent-contract-test', new ContractTestHandler())

  // Health server — expose orchestrator health snapshot at /metrics as JSON
  const healthPort = Number(process.env.HEALTH_PORT) || 8080
  if (!config.runtime.isLambda) {
    startHealthServer({
      port: healthPort,
      pool,
      getMetrics: async () => JSON.stringify(orchestrator.healthCheck()),
      metricsContentType: 'application/json',
    })
  }

  // Graceful shutdown
  const controller = new AbortController()
  const onSignal = () => {
    logger.info('shutdown_signal_received')
    orchestrator.stop()
    controller.abort()
  }
  process.on('SIGTERM', onSignal)
  process.on('SIGINT', onSignal)

  await orchestrator.start(controller.signal)

  await pool.end()
  return 0
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('agent_orchestrator_fatal', { error: message, stack })
      process.exit(1)
    })
}
