import { buildApp } from '../../plane-a/src/app'
import { getMacroCorridors, type MacroCorridor } from '../../shared/macro-corridors'

type HttpResult = {
  name: string
  ok: boolean
  status: number
  ms: number
  note?: string
}

type CorridorTest = {
  from: string
  to: string
  fromCurrency: string
  toCurrency: string
  method: string
  corridorId: string
}

const nowMs = () => Date.now()

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '')
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const toInt = (value: string | undefined): number | undefined => {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

const withTimeout = (ms: number) => {
  const timeout = Number.isFinite(ms) && ms > 0 ? ms : 0
  if (!timeout || !('timeout' in AbortSignal)) {
    return undefined
  }
  return AbortSignal.timeout(timeout)
}

const normalizeMethod = (value?: string) => {
  const method = (value || 'bank').toLowerCase()
  const normalized = method === 'wallet' ? 'wallet' : method === 'cash-pickup' ? 'cash_pickup' : method
  return normalized === 'bank'
    || normalized === 'wallet'
    || normalized === 'cash_pickup'
    || normalized === 'mobile_wallet'
    || normalized === 'bank_deposit'
    || normalized === 'cash' || normalized === 'card' || normalized === 'airtime'
    ? (normalized === 'bank_deposit' ? 'bank' : normalized)
    : 'bank'
}

const macroToCorridorTests = (corridors: MacroCorridor[]): CorridorTest[] =>
  corridors.map(c => ({
    from: c.sourceCountry,
    to: c.destCountry,
    fromCurrency: c.sourceCurrency,
    toCurrency: c.destCurrency,
    method: normalizeMethod('bank'),
    corridorId: c.corridorId,
  }))

const parseExplicitCorridor = (token: string): CorridorTest[] => {
  const [corridorPart, methodPart] = token.split(':')
  const parts = corridorPart.split('-').filter(Boolean)
  if (parts.length < 4) return []
  return [{
    from: parts[0].toUpperCase(),
    to: parts[1].toUpperCase(),
    fromCurrency: parts[2].toUpperCase(),
    toCurrency: parts[3].toUpperCase(),
    method: normalizeMethod(methodPart),
    corridorId: `${parts[0].toUpperCase()}-${parts[1].toUpperCase()}-${parts[2].toUpperCase()}-${parts[3].toUpperCase()}`,
  }]
}

const resolveCorridorSet = (): CorridorTest[] => {
  const setMode = (process.env.SMOKE_CORRIDOR_SET || 'default').toLowerCase()
  const max = toInt(process.env.SMOKE_MAX_CORRIDORS)
  const explicit = process.env.SMOKE_CORRIDORS
    ? process.env.SMOKE_CORRIDORS.split(',').map((token) => parseExplicitCorridor(token.trim())).flat()
    : []

  const defaultCorridors: readonly CorridorTest[] = [
    {
      from: 'US',
      to: 'MX',
      fromCurrency: 'USD',
      toCurrency: 'MXN',
      method: 'bank',
      corridorId: 'US-MX-USD-MXN',
    },
    {
      from: 'US',
      to: 'PH',
      fromCurrency: 'USD',
      toCurrency: 'PHP',
      method: 'bank',
      corridorId: 'US-PH-USD-PHP',
    },
    {
      from: 'US',
      to: 'IN',
      fromCurrency: 'USD',
      toCurrency: 'INR',
      method: 'bank',
      corridorId: 'US-IN-USD-INR',
    },
    {
      from: 'US',
      to: 'NG',
      fromCurrency: 'USD',
      toCurrency: 'NGN',
      method: 'bank',
      corridorId: 'US-NG-USD-NGN',
    },
    {
      from: 'US',
      to: 'KE',
      fromCurrency: 'USD',
      toCurrency: 'KES',
      method: 'wallet',
      corridorId: 'US-KE-USD-KES',
    },
    {
      from: 'US',
      to: 'CO',
      fromCurrency: 'USD',
      toCurrency: 'COP',
      method: 'bank',
      corridorId: 'US-CO-USD-COP',
    },
  ]

  let corridors: CorridorTest[] = []
  if (explicit.length > 0) {
    corridors = explicit
  } else if (setMode === 'macro' || setMode === 'all') {
    corridors = macroToCorridorTests(getMacroCorridors())
  } else if (setMode === 'default') {
    corridors = [...defaultCorridors]
  }

  if (corridors.length === 0) {
    corridors = [...defaultCorridors]
  }

  if (max && max > 0 && corridors.length > max) {
    corridors = corridors.slice(0, max)
  }

  return corridors
}

const timedFetchJson = async (url: string, init?: RequestInit) => {
  const start = nowMs()
  const timeoutMs = Number(process.env.SMOKE_FETCH_TIMEOUT_MS || 12000)
  // Freshly deployed public edges can return transient 5xx responses while route
  // propagation settles. Keep the smoke strict on final status, but give it a
  // realistic retry budget before declaring the release unhealthy.
  const maxAttempts = Math.max(1, Number(process.env.SMOKE_FETCH_RETRIES || 10))
  let res: Response | null = null
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const initWithTimeout = {
      ...init,
      signal: init?.signal || withTimeout(timeoutMs),
    }

    try {
      res = await fetch(url, initWithTimeout)
      if (res.status < 500 || attempt === maxAttempts) {
        break
      }
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || init?.signal?.aborted) {
        throw error
      }
    }

    await sleep(Math.min(4000, attempt * 1000))
  }

  if (!res) {
    throw lastError instanceof Error ? lastError : new Error(`Request failed for ${url}`)
  }

  const ms = nowMs() - start
  let body: any = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null)
  } else {
    body = await res.text().catch(() => null)
  }
  return { res, ms, body }
}

