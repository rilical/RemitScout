import '../../shared/load-env'
import {
  resolveSmokeApiBaseUrl,
  resolveSmokeRootBaseUrl,
} from './alerts-watchlists-smoke'
import { jsonFetch } from './json-fetch'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type JsonRecord = Record<string, unknown>

type SupabasePasswordSignInResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type SupabaseUserFactor = {
  id?: string
  factor_type?: string
  status?: string
}

type SupabaseUserResponse = {
  id?: string
  email?: string
  factors?: SupabaseUserFactor[]
  error?: string
  message?: string
}

type SupabaseMfaChallengeResponse = {
  id?: string
  error?: string
  message?: string
}

type SupabaseMfaVerifyResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  token_type?: string
  error?: string
  error_description?: string
  message?: string
}

type AdminExchangeResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  code?: string
  message?: string
}

type ObserverSummaryResponse = {
  success?: boolean
  error?: string
  message?: string
}

type ModuleRegistryResponse = {
  modules?: unknown[]
  updatedAt?: string | null
  error?: string
  message?: string
}

type DiscoveryScansResponse = {
  scans?: unknown[]
  error?: string
  message?: string
}

type DiscoveryCertificationRunsResponse = {
  runs?: unknown[]
  error?: string
  message?: string
}

type AuditLogsResponse = {
  logs?: unknown[]
  error?: string
  message?: string
}

type AuditLogDetailResponse = {
  event_id?: string
  log?: {
    event_id?: string
  }
  error?: string
  message?: string
}

type FeatureFlagsEffectiveResponse = {
  generated_at?: string
  flags?: unknown[]
  definitions?: unknown[]
  error?: string
  message?: string
}

type AdminFeatureFlagsResponse = {
  flags?: unknown[]
  runtime?: {
    generated_at?: string
    flags?: unknown[]
  }
  definitions?: unknown[]
  error?: string
  message?: string
}

type InstitutionalClientsResponse = {
  clients?: unknown[]
  launch_gate?: {
    blocked?: boolean
  }
  workflow?: {
    allowed_prelaunch_actions?: unknown[]
  }
  error?: string
  message?: string
}

type AdsAdminResponse = {
  runtime?: {
    runtime_enabled?: boolean
    mode?: string
  }
  summary?: {
    total?: number
  }
  ads?: unknown[]
  error?: string
  message?: string
}

type AdsPreviewResponse = {
  runtime?: {
    runtime_enabled?: boolean
    mode?: string
  }
  eligible_count?: number
  reason?: string
  ad?: unknown
  error?: string
  message?: string
}

type AnalyticsCorridorsResponse = {
  corridors?: unknown[]
  error?: string
  message?: string
}

type AnalyticsSessionsResponse = {
  total_sessions?: number
  unique_users?: number
  error?: string
  message?: string
}

type GoldExportsResponse = {
  success?: boolean
  rows?: unknown[]
  meta?: {
    date?: string | null
  }
  error?: string
  message?: string
}

type AdminPlanMutationResponse = {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
  result?: unknown
  plan?: unknown
  user?: {
    email?: string | null
    planCode?: string | null
    plan_code?: string | null
    planStatus?: string | null
    plan_status?: string | null
    status?: string | null
  }
  planCode?: string | null
  plan_code?: string | null
  planStatus?: string | null
  plan_status?: string | null
  status?: string | null
}

type AdminPlansListResponse = {
  users?: unknown[]
  items?: unknown[]
  plans?: unknown[]
  rows?: unknown[]
  error?: string
  message?: string
}

export type AdminSmokeConfig = {
  targetEmail: string
  grantNotes: string
  revokeReason: string
}

