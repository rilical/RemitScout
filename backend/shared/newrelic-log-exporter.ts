type NewRelicLogRecord = Record<string, unknown>

type ExporterConfig = {
  enabled: boolean
  ingestKey: string
  endpoint: string
  batchSize: number
  flushIntervalMs: number
  maxQueue: number
}

const DEFAULT_ENDPOINT_US = 'https://log-api.newrelic.com/log/v1'
const DEFAULT_ENDPOINT_EU = 'https://log-api.eu.newrelic.com/log/v1'
const DEFAULT_BATCH_SIZE = 50
const DEFAULT_FLUSH_INTERVAL_MS = 5000
const DEFAULT_MAX_QUEUE = 5000
const DROP_WARN_INTERVAL_MS = 30000

let cachedConfig: ExporterConfig | null = null
let queue: NewRelicLogRecord[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let inFlightFlush: Promise<void> | null = null
let droppedCount = 0
let lastDropWarnAt = 0

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt((value || '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeEnvName = (value: string | undefined): string => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const parseEnabled = (): boolean => {
  const raw = (process.env.NEW_RELIC_LOGS_ENABLED || '').trim().toLowerCase()
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false

  const envName = normalizeEnvName(process.env.ENVIRONMENT || process.env.NODE_ENV)
  return envName === 'staging' || envName === 'prod'
}

const resolveEndpoint = (): string => {
  const explicit = (process.env.NEW_RELIC_LOGS_ENDPOINT || '').trim()
  if (explicit) return explicit
  const region = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
  return region === 'EU' ? DEFAULT_ENDPOINT_EU : DEFAULT_ENDPOINT_US
}

const getConfig = (): ExporterConfig => {
  if (cachedConfig) return cachedConfig

  cachedConfig = {
    enabled: parseEnabled(),
    ingestKey: (process.env.NEW_RELIC_INGEST_KEY || '').trim(),
    endpoint: resolveEndpoint(),
    batchSize: parsePositiveInt(process.env.NEW_RELIC_LOGS_BATCH_SIZE, DEFAULT_BATCH_SIZE),
    flushIntervalMs: parsePositiveInt(process.env.NEW_RELIC_LOGS_FLUSH_MS, DEFAULT_FLUSH_INTERVAL_MS),
    maxQueue: parsePositiveInt(process.env.NEW_RELIC_LOGS_MAX_QUEUE, DEFAULT_MAX_QUEUE),
  }

  return cachedConfig
}

const emitDropWarning = (): void => {
  if (droppedCount <= 0) return
  const now = Date.now()
  if (now - lastDropWarnAt < DROP_WARN_INTERVAL_MS) return

  const warning = {
    level: 'warn',
    time: new Date(now).toISOString(),
    component: 'shared.newrelic-log-exporter',
    event: 'newrelic_log_export_drop',
    dropped_count: droppedCount,
    queue_size: queue.length,
  }
  console.warn(JSON.stringify(warning))
  droppedCount = 0
  lastDropWarnAt = now
}

const sendBatch = async (config: ExporterConfig, batch: NewRelicLogRecord[]): Promise<void> => {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': config.ingestKey,
    },
    body: JSON.stringify(batch),
  })

  if (!response.ok) {
    throw new Error(`new_relic_logs_http_${response.status}`)
  }
}

const ensureFlushTimer = (config: ExporterConfig): void => {
  if (flushTimer || !config.enabled || !config.ingestKey) return

  flushTimer = setInterval(() => {
    void flushNewRelicLogs()
  }, config.flushIntervalMs)
  flushTimer.unref?.()
}

const stopFlushTimer = (): void => {
  if (!flushTimer) return
  clearInterval(flushTimer)
  flushTimer = null
}

export const isNewRelicLogExportEnabled = (): boolean => {
  const config = getConfig()
  return config.enabled && Boolean(config.ingestKey)
}

export const enqueueNewRelicLog = (record: NewRelicLogRecord): void => {
  const config = getConfig()
  if (!config.enabled || !config.ingestKey) return

  if (queue.length >= config.maxQueue) {
    queue.shift()
    droppedCount += 1
    emitDropWarning()
  }

  queue.push(record)
  ensureFlushTimer(config)

  if (queue.length >= config.batchSize) {
    void flushNewRelicLogs()
  }
}

export const flushNewRelicLogs = async (drain = false): Promise<void> => {
  const config = getConfig()
  if (!config.enabled || !config.ingestKey || queue.length === 0) return

  if (inFlightFlush) {
    await inFlightFlush
    if (!drain || queue.length === 0) return
  }

  inFlightFlush = (async () => {
    while (queue.length > 0) {
      const batchSize = drain ? Math.min(queue.length, config.batchSize) : config.batchSize
      const batch = queue.slice(0, batchSize)

      try {
        await sendBatch(config, batch)
        queue = queue.slice(batch.length)
      } catch (error) {
        const warning = {
          level: 'warn',
          time: new Date().toISOString(),
          component: 'shared.newrelic-log-exporter',
          event: 'newrelic_log_export_flush_failed',
          error: error instanceof Error ? error.message : String(error),
        }
        console.warn(JSON.stringify(warning))
        break
      }

      if (!drain) break
    }
  })()

  try {
    await inFlightFlush
  } finally {
    inFlightFlush = null
    emitDropWarning()
  }
}

export const shutdownNewRelicLogExport = async (): Promise<void> => {
  stopFlushTimer()
  await flushNewRelicLogs(true)
}

export const resetNewRelicLogExporterForTests = (): void => {
  stopFlushTimer()
  queue = []
  droppedCount = 0
  lastDropWarnAt = 0
  inFlightFlush = null
  cachedConfig = null
}
