import '../../shared/load-env'
import {
  resolveSmokeApiBaseUrl,
  resolveSmokeRootBaseUrl,
} from './alerts-watchlists-smoke'

type Check = {
  name: string
  ok: boolean
  note?: string
}

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

type AuditLogsResponse = {
  logs?: unknown[]
  error?: string
  message?: string
}

type AdminPlanMutationResponse = {
  success?: boolean
  error?: string
  message?: string
  user?: {
    email?: string | null
    plan_code?: string | null
    status?: string | null
  }
}

type AdminPlansListResponse = {
  users?: Array<{
    email?: string | null
    plan_code?: string | null
    plan_status?: string | null
  }>
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

export const findPlanForEmail = (
  body: AdminPlansListResponse,
  email: string,
) => {
  const normalized = email.trim().toLowerCase()
  return body.users?.find((user) => user.email?.trim().toLowerCase() === normalized) ?? null
}

export const readSmokeUserMfaCode = (
  env: NodeJS.ProcessEnv = process.env,
): string => env.SMOKE_USER_MFA_CODE?.trim() || env.E2E_AUTH_MFA_CODE?.trim() || ''

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

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const jsonFetch = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  const body: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '')
  return { status: res.status, body: body as T }
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
  const supabaseSession = await signInSupabase()
  let exchange = await exchangeAdminSession(apiBase, supabaseSession.accessToken)
  let supabaseAccessToken = supabaseSession.accessToken

  if (isAdminMfaRequiredResponse(exchange.status, exchange.body)) {
    supabaseAccessToken = await maybeVerifySupabaseMfa(
      supabaseSession.supabaseUrl,
      supabaseSession.apiKey,
      supabaseSession.accessToken,
    )
    exchange = await exchangeAdminSession(apiBase, supabaseAccessToken)
  }

  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)

  const adminAccessToken = typeof exchange.body?.access_token === 'string'
    ? exchange.body.access_token
    : ''

  record({
    name: 'POST /sessions/admin/exchange',
    ok: exchange.status < 400 && adminAccessToken.length > 0,
    note: exchange.status < 400
      ? `status=${exchange.status}`
      : `status=${exchange.status} body=${JSON.stringify(exchange.body)}`,
  })

  if (!adminAccessToken) {
    printResultsAndExit(checks)
    return
  }

  const adminHeaders = {
    Authorization: `Bearer ${adminAccessToken}`,
  }

  const observerSummary = await jsonFetch<ObserverSummaryResponse>(
    `${apiBase}/ops/observer/summary?limit=1&windowHours=24`,
    { headers: adminHeaders },
  )
  record({
    name: 'GET /ops/observer/summary',
    ok: observerSummary.status < 400 && observerSummary.body?.success === true,
    note: observerSummary.status < 400
      ? `status=${observerSummary.status}`
      : `status=${observerSummary.status} body=${JSON.stringify(observerSummary.body)} root=${rootBase}`,
  })

  const auditLogs = await jsonFetch<AuditLogsResponse>(`${apiBase}/audit/logs?limit=1`, {
    headers: adminHeaders,
  })
  record({
    name: 'GET /audit/logs?limit=1',
    ok: auditLogs.status < 400 && Array.isArray(auditLogs.body?.logs),
    note: auditLogs.status < 400
      ? `status=${auditLogs.status} logs=${String(auditLogs.body?.logs?.length ?? 0)}`
      : `status=${auditLogs.status} body=${JSON.stringify(auditLogs.body)}`,
  })

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
  record({
    name: `POST /admin/plans/grant (${adminConfig.targetEmail})`,
    ok: grant.status < 400 && grant.body?.success === true && grant.body?.user?.plan_code === 'enterprise',
    note: grant.status < 400
      ? `status=${grant.status} plan=${String(grant.body?.user?.plan_code)}`
      : `status=${grant.status} body=${JSON.stringify(grant.body)}`,
  })

  const plansAfterGrant = await jsonFetch<AdminPlansListResponse>(`${apiBase}/admin/plans?limit=200`, {
    headers: adminHeaders,
  })
  const grantedPlan = findPlanForEmail(plansAfterGrant.body, adminConfig.targetEmail)
  record({
    name: `GET /admin/plans reflects enterprise for ${adminConfig.targetEmail}`,
    ok: plansAfterGrant.status < 400 && grantedPlan?.plan_code === 'enterprise' && grantedPlan?.plan_status === 'active',
    note: plansAfterGrant.status < 400
      ? `plan=${String(grantedPlan?.plan_code)} status=${String(grantedPlan?.plan_status)}`
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
  record({
    name: `POST /admin/plans/revoke (${adminConfig.targetEmail})`,
    ok: revoke.status < 400 && revoke.body?.success === true && revoke.body?.user?.plan_code === 'free',
    note: revoke.status < 400
      ? `status=${revoke.status} plan=${String(revoke.body?.user?.plan_code)}`
      : `status=${revoke.status} body=${JSON.stringify(revoke.body)}`,
  })

  const plansAfterRevoke = await jsonFetch<AdminPlansListResponse>(`${apiBase}/admin/plans?limit=200&plan_code=free`, {
    headers: adminHeaders,
  })
  const revokedPlan = findPlanForEmail(plansAfterRevoke.body, adminConfig.targetEmail)
  record({
    name: `GET /admin/plans reflects free reset for ${adminConfig.targetEmail}`,
    ok: plansAfterRevoke.status < 400 && revokedPlan?.plan_code === 'free' && revokedPlan?.plan_status === 'active',
    note: plansAfterRevoke.status < 400
      ? `plan=${String(revokedPlan?.plan_code)} status=${String(revokedPlan?.plan_status)}`
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
