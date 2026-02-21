import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { parseCorridorId } from '../../shared/corridor'

const logger = createLogger('script.ci.rights-differential-gate')

type RightsRow = {
  provider_id: string
  allowed_collect: boolean | null
  allowed_b2c: boolean | null
  stoplist_status: string | null
  source_countries: string[] | null
  destination_countries: string[] | null
}

type CapabilityRow = {
  provider_id: string
  corridor_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean | null
}

type RequestedMethod = 'bank' | 'cash' | 'wallet' | 'airtime'

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeUpper = (value: string): string => value.trim().toUpperCase()
const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const includesCountry = (list: string[] | null, country: string): boolean => {
  if (!list || !list.length) return false
  const needle = normalizeUpper(country)
  return list.some((value) => normalizeUpper(value) === needle)
}

const toMethod = (value?: string | null): RequestedMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) return 'airtime'
  if (token === 'wallet' || token.includes('wallet') || token.includes('mobile_money')) return 'wallet'
  if (token === 'cash' || token.includes('cash')) return 'cash'
  if (token === 'bank' || token.includes('bank') || token.includes('account') || token.includes('card')) return 'bank'
  return null
}

const parseMethods = (value: string | undefined): RequestedMethod[] => {
  const raw = splitCsv(value).map((v) => v.trim().toLowerCase())
  if (!raw.length) return ['bank']
  const mapped = raw
    .map((item): RequestedMethod | null => {
      if (item === 'bank') return 'bank'
      if (item === 'cash') return 'cash'
      if (item === 'wallet') return 'wallet'
      if (item === 'airtime') return 'airtime'
      return null
    })
    .filter((item): item is RequestedMethod => Boolean(item))
  return mapped.length ? Array.from(new Set(mapped)) : ['bank']
}

const capabilitySupportsMethod = (row: CapabilityRow, method: RequestedMethod): boolean => {
  const payin = (row.payin_methods || []).map((item) => toMethod(item)).filter((item): item is RequestedMethod => Boolean(item))
  const payoutFallback = row.payout_methods && row.payout_methods.length ? row.payout_methods : ['bank_deposit']
  const payout = payoutFallback.map((item) => toMethod(item)).filter((item): item is RequestedMethod => Boolean(item))
  return payin.includes(method) || payout.includes(method)
}

const run = async () => {
  const priorityCorridors = splitCsv(process.env.PRIORITY_CORRIDORS)
    .map(normalizeUpper)
    .filter((corridorId) => Boolean(parseCorridorId(corridorId)))
  const methods = parseMethods(process.env.METHODS)
  const maxRightsGap = Number(process.env.MAX_RIGHTS_GAP ?? '0')

  const corridors = priorityCorridors.length
    ? priorityCorridors
    : ['US-AL-USD-ALL', 'US-AR-USD-ARS']

  const pool = createPool(config.db.planeBUrl)
  try {
    const rightsResult = await query<RightsRow>(
      `SELECT provider_id,
              allowed_collect,
              allowed_b2c,
              stoplist_status,
              source_countries,
              destination_countries
         FROM silver.rights_matrix
         WHERE allowed_collect = true
           AND allowed_b2c = true
           AND stoplist_status = 'active'`,
      [],
      pool,
    )
    const rightsByProvider = new Map(
      rightsResult.rows.map((row) => [normalizeToken(row.provider_id), row]),
    )

    const capResult = await query<CapabilityRow>(
      `SELECT provider_id, corridor_id, payin_methods, payout_methods, is_supported
       FROM silver.provider_corridor_capability
       WHERE corridor_id = ANY($1::text[])`,
      [corridors],
      pool,
    )

    const findings: Array<{
      corridorId: string
      method: RequestedMethod
      enforce: number
      ignoreAll: number
      rightsGap: number
      excludedRightsDominant: boolean
    }> = []

    for (const corridorId of corridors) {
      const parsed = parseCorridorId(corridorId)
      if (!parsed) continue
      const rows = capResult.rows.filter((row) => normalizeUpper(row.corridor_id) === corridorId)

      for (const method of methods) {
        let enforce = 0
        let ignoreAll = 0
        for (const row of rows) {
          if (!row.is_supported) continue
          if (!capabilitySupportsMethod(row, method)) continue
          ignoreAll += 1

          const rights = rightsByProvider.get(normalizeToken(row.provider_id))
          const eligible = Boolean(
            rights
            && includesCountry(rights.source_countries, parsed.sourceCountry)
            && includesCountry(rights.destination_countries, parsed.destCountry),
          )
          if (eligible) enforce += 1
        }

        const rightsGap = Math.max(0, ignoreAll - enforce)
        const excludedRightsDominant = ignoreAll > 0 && enforce === 0
        findings.push({
          corridorId,
          method,
          enforce,
          ignoreAll,
          rightsGap,
          excludedRightsDominant,
        })
      }
    }

    const violations = findings.filter(
      (row) => row.rightsGap > maxRightsGap || row.excludedRightsDominant,
    )

    logger.info('rights_differential_gate_summary', {
      environment: config.env,
      corridors,
      methods,
      max_rights_gap: maxRightsGap,
      findings,
      violations,
    })

    if (violations.length > 0) {
      throw new Error(`rights_differential_gate_failed: ${violations.length} violation(s)`)
    }

    console.log('✅ rights differential gate passed')
  } finally {
    await pool.end().catch(() => {})
  }
}

run().catch((error) => {
  console.error(
    'rights differential gate failed:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
})

