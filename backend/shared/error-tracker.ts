import * as Sentry from '@sentry/node'
import { hostname } from 'os'

import { createLogger } from './logger'
import { getAwsContext } from './utils/aws-context'

const logger = createLogger('shared.error-tracker')

let initialized = false

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'api_key', 'apiKey', 'accessToken', 'refreshToken']
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
const IGNORE_ERRORS = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'AbortError']

const filterSensitiveData = (event: Sentry.ErrorEvent): Sentry.ErrorEvent | null => {
  if (!event) return null

  if (event.request?.headers) {
    for (const header of SENSITIVE_HEADERS) {
      if (event.request.headers[header]) {
        event.request.headers[header] = '[REDACTED]'
      }
    }
  }

  if (event.request?.data && typeof event.request.data === 'object') {
    for (const field of SENSITIVE_FIELDS) {
      if (field in event.request.data) {
        (event.request.data as Record<string, unknown>)[field] = '[REDACTED]'
      }
    }
  }

  if (event.extra && typeof event.extra === 'object') {
    for (const field of SENSITIVE_FIELDS) {
      if (field in event.extra) {
        (event.extra as Record<string, unknown>)[field] = '[REDACTED]'
      }
    }
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

export const setUserContext = (userId: string, email?: string): void => {
  if (!initialized) {
    return
  }

  try {
    Sentry.setUser({ id: userId, email })
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
