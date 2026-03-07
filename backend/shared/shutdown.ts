import { createLogger } from './logger'
import { flushCloudWatchMetrics } from './cloudwatch-metrics'
import { cleanupAllConnections } from './connection-manager'
import { shutdownTracing } from './tracing'
import { captureError } from './error-tracker'
import { getLambdaContext, isLambdaTimeoutWarning, type LambdaContext } from './utils/aws-context'
import { emitOpsEvent } from './ops-events'
import { shutdownNewRelicLogExport } from './newrelic-log-exporter'
import { shutdownNewRelicMetricExport } from './newrelic-metric-exporter'

const logger = createLogger('shared.shutdown')

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
const isECS = Boolean(
  process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4,
)

export type ShutdownOptions = {
  name?: string
  timeoutMs?: number
  exitOnSignal?: boolean
  onShutdownRequested?: (signal: string) => Promise<void> | void
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
let globalCrashHandlersInstalled = false
let shutdownController: AbortController | null = null
let signalHandlersInstalled = false
let currentSignalHandler: {
  exitOnSignal: boolean
  requestShutdown: (signal: string) => Promise<void>
  shutdownNow: (signal: string) => Promise<void>
} | null = null
let sigtermListener: (() => void) | null = null
let sigintListener: (() => void) | null = null

export const isShutdownRequested = (): boolean => shutdownRequested

export const resetShutdownState = (): void => {
  shutdownRequested = false
  shutdownHooks.length = 0
  shutdownController = null
  if (forceExitTimer) {
    clearTimeout(forceExitTimer)
    forceExitTimer = null
  }
  currentSignalHandler = null
  if (sigtermListener && typeof process.off === 'function') {
    process.off('SIGTERM', sigtermListener)
  }
  if (sigintListener && typeof process.off === 'function') {
    process.off('SIGINT', sigintListener)
  }
  sigtermListener = null
  sigintListener = null
  signalHandlersInstalled = false
}

const getShutdownController = (): AbortController => {
  if (!shutdownController) {
    shutdownController = new AbortController()
  }
  return shutdownController
}

const installGlobalCrashHandlers = (log: ReturnType<typeof createLogger>): void => {
  if (globalCrashHandlersInstalled) return
  globalCrashHandlersInstalled = true

  process.on('unhandledRejection', (reason) => {
    const err =
      reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : String(reason))

    log.error('unhandled_rejection', {
      error: err.message,
      stack: err.stack,
    })

    // Best-effort capture, then crash hard. A worker continuing after this is unsafe.
    try {
      getShutdownController().abort()
    } catch (abortError) {
      log.debug('shutdown_abort_signal_failed', {
        event: 'unhandled_rejection',
        error: abortError instanceof Error ? abortError.message : String(abortError),
      })
    }
    const forcedExit = setTimeout(() => process.exit(1), 2000)
    forcedExit.unref?.()
    void captureError(err, { event: 'unhandledRejection' }).finally(() => process.exit(1))
  })

  process.on('uncaughtException', (error) => {
    const err = error instanceof Error ? error : new Error(String(error))

    log.error('uncaught_exception', {
      error: err.message,
      stack: err.stack,
    })

    try {
      getShutdownController().abort()
    } catch (abortError) {
      log.debug('shutdown_abort_signal_failed', {
        event: 'uncaught_exception',
        error: abortError instanceof Error ? abortError.message : String(abortError),
      })
    }
    const forcedExit = setTimeout(() => process.exit(1), 2000)
    forcedExit.unref?.()
    void captureError(err, { event: 'uncaughtException' }).finally(() => process.exit(1))
  })
}

