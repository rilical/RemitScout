import { config } from './config'

type MetricRecord = {
  name: string
  type: 'gauge' | 'count'
  value: number
  timestamp?: number
  attributes?: Record<string, string | number>
}

type ExporterConfig = {
  enabled: boolean
  ingestKey: string
  endpoint: string
  batchSize: number
  flushIntervalMs: number
  maxQueue: number
}

type RawNewRelicMetricConfig = ExporterConfig & {
  serviceName: string
  normalizedEnvironment: string
}

const DROP_WARN_INTERVAL_MS = 30_000
const DEFAULT_NEW_RELIC_METRIC_CONFIG: RawNewRelicMetricConfig = {
  enabled: false,
  ingestKey: '',
  endpoint: 'https://metric-api.newrelic.com/metric/v1',
  batchSize: 100,
  flushIntervalMs: 10_000,
  maxQueue: 5000,
  serviceName: '',
  normalizedEnvironment: '',
}

let cachedConfig: ExporterConfig | null = null
let queue: MetricRecord[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let inFlightFlush: Promise<void> | null = null
let droppedCount = 0
let lastDropWarnAt = 0

const getRawConfig = (): RawNewRelicMetricConfig =>
  config.observability?.newRelicMetrics ?? DEFAULT_NEW_RELIC_METRIC_CONFIG

const getConfig = (): ExporterConfig => {
  if (cachedConfig) return cachedConfig

  const nrm = getRawConfig()

  cachedConfig = {
    enabled: nrm.enabled,
    ingestKey: nrm.ingestKey,
    endpoint: nrm.endpoint,
    batchSize: nrm.batchSize,
    flushIntervalMs: nrm.flushIntervalMs,
    maxQueue: nrm.maxQueue,
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
    component: 'shared.newrelic-metric-exporter',
    event: 'newrelic_metric_export_drop',
    dropped_count: droppedCount,
    queue_size: queue.length,
  }
  console.warn(JSON.stringify(warning))
  droppedCount = 0
  lastDropWarnAt = now
}

const buildPayload = (batch: MetricRecord[]): object[] => {
  const now = Math.floor(Date.now() / 1000)
  const nrm = getRawConfig()
  const serviceName = nrm.serviceName
  const environment = nrm.normalizedEnvironment

  const commonAttributes: Record<string, string> = { environment }
  if (serviceName) commonAttributes.service = serviceName

  const metrics = batch.map((m) => ({
    name: m.name,
    type: m.type,
    value: m.value,
    timestamp: m.timestamp || now,
    attributes: m.attributes || {},
  }))

  return [
    {
      common: { attributes: commonAttributes },
      metrics,
    },
  ]
}

const sendBatch = async (cfg: ExporterConfig, batch: MetricRecord[]): Promise<void> => {
  const response = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': cfg.ingestKey,
    },
    body: JSON.stringify(buildPayload(batch)),
  })

  if (!response.ok) {
    throw new Error(`new_relic_metrics_http_${response.status}`)
  }
}

const ensureFlushTimer = (cfg: ExporterConfig): void => {
  if (flushTimer || !cfg.enabled || !cfg.ingestKey) return

  flushTimer = setInterval(() => {
    void flushNewRelicMetrics()
  }, cfg.flushIntervalMs)
  flushTimer.unref?.()
}

const stopFlushTimer = (): void => {
  if (!flushTimer) return
  clearInterval(flushTimer)
  flushTimer = null
}

export const isNewRelicMetricExportEnabled = (): boolean => {
  const cfg = getConfig()
  return cfg.enabled && Boolean(cfg.ingestKey)
}

export const enqueueNewRelicMetric = (record: MetricRecord): void => {
  const cfg = getConfig()
  if (!cfg.enabled || !cfg.ingestKey) return

  if (queue.length >= cfg.maxQueue) {
    queue.shift()
    droppedCount += 1
    emitDropWarning()
  }

  queue.push(record)
  ensureFlushTimer(cfg)

  if (queue.length >= cfg.batchSize) {
    void flushNewRelicMetrics()
  }
}

export const flushNewRelicMetrics = async (drain = false): Promise<void> => {
  const cfg = getConfig()
  if (!cfg.enabled || !cfg.ingestKey || queue.length === 0) return

  if (inFlightFlush) {
    await inFlightFlush
    if (!drain || queue.length === 0) return
  }

  inFlightFlush = (async () => {
    while (queue.length > 0) {
      const batchSize = drain ? Math.min(queue.length, cfg.batchSize) : cfg.batchSize
      const batch = queue.slice(0, batchSize)

      try {
        await sendBatch(cfg, batch)
        queue = queue.slice(batch.length)
      } catch (error) {
        const warning = {
          level: 'warn',
          time: new Date().toISOString(),
          component: 'shared.newrelic-metric-exporter',
          event: 'newrelic_metric_export_flush_failed',
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

export const shutdownNewRelicMetricExport = async (): Promise<void> => {
  stopFlushTimer()
  await flushNewRelicMetrics(true)
}

export const resetNewRelicMetricExporterForTests = (): void => {
  stopFlushTimer()
  queue = []
  droppedCount = 0
  lastDropWarnAt = 0
  inFlightFlush = null
  cachedConfig = null
}
