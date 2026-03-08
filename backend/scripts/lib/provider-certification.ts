import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { getProviderCatalogEntry, listProviders } from '../../shared/provider-catalog'
import { runProviderCapabilityProbe, type CapabilityProbeProviderReport } from '../provider-capability-probe'
import { runProviderDeliveryDiscovery, type ProviderReport } from '../provider-delivery-discovery'
import { runNoQuotesAudit, type NoQuotesAuditPayload } from '../no-quotes-audit'
import {
  collectProviderHealthEvidence,
  type ProviderHealthEvidenceOutput,
} from '../evidence/provider-health-evidence'
import {
  runCorridorProviderForensics,
  type CorridorProviderForensicsPayload,
} from '../corridor-provider-forensics'
import {
  assertCanonicalProviderCoverage,
  getDiscoveryEvidenceProfile,
  resolveEvidenceConfidence,
  type EvidenceConfidence,
} from './provider-reliability'

const logger = createLogger('script.provider-certification')

export type ProviderCertificationStatus = 'certified' | 'degraded' | 'blocked'

export type ProviderCertificationRunOptions = {
  runId?: string
  providerIds?: string[]
  triggeredBy?: 'schedule' | 'agent' | 'manual' | 'automation'
  requestedBy?: string
  reviewOnly?: boolean
  planeABaseUrl?: string
  method?: 'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card'
  amount?: number
  windowHours?: number
  persist?: boolean
  notes?: string
  pool?: Pool
}

export type ProviderCertificationProviderResult = {
  provider_id: string
  status: ProviderCertificationStatus
  evidence_confidence: EvidenceConfidence
  evidence_lane: EvidenceConfidence
  summary: string
  drift_reasons: string[]
  artifact_pointers: Array<{ kind: string; ref: string; note?: string }>
  discovery_scan_id: number | null
  evidence: Record<string, unknown>
}

export type ProviderCertificationRunResult = {
  run_id: string
  status: 'running' | 'completed' | 'failed' | 'partial'
  environment: string
  triggered_by: string
  requested_by: string | null
  review_only: boolean
  catalog_count: number
  provider_count: number
  certified_count: number
  degraded_count: number
  blocked_count: number
  notes: string | null
  results: ProviderCertificationProviderResult[]
}

type DiscoveryScanSnapshot = {
  id: number
  provider_id: string
  status: string
  review_status: string
  apply_status: string
  diff_json: Record<string, unknown> | null
  completed_at: string | null
}

const mapByProvider = <T extends { providerId: string }>(items: T[]): Map<string, T> => {
  return new Map(items.map((item) => [item.providerId, item] as const))
}

const methodToPayout = (method: string): string => {
  if (method === 'cash') return 'cash_pickup'
  if (method === 'wallet') return 'mobile_wallet'
  if (method === 'airtime') return 'airtime'
  if (method === 'home') return 'home_delivery'
  if (method === 'card') return 'debit_card'
  return 'bank_deposit'
}

const methodToPayin = (method: string): string => {
  if (method === 'card') return 'debit_card'
  return 'bank_transfer'
}

const loadLatestDiscoveryScans = async (pool: Pool, providerIds: string[]): Promise<Map<string, DiscoveryScanSnapshot>> => {
  const result = await pool.query(
    `SELECT DISTINCT ON (provider_id)
            id,
            provider_id,
            status,
            review_status,
            apply_status,
            diff_json,
            completed_at::text
       FROM silver.discovery_scan
      WHERE provider_id = ANY($1::text[])
      ORDER BY provider_id, completed_at DESC NULLS LAST, id DESC`,
    [providerIds],
  )

  return new Map(
    result.rows.map((row) => [
      String(row.provider_id),
      {
        id: Number(row.id),
        provider_id: String(row.provider_id),
        status: String(row.status),
        review_status: String(row.review_status),
        apply_status: String(row.apply_status),
        diff_json: (row.diff_json ?? null) as Record<string, unknown> | null,
        completed_at: row.completed_at ?? null,
      },
    ] as const),
  )
}

const loadNoQuotesByProvider = (payload: NoQuotesAuditPayload | null): Map<string, {
  count: number
  sampleCorridorId: string | null
}> => {
  const byProvider = new Map<string, { count: number; sampleCorridorId: string | null }>()
  if (!payload) return byProvider

  for (const item of payload.no_quotes_providers) {
    byProvider.set(item.provider, { count: item.count, sampleCorridorId: null })
  }
  for (const pair of payload.no_quotes_pairs) {
    const entry = byProvider.get(pair.provider) ?? { count: 0, sampleCorridorId: null }
    if (!entry.sampleCorridorId) entry.sampleCorridorId = pair.corridor_id
    byProvider.set(pair.provider, entry)
  }

  return byProvider
}

const summarizeHealthBlockers = (health: ProviderHealthEvidenceOutput): string[] => {
  return health.evidence.findings
    .map((finding) => String(finding.reason_code || '').trim())
    .filter(Boolean)
}

