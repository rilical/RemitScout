/**
 * Dev-only utility to capture Paysend fixtures for corridor parsing tests.
 *
 * Run from the backend directory. Fixtures default to paysend/fixtures/corridors-live.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import { extractPaysendMethodPairs, parsePaysendPayload } from '../../plane-b/src/providers/paysend/parse'
import { fetchPaysendQuote } from '../../plane-b/src/providers/paysend/fetch'

const corridorSpecs = [
  { corridor_id: 'US-MX-USD-MXN', locale: 'en-US' },
  { corridor_id: 'GB-IN-GBP-INR', locale: 'en-GB' },
  { corridor_id: 'GB-PH-GBP-PHP', locale: 'en-GB' },
  { corridor_id: 'DE-TR-EUR-TRY', locale: 'en-DE' },
  { corridor_id: 'FR-MA-EUR-MAD', locale: 'en-FR' },
  { corridor_id: 'IT-RO-EUR-RON', locale: 'en-IT' },
  { corridor_id: 'ES-CO-EUR-COP', locale: 'en-ES' },
  { corridor_id: 'CA-PH-CAD-PHP', locale: 'en-CA' },
  { corridor_id: 'AU-NZ-AUD-NZD', locale: 'en-AU' },
  { corridor_id: 'NL-NG-EUR-NGN', locale: 'en-NL' },
]

const fixturesDir = process.env.PAYSEND_SNAPSHOT_DIR
  || path.join(
    process.cwd(),
    'plane-b',
    'src',
    'providers',
    'paysend',
    'fixtures',
    'corridors-live',
  )

const delayMs = 1500
const requestTimeoutMs = Number(process.env.PAYSEND_SNAPSHOT_TIMEOUT_MS) || 25000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Paysend snapshot timeout for ${label} after ${timeoutMs}ms`))
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
  provider_id: 'paysend',
  corridor_id,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale,
})

const fetchPaysendSnapshot = async (request: CollectorRequest) => {
  const result = await withTimeout(
    fetchPaysendQuote(request),
    requestTimeoutMs,
    request.corridor_id,
  )
  return { status: result.status, payload: result.payload, bodyText: result.bodyText }
}

const main = async () => {
  await mkdir(fixturesDir, { recursive: true })
  const summary: Record<string, unknown> = {}

  for (const spec of corridorSpecs) {
    const request = buildRequest(spec.corridor_id, spec.locale)
    const result = await fetchPaysendSnapshot(request)
    const payload = result.payload
    const safePayload = payload && typeof payload === 'object'
      ? payload
      : { raw: result.bodyText }

    const fixturePath = path.join(fixturesDir, `${spec.corridor_id}.json`)
    await writeFile(fixturePath, JSON.stringify(safePayload, null, 2))

    const pairs = extractPaysendMethodPairs(safePayload as Record<string, unknown>, spec.corridor_id)
    const parsed = parsePaysendPayload(safePayload as Record<string, unknown>, request)

    summary[spec.corridor_id] = {
      status: result.status,
      method_pairs: pairs,
      base_rate: parsed?.base_rate ?? null,
      fee_amount: parsed?.fee_amount ?? null,
      receive_amount: parsed?.receive_amount ?? null,
      parse_flags: parsed?.parse_flags ?? [],
      fixture_path: fixturePath,
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
