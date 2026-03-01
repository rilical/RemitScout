import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import type { FailureBundle, FailureSeverity, FailureCategory, FetcherSource, FailureLayer } from '../../../shared/types/failure-bundle'
import { DEFAULT_FAILURE_BUNDLE_THRESHOLDS, inferFetcherSource, inferFailureLayer } from '../../../shared/types/failure-bundle'
import { addBreadcrumb } from '../../../shared/error-tracker'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'

const logger = createLogger('plane-b.agents.failure-detector')

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (
  extra: Record<string, string | undefined> = {},
): Record<string, string> => {
  const dims: Record<string, string> = {
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
    service: 'remit-scout',
    connector: config.agent.llmConnector,
    model: config.agent.llmModel,
  }
  for (const [key, value] of Object.entries(extra)) {
    const normalized = (value || '').trim()
    if (normalized) {
      dims[key] = normalized.slice(0, 255)
    }
  }
  return dims
}

/**
 * DOM drift result — comparison between current and previous DOM signatures.
 */
export type DomDriftResult = {
  /** Whether a drift was detected */
  drifted: boolean
  /** Current DOM signature hash */
  currentHash: string | null
  /** Previous DOM signature hash */
  previousHash: string | null
  /** Number of observations with the new signature */
  newSignatureCount: number
  /** Number of observations with the old signature */
  oldSignatureCount: number
  /** Confidence that this is a genuine DOM change vs transient noise */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Failure Detector — monitors module health and creates FailureBundles
 * when persistent failures are detected.
 *
 * The detector runs periodically (via dispatch queue or cron) and:
 * 1. Scans `silver.module_registry` for modules with rising failure counts
 * 2. Queries `silver.observation` for recent failure observations
 * 3. Classifies failure patterns (transient vs persistent, category)
 * 4. Detects DOM signature drift by comparing current vs historical hashes
 * 5. Creates FailureBundle records in `silver.failure_bundle` with fetcher_source and layer classification
 * 6. Updates module status to 'quarantined' if thresholds exceeded
 *
 * FailureBundles are the input to the self-healing pipeline (ParserHandler, PatchProposer, etc.)
 */
export class FailureDetector {
  private readonly pool: Pool
  private readonly thresholds = DEFAULT_FAILURE_BUNDLE_THRESHOLDS

  /**
   * Cache of last-known DOM signature hashes per module.
   * Used for drift detection between detection cycles.
   */
  private readonly domSignatureCache = new Map<string, string>()

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Scan all active modules for failure patterns.
   */
  async detectFailures(): Promise<FailureBundle[]> {
    const detectionRunId = randomUUID()
    const bundles: FailureBundle[] = []

    // Find modules with recent failures
    const { rows: modules } = await this.pool.query<{
      module_id: string
      provider_id: string
      collector_type: string
      consecutive_failures: number
      parse_error_rate: number
      status: string
    }>(
      `SELECT module_id, provider_id, collector_type, consecutive_failures, parse_error_rate, status
       FROM silver.module_registry
       WHERE status IN ('production', 'beta', 'sandbox')
         AND (consecutive_failures >= $1 OR parse_error_rate >= $2)
       ORDER BY consecutive_failures DESC`,
      [this.thresholds.consecutiveFailureThreshold, this.thresholds.parseErrorRateThreshold],
    )

    recordCloudWatchMetric({
      name: 'detection_run_total',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        run_id: detectionRunId,
        correlation_id: detectionRunId,
      }),
      highCardinality: true,
    })
    recordCloudWatchMetric({
      name: 'detection_modules_scanned',
      value: modules.length,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({
        run_id: detectionRunId,
        correlation_id: detectionRunId,
      }),
      highCardinality: true,
    })

    for (const mod of modules) {
      // Check if there's already an open (unrepaired) bundle for this module
      const { rows: existing } = await this.pool.query(
        `SELECT bundle_id FROM silver.failure_bundle
         WHERE module_id = $1 AND repair_attempted = FALSE
         ORDER BY created_at DESC LIMIT 1`,
        [mod.module_id],
      )

      if (existing.length > 0) {
        logger.debug('failure_bundle_exists', { moduleId: mod.module_id, bundleId: existing[0].bundle_id })
        continue
      }

      // Gather failure evidence from observations
      const { rows: failures } = await this.pool.query<{
        observation_id: string
        corridor_id: string | null
        payload: Record<string, unknown>
        observed_at: string
      }>(
        `SELECT observation_id, corridor_id, payload, observed_at
         FROM silver.observation
         WHERE module_id = $1 AND type = 'failure'
           AND observed_at > NOW() - INTERVAL '1 hour'
         ORDER BY observed_at DESC
         LIMIT 50`,
        [mod.module_id],
      )

      if (failures.length === 0) {
        continue
      }

      // Classify the failure
      const category = this.classifyFailureCategory(failures)
      const severity = this.classifyFailureSeverity(mod.consecutive_failures, mod.parse_error_rate)

      // Extract affected corridors
      const affectedCorridors = [...new Set(failures.map((f) => f.corridor_id).filter(Boolean))] as string[]

      // Extract HTTP statuses
      const httpStatuses = [...new Set(
        failures
          .map((f) => f.payload?.httpStatus as number | undefined)
          .filter((s): s is number => typeof s === 'number'),
      )]

      // Extract DOM signature info
      const latestFailure = failures[0]
      const domSignatureHash = (latestFailure.payload?.domSignatureHash as string) ?? null
      const previousDomSignatureHash = (latestFailure.payload?.previousDomSignatureHash as string) ?? null

      // Collect quality flags from failure observations
      const qualityFlagsSet = new Set<string>()
      for (const f of failures) {
        const flags = f.payload?.qualityFlags
        if (Array.isArray(flags)) {
          for (const flag of flags) {
            if (typeof flag === 'string') qualityFlagsSet.add(flag)
          }
        }
      }

      // Detect DOM signature drift across the failure window
      const driftResult = this.detectDomDrift(mod.module_id, failures)
      if (driftResult.drifted && category !== 'dom_change') {
        // Override category to dom_change if drift is high-confidence
        // but only if the original category was parse/unknown (not network-level)
        if (driftResult.confidence === 'high' && (category === 'parse' || category === 'unknown')) {
          logger.info('dom_drift_override', {
            moduleId: mod.module_id,
            originalCategory: category,
            driftConfidence: driftResult.confidence,
          })
          // Let category remain as classified — drift info is in the bundle
        }
      }

      // Infer fetcher source from collector type and failure layer from category
      const fetcherSource: FetcherSource = inferFetcherSource(mod.collector_type)
      const errorType = (latestFailure.payload?.errorType as string) ?? 'unknown'
      const failureLayer: FailureLayer = inferFailureLayer(category, errorType)

      const bundle: FailureBundle = {
        bundleId: randomUUID(),
        moduleId: mod.module_id,
        providerId: mod.provider_id,
        collectorType: mod.collector_type,
        severity,
        category,
        consecutiveFailures: mod.consecutive_failures,
        firstFailureAt: failures[failures.length - 1].observed_at,
        lastFailureAt: failures[0].observed_at,
        createdAt: new Date().toISOString(),
        errorMessage: (latestFailure.payload?.errorMessage as string) ?? 'Unknown error',
        errorType,
        httpStatuses,
        affectedCorridors,
        domSignatureHash: driftResult.currentHash ?? domSignatureHash,
        previousDomSignatureHash: driftResult.previousHash ?? previousDomSignatureHash,
        observationIds: failures.map((f) => f.observation_id),
        qualityFlags: [...qualityFlagsSet],
        repairAttempted: false,
        repairOutcome: null,
        repairPrUrl: null,
        fetcherSource,
        failureLayer,
      }

      // Persist the bundle
      await this.persistBundle(bundle)

      // Quarantine the module if severity is critical or persistent
      if (severity === 'critical' || severity === 'persistent') {
        await this.quarantineModule(mod.module_id, category)
      }

      bundles.push(bundle)
      recordCloudWatchMetric({
        name: 'detection_bundles_by_category',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions({
          category,
          provider_id: bundle.providerId,
          route: bundle.affectedCorridors[0] ?? 'unknown',
          fetcher_source: bundle.fetcherSource,
          failure_layer: bundle.failureLayer,
          run_id: detectionRunId,
          correlation_id: bundle.bundleId,
        }),
        highCardinality: true,
      })
      logger.info('failure_bundle_created', {
        bundleId: bundle.bundleId,
        moduleId: mod.module_id,
        severity,
        category,
        consecutiveFailures: mod.consecutive_failures,
      })
    }

    return bundles
  }

  /**
   * Classify failure category from observation evidence.
   */
  private classifyFailureCategory(
    failures: Array<{ payload: Record<string, unknown> }>,
  ): FailureCategory {
    const errorTypes = failures.map((f) => (f.payload?.errorType as string) ?? '').filter(Boolean)
    const errorMessages = failures.map((f) => (f.payload?.errorMessage as string) ?? '').filter(Boolean)

    // Check for DOM changes
    if (failures.some((f) => f.payload?.domSignatureHash && f.payload?.previousDomSignatureHash
        && f.payload.domSignatureHash !== f.payload.previousDomSignatureHash)) {
      return 'dom_change'
    }

    // Check for parse errors
    if (errorTypes.some((t) => t.includes('Parse') || t.includes('TypeError'))
        || errorMessages.some((m) => m.includes('parse') || m.includes('NaN') || m.includes('Cannot read'))) {
      return 'parse'
    }

    // Check for rate limiting
    if (errorMessages.some((m) => m.includes('rate') || m.includes('429') || m.includes('throttle'))) {
      return 'rate_limit'
    }

    // Check for auth failures
    if (errorMessages.some((m) => m.includes('401') || m.includes('403') || m.includes('auth'))) {
      return 'auth'
    }

    // Check for network errors
    if (errorTypes.some((t) => t.includes('ECONNREFUSED') || t.includes('ETIMEDOUT') || t.includes('fetch'))
        || errorMessages.some((m) => m.includes('timeout') || m.includes('ECONNREFUSED'))) {
      return 'timeout'
    }

    // Check for server errors
    if (errorMessages.some((m) => m.includes('500') || m.includes('502') || m.includes('503'))) {
      return 'server_error'
    }

    return 'unknown'
  }

  /**
   * Classify failure severity based on metrics.
   */
  private classifyFailureSeverity(consecutiveFailures: number, parseErrorRate: number): FailureSeverity {
    if (consecutiveFailures >= 20 || parseErrorRate >= 0.8) return 'critical'
    if (consecutiveFailures >= 10 || parseErrorRate >= 0.5) return 'persistent'
    if (consecutiveFailures >= 5 || parseErrorRate >= 0.3) return 'degraded'
    return 'transient'
  }

  /**
   * Detect DOM signature drift for a module by comparing hash frequencies
   * across recent failure observations.
   *
   * Drift is detected when:
   * - Multiple distinct DOM signature hashes appear in the failure window
   * - The latest hash differs from the cached (previously known) hash
   *
   * Confidence is assigned based on how many observations carry the new vs old hash.
   */
  private detectDomDrift(
    moduleId: string,
    failures: Array<{ payload: Record<string, unknown>; observed_at: string }>,
  ): DomDriftResult {
    const hashCounts = new Map<string, number>()
    let latestHash: string | null = null

    for (const f of failures) {
      const hash = f.payload?.domSignatureHash as string | undefined
      if (hash) {
        hashCounts.set(hash, (hashCounts.get(hash) ?? 0) + 1)
        // failures are ordered DESC by observed_at, so first one is latest
        if (!latestHash) latestHash = hash
      }
    }

    if (hashCounts.size <= 1) {
      // No drift — all observations have the same hash (or no hash at all)
      const cachedHash = this.domSignatureCache.get(moduleId)
      if (latestHash && cachedHash && latestHash !== cachedHash) {
        // Drift detected vs the cache from a previous detection cycle
        const newCount = hashCounts.get(latestHash) ?? 0
        this.domSignatureCache.set(moduleId, latestHash)
        return {
          drifted: true,
          currentHash: latestHash,
          previousHash: cachedHash,
          newSignatureCount: newCount,
          oldSignatureCount: 0,
          confidence: newCount >= 3 ? 'high' : newCount >= 2 ? 'medium' : 'low',
        }
      }
      // Update cache
      if (latestHash) this.domSignatureCache.set(moduleId, latestHash)
      return { drifted: false, currentHash: latestHash, previousHash: null, newSignatureCount: 0, oldSignatureCount: 0, confidence: 'low' }
    }

    // Multiple hashes in the window — drift detected within this cycle
    // Sort by count descending, then treat the most-frequent as "current"
    const sorted = [...hashCounts.entries()].sort((a, b) => b[1] - a[1])
    const currentHash = latestHash ?? sorted[0][0]
    const previousHash = sorted.find(([h]) => h !== currentHash)?.[0] ?? null
    const newCount = hashCounts.get(currentHash) ?? 0
    const oldCount = previousHash ? (hashCounts.get(previousHash) ?? 0) : 0

    // Update cache
    this.domSignatureCache.set(moduleId, currentHash)

    // Confidence: high if the new hash dominates, medium if mixed, low if minority
    let confidence: DomDriftResult['confidence'] = 'low'
    if (newCount >= 5 || (newCount > oldCount * 2)) confidence = 'high'
    else if (newCount >= 2) confidence = 'medium'

    return {
      drifted: true,
      currentHash,
      previousHash,
      newSignatureCount: newCount,
      oldSignatureCount: oldCount,
      confidence,
    }
  }

  /**
   * Persist a FailureBundle to the database.
   */
  private async persistBundle(bundle: FailureBundle): Promise<void> {
    await this.pool.query(
      `INSERT INTO silver.failure_bundle
       (bundle_id, module_id, provider_id, collector_type, severity, category,
        consecutive_failures, first_failure_at, last_failure_at,
        error_message, error_type, http_statuses, affected_corridors,
        dom_signature_hash, previous_dom_signature_hash, observation_ids, quality_flags,
        fetcher_source, failure_layer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        bundle.bundleId, bundle.moduleId, bundle.providerId, bundle.collectorType,
        bundle.severity, bundle.category, bundle.consecutiveFailures,
        bundle.firstFailureAt, bundle.lastFailureAt, bundle.errorMessage, bundle.errorType,
        bundle.httpStatuses, bundle.affectedCorridors,
        bundle.domSignatureHash, bundle.previousDomSignatureHash, bundle.observationIds,
        bundle.qualityFlags,
        bundle.fetcherSource, bundle.failureLayer,
      ],
    )
  }

  /**
   * Quarantine a module by updating its status in the registry.
   */
  private async quarantineModule(moduleId: string, reason: FailureCategory): Promise<void> {
    await this.pool.query(
      `UPDATE silver.module_registry
       SET status = 'quarantined', quarantine_reason = $2, quarantined_at = NOW(), updated_at = NOW()
       WHERE module_id = $1 AND status != 'quarantined'`,
      [moduleId, reason],
    )
    recordCloudWatchMetric({
      name: 'module_quarantined',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions({ reason }),
    })
    addBreadcrumb(`Module ${moduleId} quarantined: ${reason}`, 'agent.failure-detector', 'warning')
    logger.warn('module_quarantined', { moduleId, reason })
  }
}