const determineCertificationStatus = (input: {
  evidenceConfidence: EvidenceConfidence
  health: ProviderHealthEvidenceOutput
  delivery: ProviderReport | null
  capability: CapabilityProbeProviderReport | null
  scan: DiscoveryScanSnapshot | null
  noQuotesCount: number
}): { status: ProviderCertificationStatus; driftReasons: string[] } => {
  const driftReasons: string[] = []
  const healthReasons = summarizeHealthBlockers(input.health)

  if (healthReasons.includes('provider.no_recent_runs')) driftReasons.push('provider.no_recent_runs')
  if (healthReasons.includes('provider.no_recent_success')) driftReasons.push('provider.no_recent_success')
  if (healthReasons.includes('provider.circuit_open')) driftReasons.push('provider.circuit_open')
  if (healthReasons.includes('provider.blocked.http_403')) driftReasons.push('provider.blocked.http_403')

  if (input.health.summary.missingCorridors.length > 0) driftReasons.push('freshness_missing')
  if (input.health.summary.staleCorridors.length > 0) driftReasons.push('freshness_stale')
  if (input.noQuotesCount > 0) driftReasons.push('no_quotes')
  if (input.evidenceConfidence === 'static_fallback') driftReasons.push('static_fallback_only')
  if (!input.scan) driftReasons.push('discovery_scan_missing')
  if (input.scan && input.scan.status === 'failed') driftReasons.push('discovery_scan_failed')
  if (input.scan && input.scan.diff_json && input.scan.review_status === 'pending_review') driftReasons.push('discovery_review_pending')
  if (input.scan && input.scan.apply_status === 'failed') driftReasons.push('discovery_apply_failed')
  if ((input.delivery?.missingFromDb.length ?? 0) > 0 || (input.delivery?.unmappedInDb.length ?? 0) > 0) {
    driftReasons.push('delivery_method_gap')
  }
  if ((input.capability?.results.some((entry) => entry.supported) ?? false) === false) {
    driftReasons.push('capability_probe_missing_positive_evidence')
  }

  const blockedReasonSet = new Set([
    'provider.no_recent_runs',
    'provider.no_recent_success',
    'provider.circuit_open',
    'provider.blocked.http_403',
  ])

  if (driftReasons.some((reason) => blockedReasonSet.has(reason))) {
    return { status: 'blocked', driftReasons: Array.from(new Set(driftReasons)) }
  }
  if (driftReasons.length > 0) {
    return { status: 'degraded', driftReasons: Array.from(new Set(driftReasons)) }
  }
  return { status: 'certified', driftReasons: [] }
}

