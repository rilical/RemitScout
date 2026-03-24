export {}

const normalizeEnvName = (value: string): string => {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const runtimeEnv = normalizeEnvName(process.env.ENVIRONMENT || process.env.NODE_ENV || '')
const isStrictEnv =
  runtimeEnv === 'staging' ||
  runtimeEnv === 'prod' ||
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.env.STRICT_CONFIG === '1'

const missing: string[] = []

const requireValue = (value: string | undefined, name: string): void => {
  if (!value || !value.trim()) {
    missing.push(name)
  }
}

const boolFromEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') return fallback
  const normalized = value.trim().toLowerCase()
  return normalized !== '0' && normalized !== 'false' && normalized !== 'off' && normalized !== 'no'
}

const normalizeNewRelicAwsMode = (
  value: string | undefined,
  name: string,
): 'push_pull' | 'push_only' | 'otlp_only' | null => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) {
    missing.push(`${name} (required in strict env)`)
    return null
  }
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  missing.push(`${name} (unsupported New Relic AWS mode: ${value})`)
  return null
}

const normalizeNamespaces = (value: string | undefined): string[] =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const REQUIRED_STAGING_METRIC_STREAM_NAMESPACES = [
  'AWS/SQS',
  'AWS/ECS',
  'AWS/Lambda',
  'AWS/Events',
]

const haveSameNamespaceSet = (actual: string[], expected: string[]): boolean => {
  if (actual.length !== expected.length) return false
  const actualSet = new Set(actual)
  return expected.every(namespace => actualSet.has(namespace))
}

if (isStrictEnv) {
  const stagingNewRelicAwsMode = normalizeNewRelicAwsMode(
    process.env.NEW_RELIC_STAGING_AWS_MODE,
    'NEW_RELIC_STAGING_AWS_MODE',
  )
  const prodNewRelicAwsMode = normalizeNewRelicAwsMode(
    process.env.NEW_RELIC_PROD_AWS_MODE,
    'NEW_RELIC_PROD_AWS_MODE',
  )

  requireValue(process.env.SENTRY_DSN, 'SENTRY_DSN')
  requireValue(process.env.NEW_RELIC_ACCOUNT_ID, 'NEW_RELIC_ACCOUNT_ID')
  requireValue(process.env.NEW_RELIC_REGION, 'NEW_RELIC_REGION')
  requireValue(process.env.NEW_RELIC_INGEST_KEY, 'NEW_RELIC_INGEST_KEY')
  requireValue(process.env.NEW_RELIC_USER_API_KEY, 'NEW_RELIC_USER_API_KEY (required for verify-signals hard gate)')

  if (stagingNewRelicAwsMode !== 'push_only') {
    missing.push('NEW_RELIC_STAGING_AWS_MODE (must be push_only in strict env)')
  }
  if (prodNewRelicAwsMode !== 'otlp_only') {
    missing.push('NEW_RELIC_PROD_AWS_MODE (must be otlp_only in strict env)')
  }

  if (stagingNewRelicAwsMode && stagingNewRelicAwsMode !== 'otlp_only') {
    requireValue(
      process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID,
      'NEW_RELIC_STAGING_AWS_ACCOUNT_ID',
    )
    requireValue(
      process.env.NEW_RELIC_STAGING_AWS_ROLE_ARN,
      'NEW_RELIC_STAGING_AWS_ROLE_ARN',
    )
  }
  if (prodNewRelicAwsMode && prodNewRelicAwsMode !== 'otlp_only') {
    requireValue(
      process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID,
      'NEW_RELIC_PROD_AWS_ACCOUNT_ID',
    )
    requireValue(
      process.env.NEW_RELIC_PROD_AWS_ROLE_ARN,
      'NEW_RELIC_PROD_AWS_ROLE_ARN',
    )
  }

  const exporter = (process.env.TRACING_EXPORTER || '').trim().toLowerCase()
  if (!exporter || exporter === 'none') {
    missing.push('TRACING_EXPORTER (must include otlp in strict env)')
  } else if (!(exporter.includes('otlp') || exporter.includes('both') || exporter.includes('all'))) {
    missing.push('TRACING_EXPORTER (must include otlp for New Relic span export)')
  }

  const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    ''
  const otlpHeaders =
    process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS ||
    process.env.OTEL_EXPORTER_OTLP_HEADERS ||
    ''
  const newRelicIngestKey = process.env.NEW_RELIC_INGEST_KEY || ''
  if (otlpEndpoint.includes('nr-data.net') && !otlpHeaders && !newRelicIngestKey) {
    missing.push('OTEL_EXPORTER_OTLP_HEADERS or NEW_RELIC_INGEST_KEY (required for New Relic OTLP)')
  }

  const logsEnabledDefault = runtimeEnv === 'prod'
  const logsEnabled = boolFromEnv(process.env.NEW_RELIC_LOGS_ENABLED, logsEnabledDefault)
  const awsMetricStreamEnabled = boolFromEnv(
    process.env.NEW_RELIC_AWS_METRIC_STREAM_ENABLED,
    runtimeEnv === 'staging',
  )
  const awsLogForwardingEnabled = boolFromEnv(
    process.env.NEW_RELIC_AWS_LOG_FORWARDING_ENABLED,
    false,
  )

  if (runtimeEnv === 'staging') {
    if (!logsEnabled) {
      missing.push('NEW_RELIC_LOGS_ENABLED (must be enabled in staging)')
    }
    if (awsLogForwardingEnabled) {
      missing.push('NEW_RELIC_AWS_LOG_FORWARDING_ENABLED (must be 0 in staging)')
    }
    if (awsMetricStreamEnabled) {
      const namespaces = normalizeNamespaces(process.env.NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES)
      if (!haveSameNamespaceSet(namespaces, REQUIRED_STAGING_METRIC_STREAM_NAMESPACES)) {
        missing.push(
          `NEW_RELIC_AWS_METRIC_STREAM_NAMESPACES (must be exactly ${REQUIRED_STAGING_METRIC_STREAM_NAMESPACES.join(',')})`,
        )
      }
    }
  }

  if (runtimeEnv === 'prod') {
    if (!logsEnabled) {
      missing.push('NEW_RELIC_LOGS_ENABLED (must be enabled in prod)')
    }
    if (awsMetricStreamEnabled) {
      missing.push('NEW_RELIC_AWS_METRIC_STREAM_ENABLED (must be 0 in prod)')
    }
    if (awsLogForwardingEnabled) {
      missing.push('NEW_RELIC_AWS_LOG_FORWARDING_ENABLED (must be 0 in prod)')
    }
  }

  if (process.env.CLOUDWATCH_METRICS_ENABLED === '0') {
    missing.push('CLOUDWATCH_METRICS_ENABLED (must not be 0)')
  }
}

if (missing.length > 0) {
  console.error(`Observability checks failed: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('✅ Observability checks passed')
