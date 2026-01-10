import { runIngestion } from '../../plane-b/src/ingest'
import { runB2cRefreshWorker } from '../b2c-refresh-worker'
import { runGoldFxRatesJob } from '../gold-fx-rates-job'
import { runGoldPopularCorridorsJob } from '../gold-popular-corridors-job'
import { runGoldPulseCacheJob } from '../gold-pulse-cache-job'
import { runGoldPublisherJob } from '../gold-publisher-job'
import { runProviderCapabilityProbe } from '../provider-capability-probe'
import { runSmartAlertsJob } from '../smart-alerts-job'
import { runTelemetryAnalyticsJob } from '../telemetry-analytics-job'
import { runContinuousSync } from '../oanda-rates-sync'
import { runBankVsSpecialistRefresh } from '../bank-vs-specialist-refresh'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.dev-continuous-pipeline')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback = true) => {
  if (value === undefined) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const ingestIntervalSeconds = toNumber(process.env.PIPELINE_INGEST_INTERVAL_SECONDS, 60)
const b2cRefreshIntervalSeconds = toNumber(process.env.PIPELINE_B2C_REFRESH_INTERVAL_SECONDS, 10)
const goldFxRatesIntervalMinutes = toNumber(process.env.PIPELINE_GOLD_FX_RATES_INTERVAL_MINUTES, 10)
const goldPulseCacheIntervalMinutes = toNumber(process.env.PIPELINE_GOLD_PULSE_CACHE_INTERVAL_MINUTES, 10)
const goldPopularCorridorsIntervalMinutes = toNumber(process.env.PIPELINE_GOLD_POPULAR_CORRIDORS_INTERVAL_MINUTES, 15)
const goldPublisherIntervalMinutes = toNumber(process.env.PIPELINE_GOLD_PUBLISHER_INTERVAL_MINUTES, 30)
const capabilityProbeIntervalMinutes = toNumber(process.env.PIPELINE_CAPABILITY_PROBE_INTERVAL_MINUTES, 60)
const smartAlertsIntervalMinutes = toNumber(process.env.PIPELINE_SMART_ALERTS_INTERVAL_MINUTES, 15)
const telemetryAnalyticsIntervalMinutes = toNumber(process.env.PIPELINE_TELEMETRY_ANALYTICS_INTERVAL_MINUTES, 60)
const bankVsSpecialistIntervalMinutes = toNumber(
  process.env.PIPELINE_BANK_VS_SPECIALIST_REFRESH_INTERVAL_MINUTES,
  240,
)

const enableIngestion = toBoolean(process.env.PIPELINE_INGEST_ENABLED, true)
const enableB2cRefresh = toBoolean(process.env.PIPELINE_B2C_REFRESH_ENABLED, true)
const enableGoldFxRates = toBoolean(process.env.PIPELINE_GOLD_FX_RATES_ENABLED, true)
const enableGoldPulseCache = toBoolean(process.env.PIPELINE_GOLD_PULSE_CACHE_ENABLED, true)
const enableGoldPopularCorridors = toBoolean(process.env.PIPELINE_GOLD_POPULAR_CORRIDORS_ENABLED, true)
const enableGoldPublisher = toBoolean(process.env.PIPELINE_GOLD_PUBLISHER_ENABLED, true)
const enableCapabilityProbe = toBoolean(process.env.PIPELINE_CAPABILITY_PROBE_ENABLED, true)
const enableSmartAlerts = toBoolean(process.env.PIPELINE_SMART_ALERTS_ENABLED, true)
const enableTelemetryAnalytics = toBoolean(process.env.PIPELINE_TELEMETRY_ANALYTICS_ENABLED, true)
const enableOandaSync = toBoolean(process.env.PIPELINE_OANDA_SYNC_ENABLED, true)
const enableBankVsSpecialistRefresh = toBoolean(
  process.env.PIPELINE_BANK_VS_SPECIALIST_REFRESH_ENABLED,
  true,
)

let shutdownRequested = false

const requestShutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
}

process.on('SIGTERM', () => requestShutdown('SIGTERM'))
process.on('SIGINT', () => requestShutdown('SIGINT'))

