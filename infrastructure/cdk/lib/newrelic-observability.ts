const trim = (value?: string): string => value?.trim() || ''

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

  const explicitHeaders =
    trim(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS) ||
    trim(process.env.OTEL_EXPORTER_OTLP_HEADERS)
  const newRelicIngestKey = trim(process.env.NEW_RELIC_INGEST_KEY)
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