const installSignalHandlers = (): void => {
  if (isLambda || signalHandlersInstalled) return
  signalHandlersInstalled = true

  sigtermListener = () => {
    const handler = currentSignalHandler
    if (!handler) return
    void (handler.exitOnSignal
      ? handler.shutdownNow('SIGTERM')
      : handler.requestShutdown('SIGTERM'))
  }
  sigintListener = () => {
    const handler = currentSignalHandler
    if (!handler) return
    void (handler.exitOnSignal
      ? handler.shutdownNow('SIGINT')
      : handler.requestShutdown('SIGINT'))
  }

  process.on('SIGTERM', sigtermListener)
  process.on('SIGINT', sigintListener)
}

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

  cleanupTasks.push({
    name: 'flush_new_relic_logs',
    priority: 5,
    task: async () => {
      try {
        await shutdownNewRelicLogExport()
        log.debug('new_relic_logs_flushed')
      } catch (error) {
        log.warn('new_relic_logs_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })

  cleanupTasks.push({
    name: 'flush_new_relic_metrics',
    priority: 5,
    task: async () => {
      try {
        await shutdownNewRelicMetricExport()
        log.debug('new_relic_metrics_flushed')
      } catch (error) {
        log.warn('new_relic_metrics_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })

  for (const hook of shutdownHooks) {
    cleanupTasks.push({
      name: 'custom_shutdown_hook',
      priority: 6,
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
    const results = await Promise.allSettled(cleanupTasks.map((task) => task.task()))
    for (let i = 0; i < results.length; i += 1) {
      const result = results[i]
      if (result.status === 'rejected') {
        const taskName = cleanupTasks[i]?.name || 'unknown'
        log.warn('shutdown_cleanup_task_rejected', {
          task: taskName,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        })
      }
    }
  }
}

export const createShutdownHandler = (
  options: ShutdownOptions = {},
  lambdaContext?: LambdaContext,
) => {
  const {
    name,
    timeoutMs = getDefaultTimeout(),
    exitOnSignal = true,
    onShutdownRequested,
    onShutdown,
    logger: customLogger,
  } = options
  const log = customLogger ?? logger

  installGlobalCrashHandlers(log)
  const controller = getShutdownController()
  let shutdownNowPromise: Promise<void> | null = null

  const requestShutdown = async (signal: string): Promise<void> => {
    if (shutdownRequested) return
    shutdownRequested = true
    try {
      controller.abort()
    } catch (abortError) {
      log.debug('shutdown_abort_signal_failed', {
        event: 'shutdown_requested',
        signal,
        error: abortError instanceof Error ? abortError.message : String(abortError),
      })
    }

    const resolvedLambdaContext = lambdaContext || (isLambda ? getLambdaContext() : undefined)

    log.info('shutdown_requested', {
      signal,
      name,
      timeout_ms: timeoutMs,
      is_lambda: isLambda,
      lambda_request_id: resolvedLambdaContext?.requestId,
      lambda_remaining_ms: resolvedLambdaContext?.remainingTimeMs,
    })
    emitOpsEvent({
      type: 'shutdown_started',
      component: name ?? 'unknown',
      details: { signal, timeout_ms: timeoutMs, is_lambda: isLambda },
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

    if (onShutdownRequested) {
      try {
        await Promise.resolve(onShutdownRequested(signal))
      } catch (error) {
        log.warn('shutdown_requested_hook_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  const shutdownNow = async (signal: string): Promise<void> => {
    if (shutdownNowPromise) {
      await shutdownNowPromise
      return
    }

    shutdownNowPromise = (async () => {
    if (!shutdownRequested) {
      await requestShutdown(signal)
    }

    const resolvedLambdaContext = lambdaContext || (isLambda ? getLambdaContext() : undefined)

    try {
      await performCleanup(log, resolvedLambdaContext)

      if (onShutdown) {
        await Promise.resolve(onShutdown())
      }
      emitOpsEvent({
        type: 'shutdown_complete',
        component: name ?? 'unknown',
        details: { signal, success: true },
      })
      if (forceExitTimer) {
        clearTimeout(forceExitTimer)
      }
      process.exit(0)
    } catch (error) {
      log.error('shutdown_cleanup_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      emitOpsEvent({
        type: 'shutdown_complete',
        component: name ?? 'unknown',
        details: { signal, success: false, error: error instanceof Error ? error.message : String(error) },
      })
      if (forceExitTimer) {
        clearTimeout(forceExitTimer)
      }
      process.exit(1)
    }
    })()

    await shutdownNowPromise
  }

  currentSignalHandler = {
    exitOnSignal,
    requestShutdown,
    shutdownNow,
  }
  installSignalHandlers()

  return {
    requestShutdown,
    shutdown: shutdownNow,
    shutdownNow,
    isShutdownRequested: () => shutdownRequested,
    isShuttingDown: () => shutdownRequested,
    signal: controller.signal,
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
