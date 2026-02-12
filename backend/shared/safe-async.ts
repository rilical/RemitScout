import type { createLogger } from './logger'

type LoggerLike = Pick<ReturnType<typeof createLogger>, 'debug' | 'warn' | 'error'>

/**
 * Wraps an async function, logs failures with context, and returns a default value.
 *
 * Use for non-critical paths (metrics, audit logs, session tracking) where failures
 * must be visible but must not block the primary request/worker flow.
 */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  logger: LoggerLike,
  event: string,
  context: Record<string, unknown> = {},
  options?: { defaultValue?: T; level?: 'debug' | 'warn' | 'error' },
): Promise<T | undefined> => {
  try {
    return await fn()
  } catch (error) {
    const level = options?.level ?? 'warn'
    const payload = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    if (level === 'debug') logger.debug(event, payload)
    else if (level === 'error') logger.error(event, payload)
    else logger.warn(event, payload)
    return options?.defaultValue
  }
}

