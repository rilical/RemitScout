import type { Pool } from 'pg'
import { config } from '../../shared/config'
import { listProviders } from '../../shared/provider-catalog'

export type DiscoveryAutoApplyDecision = {
  allowed: boolean
  reasons: string[]
  gating: {
    providerInCatalog: boolean
    certificationEligible: boolean
    noOpenCircuit: boolean
    noPriorApplyFailure: boolean
    rightsActive: boolean
    stagingCertifiedForProd: boolean
  }
}

export type DiscoveryAutoApplyInput = {
  providerId: string
  scanId: number
  certificationResult?: {
    status: string
    evidence_confidence: string
  } | null
  environment?: string
}

export const evaluateDiscoveryAutoApplyPolicy = async (
  pool: Pool,
  input: DiscoveryAutoApplyInput,
): Promise<DiscoveryAutoApplyDecision> => {
  const environment = String(input.environment || config.env || 'dev').trim().toLowerCase()
  const providerInCatalog = listProviders().includes(input.providerId as any)
  const certificationEligible = (
    String(input.certificationResult?.status || '') === 'certified'
    && String(input.certificationResult?.evidence_confidence || '') !== 'static_fallback'
  )

  const [circuitResult, rightsResult, priorFailureResult, stagingResult] = await Promise.all([
    pool.query(
      `SELECT EXISTS (
         SELECT 1
           FROM silver.circuit_breaker
          WHERE provider_id = $1
            AND state = 'open'
       ) AS has_open_circuit`,
      [input.providerId],
    ),
    pool.query(
      `SELECT stoplist_status
         FROM silver.rights_matrix
        WHERE provider_id = $1
        LIMIT 1`,
      [input.providerId],
    ),
    pool.query(
      `SELECT EXISTS (
         SELECT 1
           FROM silver.discovery_scan
          WHERE provider_id = $1
            AND id <> $2
            AND apply_status = 'failed'
       ) AS has_failed_apply`,
      [input.providerId, input.scanId],
    ),
    environment === 'prod'
      ? pool.query(
          `SELECT EXISTS (
             SELECT 1
               FROM silver.provider_certification_result result
               JOIN silver.provider_certification_run run
                 ON run.run_id = result.run_id
              WHERE result.provider_id = $1
                AND result.status = 'certified'
                AND result.evidence_confidence <> 'static_fallback'
                AND run.environment = 'staging'
              ORDER BY run.created_at DESC
              LIMIT 1
           ) AS has_staging_certification`,
          [input.providerId],
        )
      : Promise.resolve({ rows: [{ has_staging_certification: true }] }),
  ])

  const noOpenCircuit = circuitResult.rows[0]?.has_open_circuit !== true
  const rightsActive = !rightsResult.rows[0]?.stoplist_status || String(rightsResult.rows[0].stoplist_status).toLowerCase() === 'active'
  const noPriorApplyFailure = priorFailureResult.rows[0]?.has_failed_apply !== true
  const stagingCertifiedForProd = stagingResult.rows[0]?.has_staging_certification === true

  const reasons: string[] = []
  if (!providerInCatalog) reasons.push('provider_not_in_catalog')
  if (!certificationEligible) reasons.push('provider_not_certified_for_auto_apply')
  if (!noOpenCircuit) reasons.push('provider_circuit_open')
  if (!rightsActive) reasons.push('provider_stoplisted')
  if (!noPriorApplyFailure) reasons.push('prior_apply_failure_unresolved')
  if (environment === 'prod' && !stagingCertifiedForProd) reasons.push('no_staging_certification_for_production')

  return {
    allowed: reasons.length === 0,
    reasons,
    gating: {
      providerInCatalog,
      certificationEligible,
      noOpenCircuit,
      noPriorApplyFailure,
      rightsActive,
      stagingCertifiedForProd,
    },
  }
}
