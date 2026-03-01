export const ISSUEOPS_DOMAINS = [
  'provider_health',
  'queue',
  'api_latency',
  'freshness',
  'indices',
  'pulse',
  'exports',
  'infra_drift',
  'security',
  'other',
] as const

export type IssueOpsDomain = (typeof ISSUEOPS_DOMAINS)[number]

const domainSet = new Set<string>(ISSUEOPS_DOMAINS)

const normalizeToken = (value: unknown): string => {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const aliasToDomain: Record<string, IssueOpsDomain> = {
  provider_health: 'provider_health',
  provider: 'provider_health',
  provider_probe: 'provider_health',
  provider_status: 'provider_health',

  queue: 'queue',
  queues: 'queue',
  queue_backlog: 'queue',
  backlog: 'queue',
  dlq: 'queue',

  api_latency: 'api_latency',
  http_latency: 'api_latency',
  latency: 'api_latency',
  api: 'api_latency',

  freshness: 'freshness',
  freshness_slo: 'freshness',

  indices: 'indices',
  index: 'indices',
  teer: 'indices',
  rci: 'indices',
  rvi: 'indices',

  pulse: 'pulse',
  pulse_cache: 'pulse',

  exports: 'exports',
  export: 'exports',
  export_job: 'exports',

  infra_drift: 'infra_drift',
  infrastructure_drift: 'infra_drift',
  env_drift: 'infra_drift',
  drift: 'infra_drift',

  security: 'security',
  dast: 'security',
  vulnerability: 'security',

  other: 'other',
}

const hintPriority: Array<{ domain: IssueOpsDomain; tokens: string[] }> = [
  { domain: 'security', tokens: ['security', 'dast', 'vulnerability'] },
  { domain: 'infra_drift', tokens: ['infra_drift', 'infrastructure_drift', 'env_drift'] },
  { domain: 'exports', tokens: ['exports', 'export_job', 'export'] },
  { domain: 'indices', tokens: ['indices', 'teer', 'rci', 'rvi'] },
  { domain: 'pulse', tokens: ['pulse', 'pulse_cache'] },
  { domain: 'freshness', tokens: ['freshness', 'freshness_slo'] },
  { domain: 'queue', tokens: ['queue', 'backlog', 'dlq'] },
  { domain: 'api_latency', tokens: ['api_latency', 'http_latency', 'latency'] },
  { domain: 'provider_health', tokens: ['provider_health', 'provider_probe', 'provider'] },
]

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean)
  }
  const single = String(value ?? '').trim()
  return single ? [single] : []
}

const resolveDomainAlias = (value: unknown): IssueOpsDomain | null => {
  const token = normalizeToken(value)
  if (!token) return null
  if (domainSet.has(token)) return token as IssueOpsDomain
  return aliasToDomain[token] ?? null
}

const resolveHintedDomain = (parts: unknown[]): IssueOpsDomain | null => {
  const text = normalizeToken(parts.filter(Boolean).join(' '))
  if (!text) return null

  for (const hint of hintPriority) {
    if (hint.tokens.some((token) => text.includes(token))) {
      return hint.domain
    }
  }
  return null
}

export const classifyIssueOpsDomain = (input: {
  domain?: unknown
  signal_id?: unknown
  signal_sources?: unknown
  symptoms?: unknown
  queue_kind?: unknown
  target_url?: unknown
  provider_id?: unknown
}): IssueOpsDomain => {
  const explicit = resolveDomainAlias(input.domain)
  if (explicit) return explicit

  if (String(input.queue_kind ?? '').trim()) return 'queue'
  if (String(input.provider_id ?? '').trim()) return 'provider_health'
  if (String(input.target_url ?? '').trim()) return 'api_latency'

  const hinted = resolveHintedDomain([
    input.signal_id,
    ...toStringList(input.signal_sources),
    input.symptoms,
  ])

  return hinted ?? 'other'
}
