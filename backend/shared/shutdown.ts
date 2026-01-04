import { createLogger } from './logger'
import { flushCloudWatchMetrics } from './cloudwatch-metrics'
import { cleanupAllConnections } from './connection-manager'
import { shutdownTracing } from './tracing'
import { getLambdaContext, isLambdaTimeoutWarning, type LambdaContext } from './utils/aws-context'

const logger = createLogger('shared.shutdown')

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
const isECS = Boolean(
  process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4,
)

export type ShutdownOptions = {
  timeoutMs?: number
  onShutdown?: () => Promise<void> | void
  logger?: ReturnType<typeof createLogger>
}

type ShutdownHook = () => Promise<void> | void

const shutdownHooks: ShutdownHook[] = []

export const registerShutdownHook = (hook: ShutdownHook): void => {
  shutdownHooks.push(hook)
  logger.debug('shutdown_hook_registered', { total_hooks: shutdownHooks.length })
}

let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null

export const isShutdownRequested = (): boolean => shutdownRequested

const getDefaultTimeout = (): number => {
  if (isLambda) {
    return 5000
  }
  if (isECS) {
    return 30000
  }
  return 30000
}

const performCleanup = async (
  log: ReturnType<typeof createLogger>,
  lambdaContext?: LambdaContext,
): Promise<void> => {
  const cleanupTasks: Array<{ name: string; task: () => Promise<void>; priority: number }> = []

  // In Lambda, flush metrics first and with highest priority
  if (isLambda) {
    cleanupTasks.push({
      name: 'flush_cloudwatch_metrics',
      priority: 1,
      task: async () => {
        try {
          // Check if approaching timeout
          if (lambdaContext && isLambdaTimeoutWarning(lambdaContext, 0.9)) {
            log.warn('lambda_timeout_imminent_flushing_metrics', {
              remaining_ms: lambdaContext.remainingTimeMs,
              timeout_ms: lambdaContext.timeoutMs,
            })
          }
          await flushCloudWatchMetrics()
          log.debug('cloudwatch_metrics_flushed')
        } catch (error) {
          log.warn('cloudwatch_metrics_flush_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    })
  } else {
    cleanupTasks.push({
      name: 'flush_cloudwatch_metrics',
      priority: 2,
      task: async () => {
        try {
          await flushCloudWatchMetrics()
          log.debug('cloudwatch_metrics_flushed')
        } catch (error) {
          log.warn('cloudwatch_metrics_flush_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    })
  }

  cleanupTasks.push({
    name: 'cleanup_connections',
    priority: 3,
    task: async () => {
      try {
        await cleanupAllConnections()
        log.debug('connections_cleaned_up')
      } catch (error) {
        log.warn('connections_cleanup_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })

  cleanupTasks.push({
    name: 'shutdown_tracing',
    priority: 4,
    task: async () => {
      try {
        await shutdownTracing()
        log.debug('tracing_shutdown_complete')
      } catch (error) {
        log.warn('tracing_shutdown_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })

  for (const hook of shutdownHooks) {
    cleanupTasks.push({
      name: 'custom_shutdown_hook',
      priority: 5,
      task: async () => {
        try {
          await Promise.resolve(hook())
        } catch (error) {
          log.warn('shutdown_hook_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    })
  }

  // Sort by priority and execute sequentially in Lambda (to ensure metrics flush first)
  // or in parallel for ECS/local
  if (isLambda) {
    cleanupTasks.sort((a, b) => a.priority - b.priority)
    for (const task of cleanupTasks) {
      await task.task()
    }
  } else {
    await Promise.allSettled(cleanupTasks.map((task) => task.task()))
  }
}

export const createShutdownHandler = (
  options: ShutdownOptions = {},
  lambdaContext?: LambdaContext,
) => {
  const {
    timeoutMs = getDefaultTimeout(),
    onShutdown,
    logger: customLogger,
  } = options
  const log = customLogger ?? logger

  const shutdown = async (signal: string) => {
    if (shutdownRequested) return
    shutdownRequested = true

    const resolvedLambdaContext = lambdaContext || (isLambda ? getLambdaContext() : undefined)

    log.info('shutdown_requested', {
      signal,
      timeout_ms: timeoutMs,
      is_lambda: isLambda,
      lambda_request_id: resolvedLambdaContext?.requestId,
      lambda_remaining_ms: resolvedLambdaContext?.remainingTimeMs,
    })

    // In Lambda, check if we're approaching timeout
    if (isLambda && resolvedLambdaContext && isLambdaTimeoutWarning(resolvedLambdaContext, 0.8)) {
      log.warn('lambda_timeout_warning', {
        remaining_ms: resolvedLambdaContext.remainingTimeMs,
        timeout_ms: resolvedLambdaContext.timeoutMs,
        threshold: 0.8,
      })
    }

    forceExitTimer = setTimeout(() => {
      log.warn('shutdown_forced', { timeout_ms: timeoutMs })
      process.exit(1)
    }, timeoutMs)

    try {
      await performCleanup(log, resolvedLambdaContext)

      if (onShutdown) {
        await Promise.resolve(onShutdown())
      }
      if (forceExitTimer) {
        clearTimeout(forceExitTimer)
      }
      process.exit(0)
    } catch (error) {
      log.error('shutdown_cleanup_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      if (forceExitTimer) {
        clearTimeout(forceExitTimer)
      }
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  return {
    shutdown,
    isShutdownRequested: () => shutdownRequested,
  }
}

/**
 * Flushes CloudWatch metrics before Lambda timeout.
 * Should be called in Lambda handlers' finally blocks.
 */
export const flushMetricsBeforeLambdaTimeout = async (
  lambdaContext?: LambdaContext,
): Promise<void> => {
  if (!isLambda) {
    return
  }

  const context = lambdaContext || getLambdaContext()
  if (context.remainingTimeMs && context.remainingTimeMs < 5000) {
    // Less than 5 seconds remaining, flush immediately
    logger.warn('lambda_timeout_imminent_flushing_metrics', {
      remaining_ms: context.remainingTimeMs,
      request_id: context.requestId,
    })
    await flushCloudWatchMetrics()
  } else if (isLambdaTimeoutWarning(context, 0.8)) {
    // Approaching timeout threshold, flush proactively
    logger.debug('lambda_timeout_warning_flushing_metrics', {
      remaining_ms: context.remainingTimeMs,
      request_id: context.requestId,
    })
    await flushCloudWatchMetrics()
  }
}