const runRemote = async (baseUrl: string): Promise<HttpResult[]> => {
  const root = normalizeBaseUrl(baseUrl)
  const apiBase = `${root}/api/v1`
  const results: HttpResult[] = []

  const record = (r: HttpResult) => results.push(r)

  // Core health endpoints
  {
    const { res, ms } = await timedFetchJson(`${root}/healthz`)
    record({ name: 'GET /healthz', ok: res.status < 400, status: res.status, ms })
  }
  {
    const { res, ms, body } = await timedFetchJson(`${root}/readyz`)
    record({
      name: 'GET /readyz',
      ok: res.status < 400,
      status: res.status,
      ms,
      note: typeof body === 'object' && body ? JSON.stringify(body) : undefined,
    })
  }
  {
    const start = nowMs()
    const res = await fetch(`${root}/metrics`)
    const ms = nowMs() - start
    record({ name: 'GET /metrics', ok: res.status < 400, status: res.status, ms })
  }

  // B2C corridor -> providers happy path (must return data, not just "collecting").
  const corridors = resolveCorridorSet()

  for (const corridor of corridors) {
    const ccUrl = `${apiBase}/corridor-currencies?from=${corridor.from}&to=${corridor.to}`
    {
      const { res, ms, body } = await timedFetchJson(ccUrl)
      const pairs = Array.isArray(body?.pairs) ? body.pairs.length : 0
      record({
        name: `GET /corridor-currencies ${corridor.from}-${corridor.to}`,
        ok: res.status < 400 && pairs > 0,
        status: res.status,
        ms,
        note: `pairs=${pairs}`,
      })
    }

    const providersUrl =
      `${apiBase}/providers?from=${corridor.from}&to=${corridor.to}` +
      `&amount=500&fromCurrency=${corridor.fromCurrency}&toCurrency=${corridor.toCurrency}` +
      `&method=${corridor.method}`

    const { res, ms, body } = await timedFetchJson(providersUrl)

    const providerCount =
      Array.isArray(body?.data) ? body.data.length
        : Array.isArray(body?.providers) ? body.providers.length
          : 0

    const errorCode =
      body?.error?.code ||
      body?.error?.error ||
      body?.error ||
      body?.code ||
      body?.message ||
      null

    const collecting =
      body?.error?.code === 'quotes_unavailable' ||
      body?.error?.code === 'refresh_pending'

    record({
      name: `GET /providers ${corridor.from}-${corridor.to} (${corridor.method})`,
      ok: res.status < 500 && !collecting && providerCount > 0,
      status: res.status,
      ms,
      note: collecting
        ? `collecting (${String(errorCode)})`
        : `providers=${providerCount}${errorCode ? ` (${String(errorCode)})` : ''}`,
    })
  }

  // B2B readiness (public)
  {
    const { res, ms, body } = await timedFetchJson(`${apiBase}/indices/health`)
    const status = typeof body?.status === 'string' ? body.status : null
    record({
      name: 'GET /indices/health',
      ok: res.status < 400 && (status === null || status === 'healthy' || status === 'degraded'),
      status: res.status,
      ms,
      note: status ? `status=${status}` : undefined,
    })
  }

  return results
}

const runLocal = async (): Promise<HttpResult[]> => {
  const app = await buildApp()
  const results: HttpResult[] = []
  const record = (r: HttpResult) => results.push(r)

  try {
    await app.ready()

    const inject = async (name: string, url: string) => {
      const start = nowMs()
      const res = await app.inject({ method: 'GET', url })
      const ms = nowMs() - start
      record({ name, ok: res.statusCode < 400, status: res.statusCode, ms })
      return res
    }

    await inject('GET /healthz', '/healthz')
    await inject('GET /readyz', '/readyz')
    await inject('GET /metrics', '/metrics')
  } finally {
    await app.close()
  }

  return results
}

const main = async () => {
  const baseUrl = process.env.SMOKE_BASE_URL || ''
  const strict = process.env.SMOKE_STRICT === '1'

  const results = baseUrl ? await runRemote(baseUrl) : await runLocal()

  const failures = results.filter((r) => !r.ok)
  const timings = results.map((r) => r.ms)

  for (const r of results) {
    const marker = r.ok ? 'PASS' : 'FAIL'
    const note = r.note ? ` | ${r.note}` : ''
    console.log(`${marker} ${r.name} status=${r.status} ms=${r.ms}${note}`)
  }

  console.log(
    `\nTiming summary: p50=${percentile(timings, 50)}ms p95=${percentile(timings, 95)}ms count=${timings.length}`,
  )

  if (failures.length > 0) {
    console.error(`\nIntegration smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  if (strict) {
    console.log('\nIntegration smoke passed (strict mode).')
  } else {
    console.log('\nIntegration smoke passed.')
  }
}

main().catch((error) => {
  console.error('Integration smoke crashed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
