/**
 * AWS CloudWatch Synthetics Canary Handler
 * 
 * Migrated from synthetic-monitor.ts to AWS CloudWatch Synthetics.
 * This Lambda function runs as a CloudWatch Synthetics canary.
 * 
 * **Deployment**: Deploy via CDK using CloudWatch Synthetics Canary construct.
 * **Schedule**: Runs every 5 minutes via EventBridge rule.
 * 
 * **Environment Variables**:
 * - PLANE_A_BASE_URL: Base URL for Plane A API (required)
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { createLogger } from '../shared/logger'
import { formatError } from '../shared/utils/error-handling'

const logger = createLogger('script.aws-synthetic-monitor')

const cloudWatchClient = new CloudWatchClient({})

type TestResult = {
  success: boolean
  duration: number
  error?: string
}

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

const testHealthEndpoint = async (baseUrl: string): Promise<TestResult> => {
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
      error: formatError(error).message,
    }
  }
}

const testQuotesEndpoint = async (baseUrl: string): Promise<TestResult> => {
  const startTime = Date.now()
  try {
    const url = `${baseUrl}/api/quotes/current?corridor_id=US-USD_IN-INR&amount=1000&payin=bank_transfer&payout=bank_deposit`
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
      error: formatError(error).message,
    }
  }
}

const testPopularCorridorsEndpoint = async (baseUrl: string): Promise<TestResult> => {
  const startTime = Date.now()
  try {
    const { status, body, duration } = await fetchWithTimeout(
      `${baseUrl}/api/popular-corridors`,
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
      error: formatError(error).message,
    }
  }
}

/**
 * Records CloudWatch metrics for synthetic tests.
 */
const recordTestMetric = async (
  testName: string,
  success: boolean,
  duration: number,
): Promise<void> => {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Synthetic',
        MetricData: [
          {
            MetricName: 'test_result',
            Value: success ? 1 : 0,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'TestName', Value: testName },
              { Name: 'Status', Value: success ? 'success' : 'failure' },
            ],
          },
          {
            MetricName: 'test_duration',
            Value: duration,
            Unit: 'Seconds',
            Timestamp: new Date(),
            Dimensions: [{ Name: 'TestName', Value: testName }],
          },
        ],
      }),
    )
  } catch (error) {
    logger.debug('test_metric_failed', {
      test_name: testName,
      error: formatError(error).message,
    })
  }
}

/**
 * Lambda handler for CloudWatch Synthetics canary.
 */
export const handler = async (): Promise<{ success: boolean; results: TestResult[] }> => {
  const baseUrl = process.env.PLANE_A_BASE_URL
  if (!baseUrl) {
    throw new Error('PLANE_A_BASE_URL environment variable is required')
  }

  logger.info('synthetic_tests_starting', { base_url: baseUrl })

  const tests = [
    { name: 'health', fn: () => testHealthEndpoint(baseUrl) },
    { name: 'quotes', fn: () => testQuotesEndpoint(baseUrl) },
    { name: 'popular_corridors', fn: () => testPopularCorridorsEndpoint(baseUrl) },
  ]

  const results = await Promise.allSettled(tests.map((t) => t.fn()))

  const testResults: TestResult[] = []
  let allSuccess = true

  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i].name
    const result = results[i]

    if (result.status === 'fulfilled') {
      const { success, duration, error } = result.value
      testResults.push(result.value)

      await recordTestMetric(testName, success, duration)

      if (!success) {
        allSuccess = false
      }

      logger.info('synthetic_test_result', {
        test_name: testName,
        status: success ? 'success' : 'failure',
        duration_seconds: duration,
        error,
      })
    } else {
      const error = result.reason instanceof Error ? result.reason.message : String(result.reason)
      testResults.push({
        success: false,
        duration: 0,
        error,
      })
      allSuccess = false

      await recordTestMetric(testName, false, 0)

      logger.error('synthetic_test_error', {
        test_name: testName,
        error,
      })
    }
  }

  logger.info('synthetic_tests_completed', {
    success: allSuccess,
    test_count: tests.length,
  })

  return {
    success: allSuccess,
    results: testResults,
  }
}



