import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { config } from './config'
import { createLogger } from './logger'

export type OpsEventType =
  | 'circuit_open'
  | 'circuit_close'
  | 'lock_contention'
  | 'backpressure'
  | 'shutdown_started'
  | 'shutdown_complete'
  | 'dependency_unavailable'

const logger = createLogger('shared.ops-events')

export const emitOpsEvent = (event: {
  type: OpsEventType
  component: string
  details: Record<string, unknown>
}): void => {
  logger.info(`ops:${event.type}`, {
    ops_event: event.type,
    component: event.component,
    details: event.details,
  })

  // Best-effort: ops events must never break business logic.
  try {
    recordCloudWatchMetric({
      name: `ops_event_${event.type}`,
      value: 1,
      unit: 'Count',
      dimensions: {
        component: event.component,
        environment: config.envName || config.env,
      },
    })
  } catch (error) {
    logger.debug('ops_event_metric_emit_failed', {
      ops_event: event.type,
      component: event.component,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
