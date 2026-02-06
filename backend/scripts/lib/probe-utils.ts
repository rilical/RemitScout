import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.probe-utils')
const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

let cloudWatchClient: CloudWatchClient | null = null

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

/**
 * Publishes CloudWatch metrics for probe results.
 */
const publishProbeMetrics = async (
  providerId: string,
  result: ProbeResult,
): Promise<void> => {
  try {
    if (!config.observability.cloudwatch.enabled) {
      return
    }
    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Probes',
        MetricData: [
          {
            MetricName: 'probe_run_total',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'probe_result',
            Value: result.success ? 1 : 0,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'Status', Value: result.success ? 'success' : 'failure' },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'probe_duration',
            Value: result.durationMs / 1000, // Convert to seconds
            Unit: 'Seconds',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'probe_corridors_tested',
            Value: result.corridorsTested,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'probe_corridors_succeeded',
            Value: result.corridorsSucceeded,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'probe_corridors_failed',
            Value: result.corridorsFailed,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'ProviderId', Value: providerId },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    // Silently fail metrics - don't break probe execution
    logger.debug('probe_metrics_failed', {
      provider_id: providerId,
      error: formatError(error).message,
    })
  }
}

export type ProbeResult = {
  success: boolean
  providerId?: string
  corridorsTested: number
  corridorsSucceeded: number
  corridorsFailed: number
  durationMs: number
  errors?: Array<{ corridor: string; error: string }>
}

export const createProbeRunner = (options: {
  providerId: string
  corridors?: readonly string[]
  timeoutMs?: number
  retries?: number
  onResult?: (result: ProbeResult) => void
}) => {
  const logger = createLogger(`script.probe.${options.providerId}`)
  const timeoutMs = options.timeoutMs ?? 300000
  const retries = options.retries ?? 0
  const corridorCount = options.corridors?.length ?? 0

  return {
    async run(collectorFn: () => Promise<boolean>): Promise<ProbeResult> {
      const startTime = Date.now()
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= retries; attempt++) {
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        let timeoutWarningId: ReturnType<typeof setTimeout> | null = null
        try {
          // Set up timeout warning (at 80% of timeout)
          const warningTimeout = Math.floor(timeoutMs * 0.8)
          timeoutWarningId = setTimeout(() => {
            logger.warn('probe_timeout_warning', {
              provider_id: options.providerId,
              timeout_ms: timeoutMs,
              warning_at_ms: warningTimeout,
            })
          }, warningTimeout)

          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error(`Probe timeout after ${timeoutMs}ms`)),
              timeoutMs,
            )
          })

          const ok = await Promise.race([collectorFn(), timeoutPromise])
          const durationMs = Date.now() - startTime

          const result: ProbeResult = {
            success: ok,
            providerId: options.providerId,
            corridorsTested: corridorCount,
            corridorsSucceeded: ok ? corridorCount : 0,
            corridorsFailed: ok ? 0 : corridorCount,
            durationMs,
          }

          // Publish CloudWatch metrics
          await publishProbeMetrics(options.providerId, result)

          if (options.onResult) {
            options.onResult(result)
          }

          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          if (attempt < retries) {
            logger.warn('probe_retry', { attempt: attempt + 1, error: lastError.message })
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          }
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          if (timeoutWarningId) {
            clearTimeout(timeoutWarningId)
          }
        }
      }

      const durationMs = Date.now() - startTime
      const result: ProbeResult = {
        success: false,
        providerId: options.providerId,
        corridorsTested: corridorCount,
        corridorsSucceeded: 0,
        corridorsFailed: corridorCount,
        durationMs,
        errors: [{ corridor: 'all', error: lastError?.message ?? 'Unknown error' }],
      }

      // Publish CloudWatch metrics
      await publishProbeMetrics(options.providerId, result)

      if (options.onResult) {
        options.onResult(result)
      }

      return result
    },
  }
}

export const outputProbeResult = (result: ProbeResult, format: 'json' | 'text' = 'json') => {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Probe ${result.success ? 'PASSED' : 'FAILED'}`)
    console.log(`Provider: ${result.providerId}`)
    console.log(`Duration: ${result.durationMs}ms`)
    console.log(`Corridors: ${result.corridorsSucceeded}/${result.corridorsTested} succeeded`)
    if (result.errors) {
      console.log('Errors:')
      result.errors.forEach(e => console.log(`  - ${e.corridor}: ${e.error}`))
    }
  }
}
