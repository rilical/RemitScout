/**
 * Synthetic Monitoring Script
 *
 * Runs automated end-to-end health checks against Plane A API.
 *
 * Environment Variables:
 * - SYNTHETIC_MONITOR_PORT: Port for metrics server (default: 9090)
 * - SYNTHETIC_MONITOR_INTERVAL_SECONDS: Test interval in seconds (default: 60)
 * - PLANE_A_BASE_URL: Base URL for Plane A API (required)
 */

import http from 'node:http'
import { Counter, Gauge, Registry } from 'prom-client'

import { createLogger } from '../shared/logger'
import { config } from '../shared/config'
import { createShutdownHandler } from '../shared/shutdown'

const logger = createLogger('script.synthetic-monitor')

const register = new Registry()

const syntheticTestTotal = new Counter({
  name: 'synthetic_test_total',
  help: 'Total synthetic test runs.',
  labelNames: ['test_name', 'status'],
  registers: [register],
})

const syntheticTestDurationSeconds = new Gauge({
  name: 'synthetic_test_duration_seconds',
  help: 'Synthetic test duration in seconds.',
  labelNames: ['test_name'],
  registers: [register],
})

const syntheticTestLastSuccessTimestamp = new Gauge({
  name: 'synthetic_test_last_success_timestamp',
  help: 'Unix timestamp of last successful test.',
  labelNames: ['test_name'],
  registers: [register],
})

type TestResult = {
  success: boolean
  duration: number
  error?: string
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const port = toNumber(process.env.SYNTHETIC_MONITOR_PORT, 9090)
const intervalSeconds = toNumber(process.env.SYNTHETIC_MONITOR_INTERVAL_SECONDS, 60)
const baseUrl = process.env.PLANE_A_BASE_URL || `http://localhost:${config.planeA.port}`

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number,
): Promise<{ status: number; body: unknown; duration: number }> => {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const duration = (Date.now() - startTime) / 1000
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    return { status: response.status, body, duration }
  } finally {
    clearTimeout(timeout)
  }
}

const testHealthEndpoint = async (): Promise<TestResult> => {
  const startTime = Date.now()
  try {
    const { status, duration } = await fetchWithTimeout(`${baseUrl}/healthz`, 1000)
    const success = status === 200 && duration < 1
    return {
      success,
      duration,
      error: success ? undefined : `Status: ${status}, Duration: ${duration}s`,
    }
  } catch (error) {
    return {
      success: false,
      duration: (Date.now() - startTime) / 1000,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const testQuotesEndpoint = async (): Promise<TestResult> => {
  const startTime = Date.now()
  try {
    const url = `${baseUrl}/api/v1/quotes/current?corridor_id=US-USD_IN-INR&amount=1000&payin=bank_transfer&payout=bank_deposit`
    const { status, body, duration } = await fetchWithTimeout(url, 5000)

    if (status !== 200) {
      return {
        success: false,
        duration,
        error: `Status: ${status}`,
      }
    }

    if (duration > 5) {
      return {
        success: false,
        duration,
        error: `Duration exceeded 5s: ${duration}s`,
      }
    }

    const hasQuotes = body && typeof body === 'object' && 'quotes' in body
    if (!hasQuotes) {
      return {
        success: false,
        duration,
        error: 'Response missing quotes array',
      }
    }

    return { success: true, duration }
  } catch (error) {
    return {
      success: false,
      duration: (Date.now() - startTime) / 1000,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const testPopularCorridorsEndpoint = async (): Promise<TestResult> => {
  const startTime = Date.now()
  try {
    const { status, body, duration } = await fetchWithTimeout(
      `${baseUrl}/api/v1/popular-corridors`,
      3000,
    )

    if (status !== 200) {
      return {
        success: false,
        duration,
        error: `Status: ${status}`,
      }
    }

    if (duration > 3) {
      return {
        success: false,
        duration,
        error: `Duration exceeded 3s: ${duration}s`,
      }
    }

    const hasCorridors = body && typeof body === 'object' && 'corridors' in body
    if (!hasCorridors) {
      return {
        success: false,
        duration,
        error: 'Response missing corridors array',
      }
    }

    return { success: true, duration }
  } catch (error) {
    return {
      success: false,
      duration: (Date.now() - startTime) / 1000,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const tests = [
  { name: 'health', fn: testHealthEndpoint },
  { name: 'quotes', fn: testQuotesEndpoint },
  { name: 'popular_corridors', fn: testPopularCorridorsEndpoint },
]

const runTests = async (): Promise<void> => {
  logger.info('synthetic_tests_starting', { test_count: tests.length })

  const results = await Promise.allSettled(tests.map((t) => t.fn()))

  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i].name
    const result = results[i]

    if (result.status === 'fulfilled') {
      const { success, duration, error } = result.value
      const status = success ? 'success' : 'failure'

      syntheticTestTotal.inc({ test_name: testName, status })
      syntheticTestDurationSeconds.set({ test_name: testName }, duration)

      if (success) {
        syntheticTestLastSuccessTimestamp.set({ test_name: testName }, Date.now() / 1000)
      }

      logger.info('synthetic_test_result', {
        test_name: testName,
        status,
        duration_seconds: duration,
        error,
      })
    } else {
      syntheticTestTotal.inc({ test_name: testName, status: 'failure' })
      logger.error('synthetic_test_error', {
        test_name: testName,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  }

  logger.info('synthetic_tests_completed', { test_count: tests.length })
}

let testInterval: NodeJS.Timeout | null = null
let server: http.Server | null = null

const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.end('method_not_allowed')
        return
      }

      const path = req.url?.split('?')[0] ?? ''

      if (path === '/health') {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
        return
      }

      if (path === '/metrics') {
        try {
          const metrics = await register.metrics()
          res.statusCode = 200
          res.setHeader('content-type', register.contentType)
          res.end(metrics)
        } catch (error) {
          res.statusCode = 500
          res.end('metrics_error')
        }
        return
      }

      res.statusCode = 404
      res.end('not_found')
    })

    server.once('error', reject)
    server.listen(port, () => {
      logger.info('synthetic_monitor_server_started', { port })
      resolve()
    })
  })
}

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 10000,
  logger,
  onShutdown: async () => {
    if (testInterval) {
      clearInterval(testInterval)
      testInterval = null
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve())
      })
    }
  },
})

const run = async (): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('synthetic_monitor_skipped', { reason: 'shutdown_requested' })
    return
  }

  await startServer()

  await runTests()

  testInterval = setInterval(() => {
    if (!isShutdownRequested()) {
      runTests().catch((error) => {
        logger.error('synthetic_tests_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
  }, intervalSeconds * 1000)

  logger.info('synthetic_monitor_started', {
    interval_seconds: intervalSeconds,
    base_url: baseUrl,
  })
}

run().catch((error) => {
  logger.error('synthetic_monitor_fatal', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
  process.exit(1)
})




