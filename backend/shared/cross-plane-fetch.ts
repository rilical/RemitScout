/**
 * Cross-plane HTTP fetch wrapper.
 *
 * Wraps outbound requests from Plane A to Plane C (or any internal plane-to-plane
 * call) and emits a `cross_plane_hop_duration_ms` metric to the
 * `RemitScout/Tracing` CloudWatch namespace.  This metric is consumed by:
 *   - `CrossPlaneHopLatencyAlarm` in infrastructure/cdk/lib/monitoring.ts
 *   - `traceContinuityWidget` dashboard widget
 *
 * Usage:
 * ```ts
 * import { fetchCrossPlane } from '../../../shared/cross-plane-fetch'
 *
 * const response = await fetchCrossPlane({
 *   url: `${config.planeA.planeCBaseUrl}/internal/v1/some-endpoint`,
 *   sourcePlane: 'plane-a',
 *   targetPlane: 'plane-c',
 *   init: { method: 'GET', headers: { ... } },
 * })
 * ```
 */

import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch'
import { config } from './config'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.cross-plane-fetch')

const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

let cloudWatchClient: CloudWatchClient | null = null
const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

export type CrossPlaneMetricInput = {
  sourcePlane: string
  targetPlane: string
  durationMs: number
  /**
   * Ratio-style score used by alarms. `1` means no amplification.
   * Values > 1 indicate downstream errors amplified relative to caller expectations.
   */
  errorAmplification: number
}

/**
 * Emits cross-plane tracing metrics to CloudWatch.
 *
 * To support existing alarms that only dimension by `environment`, we emit:
 * - one metric point with `environment` dimension only
 * - one metric point with `source_plane` + `target_plane` + `environment`
 */
export const recordCrossPlaneMetrics = async ({
  sourcePlane,
  targetPlane,
  durationMs,
  errorAmplification,
}: CrossPlaneMetricInput): Promise<void> => {
  try {
    if (!config.observability.cloudwatch.enabled) return
    const client = getCloudWatchClient()
    const sanitizedDuration = Math.max(0, durationMs)
    const sanitizedAmplification = Number.isFinite(errorAmplification)
      ? Math.max(0, errorAmplification)
      : 1

    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Tracing',
        MetricData: [
          {
            MetricName: 'cross_plane_hop_duration_ms',
            Value: sanitizedDuration,
            Unit: StandardUnit.Milliseconds,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'cross_plane_hop_duration_ms',
            Value: sanitizedDuration,
            Unit: StandardUnit.Milliseconds,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'source_plane', Value: sourcePlane },
              { Name: 'target_plane', Value: targetPlane },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'cross_plane_error_amplification',
            Value: sanitizedAmplification,
            Unit: StandardUnit.None,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'environment', Value: environmentDimension },
            ],
          },
          {
            MetricName: 'cross_plane_error_amplification',
            Value: sanitizedAmplification,
            Unit: StandardUnit.None,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'source_plane', Value: sourcePlane },
              { Name: 'target_plane', Value: targetPlane },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    logger.warn('cross_plane_metric_failed', {
      source_plane: sourcePlane,
      target_plane: targetPlane,
      error: formatError(error).message,
    })
  }
}

export type CrossPlaneFetchOptions = {
  /** Fully-qualified URL to call (e.g. `${config.planeA.planeCBaseUrl}/internal/...`). */
  url: string
  /** Label identifying the calling plane, e.g. `'plane-a'`. */
  sourcePlane: string
  /** Label identifying the target plane, e.g. `'plane-c'`. */
  targetPlane: string
  /** Standard `RequestInit` options forwarded to the underlying `fetch`. */
  init?: RequestInit
}

/**
 * Performs a cross-plane HTTP request and records the round-trip latency.
 *
 * The function re-throws any network error so callers retain full control
 * over error handling.  The metric is always emitted (success or error)
 * to capture both fast-path and failure latency.
 */
export const fetchCrossPlane = async (options: CrossPlaneFetchOptions): Promise<Response> => {
  const { url, sourcePlane, targetPlane, init } = options
  const start = Date.now()
  let responseOk = false
  try {
    const response = await fetch(url, init)
    responseOk = response.ok
    return response
  } catch (error) {
    responseOk = false
    throw error
  } finally {
    // Emit metric regardless of success/failure so the p95 alarm captures
    // both normal and error-path latency.
    const durationMs = Date.now() - start
    void recordCrossPlaneMetrics({
      sourcePlane,
      targetPlane,
      durationMs,
      errorAmplification: responseOk ? 1 : 2,
    })
  }
}
