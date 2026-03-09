import '../../shared/load-env'
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs'
import { getQueueAgeSeconds, getQueueDLQ, getQueueDepth, getQueueStats } from '../../shared/sqs'
import { resolveSmokeApiBaseUrl } from './alerts-watchlists-smoke'
import { jsonFetch, maybeVerifySupabaseMfa, signInSupabase } from './auth-surface-smoke'
import {
  isAdminMfaRequiredResponse,
  readSmokeUserMfaCode,
  resolveAdminSmokeAuthToken,
} from './admin-surface-smoke'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type QueueKind =
  | 'quote_refresh'
  | 'fx_rate_refresh'
  | 'ingest_fanout'
  | 'ingest_fanout_tier2'
  | 'exports'
  | 'notifications'
  | 'ops_alerts'
  | 'gold_live'

type AdminExchangeResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  code?: string
  message?: string
}

export const resolveWorkerResilienceAdminAuth = (
  status: number,
  body: AdminExchangeResponse | null | undefined,
  supabaseToken: string,
) => {
  const auth = resolveAdminSmokeAuthToken(status, body, supabaseToken)
  return {
    ...auth,
    ok: status < 400 && Boolean(auth.token),
    note: `status=${status}${auth.source === 'supabase_fallback' ? ' fallback=supabase_jwt' : ''}`,
  }
}

export const resolveQueueLookupIssue = (
  error: unknown,
): 'nonexistent_queue' | 'access_denied' | null => {
  const name = typeof error === 'object' && error && 'name' in error
    ? String(error.name || '')
    : ''
  const message = typeof error === 'object' && error && 'message' in error
    ? String(error.message || '')
    : ''
  const haystack = `${name} ${message}`.toLowerCase()

  if (
    haystack.includes('nonexistentqueue')
    || haystack.includes('queuedoesnotexist')
    || haystack.includes('queue does not exist')
  ) {
    return 'nonexistent_queue'
  }

  if (
    haystack.includes('accessdenied')
    || haystack.includes('not authorized to perform')
    || haystack.includes('authorizationerror')
  ) {
    return 'access_denied'
  }

  return null
}

type OpsServiceHealthResponse = {
  source?: string
  unavailable?: boolean
  message?: string | null
  services?: Array<{
    service_id?: string
    display_name?: string
    status?: 'healthy' | 'degraded' | 'offline' | 'unknown'
    message?: string | null
  }>
}

type ObserverSummaryResponse = {
  success?: boolean
  gold?: {
    latest_date?: string | null
  }
  queues?: {
    quote_refresh?: Array<{ status?: string; count?: number }>
    fx_rate_refresh?: Array<{ status?: string; count?: number }>
    window_hours?: number
  }
}

const ALL_QUEUE_KINDS: QueueKind[] = [
  'quote_refresh',
  'fx_rate_refresh',
  'ingest_fanout',
  'ingest_fanout_tier2',
  'exports',
  'notifications',
  'ops_alerts',
  'gold_live',
]

const CRITICAL_SERVICE_IDS = [
  'plane-b-ingest',
  'b2c-refresh',
  'fx-rate-refresh',
  'ingest-fanout-tier-1',
  'ingest-fanout-tier-2',
  'gold-live',
  'notifications',
  'ops-alerts',
  'alert-evaluation',
  'export-worker',
  'agent-orchestrator',
  'stress-responder',
] as const

