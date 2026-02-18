/**
 * Evidence: provider capability probe (DB + live probe)
 *
 * Goal:
 * - Bound output for LLM use: aggregate + small samples only.
 * - Capture unsupported/failed capability probes deterministically.
 *
 * Required env:
 * - DATABASE_URL_PLANE_B
 *
 * Optional env:
 * - ENVIRONMENT (dev|staging|prod)
 * - CASE_ID
 * - CAPABILITY_PROBE_LIMIT (default 25)
 * - CAPABILITY_PROBE_AMOUNT_BUCKET (default 500)
 * - CAPABILITY_PROBE_PAYIN_METHOD (default bank_transfer)
 * - CAPABILITY_PROBE_PAYOUT_METHOD (default bank_deposit)
 * - CAPABILITY_PROBE_TIERS (default tier_1,tier_2)
 */

import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { initTracing } from '../../shared/tracing'
import { resolveProviderSupport } from '../../plane-b/src/services/provider-capability'
import { providerRegistry } from '../../plane-b/src/providers'
import { getGithubActionsRunUrl, resolveCaseEnv, writeEvidenceResult, type EvidenceFinding } from '../lib/evidence'

const logger = createLogger('script.provider-capability-probe-evidence')
initTracing('provider-capability-probe-evidence')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const limitPerProvider = Math.max(1, toNumber(process.env.CAPABILITY_PROBE_LIMIT, 25))
const amountBucket = Math.max(1, toNumber(process.env.CAPABILITY_PROBE_AMOUNT_BUCKET, 500))
const payinMethod = process.env.CAPABILITY_PROBE_PAYIN_METHOD || 'bank_transfer'
const payoutMethod = process.env.CAPABILITY_PROBE_PAYOUT_METHOD || 'bank_deposit'

const targetTiers = (process.env.CAPABILITY_PROBE_TIERS || 'tier_1,tier_2')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

const loadTierCorridors = async (pool: ReturnType<typeof createPool>) => {
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
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.provider_corridor_capability
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )
  return new Set(result.rows.map(row => row.corridor_id).filter(Boolean))
}

