import '../../shared/load-env'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type SmokeMeResponse = {
  success?: boolean
  user?: {
    user_id?: string
    email?: string | null
    role?: string | null
    app_role?: string | null
    is_admin?: boolean
  }
  plan?: {
    plan_code?: string
    status?: string
  }
  plan_effective?: {
    plan_code?: string
    is_active?: boolean
    source?: string
  }
  entitlements?: {
    pulse_access?: string
    exports_enabled?: boolean
    exports_max_days?: number | null
    alerts_max?: number | null
    history_max_days?: number | null
    watchlist_items?: number | null
    api_access?: boolean
    api_tier?: number | null
  }
}

export type SmokeMeExpectations = {
  email?: string
  isAdmin?: boolean
  appRole?: string
  effectivePlanCode?: string
  requireEnterpriseEntitlements?: boolean
}

type SupabasePasswordSignInResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

type SmokeWatchlistTarget =
  | { type: 'fxPair'; base: string; quote: string }
  | { type: 'corridor'; from: string; to: string; method?: string }

type SmokeWatchlistResponse = {
  success?: boolean
  status?: string
  error?: string
  details?: {
    error?: string
  }
  item?: {
    id?: string
  }
}

type SmokeAlertMetric = 'rate' | 'recipientGets' | 'sendScore'
type SmokeAlertComparator = 'gt' | 'gte' | 'lt' | 'lte' | 'crosses_above' | 'crosses_below'

type SmokeAlertRule = {
  metric: SmokeAlertMetric
  comparator: SmokeAlertComparator
  value: number
}

type SmokeAlertResponse = {
  success?: boolean
  status?: string
  error?: string
  details?: {
    error?: string
  }
  alert?: {
    id?: string
  }
}

type SmokeCorridorEligibilityResponse = {
  success?: boolean
  smartAlerts?: {
    status?: 'available' | 'rolling_out' | 'not_offered'
  }
}

type SmokeApiErrorBody = {
  error?: string
  details?: {
    error?: string
  }
}

type SmokeRetryOptions = {
  retries?: number
  retryDelayMs?: number
}

const SMOKE_RETRYABLE_STATUS_MIN = 500
const DEFAULT_SMOKE_RETRIES = 3
const DEFAULT_SMOKE_RETRY_DELAY_MS = 1000

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '')

export const resolveSmokeRootBaseUrl = (value: string) => {
  const normalized = normalizeBaseUrl(value)
  if (normalized.endsWith('/api/v1')) {
    return normalized.slice(0, -'/api/v1'.length)
  }
  if (normalized.endsWith('/api')) {
    return normalized.slice(0, -'/api'.length)
  }
  return normalized
}

export const resolveSmokeApiBaseUrl = (value: string) => {
  const normalized = normalizeBaseUrl(value)
  if (normalized.endsWith('/api/v1')) return normalized
  if (normalized.endsWith('/api')) return `${normalized}/v1`
  return `${normalized}/api/v1`
}

export const shouldRetrySmokeResponse = (status: number) => status >= SMOKE_RETRYABLE_STATUS_MIN

const parseOptionalBoolean = (value: string | undefined): boolean | undefined => {
  if (!value || !value.trim()) return undefined
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  throw new Error(`Invalid boolean value: ${value}`)
}

export const readSmokeMeExpectations = (
  env: NodeJS.ProcessEnv = process.env,
): SmokeMeExpectations => ({
  email: env.SMOKE_EXPECTED_EMAIL?.trim() || undefined,
  isAdmin: parseOptionalBoolean(env.SMOKE_EXPECTED_IS_ADMIN),
  appRole: env.SMOKE_EXPECTED_APP_ROLE?.trim() || undefined,
  effectivePlanCode: env.SMOKE_EXPECTED_EFFECTIVE_PLAN_CODE?.trim() || undefined,
  requireEnterpriseEntitlements: parseOptionalBoolean(env.SMOKE_EXPECT_ENTERPRISE_ENTITLEMENTS),
})

