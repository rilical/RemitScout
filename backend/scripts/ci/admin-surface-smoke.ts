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

const signInSupabase = async (): Promise<string> => {
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
  return token
}

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
  const supabaseAccessToken = await signInSupabase()
  const supabaseAuthHeaders = {
    Authorization: `Bearer ${supabaseAccessToken}`,
  }

  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)

  const exchange = await jsonFetch<AdminExchangeResponse>(`${apiBase}/sessions/admin/exchange`, {
    method: 'POST',
    headers: supabaseAuthHeaders,
  })

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