const sqs = new SQSClient({})

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const normalizeEnvName = (value: string): string => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return 'staging'
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const readBooleanEnv = (key: string, fallback = false): boolean => {
  const value = process.env[key]
  if (!value || !value.trim()) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const isQueueKind = (value: string): value is QueueKind =>
  ALL_QUEUE_KINDS.includes(value as QueueKind)

const readQueueKinds = (): QueueKind[] => {
  const raw = process.env.SMOKE_QUEUE_KINDS?.trim() || ''
  if (!raw) return ALL_QUEUE_KINDS
  return raw
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(isQueueKind)
}

const getQueueName = (envName: string, kind: QueueKind): string => {
  const prefix = `remit-scout-${envName}-`
  switch (kind) {
    case 'quote_refresh': return `${prefix}quote-refresh`
    case 'fx_rate_refresh': return `${prefix}fx-rate-refresh`
    case 'ingest_fanout': return `${prefix}ingest-fanout`
    case 'ingest_fanout_tier2': return `${prefix}ingest-fanout-tier2`
    case 'exports': return `${prefix}export-job`
    case 'notifications': return `${prefix}notifications`
    case 'ops_alerts': return `${prefix}ops-alerts`
    case 'gold_live': return `${prefix}gold-live`
  }
}

const normalizeQueueUrlEnv = (value: string | undefined): string => {
  const normalized = String(value || '').trim()
  return normalized && normalized.toLowerCase() !== 'null' ? normalized : ''
}

export const resolveQueueUrlFromEnv = (kind: QueueKind): string => {
  switch (kind) {
    case 'quote_refresh':
      return normalizeQueueUrlEnv(process.env.QUOTE_REFRESH_QUEUE_URL)
    case 'fx_rate_refresh':
      return normalizeQueueUrlEnv(process.env.FX_RATE_REFRESH_QUEUE_URL)
    case 'ingest_fanout':
      return normalizeQueueUrlEnv(process.env.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL)
        || normalizeQueueUrlEnv(process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL)
    case 'ingest_fanout_tier2':
      return normalizeQueueUrlEnv(process.env.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL)
    case 'exports':
      return normalizeQueueUrlEnv(process.env.EXPORT_JOB_QUEUE_URL)
    case 'notifications':
      return normalizeQueueUrlEnv(process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL)
    case 'ops_alerts':
      return normalizeQueueUrlEnv(process.env.PLANE_B_OPS_ALERT_QUEUE_URL)
    case 'gold_live':
      return normalizeQueueUrlEnv(process.env.GOLD_LIVE_QUEUE_URL)
  }
}

const resolveQueueUrl = async (envName: string, kind: QueueKind) => {
  const queueName = getQueueName(envName, kind)
  const queueUrlFromEnv = resolveQueueUrlFromEnv(kind)
  if (queueUrlFromEnv) {
    return {
      queueName,
      queueUrl: queueUrlFromEnv,
      issue: null,
    }
  }
  try {
    const response = await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }))
    const queueUrl = String(response.QueueUrl || '').trim()
    if (!queueUrl) {
      throw new Error(`Queue URL not found for ${queueName}`)
    }
    return { queueName, queueUrl, issue: null }
  } catch (error) {
    const issue = resolveQueueLookupIssue(error)
    if (issue) {
      return {
        queueName,
        queueUrl: null,
        issue,
      }
    }
    throw error
  }
}

const queueAgeThresholdSeconds = (
  envName: string,
  kind: QueueKind,
): number | null => {
  if (kind === 'quote_refresh' || kind === 'fx_rate_refresh') {
    return envName === 'prod' ? 15 * 60 : 30 * 60
  }
  if (kind === 'ingest_fanout_tier2') {
    return envName === 'prod' ? 60 * 60 : 90 * 60
  }
  return null
}

const exchangeAdminSession = async (
  apiBase: string,
  supabaseToken: string,
): Promise<{ status: number; body: AdminExchangeResponse }> => jsonFetch<AdminExchangeResponse>(
  `${apiBase}/sessions/admin/exchange`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  },
)