export const evaluateMeChecks = (
  status: number,
  body: SmokeMeResponse,
  expectations: SmokeMeExpectations,
): Check[] => {
  const checks: Check[] = [
    {
      name: 'GET /me',
      ok: status < 400 && body?.success === true,
      note: `status=${status}`,
    },
  ]

  if (!(status < 400 && body?.success === true)) {
    return checks
  }

  if (expectations.email) {
    checks.push({
      name: 'GET /me user.email matches expected smoke user',
      ok: body.user?.email?.toLowerCase() === expectations.email.toLowerCase(),
      note: `actual=${String(body.user?.email ?? '')}`,
    })
  }

  if (typeof expectations.isAdmin === 'boolean') {
    checks.push({
      name: 'GET /me user.is_admin matches expected value',
      ok: body.user?.is_admin === expectations.isAdmin,
      note: `actual=${String(body.user?.is_admin)}`,
    })
  }

  if (expectations.appRole) {
    checks.push({
      name: 'GET /me user.app_role matches expected value',
      ok: body.user?.app_role === expectations.appRole,
      note: `actual=${String(body.user?.app_role ?? '')}`,
    })
  }

  if (expectations.effectivePlanCode) {
    checks.push({
      name: 'GET /me plan_effective.plan_code matches expected value',
      ok: body.plan_effective?.plan_code === expectations.effectivePlanCode,
      note: `actual=${String(body.plan_effective?.plan_code ?? '')}`,
    })
  }

  if (expectations.requireEnterpriseEntitlements) {
    checks.push({
      name: 'GET /me returns enterprise entitlement envelope',
      ok:
        body.entitlements?.pulse_access === 'full'
        && body.entitlements?.exports_enabled === true
        && body.entitlements?.watchlist_items === null
        && body.entitlements?.alerts_max === null
        && body.entitlements?.history_max_days === 365
        && body.entitlements?.api_access === true
        && body.entitlements?.api_tier === 2,
      note: `pulse=${String(body.entitlements?.pulse_access)} exports=${String(body.entitlements?.exports_enabled)} watchlist=${String(body.entitlements?.watchlist_items)} alerts=${String(body.entitlements?.alerts_max)} history=${String(body.entitlements?.history_max_days)} api_access=${String(body.entitlements?.api_access)} api_tier=${String(body.entitlements?.api_tier)}`,
    })
  }

  return checks
}

export const resolveSmokeErrorCode = (body?: SmokeApiErrorBody | null) => {
  const nestedError = typeof body?.details?.error === 'string' ? body.details.error : ''
  if (nestedError) return nestedError
  return typeof body?.error === 'string' ? body.error : ''
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
  options: SmokeRetryOptions = {},
): Promise<{ status: number; body: T }> => {
  const retries = Math.max(0, Math.floor(options.retries ?? DEFAULT_SMOKE_RETRIES))
  const retryDelayMs = Math.max(0, Math.floor(options.retryDelayMs ?? DEFAULT_SMOKE_RETRY_DELAY_MS))

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init)
      const contentType = res.headers.get('content-type') || ''
      const body: unknown = contentType.includes('application/json')
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => '')

      if (!shouldRetrySmokeResponse(res.status) || attempt === retries) {
        return { status: res.status, body: body as T }
      }
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
    }

    const delayMs = retryDelayMs * (attempt + 1)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }

  return { status: 503, body: {} as T }
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