export const readAdminSmokeConfig = (
  env: NodeJS.ProcessEnv = process.env,
): AdminSmokeConfig => ({
  targetEmail: env.ADMIN_SMOKE_TARGET_EMAIL?.trim().toLowerCase() || 'support@remit-scout.com',
  grantNotes: env.ADMIN_SMOKE_GRANT_NOTES?.trim() || 'staging_admin_surface_smoke',
  revokeReason: env.ADMIN_SMOKE_REVOKE_REASON?.trim() || 'staging_admin_surface_smoke_reset',
})

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readNestedValue = (
  value: unknown,
  path: readonly string[],
): unknown => {
  let current: unknown = value
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

const readNestedString = (
  value: unknown,
  path: readonly string[],
): string | null => {
  const candidate = readNestedValue(value, path)
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : null
}

const hasArrayAtPath = (
  value: unknown,
  path: readonly string[],
): boolean => Array.isArray(readNestedValue(value, path))

const hasNumberAtPath = (
  value: unknown,
  path: readonly string[],
): boolean => {
  const candidate = readNestedValue(value, path)
  return typeof candidate === 'number' && Number.isFinite(candidate)
}

const hasObjectAtPath = (
  value: unknown,
  path: readonly string[],
): boolean => isRecord(readNestedValue(value, path))

const hasStringAtPath = (
  value: unknown,
  path: readonly string[],
): boolean => readNestedString(value, path) !== null

const hasNoRouteError = (value: unknown): boolean => !hasStringAtPath(value, ['error'])

const describeBodyShape = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `shape=array length=${value.length}`
  }
  if (isRecord(value)) {
    const keys = Object.keys(value).slice(0, 8)
    return `shape=object keys=${keys.join(',') || 'none'}`
  }
  return `shape=${typeof value}`
}

export const resolvePlanSnapshot = (
  value: unknown,
): { email: string | null; planCode: string | null; status: string | null } => {
  const candidates: unknown[] = [value]
  if (isRecord(value)) {
    candidates.push(value.user, value.plan, value.data, value.result)
    if (isRecord(value.data)) {
      candidates.push(value.data.user, value.data.plan)
    }
    if (isRecord(value.result)) {
      candidates.push(value.result.user, value.result.plan)
    }
  }

  let email: string | null = null
  let planCode: string | null = null
  let status: string | null = null

  for (const candidate of candidates) {
    if (!email) {
      email =
        readNestedString(candidate, ['email']) ||
        readNestedString(candidate, ['user_email'])
    }
    if (!planCode) {
      planCode =
        readNestedString(candidate, ['plan_code']) ||
        readNestedString(candidate, ['planCode'])
    }
    if (!status) {
      status =
        readNestedString(candidate, ['plan_status']) ||
        readNestedString(candidate, ['planStatus']) ||
        readNestedString(candidate, ['status'])
    }
  }

  return { email, planCode, status }
}

export const findPlanForEmail = (
  body: AdminPlansListResponse,
  email: string,
) => {
  const normalized = email.trim().toLowerCase()
  const entries = [
    body.users,
    body.items,
    body.plans,
    body.rows,
  ].find(Array.isArray) ?? []

  return entries.find((entry) => resolvePlanSnapshot(entry).email?.trim().toLowerCase() === normalized) ?? null
}

export const resolveAuditLogEventId = (
  body: AuditLogDetailResponse | unknown,
): string | null =>
  readNestedString(body, ['event_id']) || readNestedString(body, ['log', 'event_id'])

export const readSmokeUserMfaCode = (
  env: NodeJS.ProcessEnv = process.env,
): string => env.SMOKE_USER_MFA_CODE?.trim() || env.E2E_AUTH_MFA_CODE?.trim() || ''

export const readExpectedAdminMfa = (
  env: NodeJS.ProcessEnv = process.env,
): boolean => {
  const raw = env.SMOKE_EXPECT_ADMIN_MFA?.trim().toLowerCase()
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false

  const runtime = (
    env.ENVIRONMENT ||
    env.ENV_NAME ||
    env.NODE_ENV ||
    ''
  ).trim().toLowerCase()

  return runtime === 'staging' || runtime === 'prod' || runtime === 'production'
}

export const readIncludePageSurfaceChecks = (
  env: NodeJS.ProcessEnv = process.env,
): boolean => {
  const raw = env.SMOKE_INCLUDE_PAGE_SURFACES?.trim().toLowerCase()
  if (!raw) return true
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false
  throw new Error(`Invalid boolean value for SMOKE_INCLUDE_PAGE_SURFACES: ${env.SMOKE_INCLUDE_PAGE_SURFACES}`)
}

export const findVerifiedTotpFactor = (
  body: SupabaseUserResponse,
): SupabaseUserFactor | null => body.factors?.find((factor) =>
  factor.factor_type === 'totp' && factor.status === 'verified',
) ?? null

