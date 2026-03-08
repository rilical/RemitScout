import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { getProviderIds } from '../plane-b/src/providers'
import { canonicalPayoutMethods } from '../shared/normalize/canonical'

const logger = createLogger('script.provider-delivery-discovery')
initTracing('provider-delivery-discovery')

type CorridorCapabilityRow = {
  provider_id: string
  corridor_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean
  last_verified_at: string | null
}

export type ProviderReport = {
  providerId: string
  corridorsWithCapability: number
  dbPayoutMethods: string[]
  codeMapPayoutMethods: string[]
  unmappedInDb: string[]
  missingFromDb: string[]
  hasCapabilityProbe: boolean
  corridorBreakdown: Array<{
    corridorId: string
    payinMethods: string[]
    payoutMethods: string[]
    isSupported: boolean
    lastVerifiedAt: string | null
  }>
}

export type ProviderDeliveryDiscoveryOptions = {
  providerIds?: string[]
  outputFormat?: 'json' | 'text' | 'log'
  pool?: ReturnType<typeof createPool>
}

const CAPABILITY_PROBE_PROVIDERS = new Set([
  'remitly', 'wise', 'xe', 'transfergo', 'paysend', 'pangea',
  'orbitremit', 'bossmoney', 'koronapay', 'remitbee', 'singx',
  'placid', 'ria', 'dahabshiil', 'sendwave', 'mukuru', 'worldremit',
  'westernunion', 'xoom', 'instarem', 'wirebarley', 'wellsfargo', 'alansari', 'intermex',
])

const loadCodeMapMethods = async (providerId: string): Promise<string[]> => {
  try {
    const codeMap = await import(`../plane-b/src/providers/${providerId}/code-map`)
    if (codeMap.payoutMethodMap && typeof codeMap.payoutMethodMap === 'object') {
      return [...new Set(Object.values(codeMap.payoutMethodMap) as string[])]
        .filter(v => v && v !== 'other')
        .sort()
    }
    return []
  } catch {
    return []
  }
}

const loadAllCapability = async (pool: ReturnType<typeof createPool>, providerIds: string[]) => {
  const result = await query<CorridorCapabilityRow>(
    `SELECT provider_id, corridor_id, payin_methods, payout_methods, is_supported, last_verified_at
       FROM silver.provider_corridor_capability
      WHERE provider_id = ANY($1::text[])
      ORDER BY provider_id, corridor_id`,
    [providerIds],
    pool,
  )
  return result.rows
}

const buildReport = async (
  pool: ReturnType<typeof createPool>,
  providerIds: string[],
): Promise<ProviderReport[]> => {
  const allRows = await loadAllCapability(pool, providerIds)
  const byProvider = new Map<string, CorridorCapabilityRow[]>()

  for (const row of allRows) {
    const existing = byProvider.get(row.provider_id) ?? []
    existing.push(row)
    byProvider.set(row.provider_id, existing)
  }

  const reports: ProviderReport[] = []

  for (const providerId of providerIds) {
    const rows = byProvider.get(providerId) ?? []
    const dbPayoutSet = new Set<string>()

    const corridorBreakdown = rows.map((row) => {
      const payoutMethods = row.payout_methods ?? []
      const payinMethods = row.payin_methods ?? []
      for (const m of payoutMethods) {
        if (m && m !== 'other') dbPayoutSet.add(m)
      }
      return {
        corridorId: row.corridor_id,
        payinMethods,
        payoutMethods,
        isSupported: row.is_supported,
        lastVerifiedAt: row.last_verified_at,
      }
    })

    const dbPayoutMethods = [...dbPayoutSet].sort()
    const codeMapPayoutMethods = await loadCodeMapMethods(providerId)
    const codeMapSet = new Set(codeMapPayoutMethods)
    const unmappedInDb = dbPayoutMethods.filter(m => !codeMapSet.has(m))
    const missingFromDb = codeMapPayoutMethods.filter(m => !dbPayoutSet.has(m))

    reports.push({
      providerId,
      corridorsWithCapability: rows.length,
      dbPayoutMethods,
      codeMapPayoutMethods,
      unmappedInDb,
      missingFromDb,
      hasCapabilityProbe: CAPABILITY_PROBE_PROVIDERS.has(providerId),
      corridorBreakdown,
    })
  }

  return reports
}