const main = async () => {
  const smokeBaseUrl = mustEnv('SMOKE_BASE_URL')
  const baseUrl = resolveSmokeRootBaseUrl(smokeBaseUrl)
  const apiBase = resolveSmokeApiBaseUrl(smokeBaseUrl)
  const token = await signInSupabase()
  const authHeaders = { Authorization: `Bearer ${token}` }
  const meExpectations = readSmokeMeExpectations()

  const checks: Check[] = []
  const record = (c: Check) => checks.push(c)

  // Core health endpoints (no auth).
  {
    const { status } = await jsonFetch(`${baseUrl}/healthz`)
    record({ name: 'GET /healthz', ok: status < 400, note: `status=${status}` })
  }
  {
    const { status } = await jsonFetch(`${baseUrl}/readyz`)
    record({ name: 'GET /readyz', ok: status < 400, note: `status=${status}` })
  }
  {
    const { status, body } = await jsonFetch<SmokeMeResponse>(`${apiBase}/me`, {
      headers: authHeaders,
    })
    for (const check of evaluateMeChecks(status, body, meExpectations)) {
      record(check)
    }
  }

  // Watchlists: create FX + corridor targets.
  const createWatchlist = async (target: SmokeWatchlistTarget, label: string) => {
    const { status, body } = await jsonFetch<SmokeWatchlistResponse>(`${apiBase}/watchlist`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target, label }),
    })
    return { status, body }
  }

  const tag = new Date().toISOString().replace(/[:.]/g, '-')

  const fxUsdMxn = await createWatchlist(
    { type: 'fxPair', base: 'USD', quote: 'MXN' },
    `smoke: USD/MXN (${tag})`,
  )
  record({
    name: 'POST /watchlist fxPair USD/MXN',
    ok: fxUsdMxn.status < 400 && fxUsdMxn.body?.success === true,
    note: `status=${fxUsdMxn.status}`,
  })

  const fxBobArs = await createWatchlist(
    { type: 'fxPair', base: 'BOB', quote: 'ARS' },
    `smoke: BOB/ARS (${tag})`,
  )
  record({
    name: 'POST /watchlist fxPair BOB/ARS',
    ok: fxBobArs.status < 400 && fxBobArs.body?.success === true,
    note: `status=${fxBobArs.status}`,
  })

  const corridorUsMx = await createWatchlist(
    { type: 'corridor', from: 'US', to: 'MX', method: 'bank' },
    `smoke: US→MX (${tag})`,
  )
  record({
    name: 'POST /watchlist corridor US→MX',
    ok: corridorUsMx.status < 400 && corridorUsMx.body?.success === true,
    note: `status=${corridorUsMx.status}`,
  })

  const corridorBoAr = await createWatchlist(
    { type: 'corridor', from: 'BO', to: 'AR', method: 'bank' },
    `smoke: BO→AR (${tag})`,
  )
  record({
    name: 'POST /watchlist corridor BO→AR',
    ok: corridorBoAr.status < 400 && corridorBoAr.body?.success === true,
    note: `status=${corridorBoAr.status}`,
  })

  const fxUsdMxnId = fxUsdMxn.body?.item?.id
  const corridorUsMxId = corridorUsMx.body?.item?.id
  const corridorBoArId = corridorBoAr.body?.item?.id

  const createAlert = async (watchlistItemId: string, rule: SmokeAlertRule) => {
    const { status, body } = await jsonFetch<SmokeAlertResponse>(`${apiBase}/alerts`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchlistItemId, rule, frequency: 'weekly', enabled: true }),
    })
    return { status, body }
  }

  if (typeof fxUsdMxnId === 'string') {
    const fxAlert = await createAlert(fxUsdMxnId, { metric: 'rate', comparator: 'gt', value: 0 })
    record({
      name: 'POST /alerts rate (fxPair USD/MXN)',
      ok: fxAlert.status < 400 && fxAlert.body?.success === true,
      note: `status=${fxAlert.status}`,
    })
  } else {
    record({ name: 'POST /alerts rate (fxPair USD/MXN)', ok: false, note: 'missing watchlist id' })
  }

  if (typeof corridorUsMxId === 'string') {
    const quoteAlert = await createAlert(corridorUsMxId, {
      metric: 'recipientGets',
      comparator: 'gt',
      value: 0,
    })
    record({
      name: 'POST /alerts recipientGets (corridor US→MX)',
      ok: quoteAlert.status < 500, // may be blocked by quote coverage; we only require a clean error
      note: quoteAlert.body?.success === true
        ? 'created'
        : `rejected (${String(resolveSmokeErrorCode(quoteAlert.body) || quoteAlert.status)})`,
    })
  } else {
    record({
      name: 'POST /alerts recipientGets (corridor US→MX)',
      ok: false,
      note: 'missing watchlist id',
    })
  }

  if (typeof corridorBoArId === 'string') {
    const quoteAlert = await createAlert(corridorBoArId, {
      metric: 'recipientGets',
      comparator: 'gt',
      value: 0,
    })
    record({
      name: 'POST /alerts recipientGets (corridor BO→AR) rejects with quote_not_supported',
      ok: quoteAlert.status === 400 && resolveSmokeErrorCode(quoteAlert.body) === 'quote_not_supported',
      note: `status=${quoteAlert.status} error=${String(resolveSmokeErrorCode(quoteAlert.body))}`,
    })

    const smartAlert = await createAlert(corridorBoArId, {
      metric: 'sendScore',
      comparator: 'gte',
      value: 50,
    })
    record({
      name: 'POST /alerts sendScore (corridor BO→AR) rejects with smart_not_offered',
      ok: smartAlert.status === 400 && resolveSmokeErrorCode(smartAlert.body) === 'smart_not_offered',
      note: `status=${smartAlert.status} error=${String(resolveSmokeErrorCode(smartAlert.body))}`,
    })
  } else {
    record({
      name: 'POST /alerts recipientGets/sendScore (corridor BO→AR)',
      ok: false,
      note: 'missing watchlist id',
    })
  }

  // Eligibility endpoint is the source of truth for UX states.
  {
    const { status, body } = await jsonFetch<SmokeCorridorEligibilityResponse>(
      `${apiBase}/alerts/corridor-eligibility?from=US&to=MX&fromCurrency=USD&toCurrency=MXN&method=bank`,
      { headers: authHeaders },
    )
    const smartStatus = body?.smartAlerts?.status
    record({
      name: 'GET /alerts/corridor-eligibility US→MX',
      ok: status < 400 && ['available', 'rolling_out', 'not_offered'].includes(String(smartStatus)),
      note: `status=${status} smartStatus=${String(smartStatus)}`,
    })
  }

  const failures = checks.filter((c) => !c.ok)
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.note ? ` | ${c.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nAlerts/watchlists smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nAlerts/watchlists smoke passed.')
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Alerts/watchlists smoke crashed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
