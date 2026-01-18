import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { createShutdownHandler } from '../../shared/shutdown'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, shutdownTracing } from '../../shared/tracing'
import { buildApp } from './app'

if (config.env === 'production' || config.env === 'staging' || process.env.STRICT_CONFIG === '1') {
  assertRuntimeConfig({
    requirePlaneA: true,
    requireRedis: true,
    requireSupabase: true,
    requireStripe: true,
    requireJwtSecret: config.planeA.requireJwt,
  })
}

initErrorTracking('plane-a')
initTracing('plane-a')

const logger = createLogger('plane-a.server')

const loadSmartAlertsJob = async (): Promise<(() => Promise<void>) | null> => {
  try {
    const modulePath = '../../scripts/smart-alerts-job'
    const module = await import(modulePath) as { runSmartAlertsJob?: () => Promise<void> }
    return module.runSmartAlertsJob ?? null
  } catch (error) {
    logger.warn('smart_alerts_loader_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const start = async () => {
  let app: Awaited<ReturnType<typeof buildApp>> | null = null
  let isShutdownRequested = () => false
  let smartAlertsTimer: ReturnType<typeof setInterval> | null = null
  let smartAlertsRunning = false

  try {
    app = await buildApp()
    const shutdown = createShutdownHandler({
      timeoutMs: 30000,
      logger,
      onShutdown: async () => {
        if (smartAlertsTimer) {
          clearInterval(smartAlertsTimer)
        }
        if (app) {
          await app.close()
        }
        await shutdownTracing()
      },
    })
    isShutdownRequested = shutdown.isShutdownRequested

    await app.listen({ port: config.planeA.port, host: '0.0.0.0' })
    logger.info('server_started', { port: config.planeA.port })

    const enableSmartAlertsScheduler = toBoolean(
      process.env.PLANE_A_SMART_ALERTS_ENABLED,
      config.env !== 'production' && config.env !== 'staging',
    )
    const smartAlertsIntervalMinutes = toNumber(
      process.env.PLANE_A_SMART_ALERTS_INTERVAL_MINUTES,
      15,
    )

    if (enableSmartAlertsScheduler && smartAlertsIntervalMinutes > 0) {
      if (!config.db.planeBUrl) {
        logger.warn('smart_alerts_scheduler_disabled', { reason: 'missing_plane_b_url' })
      } else {
        const runSmartAlerts = async () => {
          if (smartAlertsRunning) {
            logger.info('smart_alerts_skipped', { reason: 'already_running' })
            return
          }
          smartAlertsRunning = true
          const startedAt = Date.now()
          try {
            const runSmartAlertsJob = await loadSmartAlertsJob()
            if (!runSmartAlertsJob) {
              logger.warn('smart_alerts_job_missing')
              return
            }
            await runSmartAlertsJob()
            logger.info('smart_alerts_complete', { duration_ms: Date.now() - startedAt })
          } catch (error) {
            logger.warn('smart_alerts_failed', {
              error: error instanceof Error ? error.message : String(error),
            })
          } finally {
            smartAlertsRunning = false
          }
        }

        void runSmartAlerts()
        smartAlertsTimer = setInterval(
          runSmartAlerts,
          smartAlertsIntervalMinutes * 60 * 1000,
        )
        logger.info('smart_alerts_scheduler_started', {
          interval_minutes: smartAlertsIntervalMinutes,
        })
      }
    }
  } catch (error) {
    if (app?.log) {
      app.log.error(error)
    } else {
      logger.error('server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
    if (!isShutdownRequested()) {
      process.exit(1)
    }
  }
}

start()
