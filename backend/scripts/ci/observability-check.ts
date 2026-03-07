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

const normalizeNewRelicAwsMode = (value: string | undefined, fallback: 'push_pull' | 'push_only' | 'otlp_only') => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  missing.push(`Unsupported New Relic AWS mode: ${value}`)
  return fallback
}

if (isStrictEnv) {
  const newRelicAwsMode = runtimeEnv === 'staging'
    ? normalizeNewRelicAwsMode(process.env.NEW_RELIC_STAGING_AWS_MODE, 'push_pull')
    : runtimeEnv === 'prod'
      ? normalizeNewRelicAwsMode(process.env.NEW_RELIC_PROD_AWS_MODE, 'push_pull')
      : 'push_pull'

  requireValue(process.env.SENTRY_DSN, 'SENTRY_DSN')
  requireValue(process.env.NEW_RELIC_ACCOUNT_ID, 'NEW_RELIC_ACCOUNT_ID')
  requireValue(process.env.NEW_RELIC_REGION, 'NEW_RELIC_REGION')
  requireValue(process.env.NEW_RELIC_INGEST_KEY, 'NEW_RELIC_INGEST_KEY')
  requireValue(process.env.NEW_RELIC_USER_API_KEY, 'NEW_RELIC_USER_API_KEY (required for verify-signals hard gate)')

  if (runtimeEnv === 'staging' && newRelicAwsMode !== 'otlp_only') {
    requireValue(
      process.env.NEW_RELIC_STAGING_AWS_ACCOUNT_ID,
      'NEW_RELIC_STAGING_AWS_ACCOUNT_ID',
    )
  } else if (runtimeEnv === 'prod' && newRelicAwsMode !== 'otlp_only') {
    requireValue(
      process.env.NEW_RELIC_PROD_AWS_ACCOUNT_ID,
      'NEW_RELIC_PROD_AWS_ACCOUNT_ID',
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

  const logsEnabledDefault = runtimeEnv === 'staging' || runtimeEnv === 'prod'
  const logsEnabled = boolFromEnv(process.env.NEW_RELIC_LOGS_ENABLED, logsEnabledDefault)
  if (!logsEnabled) {
    missing.push('NEW_RELIC_LOGS_ENABLED (must not be disabled in strict env)')
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
