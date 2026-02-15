export const useLogger = (scope: string) => {
  const prefix = `[${scope}]`

  const emit = (level: 'debug' | 'warn' | 'error', args: unknown[]) => {
    if (!import.meta.dev) return
    // Keep runtime bundles free of console.* except warn (allowed by lint) and only in dev.
    console.warn(prefix, `${level.toUpperCase()}:`, ...args)
  }

  return {
    debug: (...args: unknown[]) => {
      emit('debug', args)
    },
    warn: (...args: unknown[]) => {
      emit('warn', args)
    },
    error: (...args: unknown[]) => {
      emit('error', args)
    },
  }
}
