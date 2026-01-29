import { Counter, Gauge } from 'prom-client'
import {
  CloudWatchClient,
  PutMetricAlarmCommand,
  type ComparisonOperator,
  type Statistic,
} from '@aws-sdk/client-cloudwatch'

import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { metricsRegistry } from './metrics-registry'
import { createLogger } from './logger'
import { config } from './config'

const logger = createLogger('shared.slo-tracker')

const sloComplianceRatio = new Gauge({
  name: 'slo_compliance_ratio',
  help: 'SLO compliance ratio (0.0-1.0).',
  labelNames: ['slo_name', 'time_window'],
  registers: [metricsRegistry],
})

const sloBreachTotal = new Counter({
  name: 'slo_breach_total',
  help: 'Total SLO breaches.',
  labelNames: ['slo_name', 'time_window'],
  registers: [metricsRegistry],
})

const sloActualValue = new Gauge({
  name: 'slo_actual_value',
  help: 'Actual SLO value (e.g., latency in seconds, success rate as ratio).',
  labelNames: ['slo_name', 'time_window'],
  registers: [metricsRegistry],
})

type SLOTarget = {
  threshold: number
  unit: 'seconds' | 'ratio' | 'count' | 'minutes'
  direction: 'lower_is_better' | 'higher_is_better'
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getSLOTargetFromEnv = (sloName: string, defaultTarget: SLOTarget): SLOTarget => {
  const envKey = `SLO_${sloName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_THRESHOLD`
  const envValue = process.env[envKey]
  if (envValue) {
    return {
      ...defaultTarget,
      threshold: toNumber(envValue, defaultTarget.threshold),
    }
  }
  return defaultTarget
}

const SLO_TARGETS_DEFAULTS: Record<string, SLOTarget> = {
  freshness_p95: { threshold: 5 * 60, unit: 'seconds', direction: 'lower_is_better' },
  quote_success_rate: { threshold: 0.98, unit: 'ratio', direction: 'higher_is_better' },
  provider_coverage: { threshold: 3, unit: 'count', direction: 'higher_is_better' },
  gold_export_lag: { threshold: 60, unit: 'seconds', direction: 'lower_is_better' },
  api_latency_p95: { threshold: 5, unit: 'seconds', direction: 'lower_is_better' },
  api_error_rate: { threshold: 0.05, unit: 'ratio', direction: 'lower_is_better' },
}

const SLO_TARGETS: Record<string, SLOTarget> = Object.fromEntries(
  Object.entries(SLO_TARGETS_DEFAULTS).map(([name, defaultTarget]) => [
    name,
    getSLOTargetFromEnv(name, defaultTarget),
  ]),
)

const getEnvironment = (): string => {
  return process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'
}

const getServiceName = (): string => {
  return process.env.SERVICE_NAME || 'remit-scout'
}

const getCloudWatchDimensions = (sloName: string, timeWindow: string) => {
  return {
    slo_name: sloName,
    time_window: timeWindow,
    environment: getEnvironment(),
    service: getServiceName(),
  }
}

export const calculateSLOCompliance = (
  sloName: string,
  timeWindow: string,
  actualValue: number,
): number => {
  const target = SLO_TARGETS[sloName]
  if (!target) {
    logger.warn('slo_unknown', { slo_name: sloName })
    return 0
  }

  if (!Number.isFinite(actualValue)) {
    logger.warn('slo_invalid_value', { slo_name: sloName, actual_value: actualValue })
    return 0
  }

  let compliant: boolean
  if (target.direction === 'lower_is_better') {
    compliant = actualValue <= target.threshold
  } else {
    compliant = actualValue >= target.threshold
  }

  const complianceRatio = compliant ? 1.0 : 0.0

  sloComplianceRatio.set({ slo_name: sloName, time_window: timeWindow }, complianceRatio)
  sloActualValue.set({ slo_name: sloName, time_window: timeWindow }, actualValue)

  if (!compliant) {
    sloBreachTotal.inc({ slo_name: sloName, time_window: timeWindow })
    logger.warn('slo_breach', {
      slo_name: sloName,
      time_window: timeWindow,
      actual_value: actualValue,
      threshold: target.threshold,
      unit: target.unit,
    })
  }

  const dimensions = getCloudWatchDimensions(sloName, timeWindow)

  recordCloudWatchMetric({
    name: 'slo_compliance_ratio',
    value: complianceRatio,
    unit: 'None',
    dimensions,
  })
  recordCloudWatchMetric({
    name: 'slo_actual_value',
    value: actualValue,
    unit:
      target.unit === 'seconds' || target.unit === 'minutes'
        ? 'Seconds'
        : target.unit === 'ratio'
          ? 'None'
          : 'Count',
    dimensions,
  })
  if (!compliant) {
    recordCloudWatchMetric({
      name: 'slo_breach_total',
      value: 1,
      unit: 'Count',
      dimensions,
    })
  }

  return complianceRatio
}

export const recordSLOValue = (
  sloName: string,
  timeWindow: string,
  actualValue: number,
): void => {
  try {
    calculateSLOCompliance(sloName, timeWindow, actualValue)
  } catch (error) {
    logger.error('slo_record_failed', {
      slo_name: sloName,
      time_window: timeWindow,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const getSLOTarget = (sloName: string): SLOTarget | undefined => {
  return SLO_TARGETS[sloName]
}

export const listSLONames = (): string[] => {
  return Object.keys(SLO_TARGETS)
}

export type Percentile = 'p50' | 'p95' | 'p99'

export const aggregateSLOValue = (
  values: number[],
  percentile: Percentile = 'p95',
): number => {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)

  let index: number
  switch (percentile) {
    case 'p50':
      index = Math.floor(sorted.length * 0.5)
      break
    case 'p95':
      index = Math.floor(sorted.length * 0.95)
      break
    case 'p99':
      index = Math.floor(sorted.length * 0.99)
      break
  }

  return sorted[Math.min(index, sorted.length - 1)]
}

export type CloudWatchAlarmOptions = {
  alarmName: string
  snsTopicArn?: string
  evaluationPeriods?: number
  datapointsToAlarm?: number
  periodSeconds?: number
  treatMissingData?: 'breaching' | 'notBreaching' | 'ignore' | 'missing'
}

let cloudWatchClient: CloudWatchClient | null = null

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

export const createSLOCloudWatchAlarm = async (
  sloName: string,
  timeWindow: string,
  options: CloudWatchAlarmOptions,
): Promise<void> => {
  const target = SLO_TARGETS[sloName]
  if (!target) {
    throw new Error(`Unknown SLO: ${sloName}`)
  }

  if (!config.observability.cloudwatch.enabled) {
    logger.debug('cloudwatch_disabled_skipping_alarm', { slo_name: sloName })
    return
  }

  const dimensions = getCloudWatchDimensions(sloName, timeWindow)
  const dimensionArray = Object.entries(dimensions).map(([Name, Value]) => ({
    Name,
    Value: String(Value),
  }))

  const comparisonOperator: ComparisonOperator =
    target.direction === 'lower_is_better' ? 'GreaterThanThreshold' : 'LessThanThreshold'

  const threshold = target.direction === 'lower_is_better' ? target.threshold : target.threshold

  const alarmConfig: any = {
    AlarmName: options.alarmName,
    MetricName: 'slo_compliance_ratio',
    Namespace: config.observability.cloudwatch.namespace,
    Statistic: 'Average' as Statistic,
    Dimensions: dimensionArray,
    Period: options.periodSeconds || 300,
    EvaluationPeriods: options.evaluationPeriods || 2,
    DatapointsToAlarm: options.datapointsToAlarm || 1,
    Threshold: threshold,
    ComparisonOperator: comparisonOperator,
    TreatMissingData: options.treatMissingData || 'breaching',
  }

  if (options.snsTopicArn) {
    alarmConfig.AlarmActions = [options.snsTopicArn]
    alarmConfig.OKActions = [options.snsTopicArn]
  }

  try {
    const client = getCloudWatchClient()
    await client.send(new PutMetricAlarmCommand(alarmConfig))
    logger.info('slo_alarm_created', {
      slo_name: sloName,
      alarm_name: options.alarmName,
    })
  } catch (error) {
    logger.error('slo_alarm_creation_failed', {
      slo_name: sloName,
      alarm_name: options.alarmName,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