export const formatProviderDeliveryDiscoveryReport = (reports: ProviderReport[]): string => {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════',
    '  PROVIDER DELIVERY METHOD COVERAGE REPORT',
    `  Generated: ${new Date().toISOString()}`,
    `  Canonical payout methods: ${canonicalPayoutMethods.join(', ')}`,
    '═══════════════════════════════════════════════════════',
    '',
  ]

  const summary = {
    total: reports.length,
    withData: reports.filter(r => r.corridorsWithCapability > 0).length,
    withProbe: reports.filter(r => r.hasCapabilityProbe).length,
    withGaps: reports.filter(r => r.unmappedInDb.length > 0 || r.missingFromDb.length > 0).length,
  }

  lines.push(`  Providers: ${summary.total} total, ${summary.withData} with DB data, ${summary.withProbe} with live probe`)
  lines.push(`  Providers with method gaps: ${summary.withGaps}`)
  lines.push('')

  for (const report of reports) {
    const status = report.corridorsWithCapability > 0 ? '✓' : '✗'
    lines.push(`──── ${status} ${report.providerId} ────`)
    lines.push(`  Corridors in DB: ${report.corridorsWithCapability}`)
    lines.push(`  DB payout methods:       [${report.dbPayoutMethods.join(', ')}]`)
    lines.push(`  Code-map payout methods: [${report.codeMapPayoutMethods.join(', ')}]`)
    lines.push(`  Has capability probe:    ${report.hasCapabilityProbe}`)

    if (report.unmappedInDb.length > 0) {
      lines.push(`  ⚠ In DB but not in code-map: [${report.unmappedInDb.join(', ')}]`)
    }
    if (report.missingFromDb.length > 0) {
      lines.push(`  ⚠ In code-map but never seen in DB: [${report.missingFromDb.join(', ')}]`)
    }
    if (report.unmappedInDb.length === 0 && report.missingFromDb.length === 0 && report.corridorsWithCapability > 0) {
      lines.push('  ✓ DB and code-map are consistent')
    }

    lines.push('')
  }

  return lines.join('\n')
}

export const runProviderDeliveryDiscovery = async (
  options: ProviderDeliveryDiscoveryOptions = {},
): Promise<ProviderReport[]> => {
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const ownsPool = !options.pool

  try {
    const allProviderIds = getProviderIds()
    const targetFilter = options.providerIds
      ?? (process.env.DISCOVERY_PROVIDERS
        ? process.env.DISCOVERY_PROVIDERS.split(',').map(id => id.trim())
        : null)
    const providerIds = targetFilter
      ? targetFilter.filter(id => allProviderIds.includes(id))
      : allProviderIds

    const outputFormat = options.outputFormat ?? ((process.env.DISCOVERY_OUTPUT_FORMAT || 'text').toLowerCase() as 'json' | 'text' | 'log')

    logger.info('discovery_start', {
      providers: providerIds.length,
      output_format: outputFormat,
    })

    const reports = await buildReport(pool, providerIds)

    if (outputFormat === 'json') {
      process.stdout.write(JSON.stringify(reports, null, 2) + '\n')
    } else if (outputFormat === 'text') {
      process.stdout.write(formatProviderDeliveryDiscoveryReport(reports) + '\n')
    }

    logger.info('discovery_complete', {
      providers: reports.length,
      providers_with_data: reports.filter(r => r.corridorsWithCapability > 0).length,
      providers_with_gaps: reports.filter(r => r.unmappedInDb.length > 0 || r.missingFromDb.length > 0).length,
    })
    return reports
  } finally {
    if (ownsPool) {
      await pool.end()
    }
  }
}

if (require.main === module) {
  runProviderDeliveryDiscovery().catch((error) => {
    logger.error('discovery_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