export const hasTotpMfaAmr = (accessToken: string): boolean => {
  const [, payload = ''] = accessToken.split('.')
  if (!payload) return false

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const parsed = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
      amr?: Array<{ method?: string; mfa?: boolean }>
    }
    const amr = Array.isArray(parsed?.amr) ? parsed.amr : []
    return amr.some((entry) => entry?.mfa === true || entry?.method === 'totp')
  }
  catch {
    return false
  }
}

export const isAdminMfaRequiredResponse = (
  status: number,
  body: AdminExchangeResponse | null | undefined,
): boolean => status === 403 && (
  body?.error === 'mfa_required' ||
  body?.code === 'mfa_required'
)

export const resolveAdminSmokeAuthToken = (
  status: number,
  body: AdminExchangeResponse | null | undefined,
  supabaseAccessToken: string,
): { token: string; source: 'admin_exchange' | 'supabase_fallback' | 'none' } => {
  const exchangeToken = typeof body?.access_token === 'string' ? body.access_token.trim() : ''
  if (status < 400 && exchangeToken.length > 0) {
    return { token: exchangeToken, source: 'admin_exchange' }
  }
  if (status < 400 && supabaseAccessToken.trim().length > 0) {
    return { token: supabaseAccessToken.trim(), source: 'supabase_fallback' }
  }
  return { token: '', source: 'none' }
}

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const buildSupabaseHeaders = (apiKey: string, accessToken?: string): HeadersInit => ({
  apikey: apiKey,
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  'Content-Type': 'application/json',
})

const maybeVerifySupabaseMfa = async (
  supabaseUrl: string,
  apiKey: string,
  accessToken: string,
): Promise<string> => {
  if (hasTotpMfaAmr(accessToken)) {
    return accessToken
  }

  const { status: userStatus, body: userBody } = await jsonFetch<SupabaseUserResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
    {
      headers: buildSupabaseHeaders(apiKey, accessToken),
    },
  )

  if (userStatus >= 400) {
    throw new Error(`Supabase getUser failed status=${userStatus} body=${JSON.stringify(userBody)}`)
  }

  const verifiedTotpFactor = findVerifiedTotpFactor(userBody)
  if (!verifiedTotpFactor?.id) {
    return accessToken
  }

  const mfaCode = readSmokeUserMfaCode()
  if (!mfaCode) {
    throw new Error('Missing SMOKE_USER_MFA_CODE for smoke user with verified TOTP MFA factor.')
  }

  const { status: challengeStatus, body: challengeBody } = await jsonFetch<SupabaseMfaChallengeResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/factors/${verifiedTotpFactor.id}/challenge`,
    {
      method: 'POST',
      headers: buildSupabaseHeaders(apiKey, accessToken),
      body: JSON.stringify({ factorId: verifiedTotpFactor.id }),
    },
  )

  const challengeId = typeof challengeBody?.id === 'string' ? challengeBody.id : ''
  if (challengeStatus >= 400 || !challengeId) {
    throw new Error(
      `Supabase MFA challenge failed status=${challengeStatus} body=${JSON.stringify(challengeBody)}`,
    )
  }

  const { status: verifyStatus, body: verifyBody } = await jsonFetch<SupabaseMfaVerifyResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/factors/${verifiedTotpFactor.id}/verify`,
    {
      method: 'POST',
      headers: buildSupabaseHeaders(apiKey, accessToken),
      body: JSON.stringify({
        challenge_id: challengeId,
        code: mfaCode,
      }),
    },
  )

  const verifiedAccessToken = typeof verifyBody?.access_token === 'string'
    ? verifyBody.access_token
    : ''
  if (verifyStatus >= 400 || !verifiedAccessToken) {
    throw new Error(
      `Supabase MFA verify failed status=${verifyStatus} body=${JSON.stringify(verifyBody)}`,
    )
  }

  return verifiedAccessToken
}

type SupabaseSession = {
  supabaseUrl: string
  apiKey: string
  accessToken: string
}

const signInSupabase = async (): Promise<SupabaseSession> => {
  const supabaseUrl = mustEnv('SUPABASE_URL')
  const apiKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ''
  if (!apiKey) {
    throw new Error('Missing SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)')
  }
  const email = mustEnv('SMOKE_USER_EMAIL')
  const password = mustEnv('SMOKE_USER_PASSWORD')

  const { status, body } = await jsonFetch<SupabasePasswordSignInResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  )

  const token = typeof body?.access_token === 'string' ? body.access_token : ''
  if (status >= 400 || !token) {
    throw new Error(`Supabase sign-in failed status=${status} body=${JSON.stringify(body)}`)
  }

  return {
    supabaseUrl,
    apiKey,
    accessToken: token,
  }
}

