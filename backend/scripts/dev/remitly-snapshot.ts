/**
 * Dev-only utility to capture Remitly fixtures for corridor parsing tests.
 *
 * Run from the backend directory so fixtures land under plane-b/src/providers/remitly/fixtures.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import { extractRemitlyMethodPairs, parseRemitlyPayload } from '../../plane-b/src/providers/remitly/parse'
import { fetchRemitlyQuote } from '../../plane-b/src/providers/remitly/fetch'

const corridorSpecs = [
  { corridor_id: 'US-MX-USD-MXN', locale: 'en-US' },
  { corridor_id: 'US-PH-USD-PHP', locale: 'en-US' },
  { corridor_id: 'US-IN-USD-INR', locale: 'en-US' },
  { corridor_id: 'US-NG-USD-NGN', locale: 'en-US' },
  { corridor_id: 'CA-IN-CAD-INR', locale: 'en-CA' },
  { corridor_id: 'CA-PH-CAD-PHP', locale: 'en-CA' },
  { corridor_id: 'GB-IN-GBP-INR', locale: 'en-GB' },
  { corridor_id: 'GB-NG-GBP-NGN', locale: 'en-GB' },
  { corridor_id: 'AU-IN-AUD-INR', locale: 'en-AU' },
  { corridor_id: 'SG-IN-SGD-INR', locale: 'en-SG' },
]

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'remitly',
  'fixtures',
  'corridors',
)

const delayMs = 1500
const requestTimeoutMs = Number(process.env.REMITLY_SNAPSHOT_TIMEOUT_MS) || 25000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Remitly snapshot timeout for ${label} after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const buildRequest = (corridor_id: string, locale: string): CollectorRequest => ({
  provider_id: 'remitly',
  corridor_id,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale,
})

const fetchRemitlySnapshot = async (request: CollectorRequest) => {
  const result = await withTimeout(
    fetchRemitlyQuote(request),
    requestTimeoutMs,
    request.corridor_id,
  )
  return { status: result.status, payload: result.payload, bodyText: result.bodyText }
}

const stripSymbols = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripSymbols)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    const cleaned: Record<string, unknown> = {}
    for (const [key, entry] of entries) {
      if (key === 'symbol') continue
      cleaned[key] = stripSymbols(entry)
    }
    return cleaned
  }
  return value
}

const main = async () => {
  await mkdir(fixturesDir, { recursive: true })
  const summary: Record<string, unknown> = {}

  for (const spec of corridorSpecs) {
    const request = buildRequest(spec.corridor_id, spec.locale)
    const result = await fetchRemitlySnapshot(request)
    const payload = result.payload
    const safePayload = payload && typeof payload === 'object' ? stripSymbols(payload) : { raw: result.bodyText }

    const fixturePath = path.join(fixturesDir, `${spec.corridor_id}.json`)
    await writeFile(fixturePath, JSON.stringify(safePayload, null, 2))

    const pairs = extractRemitlyMethodPairs(safePayload as Record<string, unknown>)
    const methods = Array.from(new Set(pairs.map(pair => pair.payout_method)))
    const parsed = parseRemitlyPayload(safePayload as Record<string, unknown>, request)

    summary[spec.corridor_id] = {
      status: result.status,
      payout_methods: methods,
      method_pairs: pairs,
      promotional_rate: parsed?.promotional_rate ?? null,
      base_rate: parsed?.base_rate ?? null,
      promotional_cap_amount: parsed?.promotional_cap_amount ?? null,
      parse_flags: parsed?.parse_flags ?? [],
    }

    if (result.status === 403 || result.status === 429) {
      console.log(`Block detected (${result.status}) for ${spec.corridor_id}; stopping further requests.`)
      break
    }

    await sleep(delayMs)
  }

  const summaryPath = path.join(fixturesDir, 'summary.json')
  await writeFile(summaryPath, JSON.stringify(summary, null, 2))
  console.log(`Wrote fixtures to ${fixturesDir}`)
  console.log(summary)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
