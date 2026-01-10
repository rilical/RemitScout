const isStrictEnv =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.env.STRICT_CONFIG === '1'

const missing: string[] = []

if (isStrictEnv) {
  if (!process.env.SENTRY_DSN) {
    missing.push('SENTRY_DSN')
  }

  const exporter = (process.env.TRACING_EXPORTER || '').toLowerCase()
  const hasTracing =
    Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
    (exporter !== '' && exporter !== 'none')
  if (!hasTracing) {
    missing.push('TRACING_EXPORTER or OTEL_EXPORTER_OTLP_ENDPOINT')
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