const exchangeAdminSession = async (
  apiBase: string,
  supabaseAccessToken: string,
) => await jsonFetch<AdminExchangeResponse>(`${apiBase}/sessions/admin/exchange`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${supabaseAccessToken}`,
  },
})

const printResultsAndExit = (checks: Check[]) => {
  const failures = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nAdmin surface smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nAdmin surface smoke passed.')
}

const main = async () => {
  const smokeBaseUrl = mustEnv('SMOKE_BASE_URL')
  const apiBase = resolveSmokeApiBaseUrl(smokeBaseUrl)
  const rootBase = resolveSmokeRootBaseUrl(smokeBaseUrl)
  const adminConfig = readAdminSmokeConfig()
  const expectAdminMfa = readExpectedAdminMfa()
  const includePageSurfaceChecks = readIncludePageSurfaceChecks()
  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)
  const supabaseSession = await signInSupabase()
  let exchange = await exchangeAdminSession(apiBase, supabaseSession.accessToken)
  let supabaseAccessToken = supabaseSession.accessToken
  const initialExchangeRequiredMfa = isAdminMfaRequiredResponse(exchange.status, exchange.body)

  if (expectAdminMfa) {
    record({
      name: 'POST /sessions/admin/exchange requires MFA before issuing admin token',
      ok: initialExchangeRequiredMfa,
      note: initialExchangeRequiredMfa
        ? `status=${exchange.status}`
        : `status=${exchange.status} body=${JSON.stringify(exchange.body)}`,
    })
  }

  if (initialExchangeRequiredMfa) {
    supabaseAccessToken = await maybeVerifySupabaseMfa(
      supabaseSession.supabaseUrl,
      supabaseSession.apiKey,
      supabaseSession.accessToken,
    )
    exchange = await exchangeAdminSession(apiBase, supabaseAccessToken)
  }

  const adminAuth = resolveAdminSmokeAuthToken(
    exchange.status,
    exchange.body,
    supabaseAccessToken,
  )
  const adminAccessToken = adminAuth.token

  record({
    name: 'POST /sessions/admin/exchange',
    ok: exchange.status < 400 && adminAccessToken.length > 0,
    note: exchange.status < 400
      ? `status=${exchange.status}${adminAuth.source === 'supabase_fallback' ? ' fallback=supabase_jwt' : ''}`
      : `status=${exchange.status} body=${JSON.stringify(exchange.body)}`,
  })

  if (!adminAccessToken) {
    printResultsAndExit(checks)
    return
  }

  const adminHeaders = {
    Authorization: `Bearer ${adminAccessToken}`,
  }
  const analyticsEndDate = new Date().toISOString().slice(0, 10)
  const analyticsStartDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  if (includePageSurfaceChecks) {
    const observerSummary = await jsonFetch<ObserverSummaryResponse>(
      `${apiBase}/ops/observer/summary?limit=1&windowHours=24`,
      { headers: adminHeaders },
    )
    const observerSummaryOk = observerSummary.status < 400
      && hasNoRouteError(observerSummary.body)
      && (
        observerSummary.body?.success === true
        || hasStringAtPath(observerSummary.body, ['timestamp'])
        || hasObjectAtPath(observerSummary.body, ['gold'])
        || hasObjectAtPath(observerSummary.body, ['queues'])
      )
    record({
      name: 'GET /ops/observer/summary',
      ok: observerSummaryOk,
      note: observerSummary.status < 400
        ? `status=${observerSummary.status} ${describeBodyShape(observerSummary.body)}`
        : `status=${observerSummary.status} body=${JSON.stringify(observerSummary.body)} root=${rootBase}`,
    })

    const moduleRegistry = await jsonFetch<ModuleRegistryResponse>(`${apiBase}/ops/modules/health`, {
      headers: adminHeaders,
    })
    const moduleRegistryOk = moduleRegistry.status < 400
      && hasNoRouteError(moduleRegistry.body)
      && (
        hasArrayAtPath(moduleRegistry.body, ['modules'])
        || hasStringAtPath(moduleRegistry.body, ['updatedAt'])
        || hasStringAtPath(moduleRegistry.body, ['updated_at'])
      )
    record({
      name: 'GET /ops/modules/health',
      ok: moduleRegistryOk,
      note: moduleRegistry.status < 400
        ? `status=${moduleRegistry.status} modules=${String(moduleRegistry.body?.modules?.length ?? 0)} ${describeBodyShape(moduleRegistry.body)}`
        : `status=${moduleRegistry.status} body=${JSON.stringify(moduleRegistry.body)}`,
    })

    const pendingDiscoveryReviews = await jsonFetch<DiscoveryScansResponse>(
      `${apiBase}/admin/discovery/pending-reviews?limit=1`,
      { headers: adminHeaders },
    )
    const pendingDiscoveryReviewsOk = pendingDiscoveryReviews.status < 400
      && hasNoRouteError(pendingDiscoveryReviews.body)
      && (
        hasArrayAtPath(pendingDiscoveryReviews.body, ['scans'])
        || hasArrayAtPath(pendingDiscoveryReviews.body, ['items'])
        || hasNumberAtPath(pendingDiscoveryReviews.body, ['count'])
      )
    record({
      name: 'GET /admin/discovery/pending-reviews?limit=1',
      ok: pendingDiscoveryReviewsOk,
      note: pendingDiscoveryReviews.status < 400
        ? `status=${pendingDiscoveryReviews.status} scans=${String(pendingDiscoveryReviews.body?.scans?.length ?? 0)} ${describeBodyShape(pendingDiscoveryReviews.body)}`
        : `status=${pendingDiscoveryReviews.status} body=${JSON.stringify(pendingDiscoveryReviews.body)}`,
    })

    const discoveryScans = await jsonFetch<DiscoveryScansResponse>(
      `${apiBase}/admin/discovery/scans?limit=1`,
      { headers: adminHeaders },
    )
    const discoveryScansOk = discoveryScans.status < 400
      && hasNoRouteError(discoveryScans.body)
      && (
        hasArrayAtPath(discoveryScans.body, ['scans'])
        || hasArrayAtPath(discoveryScans.body, ['items'])
        || hasNumberAtPath(discoveryScans.body, ['count'])
      )
    record({
      name: 'GET /admin/discovery/scans?limit=1',
      ok: discoveryScansOk,
      note: discoveryScans.status < 400
        ? `status=${discoveryScans.status} scans=${String(discoveryScans.body?.scans?.length ?? 0)} ${describeBodyShape(discoveryScans.body)}`
        : `status=${discoveryScans.status} body=${JSON.stringify(discoveryScans.body)}`,
    })

    const discoveryCertificationRuns = await jsonFetch<DiscoveryCertificationRunsResponse>(
      `${apiBase}/admin/discovery/certifications/runs?limit=1`,
      { headers: adminHeaders },
    )
    const discoveryCertificationRunsOk = discoveryCertificationRuns.status < 400
      && hasNoRouteError(discoveryCertificationRuns.body)
      && (
        hasArrayAtPath(discoveryCertificationRuns.body, ['runs'])
        || hasArrayAtPath(discoveryCertificationRuns.body, ['items'])
        || hasNumberAtPath(discoveryCertificationRuns.body, ['count'])
      )
    record({
      name: 'GET /admin/discovery/certifications/runs?limit=1',
      ok: discoveryCertificationRunsOk,
      note: discoveryCertificationRuns.status < 400
        ? `status=${discoveryCertificationRuns.status} runs=${String(discoveryCertificationRuns.body?.runs?.length ?? 0)} ${describeBodyShape(discoveryCertificationRuns.body)}`
        : `status=${discoveryCertificationRuns.status} body=${JSON.stringify(discoveryCertificationRuns.body)}`,
    })

    const auditLogs = await jsonFetch<AuditLogsResponse>(`${apiBase}/audit/logs?limit=1`, {
      headers: adminHeaders,
    })
    const auditLogsOk = auditLogs.status < 400
      && hasNoRouteError(auditLogs.body)
      && (
        hasArrayAtPath(auditLogs.body, ['logs'])
        || hasArrayAtPath(auditLogs.body, ['items'])
        || hasObjectAtPath(auditLogs.body, ['pagination'])
      )
    record({
      name: 'GET /audit/logs?limit=1',
      ok: auditLogsOk,
      note: auditLogs.status < 400
        ? `status=${auditLogs.status} logs=${String(auditLogs.body?.logs?.length ?? 0)} ${describeBodyShape(auditLogs.body)}`
        : `status=${auditLogs.status} body=${JSON.stringify(auditLogs.body)}`,
    })

    const firstAuditEventId = typeof (auditLogs.body?.logs?.[0] as { event_id?: unknown } | undefined)?.event_id === 'string'
      ? (auditLogs.body?.logs?.[0] as { event_id: string }).event_id
      : ''
    if (firstAuditEventId) {
      const auditDetail = await jsonFetch<AuditLogDetailResponse>(`${apiBase}/audit/logs/${encodeURIComponent(firstAuditEventId)}`, {
        headers: adminHeaders,
      })
      const auditDetailEventId = resolveAuditLogEventId(auditDetail.body)
      record({
        name: 'GET /audit/logs/:eventId',
        ok: auditDetail.status < 400 && auditDetailEventId === firstAuditEventId,
        note: auditDetail.status < 400
          ? `event_id=${String(auditDetailEventId ?? 'undefined')} ${describeBodyShape(auditDetail.body)}`
          : `status=${auditDetail.status} body=${JSON.stringify(auditDetail.body)}`,
      })
    }
  }

  const effectiveFlags = await jsonFetch<FeatureFlagsEffectiveResponse>(`${apiBase}/feature-flags/effective`, {
    headers: adminHeaders,
  })
  record({
    name: 'GET /feature-flags/effective',
    ok: effectiveFlags.status < 400 && Array.isArray(effectiveFlags.body?.flags) && Array.isArray(effectiveFlags.body?.definitions),
    note: effectiveFlags.status < 400
      ? `flags=${String(effectiveFlags.body?.flags?.length ?? 0)}`
      : `status=${effectiveFlags.status} body=${JSON.stringify(effectiveFlags.body)}`,
  })

  if (includePageSurfaceChecks) {
    const adminFlags = await jsonFetch<AdminFeatureFlagsResponse>(`${apiBase}/admin/feature-flags`, {
      headers: adminHeaders,
    })
    const adminFlagsOk = adminFlags.status < 400
      && hasNoRouteError(adminFlags.body)
      && (
        hasArrayAtPath(adminFlags.body, ['flags'])
        || hasArrayAtPath(adminFlags.body, ['runtime', 'flags'])
        || hasArrayAtPath(adminFlags.body, ['definitions'])
        || hasStringAtPath(adminFlags.body, ['runtime', 'generated_at'])
      )
    record({
      name: 'GET /admin/feature-flags',
      ok: adminFlagsOk,
      note: adminFlags.status < 400
        ? `db_flags=${String(adminFlags.body?.flags?.length ?? 0)} runtime_flags=${String(adminFlags.body?.runtime?.flags?.length ?? 0)} ${describeBodyShape(adminFlags.body)}`
        : `status=${adminFlags.status} body=${JSON.stringify(adminFlags.body)}`,
    })

    const analyticsCorridors = await jsonFetch<AnalyticsCorridorsResponse>(
      `${apiBase}/analytics/corridors?start_date=${analyticsStartDate}&end_date=${analyticsEndDate}&limit=5`,
      { headers: adminHeaders },
    )
    const analyticsCorridorsOk = analyticsCorridors.status < 400
      && hasNoRouteError(analyticsCorridors.body)
      && (
        hasArrayAtPath(analyticsCorridors.body, ['corridors'])
        || hasObjectAtPath(analyticsCorridors.body, ['privacy'])
        || hasObjectAtPath(analyticsCorridors.body, ['period'])
        || hasObjectAtPath(analyticsCorridors.body, ['aggregationWindow'])
      )
    record({
      name: 'GET /analytics/corridors',
      ok: analyticsCorridorsOk,
      note: analyticsCorridors.status < 400
        ? `corridors=${String(analyticsCorridors.body?.corridors?.length ?? 0)} range=${analyticsStartDate}..${analyticsEndDate} ${describeBodyShape(analyticsCorridors.body)}`
        : `status=${analyticsCorridors.status} body=${JSON.stringify(analyticsCorridors.body)}`,
    })

    const analyticsSessions = await jsonFetch<AnalyticsSessionsResponse>(
      `${apiBase}/analytics/engagement/sessions?start_date=${analyticsStartDate}&end_date=${analyticsEndDate}`,
      { headers: adminHeaders },
    )
    const analyticsSessionsOk = analyticsSessions.status < 400
      && hasNoRouteError(analyticsSessions.body)
      && (
        hasNumberAtPath(analyticsSessions.body, ['total_sessions'])
        || hasNumberAtPath(analyticsSessions.body, ['unique_users'])
        || hasNumberAtPath(analyticsSessions.body, ['bounce_rate'])
        || hasNumberAtPath(analyticsSessions.body, ['avg_session_duration'])
      )
    record({
      name: 'GET /analytics/engagement/sessions',
      ok: analyticsSessionsOk,
      note: analyticsSessions.status < 400
        ? `sessions=${String(analyticsSessions.body?.total_sessions ?? 0)} ${describeBodyShape(analyticsSessions.body)}`
        : `status=${analyticsSessions.status} body=${JSON.stringify(analyticsSessions.body)}`,
    })

    const goldExports = await jsonFetch<GoldExportsResponse>(
      `${apiBase}/ops/gold/exports/cdp-daily?amount_bucket=500&method_profile=standard_bank&limit=5`,
      { headers: adminHeaders },
    )
    record({
      name: 'GET /ops/gold/exports/cdp-daily',
      ok: goldExports.status < 400 && goldExports.body?.success === true && Array.isArray(goldExports.body?.rows),
      note: goldExports.status < 400
        ? `rows=${String(goldExports.body?.rows?.length ?? 0)} date=${String(goldExports.body?.meta?.date ?? 'null')}`
        : `status=${goldExports.status} body=${JSON.stringify(goldExports.body)}`,
    })

    const institutionalClients = await jsonFetch<InstitutionalClientsResponse>(`${apiBase}/admin/institutional/clients`, {
      headers: adminHeaders,
    })
    const institutionalClientsOk = institutionalClients.status < 400
      && hasNoRouteError(institutionalClients.body)
      && (
        hasArrayAtPath(institutionalClients.body, ['clients'])
        || hasObjectAtPath(institutionalClients.body, ['summary'])
        || hasObjectAtPath(institutionalClients.body, ['launch_gate'])
        || hasObjectAtPath(institutionalClients.body, ['workflow'])
      )
    record({
      name: 'GET /admin/institutional/clients',
      ok: institutionalClientsOk,
      note: institutionalClients.status < 400
        ? `clients=${String(institutionalClients.body?.clients?.length ?? 0)} blocked=${String(Boolean(institutionalClients.body?.launch_gate?.blocked))} ${describeBodyShape(institutionalClients.body)}`
        : `status=${institutionalClients.status} body=${JSON.stringify(institutionalClients.body)}`,
    })

    const adsAdmin = await jsonFetch<AdsAdminResponse>(`${apiBase}/admin/ads`, {
      headers: adminHeaders,
    })
    const adsAdminOk = adsAdmin.status < 400
      && hasNoRouteError(adsAdmin.body)
      && (
        hasArrayAtPath(adsAdmin.body, ['ads'])
        || hasObjectAtPath(adsAdmin.body, ['summary'])
        || hasObjectAtPath(adsAdmin.body, ['runtime'])
        || hasStringAtPath(adsAdmin.body, ['runtime', 'mode'])
      )
    record({
      name: 'GET /admin/ads',
      ok: adsAdminOk,
      note: adsAdmin.status < 400
        ? `ads=${String(adsAdmin.body?.ads?.length ?? 0)} mode=${String(adsAdmin.body?.runtime?.mode ?? 'unknown')} ${describeBodyShape(adsAdmin.body)}`
        : `status=${adsAdmin.status} body=${JSON.stringify(adsAdmin.body)}`,
    })

    const adsPreview = await jsonFetch<AdsPreviewResponse>(
      `${apiBase}/admin/ads/preview?placement=compare_inline&seed=smoke-preview&simulate_plan=free&marketing_consent=true&ignore_runtime_disabled=true`,
      { headers: adminHeaders },
    )
    const adsPreviewOk = adsPreview.status < 400
      && hasNoRouteError(adsPreview.body)
      && (
        hasStringAtPath(adsPreview.body, ['reason'])
        || hasNumberAtPath(adsPreview.body, ['eligible_count'])
        || hasObjectAtPath(adsPreview.body, ['runtime'])
        || hasObjectAtPath(adsPreview.body, ['ad'])
      )
    record({
      name: 'GET /admin/ads/preview',
      ok: adsPreviewOk,
      note: adsPreview.status < 400
        ? `reason=${String(adsPreview.body?.reason ?? 'unknown')} eligible=${String(adsPreview.body?.eligible_count ?? 0)} ${describeBodyShape(adsPreview.body)}`
        : `status=${adsPreview.status} body=${JSON.stringify(adsPreview.body)}`,
    })
  }

  const grant = await jsonFetch<AdminPlanMutationResponse>(`${apiBase}/admin/plans/grant`, {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: adminConfig.targetEmail,
      plan_code: 'enterprise',
      notes: adminConfig.grantNotes,
    }),
  })
  const grantedMutation = resolvePlanSnapshot(grant.body)
  record({
    name: `POST /admin/plans/grant (${adminConfig.targetEmail})`,
    ok: grant.status < 400 && grant.body?.success === true,
    note: grant.status < 400
      ? `status=${grant.status} plan=${String(grantedMutation.planCode ?? 'undefined')} state=${String(grantedMutation.status ?? 'undefined')} ${describeBodyShape(grant.body)}`
      : `status=${grant.status} body=${JSON.stringify(grant.body)}`,
  })

  const plansAfterGrant = await jsonFetch<AdminPlansListResponse>(`${apiBase}/admin/plans?limit=200`, {
    headers: adminHeaders,
  })
  const grantedPlan = findPlanForEmail(plansAfterGrant.body, adminConfig.targetEmail)
  const grantedPlanSnapshot = resolvePlanSnapshot(grantedPlan)
  record({
    name: `GET /admin/plans reflects enterprise for ${adminConfig.targetEmail}`,
    ok: plansAfterGrant.status < 400
      && grantedPlanSnapshot.planCode === 'enterprise'
      && grantedPlanSnapshot.status === 'active',
    note: plansAfterGrant.status < 400
      ? `plan=${String(grantedPlanSnapshot.planCode)} status=${String(grantedPlanSnapshot.status)} ${describeBodyShape(plansAfterGrant.body)}`
      : `status=${plansAfterGrant.status} body=${JSON.stringify(plansAfterGrant.body)}`,
  })

  const revoke = await jsonFetch<AdminPlanMutationResponse>(`${apiBase}/admin/plans/revoke`, {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: adminConfig.targetEmail,
      reason: adminConfig.revokeReason,
    }),
  })
  const revokedMutation = resolvePlanSnapshot(revoke.body)
  record({
    name: `POST /admin/plans/revoke (${adminConfig.targetEmail})`,
    ok: revoke.status < 400 && revoke.body?.success === true,
    note: revoke.status < 400
      ? `status=${revoke.status} plan=${String(revokedMutation.planCode ?? 'undefined')} state=${String(revokedMutation.status ?? 'undefined')} ${describeBodyShape(revoke.body)}`
      : `status=${revoke.status} body=${JSON.stringify(revoke.body)}`,
  })

  const plansAfterRevoke = await jsonFetch<AdminPlansListResponse>(`${apiBase}/admin/plans?limit=200&plan_code=free`, {
    headers: adminHeaders,
  })
  const revokedPlan = findPlanForEmail(plansAfterRevoke.body, adminConfig.targetEmail)
  const revokedPlanSnapshot = resolvePlanSnapshot(revokedPlan)
  record({
    name: `GET /admin/plans reflects free reset for ${adminConfig.targetEmail}`,
    ok: plansAfterRevoke.status < 400
      && revokedPlanSnapshot.planCode === 'free'
      && revokedPlanSnapshot.status === 'active',
    note: plansAfterRevoke.status < 400
      ? `plan=${String(revokedPlanSnapshot.planCode)} status=${String(revokedPlanSnapshot.status)} ${describeBodyShape(plansAfterRevoke.body)}`
      : `status=${plansAfterRevoke.status} body=${JSON.stringify(plansAfterRevoke.body)}`,
  })

  printResultsAndExit(checks)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Admin surface smoke crashed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
