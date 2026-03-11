import dns from 'node:dns'
import { lookup } from 'node:dns/promises'
import net from 'node:net'

type ConnectionHostSource = 'host' | 'hostname' | 'hostaddr'

type ConnectionHostCandidate = {
  source: ConnectionHostSource
  value: string
}

export type Ipv4RewriteResult = {
  connectionString: string
  originalHost: string
  resolvedHost: string
  source: ConnectionHostSource
}

type ResolveIpv4Address = (hostname: string) => Promise<string | null>

type LoggerLike = {
  info?: (event: string, payload?: Record<string, unknown>) => void
  warn?: (event: string, payload?: Record<string, unknown>) => void
}

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const HOSTLESS_SENTINEL = '__remit_scout_hostless__'
const SUPABASE_DIRECT_HOST_PATTERN = /^db\.([a-z0-9]+)\.supabase\.co$/i

const normalizeHostCandidate = (value: string | null | undefined) =>
  (value || '').trim().replace(/^\[|\]$/g, '')

const normalizeRegion = (value: string | null | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) return ''
  return normalized.replace(/_/g, '-')
}

const parseConnectionString = (connectionString: string) => {
  try {
    return new URL(connectionString)
  } catch {
    if (!connectionString.includes('@/')) {
      throw new TypeError('Invalid URL')
    }
    return new URL(connectionString.replace('@/', `@${HOSTLESS_SENTINEL}/`))
  }
}

const collectConnectionHostCandidates = (parsed: URL): ConnectionHostCandidate[] => {
  const candidates: ConnectionHostCandidate[] = [
    { source: 'host', value: normalizeHostCandidate(parsed.searchParams.get('host')) },
    { source: 'hostname', value: normalizeHostCandidate(parsed.hostname) },
    { source: 'hostaddr', value: normalizeHostCandidate(parsed.searchParams.get('hostaddr')) },
  ]
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    if (!candidate.value || candidate.value === HOSTLESS_SENTINEL) return false
    const dedupeKey = `${candidate.source}:${candidate.value.toLowerCase()}`
    if (seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  })
}

const applyResolvedHost = (parsed: URL, resolvedHost: string) => {
  if (parsed.searchParams.has('host')) {
    parsed.searchParams.set('host', resolvedHost)
  }
  if (parsed.searchParams.has('hostaddr')) {
    parsed.searchParams.set('hostaddr', resolvedHost)
  }
  if (parsed.hostname) {
    parsed.hostname = resolvedHost
  }
  return parsed.toString()
}

const deriveSupabaseSessionPoolerHost = () => {
  const explicitHost = normalizeHostCandidate(process.env.SUPABASE_SESSION_POOLER_HOST)
  if (explicitHost) return explicitHost

  const region = normalizeRegion(
    process.env.SUPABASE_POOLER_REGION
    || process.env.AWS_REGION
    || process.env.AWS_DEFAULT_REGION,
  )
  if (!region) return ''

  return `aws-0-${region}.pooler.supabase.com`
}

const rewriteSupabaseConnectionStringForPooler = (
  connectionString: string,
  candidate: ConnectionHostCandidate,
): Ipv4RewriteResult | null => {
  const match = candidate.value.match(SUPABASE_DIRECT_HOST_PATTERN)
  if (!match) return null

  const poolerHost = deriveSupabaseSessionPoolerHost()
  if (!poolerHost) return null

  const projectRef = match[1]
  const nextParsed = parseConnectionString(connectionString)
  const authUsername = decodeURIComponent(nextParsed.username || '')
  const queryUsername = (nextParsed.searchParams.get('user') || '').trim()
  const baseUsername = authUsername || queryUsername
  if (baseUsername && !baseUsername.includes('.')) {
    const poolerUsername = `${baseUsername}.${projectRef}`
    nextParsed.username = poolerUsername
    nextParsed.searchParams.set('user', poolerUsername)
  } else if (queryUsername) {
    if (!authUsername) {
      nextParsed.username = queryUsername
    }
    nextParsed.searchParams.set('user', queryUsername)
  }
  nextParsed.port = (process.env.SUPABASE_SESSION_POOLER_PORT || '5432').trim() || '5432'

  return {
    connectionString: applyResolvedHost(nextParsed, poolerHost),
    originalHost: candidate.value,
    resolvedHost: poolerHost,
    source: candidate.source,
  }
}

const defaultResolveIpv4Address: ResolveIpv4Address = async (hostname) => {
  const resolved = await lookup(hostname, { family: 4 })
  return resolved.address || null
}

export const shouldForceIpv4DbConnection = () => {
  const explicitFlag = (process.env.DB_FORCE_IPV4 || '').trim().toLowerCase()
  if (explicitFlag) {
    return TRUE_VALUES.has(explicitFlag)
  }
  return process.env.GITHUB_ACTIONS === 'true'
}

export const rewriteDbConnectionStringForIpv4 = async (
  connectionString: string,
  resolveIpv4Address: ResolveIpv4Address = defaultResolveIpv4Address,
): Promise<Ipv4RewriteResult | null> => {
  if (!connectionString) {
    return null
  }

  const parsed = parseConnectionString(connectionString)
  const candidates = collectConnectionHostCandidates(parsed)

  for (const candidate of candidates) {
    if (candidate.value === 'localhost') {
      return null
    }

    if (net.isIP(candidate.value) === 4) {
      const rewritten = applyResolvedHost(parsed, candidate.value)
      if (rewritten === connectionString) {
        return null
      }
      return {
        connectionString: rewritten,
        originalHost: candidate.value,
        resolvedHost: candidate.value,
        source: candidate.source,
      }
    }

    if (net.isIP(candidate.value) === 6) {
      continue
    }

    try {
      const resolvedHost = await resolveIpv4Address(candidate.value)
      if (resolvedHost) {
        return {
          connectionString: applyResolvedHost(parsed, resolvedHost),
          originalHost: candidate.value,
          resolvedHost,
          source: candidate.source,
        }
      }
    } catch {
      const supabaseFallback = rewriteSupabaseConnectionStringForPooler(connectionString, candidate)
      if (supabaseFallback) {
        return supabaseFallback
      }
      continue
    }
    const supabaseFallback = rewriteSupabaseConnectionStringForPooler(connectionString, candidate)
    if (supabaseFallback) {
      return supabaseFallback
    }
  }

  return null
}

export const resolveDbConnectionStringForIpv4 = async (
  connectionString: string,
  logger?: LoggerLike,
): Promise<string> => {
  if (!connectionString || !shouldForceIpv4DbConnection()) {
    return connectionString
  }

  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {
    // Ignore on runtimes that do not support result-order overrides.
  }

  try {
    const rewritten = await rewriteDbConnectionStringForIpv4(connectionString)
    if (!rewritten) {
      return connectionString
    }

    logger?.info?.('db_ipv4_resolved', {
      originalHost: rewritten.originalHost,
      resolvedHost: rewritten.resolvedHost,
      source: rewritten.source,
    })
    return rewritten.connectionString
  } catch (error) {
    logger?.warn?.('db_ipv4_resolution_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return connectionString
  }
}