const main = async () => {
  const smokeBaseUrl = mustEnv('SMOKE_BASE_URL')
  const supabaseUrl = mustEnv('SUPABASE_URL')
  const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || ''
  if (!supabasePublishableKey) {
    throw new Error('Missing SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)')
  }

  const smokeUserEmail = mustEnv('SMOKE_USER_EMAIL')
  const smokeUserPassword = mustEnv('SMOKE_USER_PASSWORD')
  const expectOpsActive = readBooleanEnv('SMOKE_EXPECT_OPS_ACTIVE', false)
  const apiBase = resolveSmokeApiBaseUrl(smokeBaseUrl)
  const envName = normalizeEnvName(
    process.env.SMOKE_ENV_NAME
      || process.env.ENVIRONMENT
      || process.env.NODE_ENV
      || 'staging',
  )
  const queueKinds = readQueueKinds()
  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)

  let supabaseToken = await signInSupabase(
    supabaseUrl,
    supabasePublishableKey,
    smokeUserEmail,
    smokeUserPassword,
  )

  const mfa = await maybeVerifySupabaseMfa(supabaseUrl, supabasePublishableKey, supabaseToken)
  supabaseToken = mfa.accessToken

  let adminExchange = await exchangeAdminSession(apiBase, supabaseToken)
  if (isAdminMfaRequiredResponse(adminExchange.status, adminExchange.body) && !mfa.factorVerified) {
    if (!readSmokeUserMfaCode()) {
      throw new Error('Admin exchange requires MFA but SMOKE_USER_MFA_CODE is missing.')
    }
    const verified = await maybeVerifySupabaseMfa(supabaseUrl, supabasePublishableKey, supabaseToken)
    supabaseToken = verified.accessToken
    adminExchange = await exchangeAdminSession(apiBase, supabaseToken)
  }

  const adminAuth = resolveWorkerResilienceAdminAuth(
    adminExchange.status,
    adminExchange.body,
    supabaseToken,
  )
  const adminToken = adminAuth.token
  const fallbackAuthSource = adminAuth.source

  record({
    name: 'POST /sessions/admin/exchange',
    ok: adminAuth.ok,
    note: adminAuth.note,
  })

  if (!adminToken) {
    const failures = checks.filter((check) => !check.ok)
    for (const check of checks) {
      console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
    }
    console.error(`\nWorker resilience smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` }

  const serviceHealth = await jsonFetch<OpsServiceHealthResponse>(`${apiBase}/ops/services/health`, {
    headers: adminHeaders,
  })
  const services = Array.isArray(serviceHealth.body?.services) ? serviceHealth.body.services : []
  const hasServiceHealth = services.length > 0
  record({
    name: 'GET /ops/services/health',
    ok: serviceHealth.status < 400 && hasServiceHealth,
    note: `status=${serviceHealth.status} services=${services.length} source=${String(serviceHealth.body?.source || '')}${fallbackAuthSource === 'supabase_fallback' ? ' fallback=supabase_jwt' : ''}`,
  })

  const pauseState = services.find((service) => service.service_id === 'ops-pause-state') ?? null
  if (hasServiceHealth) {
    record({
      name: 'Ops pause state matches expectation',
      ok: expectOpsActive ? pauseState?.status === 'healthy' : Boolean(pauseState),
      note: `status=${String(pauseState?.status || '')} message=${String(pauseState?.message || '')}`,
    })

    for (const serviceId of CRITICAL_SERVICE_IDS) {
      const service = services.find((entry) => entry.service_id === serviceId) ?? null
      record({
        name: `Service ${serviceId} registered`,
        ok: Boolean(service),
        note: `status=${String(service?.status || '')}`,
      })
      if (expectOpsActive) {
        record({
          name: `Service ${serviceId} healthy`,
          ok: service?.status === 'healthy',
          note: `status=${String(service?.status || '')} message=${String(service?.message || '')}`,
        })
      }
    }
  } else if (fallbackAuthSource === 'supabase_fallback') {
    record({
      name: 'Ops service detail remains unavailable under Supabase fallback',
      ok: false,
      note: 'fallback=supabase_jwt',
    })
  }

  const observer = await jsonFetch<ObserverSummaryResponse>(`${apiBase}/ops/observer/summary?limit=25&windowHours=24`, {
    headers: adminHeaders,
  })
  const observerHealthy = observer.status < 400 && observer.body?.success === true
  const observerGoldPresent = Boolean(observer.body?.gold?.latest_date)
  record({
    name: 'GET /ops/observer/summary',
    ok: observerHealthy,
    note: `status=${observer.status} gold_latest=${String(observer.body?.gold?.latest_date || '')}${fallbackAuthSource === 'supabase_fallback' ? ' fallback=supabase_jwt' : ''}`,
  })

  if (expectOpsActive) {
    record({
      name: 'Observer gold export date present',
      ok: observerGoldPresent,
      note: `latest_date=${String(observer.body?.gold?.latest_date || '')}${fallbackAuthSource === 'supabase_fallback' ? ' fallback=supabase_jwt' : ''}`,
    })
  }

  for (const kind of queueKinds) {
    const { queueName, queueUrl, issue } = await resolveQueueUrl(envName, kind)
    if (!queueUrl) {
      record({
        name: `Queue ${kind} direct lookup unavailable`,
        ok: !expectOpsActive,
        note: `queue=${queueName} reason=${issue}`,
      })
      continue
    }
    const stats = await getQueueStats(queueUrl)
    const ageSeconds = await getQueueAgeSeconds(queueUrl)
    const dlqUrl = await getQueueDLQ(queueUrl)
    const dlqDepth = dlqUrl ? await getQueueDepth(dlqUrl) : 0
    const threshold = queueAgeThresholdSeconds(envName, kind)

    record({
      name: `Queue ${kind} reachable`,
      ok: true,
      note: `visible=${stats.visible} in_flight=${stats.inFlight} delayed=${stats.delayed} total=${stats.total}`,
    })

    if (expectOpsActive) {
      record({
        name: `Queue ${kind} DLQ empty`,
        ok: dlqDepth === 0,
        note: `queue=${queueName} dlq_depth=${dlqDepth}`,
      })

      if (threshold !== null) {
        record({
          name: `Queue ${kind} age within threshold`,
          ok: ageSeconds < threshold,
          note: `age_seconds=${Math.round(ageSeconds)} threshold_seconds=${threshold}`,
        })
      }
    }
  }

  const failures = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nWorker resilience smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nWorker resilience smoke passed.')
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      'Worker resilience smoke crashed:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  })
}
