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

export const createLogger = (component: string) => {
  const currentLevel = resolveLogLevel()

  const emit = (level: LogLevel, event: string, context?: Record<string, unknown>) => {
    if (levelRank[level] < levelRank[currentLevel]) return
    const payload = {
      level,
      time: new Date().toISOString(),
      component,
      event,
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