export const runProviderCapabilityProbeEvidence = async () => {
  const env = resolveCaseEnv(process.env.ENVIRONMENT)
  const caseId = String(process.env.CASE_ID || `case-capability-probe-${Date.now()}`).trim()

  const pool = createPool(config.db.planeBUrl)
  try {
    const tierCorridors = await loadTierCorridors(pool)
    if (!tierCorridors.length) {
      const findings: EvidenceFinding[] = [{
        reason_code: 'capability.probe_failed',
        severity: 'sev2',
        message: 'No tier corridors found for capability probe (check CAPABILITY_PROBE_TIERS).',
        details: { tiers: targetTiers },
      }]
      writeEvidenceResult({
        success: false,
        generated_at: new Date().toISOString(),
        environment: env,
        case_id: caseId,
        skill_id: 'evidence.provider_capability_probe.github_actions',
        summary: 'Capability probe could not run: no corridors found for requested tiers.',
        findings,
        recommended_next_skill_ids: [],
        pointers: [],
        budgets: { max_findings: 25, max_pointer_items: 20, max_details_bytes_each: 2048 },
      })
      return
    }

    type ProviderAgg = {
      provider_id: string
      probed: number
      supported: number
      unsupported: number
      failed: number
      sample_unsupported: string[]
      sample_failed: Array<{ corridor_id: string; error: string }>
    }

    const perProvider: ProviderAgg[] = []

    for (const provider of providerRegistry) {
      const providerId = provider.providerId
      const existing = await loadExistingCapability(pool, providerId)
      const supportedList = provider.supportedCorridors
      const candidateSet = supportedList.length
        ? tierCorridors.filter(corridor => supportedList.includes(corridor))
        : tierCorridors
      const candidates = candidateSet.filter(corridor => !existing.has(corridor))

      if (!candidates.length) continue

      const agg: ProviderAgg = {
        provider_id: providerId,
        probed: 0,
        supported: 0,
        unsupported: 0,
        failed: 0,
        sample_unsupported: [],
        sample_failed: [],
      }

      for (const corridorId of candidates) {
        if (agg.probed >= limitPerProvider) break
        try {
          const decision = await resolveProviderSupport(
            pool,
            {
              provider_id: providerId,
              corridor_id: corridorId,
              amount_bucket: amountBucket,
              payin_method: payinMethod,
              payout_method: payoutMethod,
              send_amount: amountBucket,
              locale: 'en-US',
            },
            { allowProbe: true },
          )
          agg.probed += 1
          if (decision.supported) {
            agg.supported += 1
          } else {
            agg.unsupported += 1
            if (agg.sample_unsupported.length < 20) agg.sample_unsupported.push(corridorId)
          }
        } catch (error) {
          agg.probed += 1
          agg.failed += 1
          if (agg.sample_failed.length < 10) {
            agg.sample_failed.push({
              corridor_id: corridorId,
              error: error instanceof Error ? error.message : String(error),
            })
          }
          logger.warn('capability_probe_error', { provider_id: providerId, corridor_id: corridorId, error: error instanceof Error ? error.message : String(error) })
        }
      }

      perProvider.push(agg)
    }

    const totals = perProvider.reduce((acc, p) => {
      acc.providers += 1
      acc.probed += p.probed
      acc.supported += p.supported
      acc.unsupported += p.unsupported
      acc.failed += p.failed
      return acc
    }, { providers: 0, probed: 0, supported: 0, unsupported: 0, failed: 0 })

    const topUnsupported = perProvider
      .filter(p => p.unsupported > 0)
      .sort((a, b) => b.unsupported - a.unsupported)
      .slice(0, 10)
      .map(p => ({ provider: p.provider_id, unsupported: p.unsupported, sample_corridors: p.sample_unsupported.slice(0, 5) }))

    const topFailed = perProvider
      .filter(p => p.failed > 0)
      .sort((a, b) => b.failed - a.failed)
      .slice(0, 10)
      .map(p => ({ provider: p.provider_id, failed: p.failed, sample: p.sample_failed.slice(0, 2) }))

    const findings: EvidenceFinding[] = [
      {
        reason_code: 'capability.probe_supported',
        severity: 'sev3',
        message: 'Capability probe aggregate results.',
        details: {
          tiers: targetTiers,
          limit_per_provider: limitPerProvider,
          amount_bucket: amountBucket,
          payin_method: payinMethod,
          payout_method: payoutMethod,
          totals,
        },
      },
    ]

    if (totals.unsupported > 0) {
      findings.push({
        reason_code: 'capability.probe_unsupported',
        severity: 'sev1',
        message: 'One or more capability probes returned unsupported.',
        details: { top_unsupported: topUnsupported },
      })
    }

    if (totals.failed > 0) {
      findings.push({
        reason_code: 'capability.probe_failed',
        severity: 'sev2',
        message: 'One or more capability probes failed (exceptions).',
        details: { top_failed: topFailed },
      })
    }

    const recommended = new Set<string>()
    if (totals.unsupported > 0 || totals.failed > 0) {
      recommended.add('evidence.provider_health.github_actions')
    }

    const pointers: Array<{ kind: any; ref: string; note?: string }> = []
    const runUrl = getGithubActionsRunUrl()
    if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'GitHub Actions run for this evidence pack.' })

    const summary =
      totals.unsupported > 0 || totals.failed > 0
        ? `Capability probe found unsupported=${totals.unsupported} failed=${totals.failed} across ${totals.providers} providers.`
        : `Capability probe results: supported=${totals.supported} across ${totals.providers} providers.`

    writeEvidenceResult({
      success: totals.failed === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.provider_capability_probe.github_actions',
      summary,
      findings,
      recommended_next_skill_ids: Array.from(recommended.values()),
      pointers,
      budgets: { max_findings: 25, max_pointer_items: 20, max_details_bytes_each: 2048 },
    })
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runProviderCapabilityProbeEvidence().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('provider_capability_probe_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
    process.exit(1)
  })
}

