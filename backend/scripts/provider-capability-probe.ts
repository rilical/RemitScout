import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { resolveProviderSupport } from '../plane-b/src/services/provider-capability'
import { providerRegistry } from '../plane-b/src/providers'

const logger = createLogger('script.provider-capability-probe')
initTracing('provider-capability-probe')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

type CapabilityProbeConfig = {
  providerFilter: Set<string>
  limitPerProvider: number
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  targetTiers: string[]
  outputFormat: 'json' | 'text' | 'log'
}

export type ProviderCapabilityProbeOptions = Partial<Omit<CapabilityProbeConfig, 'providerFilter'>> & {
  providerIds?: string[]
  pool?: ReturnType<typeof createPool>
}

export type CapabilityProbeDecision = {
  corridorId: string
  supported: boolean
  reason: string | null
  source: string | null
}

export type CapabilityProbeProviderReport = {
  providerId: string
  candidates: number
  probed: number
  results: CapabilityProbeDecision[]
}

const readConfig = (options: ProviderCapabilityProbeOptions = {}): CapabilityProbeConfig => ({
  providerFilter: new Set(
    (options.providerIds
      ?? splitCsv(process.env.CAPABILITY_PROBE_PROVIDERS || process.env.DISCOVERY_PROVIDERS))
      .map((value) => value.toLowerCase()),
  ),
  limitPerProvider: Math.max(1, Number(options.limitPerProvider ?? toNumber(process.env.CAPABILITY_PROBE_LIMIT, 25))),
  amountBucket: Math.max(1, Number(options.amountBucket ?? toNumber(process.env.CAPABILITY_PROBE_AMOUNT_BUCKET, 500))),
  payinMethod: options.payinMethod || process.env.CAPABILITY_PROBE_PAYIN_METHOD || 'bank_transfer',
  payoutMethod: options.payoutMethod || process.env.CAPABILITY_PROBE_PAYOUT_METHOD || 'bank_deposit',
  targetTiers: options.targetTiers ?? splitCsv(process.env.CAPABILITY_PROBE_TIERS || 'tier_1,tier_2'),
  outputFormat: (options.outputFormat
    ?? ((process.env.CAPABILITY_PROBE_OUTPUT_FORMAT || 'log').toLowerCase() === 'json'
    ? 'json'
    : (process.env.CAPABILITY_PROBE_OUTPUT_FORMAT || 'log').toLowerCase() === 'text'
      ? 'text'
      : 'log')),
})

const loadTierCorridors = async (
  pool: ReturnType<typeof createPool>,
  targetTiers: string[],
) => {
  if (!targetTiers.length) return []
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.corridor_priority
      WHERE priority_tier = ANY($1::text[])
      ORDER BY corridor_id`,
    [targetTiers],
    pool,
  )
  return result.rows.map(row => row.corridor_id).filter(Boolean)
}

const loadExistingCapability = async (pool: ReturnType<typeof createPool>, providerId: string) => {
  const result = await query<{ corridor_id: string, is_supported: boolean | null }>(
    `SELECT corridor_id, is_supported
       FROM silver.provider_corridor_capability
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )
  return new Map(
    result.rows
      .filter(row => row.corridor_id)
      .map(row => [row.corridor_id, row.is_supported === true] as const),
  )
}

const formatTextReport = (reports: CapabilityProbeProviderReport[]): string => {
  const lines: string[] = [
    'Provider capability probe',
    `Generated: ${new Date().toISOString()}`,
    '',
  ]

  for (const report of reports) {
    lines.push(`${report.providerId}: ${report.probed}/${report.candidates} probed`)
    for (const result of report.results) {
      lines.push(`  - ${result.corridorId}: supported=${result.supported} source=${result.source ?? 'unknown'} reason=${result.reason ?? 'n/a'}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export const runProviderCapabilityProbe = async (
  options: ProviderCapabilityProbeOptions = {},
): Promise<CapabilityProbeProviderReport[]> => {
  const probeConfig = readConfig(options)
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const ownsPool = !options.pool
  try {
    const tierCorridors = await loadTierCorridors(pool, probeConfig.targetTiers)
    if (!tierCorridors.length) {
      logger.warn('capability_probe_no_corridors', { tiers: probeConfig.targetTiers })
      return []
    }

    const reports: CapabilityProbeProviderReport[] = []
    const providers = providerRegistry.filter((provider) => (
      probeConfig.providerFilter.size === 0
      || probeConfig.providerFilter.has(provider.providerId.toLowerCase())
    ))

    for (const provider of providers) {
      const providerId = provider.providerId
      const existing = await loadExistingCapability(pool, providerId)
      const catalogCorridors = new Set(provider.supportedCorridors)
      const scoreCandidate = (corridorId: string) => {
        const inCatalog = catalogCorridors.has(corridorId)
        const existingSupport = existing.get(corridorId)
        if (existingSupport === undefined && !inCatalog) return 0
        if (existingSupport === undefined) return 1
        if (existingSupport === false && !inCatalog) return 2
        if (existingSupport === false) return 3
        if (!inCatalog) return 4
        return 5
      }
      const candidates = [...tierCorridors].sort((a, b) => {
        const scoreDelta = scoreCandidate(a) - scoreCandidate(b)
        if (scoreDelta !== 0) return scoreDelta
        return a.localeCompare(b)
      })

      if (!candidates.length) {
        logger.info('capability_probe_skip', { provider_id: providerId, reason: 'no_candidates' })
        reports.push({
          providerId,
          candidates: 0,
          probed: 0,
          results: [],
        })
        continue
      }

      let probed = 0
      const results: CapabilityProbeDecision[] = []
      for (const corridorId of candidates) {
        if (probed >= probeConfig.limitPerProvider) break
        const decision = await resolveProviderSupport(
          pool,
          {
            provider_id: providerId,
            corridor_id: corridorId,
            amount_bucket: probeConfig.amountBucket,
            payin_method: probeConfig.payinMethod,
            payout_method: probeConfig.payoutMethod,
            send_amount: probeConfig.amountBucket,
            locale: 'en-US',
          },
          { allowProbe: true, skipCatalog: true, forceProbe: true },
        )
        probed += 1
        const probeResult: CapabilityProbeDecision = {
          corridorId,
          supported: decision.supported,
          reason: decision.reason ?? null,
          source: decision.source ?? null,
        }
        results.push(probeResult)
        logger.info('capability_probe_result', {
          provider_id: providerId,
          corridor_id: corridorId,
          supported: probeResult.supported,
          reason: probeResult.reason,
          source: probeResult.source,
        })
      }

      logger.info('capability_probe_summary', {
        provider_id: providerId,
        probed,
        candidates: candidates.length,
        limit: probeConfig.limitPerProvider,
      })
      reports.push({
        providerId,
        candidates: candidates.length,
        probed,
        results,
      })
    }

    if (probeConfig.outputFormat === 'json') {
      process.stdout.write(JSON.stringify(reports, null, 2) + '\n')
    } else if (probeConfig.outputFormat === 'text') {
      process.stdout.write(formatTextReport(reports) + '\n')
    }
    return reports
  } finally {
    if (ownsPool) {
      await pool.end()
    }
  }
}

if (require.main === module) {
  runProviderCapabilityProbe().catch((error) => {
    logger.error('capability_probe_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
