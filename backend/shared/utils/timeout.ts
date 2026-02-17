type TimeoutError = Error & { code?: string }

const makeTimeoutError = (label: string, ms: number): TimeoutError => {
  const err = new Error(`${label}_timeout_after_${ms}ms`) as TimeoutError
  err.name = 'TimeoutError'
  err.code = 'ETIMEDOUT'
  return err
}

export const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> => {
  if (!Number.isFinite(ms) || ms <= 0) return await promise

  let timeoutId: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(makeTimeoutError(label, ms)), ms)
    timeoutId.unref?.()
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
}

export const withAbortTimeout = async <T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label: string,
): Promise<T> => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return await fn(new AbortController().signal)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  timeoutId.unref?.()

  try {
    return await fn(controller.signal)
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = makeTimeoutError(label, ms)
      ;(timeoutError as any).cause = error
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

