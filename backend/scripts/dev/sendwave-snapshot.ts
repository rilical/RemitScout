/**
 * Dev-only utility to capture Sendwave fixtures for corridor parsing tests.
 *
 * Run from the backend directory so fixtures land under plane-b/src/providers/sendwave/fixtures.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import { extractSendwaveMethodPairs, parseSendwavePayload } from '../../plane-b/src/providers/sendwave/parse'
import { fetchSendwaveQuote } from '../../plane-b/src/providers/sendwave/fetch'

const corridorSpecs = [
  { corridor_id: 'US-PH-USD-PHP', locale: 'en-US' },
  { corridor_id: 'US-KE-USD-KES', locale: 'en-US' },
  { corridor_id: 'CA-PH-CAD-PHP', locale: 'en-CA' },
  { corridor_id: 'FR-PH-EUR-PHP', locale: 'fr-FR' },
  { corridor_id: 'FR-MA-EUR-MAD', locale: 'fr-FR' },
  { corridor_id: 'US-MX-USD-MXN', locale: 'en-US' },
]

const fixturesDir = process.env.SENDWAVE_SNAPSHOT_DIR
  || path.join(
    process.cwd(),
    'plane-b',
    'src',
    'providers',
    'sendwave',
    'fixtures',
    'corridors',
  )

const delayMs = 1500
const requestTimeoutMs = Number(process.env.SENDWAVE_SNAPSHOT_TIMEOUT_MS) || 25000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Sendwave snapshot timeout for ${label} after ${timeoutMs}ms`))
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
  provider_id: 'sendwave',
  corridor_id,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale,
})

const fetchSendwaveSnapshot = async (request: CollectorRequest) => {
  const result = await withTimeout(
    fetchSendwaveQuote(request),
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
    const result = await fetchSendwaveSnapshot(request)
    const payload = result.payload
    const safePayload = payload && typeof payload === 'object'
      ? payload
      : { raw: result.bodyText }

    const fixturePath = path.join(fixturesDir, `${spec.corridor_id}.json`)
    await writeFile(fixturePath, JSON.stringify(safePayload, null, 2))

    const pairs = extractSendwaveMethodPairs(safePayload as Record<string, unknown>)
    const parsed = parseSendwavePayload(safePayload as Record<string, unknown>, request)

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
