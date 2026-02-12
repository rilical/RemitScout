import '../../shared/load-env'

type Check = {
  name: string
  ok: boolean
  note?: string
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '')

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const jsonFetch = async <T = any>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await res.json().catch(() => ({} as T))
    : ((await res.text().catch(() => '')) as any as T)
  return { status: res.status, body }
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

  const { status, body } = await jsonFetch<any>(
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
  const baseUrl = normalizeBaseUrl(mustEnv('SMOKE_BASE_URL'))
  const apiBase = `${baseUrl}/api/v1`
  const token = await signInSupabase()
  const authHeaders = { Authorization: `Bearer ${token}` }

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

  // Watchlists: create FX + corridor targets.
  const createWatchlist = async (target: any, label: string) => {
    const { status, body } = await jsonFetch<any>(`${apiBase}/watchlist`, {
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

  const createAlert = async (watchlistItemId: string, rule: any) => {
    const { status, body } = await jsonFetch<any>(`${apiBase}/alerts`, {
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
        : `rejected (${String(quoteAlert.body?.error || quoteAlert.status)})`,
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
      ok: quoteAlert.status === 400 && quoteAlert.body?.error === 'quote_not_supported',
      note: `status=${quoteAlert.status} error=${String(quoteAlert.body?.error)}`,
    })

    const smartAlert = await createAlert(corridorBoArId, {
      metric: 'sendScore',
      comparator: 'gte',
      value: 50,
    })
    record({
      name: 'POST /alerts sendScore (corridor BO→AR) rejects with smart_not_offered',
      ok: smartAlert.status === 400 && smartAlert.body?.error === 'smart_not_offered',
      note: `status=${smartAlert.status} error=${String(smartAlert.body?.error)}`,
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
    const { status, body } = await jsonFetch<any>(
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

main().catch((error) => {
  console.error('Alerts/watchlists smoke crashed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})

