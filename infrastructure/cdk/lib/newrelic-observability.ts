const trim = (value?: string): string => value?.trim() || ''

const unwrapLicenseKey = (value?: string): string => {
  const raw = trim(value)
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed === 'object'
      && parsed !== null
      && 'LicenseKey' in parsed
      && typeof parsed.LicenseKey === 'string'
    ) {
      return parsed.LicenseKey.trim()
    }
  } catch {
    // Fall through to the raw value when the secret is already plain text.
  }

  return raw
}

const sanitizeOtlpHeaders = (rawHeaders: string, fallbackIngestKey: string): string => {
  const trimmed = trim(rawHeaders)
  if (!trimmed) return ''

  const pairs = trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (pairs.length === 0) return ''

  const sanitized = pairs.map((entry) => {
    const separatorIndex = entry.indexOf('=')
    if (separatorIndex <= 0) return entry

    const key = entry.slice(0, separatorIndex).trim()
    let value = entry.slice(separatorIndex + 1).trim()
    if (!key || !value) return entry

    if (key.toLowerCase() === 'api-key') {
      value = unwrapLicenseKey(value) || fallbackIngestKey || value
    }

    return `${key}=${value}`
  })

  return sanitized.join(',')
}

export const normalizeEnvName = (value: string): string => {
  const normalized = trim(value).toLowerCase()
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

export const isStagingOrProd = (envName: string): boolean => {
  const normalized = normalizeEnvName(envName)
  return normalized === 'staging' || normalized === 'prod'
}

export const getNewRelicTraceEndpoint = (envName: string): string | undefined => {
  if (!isStagingOrProd(envName)) return undefined
  const region = trim(process.env.NEW_RELIC_REGION).toUpperCase()
  return region === 'EU'
    ? 'https://otlp.eu01.nr-data.net/v1/traces'
    : 'https://otlp.nr-data.net/v1/traces'
}

export const resolveCloudWatchMetricsEnabled = (envName: string): string => {
  const explicit = trim(process.env.CLOUDWATCH_METRICS_ENABLED)
  if (!isStagingOrProd(envName)) {
    return explicit || '1'
  }

  // Staging/prod observability must stay on. Ignore accidental opt-outs from deploy env.
  return explicit === '0' ? '1' : (explicit || '1')
}

type TracingEnvParams = {
  envName: string
  defaultExporter?: string
  defaultEndpoint?: string
  preferDefaultEndpoint?: boolean
}

export const resolveTracingEnv = ({
  envName,
  defaultExporter = 'xray',
  defaultEndpoint,
  preferDefaultEndpoint = false,
}: TracingEnvParams): Record<string, string> => {
  const explicitExporter = trim(process.env.TRACING_EXPORTER)
  const tracingExporter = explicitExporter || (isStagingOrProd(envName) ? 'otlp' : defaultExporter)

  const explicitEndpoint =
    trim(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) ||
    trim(process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
  const inferredEndpoint = preferDefaultEndpoint
    ? (defaultEndpoint || getNewRelicTraceEndpoint(envName) || '')
    : (getNewRelicTraceEndpoint(envName) || defaultEndpoint || '')
  const otlpEndpoint = explicitEndpoint || inferredEndpoint

  const newRelicIngestKey = unwrapLicenseKey(process.env.NEW_RELIC_INGEST_KEY)
  const explicitHeaders =
    sanitizeOtlpHeaders(
      trim(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS) ||
        trim(process.env.OTEL_EXPORTER_OTLP_HEADERS),
      newRelicIngestKey,
    )
  const derivedHeaders =
    !explicitHeaders && newRelicIngestKey && otlpEndpoint.includes('nr-data.net')
      ? `api-key=${newRelicIngestKey}`
      : ''
  const otlpHeaders = explicitHeaders || derivedHeaders

  const tracingEnv: Record<string, string> = {
    TRACING_EXPORTER: tracingExporter,
  }

  if (otlpEndpoint) {
    tracingEnv.OTEL_EXPORTER_OTLP_ENDPOINT = otlpEndpoint
  }
  if (otlpHeaders) {
    tracingEnv.OTEL_EXPORTER_OTLP_HEADERS = otlpHeaders
  }
  if (newRelicIngestKey) {
    tracingEnv.NEW_RELIC_INGEST_KEY = newRelicIngestKey
  }

  return tracingEnv
}
