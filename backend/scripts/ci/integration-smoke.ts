import { buildApp } from '../../plane-a/src/app'

type HttpResult = {
  name: string
  ok: boolean
  status: number
  ms: number
  note?: string
}

const nowMs = () => Date.now()

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '')

const timedFetchJson = async (url: string, init?: RequestInit) => {
  const start = nowMs()
  const res = await fetch(url, init)
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
  const corridors = [
    { from: 'US', to: 'MX', fromCurrency: 'USD', toCurrency: 'MXN', method: 'bank' },
    { from: 'US', to: 'PH', fromCurrency: 'USD', toCurrency: 'PHP', method: 'bank' },
    { from: 'US', to: 'IN', fromCurrency: 'USD', toCurrency: 'INR', method: 'bank' },
    { from: 'US', to: 'NG', fromCurrency: 'USD', toCurrency: 'NGN', method: 'bank' },
    { from: 'US', to: 'KE', fromCurrency: 'USD', toCurrency: 'KES', method: 'wallet' },
    { from: 'US', to: 'CO', fromCurrency: 'USD', toCurrency: 'COP', method: 'bank' },
  ] as const

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