export const runProviderCertification = async (
  options: ProviderCertificationRunOptions = {},
): Promise<ProviderCertificationRunResult> => {
  const inventory = assertCanonicalProviderCoverage()
  const providerIds = (options.providerIds?.length ? options.providerIds : listProviders())
    .map((providerId) => String(providerId).trim().toLowerCase())
    .filter(Boolean)
  const runId = options.runId || randomUUID()
  const triggeredBy = options.triggeredBy || 'manual'
  const requestedBy = options.requestedBy ?? null
  const reviewOnly = options.reviewOnly ?? true
  const method = options.method || 'bank'
  const amount = Number(options.amount ?? 500)
  const windowHours = Number(options.windowHours ?? 6)
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const ownsPool = !options.pool

  const runRecord = {
    run_id: runId,
    status: 'running' as const,
    environment: config.env,
    triggered_by: triggeredBy,
    requested_by: requestedBy,
    review_only: reviewOnly,
    catalog_count: inventory.canonicalCount,
    provider_count: providerIds.length,
    certified_count: 0,
    degraded_count: 0,
    blocked_count: 0,
    notes: options.notes ?? null,
  }

  if (options.persist !== false) {
    await pool.query(
      `INSERT INTO silver.provider_certification_run
         (run_id, environment, status, triggered_by, requested_by, catalog_count, provider_count, review_only, notes)
       VALUES ($1, $2, 'running', $3, $4, $5, $6, $7, $8)`,
      [
        runId,
        config.env,
        triggeredBy,
        requestedBy,
        inventory.canonicalCount,
        providerIds.length,
        reviewOnly,
        options.notes ?? null,
      ],
    )
  }

  try {
    const [scanByProvider, deliveryReports, capabilityReports, noQuotesPayload] = await Promise.all([
      loadLatestDiscoveryScans(pool, providerIds),
      runProviderDeliveryDiscovery({ providerIds, outputFormat: 'log', pool }),
      runProviderCapabilityProbe({
        providerIds,
        payinMethod: methodToPayin(method),
        payoutMethod: methodToPayout(method),
        outputFormat: 'log',
        pool,
      }),
      options.planeABaseUrl
        ? runNoQuotesAudit({
            baseUrl: options.planeABaseUrl,
            providers: providerIds,
            amount,
            method,
            refresh: false,
          })
        : Promise.resolve(null),
    ])

    const deliveryByProvider = mapByProvider(deliveryReports)
    const capabilityByProvider = mapByProvider(capabilityReports)
    const noQuotesByProvider = loadNoQuotesByProvider(noQuotesPayload)

    const results: ProviderCertificationProviderResult[] = []

    for (const providerId of providerIds) {
      const catalogEntry = getProviderCatalogEntry(providerId as any)
      const health = await collectProviderHealthEvidence({
        providerId,
        windowHours,
        pool,
      })
      const delivery = deliveryByProvider.get(providerId) ?? null
      const capability = capabilityByProvider.get(providerId) ?? null
      const scan = scanByProvider.get(providerId) ?? null
      const noQuotes = noQuotesByProvider.get(providerId) ?? { count: 0, sampleCorridorId: null }
      const hasPositiveCapabilityProbe = capability?.results.some((entry) => entry.supported) ?? false
      const hasFreshQuotes = (
        health.summary.missingCorridors.length === 0
        && health.summary.staleCorridors.length === 0
      )
      const evidenceConfidence = resolveEvidenceConfidence({
        providerId,
        hasPositiveCapabilityProbe,
        hasFreshQuotes,
      })
      const { status, driftReasons } = determineCertificationStatus({
        evidenceConfidence,
        health,
        delivery,
        capability,
        scan,
        noQuotesCount: noQuotes.count,
      })
      const forensics = noQuotes.sampleCorridorId
        ? await runCorridorProviderForensics({
            corridorId: noQuotes.sampleCorridorId,
            amount,
            method,
            pool,
          }).catch(() => null as CorridorProviderForensicsPayload | null)
        : null
      const profile = getDiscoveryEvidenceProfile(providerId)

      const summary = [
        `${catalogEntry?.display_name ?? providerId}`,
        `status=${status}`,
        `lane=${evidenceConfidence}`,
        `runs=${health.summary.runs}`,
        `successes=${health.summary.successRuns}`,
        `missing=${health.summary.missingCorridors.length}`,
        `stale=${health.summary.staleCorridors.length}`,
        `no_quotes=${noQuotes.count}`,
      ].join(' | ')

      results.push({
        provider_id: providerId,
        status,
        evidence_confidence: evidenceConfidence,
        evidence_lane: evidenceConfidence,
        summary,
        drift_reasons: driftReasons,
        artifact_pointers: [
          { kind: 'other', ref: `catalog:${providerId}`, note: catalogEntry?.display_name ?? providerId },
          ...(scan ? [{ kind: 'other', ref: `discovery_scan:${scan.id}`, note: scan.status }] : []),
          ...(forensics ? [{ kind: 'other', ref: `corridor:${forensics.corridor_id}`, note: 'forensics sample' }] : []),
        ],
        discovery_scan_id: scan?.id ?? null,
        evidence: {
          discovery: scan,
          discovery_profile: profile,
          delivery,
          capability,
          no_quotes: noQuotes,
          health: {
            evidence: health.evidence,
            summary: health.summary,
          },
          forensics,
        },
      })
    }

    const certifiedCount = results.filter((result) => result.status === 'certified').length
    const degradedCount = results.filter((result) => result.status === 'degraded').length
    const blockedCount = results.filter((result) => result.status === 'blocked').length
    const runStatus: ProviderCertificationRunResult['status'] = blockedCount > 0 || degradedCount > 0
      ? 'partial'
      : 'completed'

    if (options.persist !== false) {
      for (const result of results) {
        await pool.query(
          `INSERT INTO silver.provider_certification_result
             (run_id, provider_id, status, evidence_confidence, evidence_lane, summary, drift_reasons, artifact_pointers_json, evidence_json, discovery_scan_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            runId,
            result.provider_id,
            result.status,
            result.evidence_confidence,
            result.evidence_lane,
            result.summary,
            result.drift_reasons,
            JSON.stringify(result.artifact_pointers),
            JSON.stringify(result.evidence),
            result.discovery_scan_id,
          ],
        )
      }

      await pool.query(
        `UPDATE silver.provider_certification_run
            SET status = $2,
                certified_count = $3,
                degraded_count = $4,
                blocked_count = $5,
                artifact_manifest_json = $6,
                completed_at = NOW()
          WHERE run_id = $1`,
        [
          runId,
          runStatus,
          certifiedCount,
          degradedCount,
          blockedCount,
          JSON.stringify({
            inventory,
            no_quotes_available: Boolean(noQuotesPayload),
          }),
        ],
      )
    }

    logger.info('provider_certification_complete', {
      runId,
      providerCount: providerIds.length,
      certifiedCount,
      degradedCount,
      blockedCount,
      status: runStatus,
    })

    return {
      ...runRecord,
      status: runStatus,
      certified_count: certifiedCount,
      degraded_count: degradedCount,
      blocked_count: blockedCount,
      results,
    }
  } catch (error) {
    if (options.persist !== false) {
      await pool.query(
        `UPDATE silver.provider_certification_run
            SET status = 'failed',
                error_json = $2,
                completed_at = NOW()
          WHERE run_id = $1`,
        [
          runId,
          JSON.stringify({
            message: error instanceof Error ? error.message : String(error),
            at: new Date().toISOString(),
          }),
        ],
      )
    }
    throw error
  } finally {
    if (ownsPool) {
      await pool.end()
    }
  }
}
