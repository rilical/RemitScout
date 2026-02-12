import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { createShutdownHandler } from '../../shared/shutdown'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, shutdownTracing } from '../../shared/tracing'
import { runStartupChecks } from '../../shared/startup'
import { buildApp } from './app'

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

const start = async () => {
  let app: Awaited<ReturnType<typeof buildApp>> | null = null
  let isShutdownRequested = () => false
  let smartAlertsTimer: ReturnType<typeof setInterval> | null = null
  let smartAlertsRunning = false

  try {
    // Fail-fast validation for required runtime config. For ECS, also validates AWS connectivity.
    await runStartupChecks({
      requirements: {
        requirePlaneA: true,
        requirePlaneC: true,
        requireRedis: true,
        requireQueues: true,
        requireStorage: true,
        requireSupabase: true,
        requireStripe: true,
        requireJwtSecret: config.planeA.requireJwt,
      },
    })

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

    const enableSmartAlertsScheduler = config.planeA.smartAlerts.enabled
    const smartAlertsIntervalMinutes = config.planeA.smartAlerts.intervalMinutes

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