const scheduleRecurring = (
  label: string,
  intervalMs: number,
  task: () => Promise<void>,
  runImmediately = true,
) => {
  if (intervalMs <= 0) {
    logger.warn('task_disabled', { task: label, reason: 'interval_zero' })
    return () => undefined
  }

  let running = false
  const run = async () => {
    if (shutdownRequested) return
    if (running) {
      logger.info('task_skipped', { task: label, reason: 'already_running' })
      return
    }
    running = true
    const startTime = Date.now()
    try {
      await task()
      logger.info('task_complete', { task: label, duration_ms: Date.now() - startTime })
    } catch (error) {
      logger.error('task_failed', {
        task: label,
        duration_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      running = false
    }
  }

  if (runImmediately) {
    void run()
  }
  const timer = setInterval(run, intervalMs)
  return () => clearInterval(timer)
}

const startContinuousPipeline = async () => {
  logger.info('pipeline_start', {
    ingest_interval_seconds: ingestIntervalSeconds,
    b2c_refresh_interval_seconds: b2cRefreshIntervalSeconds,
    gold_fx_rates_interval_minutes: goldFxRatesIntervalMinutes,
    gold_pulse_cache_interval_minutes: goldPulseCacheIntervalMinutes,
    gold_popular_corridors_interval_minutes: goldPopularCorridorsIntervalMinutes,
    gold_publisher_interval_minutes: goldPublisherIntervalMinutes,
    capability_probe_interval_minutes: capabilityProbeIntervalMinutes,
    smart_alerts_interval_minutes: smartAlertsIntervalMinutes,
    telemetry_analytics_interval_minutes: telemetryAnalyticsIntervalMinutes,
    bank_vs_specialist_interval_minutes: bankVsSpecialistIntervalMinutes,
    enable_oanda_sync: enableOandaSync,
  })

  const cleanupFns: Array<() => void> = []

  if (enableIngestion) {
    cleanupFns.push(
      scheduleRecurring(
        'plane-b-ingestion',
        ingestIntervalSeconds * 1000,
        async () => {
          if (enableB2cRefresh) {
            await runB2cRefreshWorker()
          }
          await runIngestion()
        },
        true,
      ),
    )
  }

  if (enableB2cRefresh) {
    cleanupFns.push(
      scheduleRecurring(
        'b2c-refresh-worker',
        b2cRefreshIntervalSeconds * 1000,
        async () => {
          await runB2cRefreshWorker()
        },
        true,
      ),
    )
  }

  if (enableGoldFxRates) {
    cleanupFns.push(
      scheduleRecurring(
        'gold-fx-rates',
        goldFxRatesIntervalMinutes * 60 * 1000,
        async () => {
          await runGoldFxRatesJob()
        },
        false,
      ),
    )
  }

  if (enableGoldPulseCache) {
    cleanupFns.push(
      scheduleRecurring(
        'gold-pulse-cache',
        goldPulseCacheIntervalMinutes * 60 * 1000,
        async () => {
          await runGoldPulseCacheJob()
        },
        false,
      ),
    )
  }

  if (enableGoldPopularCorridors) {
    cleanupFns.push(
      scheduleRecurring(
        'gold-popular-corridors',
        goldPopularCorridorsIntervalMinutes * 60 * 1000,
        async () => {
          await runGoldPopularCorridorsJob()
        },
        false,
      ),
    )
  }

  if (enableGoldPublisher) {
    cleanupFns.push(
      scheduleRecurring(
        'gold-publisher',
        goldPublisherIntervalMinutes * 60 * 1000,
        async () => {
          await runGoldPublisherJob()
        },
        false,
      ),
    )
  }

  if (enableCapabilityProbe) {
    cleanupFns.push(
      scheduleRecurring(
        'provider-capability-probe',
        capabilityProbeIntervalMinutes * 60 * 1000,
        async () => {
          await runProviderCapabilityProbe()
        },
        false,
      ),
    )
  }

  if (enableSmartAlerts) {
    cleanupFns.push(
      scheduleRecurring(
        'smart-alerts',
        smartAlertsIntervalMinutes * 60 * 1000,
        async () => {
          await runSmartAlertsJob()
        },
        false,
      ),
    )
  }

  if (enableTelemetryAnalytics) {
    cleanupFns.push(
      scheduleRecurring(
        'telemetry-analytics',
        telemetryAnalyticsIntervalMinutes * 60 * 1000,
        async () => {
          await runTelemetryAnalyticsJob()
        },
        false,
      ),
    )
  }

  if (enableBankVsSpecialistRefresh) {
    cleanupFns.push(
      scheduleRecurring(
        'bank-vs-specialist-refresh',
        bankVsSpecialistIntervalMinutes * 60 * 1000,
        async () => {
          await runBankVsSpecialistRefresh()
        },
        true,
      ),
    )
  }

  if (enableOandaSync) {
    try {
      await runContinuousSync()
    } catch (error) {
      logger.error('oanda_sync_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  while (!shutdownRequested) {
    await sleep(1000)
  }

  for (const cleanup of cleanupFns) {
    cleanup()
  }
}

startContinuousPipeline()
  .then(() => {
    logger.info('pipeline_exit')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('pipeline_fatal', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
