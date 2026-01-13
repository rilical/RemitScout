/**
 * Dev-only utility to capture Pangea fixtures for corridor parsing tests.
 *
 * Run from the backend directory. Fixtures default to pangea/fixtures/corridors-live.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import type { PangeaPayload } from '../../plane-b/src/providers/pangea/parse'
import { extractPangeaMethodPairs, parsePangeaPayload } from '../../plane-b/src/providers/pangea/parse'
import { fetchPangeaQuote } from '../../plane-b/src/providers/pangea/fetch'

const corridorSpecs = [
  { corridor_id: 'US-PH-USD-PHP', locale: 'en-US' },
  { corridor_id: 'US-MX-USD-MXN', locale: 'en-US' },
  { corridor_id: 'US-IN-USD-INR', locale: 'en-US' },
  { corridor_id: 'US-GT-USD-GTQ', locale: 'en-US' },
  { corridor_id: 'US-VN-USD-VND', locale: 'en-US' },
]

const fixturesDir = process.env.PANGEA_SNAPSHOT_DIR
  || path.join(
    process.cwd(),
    'plane-b',
    'src',
    'providers',
    'pangea',
    'fixtures',
    'corridors-live',
  )

const delayMs = 1200
const requestTimeoutMs = Number(process.env.PANGEA_SNAPSHOT_TIMEOUT_MS) || 20000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Pangea snapshot timeout for ${label} after ${timeoutMs}ms`))
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
  provider_id: 'pangea',
  corridor_id,
  amount_bucket: 100,
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale,
})

const fetchPangeaSnapshot = async (request: CollectorRequest) => {
  const result = await withTimeout(
    fetchPangeaQuote(request),
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
    const result = await fetchPangeaSnapshot(request)
    const payload = result.payload
    const safePayload = payload && typeof payload === 'object'
      ? payload
      : { raw: result.bodyText }

    const fixturePath = path.join(fixturesDir, `${spec.corridor_id}.json`)
    await writeFile(fixturePath, JSON.stringify(safePayload, null, 2))

    const typedPayload = safePayload as PangeaPayload
    const pairs = extractPangeaMethodPairs(typedPayload)
    const parsed = parsePangeaPayload(typedPayload, request)

    summary[spec.corridor_id] = {
      status: result.status,
      method_pairs: pairs,
      base_rate: parsed?.base_rate ?? null,
      promotional_rate: parsed?.promotional_rate ?? null,
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
