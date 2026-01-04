import { randomUUID } from 'crypto'

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
  return normalized
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
    context.lambda_request_id =
      process.env.AWS_REQUEST_ID || process.env.AWS_LAMBDA_REQUEST_ID
  }

  // ECS context
  if (process.env.ECS_TASK_ARN) {
    context.ecs_task_arn = process.env.ECS_TASK_ARN
    const arnParts = process.env.ECS_TASK_ARN.split('/')
    if (arnParts.length > 0) {
      context.ecs_task_id = arnParts[arnParts.length - 1]
    }
  }
  if (process.env.ECS_CONTAINER_NAME) {
    context.ecs_container_name = process.env.ECS_CONTAINER_NAME
  }

  // AWS general
  if (process.env.AWS_REGION) {
    context.aws_region = process.env.AWS_REGION
  }

  // Correlation ID from header (if available in request context)
  if (process.env.X_CORRELATION_ID) {
    context.correlation_id = process.env.X_CORRELATION_ID
  }

  return context
}

export const createLogger = (component: string, traceId?: string) => {
  const currentLevel = resolveLogLevel()
  const resolvedTraceId = traceId || randomUUID()
  const awsContext = getAwsLogContext()

  const emit = (level: LogLevel, event: string, context?: Record<string, unknown>) => {
    if (levelRank[level] < levelRank[currentLevel]) return
    const payload = {
      level,
      time: new Date().toISOString(),
      component,
      event,
      trace_id: resolvedTraceId,
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
