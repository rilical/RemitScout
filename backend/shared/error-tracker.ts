import * as Sentry from '@sentry/node'
import { hostname } from 'os'

import { createLogger } from './logger'
import { getAwsContext } from './utils/aws-context'

const logger = createLogger('shared.error-tracker')

let initialized = false

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'apikey',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'session',
  'credential',
]
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
const IGNORE_ERRORS = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'AbortError']
const MAX_REDACTION_DEPTH = 8

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const shouldRedactKey = (key: string): boolean => {
  const normalized = normalizeKey(key)
  return SENSITIVE_FIELDS.some((entry) => normalized.includes(normalizeKey(entry)))
}

const redactUnknown = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value
  if (depth >= MAX_REDACTION_DEPTH) return value

  if (Array.isArray(value)) {
    return value.map((entry) => redactUnknown(entry, depth + 1))
  }
  if (typeof value !== 'object') {
    return value
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (shouldRedactKey(key)) {
      redacted[key] = '[REDACTED]'
      continue
    }
    redacted[key] = redactUnknown(entry, depth + 1)
  }
  return redacted
}

const redactHeaders = (
  headers: Record<string, unknown>,
): Record<string, string> => {
  const redacted: Record<string, string> = {}
  for (const [rawKey, value] of Object.entries(headers)) {
    const key = rawKey.toLowerCase()
    if (SENSITIVE_HEADERS.includes(key) || shouldRedactKey(key)) {
      redacted[rawKey] = '[REDACTED]'
      continue
    }
    const sanitized = redactUnknown(value, 1)
    redacted[rawKey] =
      typeof sanitized === 'string'
        ? sanitized
        : Array.isArray(sanitized)
          ? sanitized.map((entry) => String(entry)).join(',')
          : sanitized === null || sanitized === undefined
            ? ''
            : String(sanitized)
  }
  return redacted
}

const filterSensitiveData = (event: Sentry.ErrorEvent): Sentry.ErrorEvent | null => {
  if (!event) return null

  if (event.request?.headers) {
    event.request.headers = redactHeaders(event.request.headers as Record<string, unknown>)
  }

  if (event.request?.data !== undefined) {
    event.request.data = redactUnknown(event.request.data)
  }

  if (event.extra) {
    event.extra = redactUnknown(event.extra) as Record<string, unknown>
  }

  return event
}

