import { randomUUID } from 'crypto'
import { context as otelContext, trace } from '@opentelemetry/api'
import { redactSensitive } from './log-redactor'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const normalizeLevel = (value?: string): LogLevel => {
  const lowered = value?.toLowerCase()
  if (lowered === 'debug' || lowered === 'info' || lowered === 'warn' || lowered === 'error') {
    return lowered
  }
  return 'info'
}

const resolveLogLevel = (): LogLevel => {
  // IMPORTANT: logger must not import `config` because many ECS/Lambda entrypoints
  // resolve secrets/env vars at runtime before importing config. Importing config
  // here freezes missing values (config is deep-frozen at module init).
  if (process.env.LOG_LEVEL) {
    return normalizeLevel(process.env.LOG_LEVEL)
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { message: String(error) }
}

const normalizeContext = (context?: Record<string, unknown>) => {
  if (!context) return undefined
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (key === 'error') {
      normalized.error = serializeError(value)
      continue
    }
    normalized[key] = value
  }
  return redactSensitive(normalized) as Record<string, unknown>
}

/**
 * Gets AWS context for logging.
 */
const getAwsLogContext = (): Record<string, unknown> => {
  const context: Record<string, unknown> = {}

  // Lambda context
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    context.lambda_function_name = process.env.AWS_LAMBDA_FUNCTION_NAME
    context.lambda_function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION
  }

  // ECS context
  const ecsTaskArn = process.env.ECS_TASK_ARN
  if (ecsTaskArn) {
    context.ecs_task_arn = ecsTaskArn
    const arnParts = ecsTaskArn.split('/')
    if (arnParts.length > 0) {
      context.ecs_task_id = arnParts[arnParts.length - 1]
    }
  }
  if (process.env.ECS_CONTAINER_NAME) {
    context.ecs_container_name = process.env.ECS_CONTAINER_NAME
  }

  // AWS general
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
  if (region) {
    context.aws_region = region
  }

  return context
}

export const createLogger = (component: string, traceId?: string) => {
  const currentLevel = resolveLogLevel()
  const fallbackTraceId = traceId || randomUUID()
  const awsContext = getAwsLogContext()

  const emit = (level: LogLevel, event: string, context?: Record<string, unknown>) => {
    if (levelRank[level] < levelRank[currentLevel]) return

    // Resolve IDs at emit-time so logs correlate with the active span (when present).
    const activeSpan = trace.getSpan(otelContext.active())
    const spanContext = activeSpan?.spanContext()
    const trace_id = traceId || spanContext?.traceId || fallbackTraceId
    const span_id = spanContext?.spanId || null

    const payload = {
      level,
      time: new Date().toISOString(),
      component,
      event,
      trace_id,
      span_id,
      ...awsContext,
      ...normalizeContext(context),
    }
    if (level === 'error') {
      console.error(JSON.stringify(payload))
      return
    }
    if (level === 'warn') {
      console.warn(JSON.stringify(payload))
      return
    }
    console.log(JSON.stringify(payload))
  }

  return {
    debug: (event: string, context?: Record<string, unknown>) => emit('debug', event, context),
    info: (event: string, context?: Record<string, unknown>) => emit('info', event, context),
    warn: (event: string, context?: Record<string, unknown>) => emit('warn', event, context),
    error: (event: string, context?: Record<string, unknown>) => emit('error', event, context),
  }
}
