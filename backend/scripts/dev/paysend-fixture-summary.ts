/**
 * Summarize Paysend fixtures by corridor and method pairs.
 *
 * Run from the backend directory.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import { parseCorridorId } from '../../shared/corridor'
import { extractPaysendMethodPairs, parsePaysendPayload } from '../../plane-b/src/providers/paysend/parse'

const fixturesRoot = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'paysend',
  'fixtures',
)

const fixtureDirs = ['corridors', 'corridors-live']
const amount = Number(process.env.PAYSEND_FIXTURE_AMOUNT || 100)

const buildRequest = (corridorId: string): CollectorRequest => ({
  provider_id: 'paysend',
  corridor_id: corridorId,
  amount_bucket: amount,
  send_amount: amount,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  locale: 'en-US',
})

const loadFixtures = async () => {
  const fixtures: Array<{ corridorId: string; filePath: string }> = []

  for (const dir of fixtureDirs) {
    const fullDir = path.join(fixturesRoot, dir)
    try {
      const entries = await readdir(fullDir)
      for (const entry of entries) {
        if (!entry.endsWith('.json')) continue
        if (entry === 'summary.json') continue
        const corridorId = entry.replace(/\.json$/, '')
        if (!parseCorridorId(corridorId)) continue
        fixtures.push({ corridorId, filePath: path.join(fullDir, entry) })
      }
    } catch {
      // Directory may not exist yet.
    }
  }

  return fixtures
}

const main = async () => {
  const fixtures = await loadFixtures()
  const summary: Record<string, unknown> = {}
  const payinMethods = new Set<string>()
  const payoutMethods = new Set<string>()
  const methodPairs = new Set<string>()

  for (const fixture of fixtures) {
    const raw = await readFile(fixture.filePath, 'utf8')
    const payload = JSON.parse(raw) as Record<string, unknown>
    const pairs = extractPaysendMethodPairs(payload, fixture.corridorId)

    for (const pair of pairs) {
      if (pair.payin_method) payinMethods.add(pair.payin_method)
      if (pair.payout_method) payoutMethods.add(pair.payout_method)
      methodPairs.add(`${pair.payin_method}:${pair.payout_method}`)
    }

    const parsed = parsePaysendPayload(payload, buildRequest(fixture.corridorId))

    summary[fixture.corridorId] = {
      fixture: fixture.filePath,
      method_pairs: pairs,
      parsed: parsed
        ? {
            payin_method: parsed.payin_method,
            payout_method: parsed.payout_method,
            fee_amount: parsed.fee_amount,
            base_rate: parsed.base_rate,
            receive_amount: parsed.receive_amount,
            parse_flags: parsed.parse_flags,
          }
        : null,
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    fixtures: fixtures.length,
    payin_methods: Array.from(payinMethods).sort(),
    payout_methods: Array.from(payoutMethods).sort(),
    method_pairs: Array.from(methodPairs).sort(),
    corridors: summary,
  }

  const summaryPath = path.join(fixturesRoot, 'summary.json')
  await writeFile(summaryPath, JSON.stringify(output, null, 2))
  console.log(JSON.stringify(output, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