export const initErrorTracking = async (serviceName?: string): Promise<void> => {
  const dsn = process.env.SENTRY_DSN
  const environment = process.env.NODE_ENV || 'development'
  const release = process.env.SENTRY_RELEASE || process.env.npm_package_version || 'unknown'
  const serverName = process.env.SENTRY_SERVER_NAME || hostname() || 'remit-scout'

  if (!dsn) {
    logger.warn('error_tracking_disabled', {
      reason: 'SENTRY_DSN not set',
    })
    return
 }

  try {
    // Get AWS context for tags
    const awsContext = await getAwsContext()

    const tags: Record<string, string> = {
      service: serviceName || 'remit-scout',
    }

    if (awsContext.region) {
      tags.aws_region = awsContext.region
    }
    if (awsContext.accountId) {
      tags.aws_account_id = awsContext.accountId
    }
    if (awsContext.isLambda && awsContext.lambda?.functionName) {
      tags.lambda_function = awsContext.lambda.functionName
    }
    if (awsContext.isECS && awsContext.ecs?.taskId) {
      tags.ecs_task_id = awsContext.ecs.taskId
    }

    Sentry.init({
      dsn,
      environment,
      release,
      serverName,
      tracesSampleRate: 0.1,
      beforeSend: filterSensitiveData,
      ignoreErrors: IGNORE_ERRORS,
      initialScope: {
        tags,
      },
    })
    initialized = true
    logger.info('error_tracking_initialized', {
      environment,
      release,
      server_name: serverName,
      service: serviceName,
      aws_context: {
        is_lambda: awsContext.isLambda,
        is_ecs: awsContext.isECS,
        region: awsContext.region,
      },
    })
  } catch (error) {
    logger.error('error_tracking_init_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const captureError = async (
  error: Error,
  context?: Record<string, unknown>,
  lambdaContext?: unknown,
): Promise<void> => {
  if (!initialized) {
    return
  }

  try {
    // Add AWS context
    const awsContext = await getAwsContext(lambdaContext)
    const extraContext: Record<string, unknown> = { ...context }

    if (awsContext.isLambda && awsContext.lambda) {
      extraContext.lambda_request_id = awsContext.lambda.requestId
      extraContext.lambda_function_name = awsContext.lambda.functionName
      extraContext.lambda_function_version = awsContext.lambda.functionVersion
    }

    if (awsContext.isECS && awsContext.ecs) {
      extraContext.ecs_task_id = awsContext.ecs.taskId
      extraContext.ecs_task_arn = awsContext.ecs.taskArn
      extraContext.ecs_container_name = awsContext.ecs.containerName
      extraContext.ecs_container_id = awsContext.ecs.containerId
    }

    if (awsContext.region) {
      extraContext.aws_region = awsContext.region
    }
    if (awsContext.accountId) {
      extraContext.aws_account_id = awsContext.accountId
    }

    Sentry.captureException(error, { extra: extraContext })
  } catch (sentryError) {
    logger.warn('sentry_capture_failed', {
      original_error: error.message,
      sentry_error: sentryError instanceof Error ? sentryError.message : String(sentryError),
    })
  }
}

export const captureExceptionWithContext = async (
  error: Error,
  context: Record<string, unknown>,
  tags?: Record<string, string>,
  lambdaContext?: unknown,
): Promise<void> => {
  if (!initialized) {
    return
  }

  try {
    // Add AWS context to tags
    const awsContext = await getAwsContext(lambdaContext)
    const allTags: Record<string, string> = {
      environment: process.env.NODE_ENV || 'development',
      ...tags,
    }

    if (awsContext.region) {
      allTags.aws_region = awsContext.region
    }
    if (awsContext.accountId) {
      allTags.aws_account_id = awsContext.accountId
    }
    if (awsContext.isLambda && awsContext.lambda?.requestId) {
      allTags.lambda_request_id = awsContext.lambda.requestId
    }
    if (awsContext.isECS && awsContext.ecs?.taskId) {
      allTags.ecs_task_id = awsContext.ecs.taskId
    }

    // Add AWS context to extra
    const extraContext: Record<string, unknown> = { ...context }
    if (awsContext.isLambda && awsContext.lambda) {
      extraContext.lambda_function_name = awsContext.lambda.functionName
      extraContext.lambda_function_version = awsContext.lambda.functionVersion
    }
    if (awsContext.isECS && awsContext.ecs) {
      extraContext.ecs_task_arn = awsContext.ecs.taskArn
      extraContext.ecs_container_name = awsContext.ecs.containerName
      extraContext.ecs_container_id = awsContext.ecs.containerId
    }

    Sentry.captureException(error, {
      extra: extraContext,
      tags: allTags,
    })
  } catch (sentryError) {
    logger.warn('sentry_capture_with_context_failed', {
      original_error: error.message,
      sentry_error: sentryError instanceof Error ? sentryError.message : String(sentryError),
    })
  }
}

export const captureMessage = (
  message: string,
  level?: 'info' | 'warning' | 'error',
): void => {
  if (!initialized) {
    return
  }

  try {
    Sentry.captureMessage(message, level)
  } catch (sentryError) {
    logger.warn('sentry_message_failed', {
      message,
      sentry_error: sentryError instanceof Error ? sentryError.message : String(sentryError),
    })
  }
}

export const setUserContext = (userId: string, _email?: string): void => {
  if (!initialized) {
    return
  }

  try {
    Sentry.setUser({ id: userId })
  } catch (error) {
    logger.warn('sentry_set_user_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const clearUserContext = (): void => {
  if (!initialized) {
    return
  }

  try {
    Sentry.setUser(null)
  } catch (error) {
    logger.warn('sentry_clear_user_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const addBreadcrumb = (
  message: string,
  category: string,
  level?: 'info' | 'warning' | 'error',
): void => {
  if (!initialized) {
    return
  }

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level: level || 'info',
      timestamp: Date.now() / 1000,
    })
  } catch (error) {
    logger.warn('sentry_breadcrumb_failed', {
      message,
      category,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const isInitialized = (): boolean => initialized
