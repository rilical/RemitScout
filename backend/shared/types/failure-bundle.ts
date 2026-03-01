/**
 * Failure severity classification.
 */
export type FailureSeverity = 'transient' | 'degraded' | 'persistent' | 'critical'

/**
 * Failure classification categories.
 */
export type FailureCategory =
  | 'network'
  | 'parse'
  | 'rate_limit'
  | 'auth'
  | 'dom_change'
  | 'data_integrity'
  | 'timeout'
  | 'server_error'
  | 'unknown'

/**
 * Fetcher source — identifies the collector layer that produced (or failed to produce) data.
 *
 * Used to route repair work to the correct agent: HTTP layer issues go to
 * stress-responder, Playwright/DOM issues go to patch-proposer for selector
 * regeneration, and API layer issues may need contract renegotiation.
 */
export type FetcherSource = 'http' | 'playwright' | 'api' | 'hybrid' | 'unknown'

/**
 * Layer classification — describes which part of the collection stack failed.
 *
 * - `fetch`: The HTTP/network request itself failed (timeout, DNS, TLS, etc.)
 * - `parse`: The response was received but could not be parsed into structured data
 * - `transform`: Parsing succeeded but the normalization/transformation step failed
 * - `validate`: Data was parsed and transformed but failed validation checks
 */
export type FailureLayer = 'fetch' | 'parse' | 'transform' | 'validate'

/**
 * FailureBundle — aggregated failure evidence for agent self-healing.
 *
 * When a module experiences persistent failures, the system creates a FailureBundle
 * that packages all relevant context for the repair agent to diagnose and propose fixes.
 *
 * Persisted to `silver.failure_bundle`.
 */
export type FailureBundle = {
  /** Unique bundle ID (UUID v4) */
  bundleId: string
  /** Module experiencing failures */
  moduleId: string
  /** Provider ID */
  providerId: string
  /** Collector type */
  collectorType: string
  /** Failure severity */
  severity: FailureSeverity
  /** Failure category */
  category: FailureCategory
  /** Number of consecutive failures */
  consecutiveFailures: number
  /** First failure timestamp (ISO 8601) */
  firstFailureAt: string
  /** Most recent failure timestamp (ISO 8601) */
  lastFailureAt: string
  /** Bundle creation timestamp (ISO 8601) */
  createdAt: string
  /** Representative error message */
  errorMessage: string
  /** Representative error type */
  errorType: string
  /** HTTP status codes observed (deduplicated) */
  httpStatuses: number[]
  /** Affected corridors */
  affectedCorridors: string[]
  /** DOM signature hash (if applicable) */
  domSignatureHash: string | null
  /** Previous DOM signature hash (for change detection) */
  previousDomSignatureHash: string | null
  /** Recent failure observation IDs for evidence trail */
  observationIds: string[]
  /** Quality flags observed in failed quotes (e.g., parse_error, negative_fee) */
  qualityFlags: string[]
  /** Whether a repair has been attempted */
  repairAttempted: boolean
  /** Repair outcome if attempted */
  repairOutcome: 'pending' | 'proposed' | 'applied' | 'rejected' | 'failed' | null
  /** Repair PR URL if proposed */
  repairPrUrl: string | null
  /** Fetcher source — which collector layer produced the failure evidence */
  fetcherSource: FetcherSource
  /** Failure layer — which part of the collection stack failed */
  failureLayer: FailureLayer
}

/**
 * Thresholds for triggering failure bundle creation.
 */
export type FailureBundleThresholds = {
  /** Consecutive failures to trigger a bundle */
  consecutiveFailureThreshold: number
  /** Parse error rate (0-1) to trigger a bundle */
  parseErrorRateThreshold: number
  /** Time window in ms for rate calculation */
  rateWindowMs: number
  /** Minimum observations in window for rate to be meaningful */
  minObservationsForRate: number
}

/**
 * Default failure bundle thresholds.
 */
export const DEFAULT_FAILURE_BUNDLE_THRESHOLDS: FailureBundleThresholds = {
  consecutiveFailureThreshold: 5,
  parseErrorRateThreshold: 0.3,
  rateWindowMs: 3_600_000, // 1 hour
  minObservationsForRate: 10,
}

/**
 * Infer the fetcher source from the collector type string.
 *
 * Mapping logic:
 * - Collector types containing 'playwright' or 'browser' -> 'playwright'
 * - Collector types containing 'api' or 'b2b' -> 'api'
 * - Collector types containing 'hybrid' -> 'hybrid'
 * - Default -> 'http'
 */
export function inferFetcherSource(collectorType: string): FetcherSource {
  const ct = collectorType.toLowerCase()
  if (ct.includes('playwright') || ct.includes('browser')) return 'playwright'
  if (ct.includes('api') || ct.includes('b2b')) return 'api'
  if (ct.includes('hybrid')) return 'hybrid'
  if (ct.includes('collector') || ct.includes('http')) return 'http'
  return 'unknown'
}

/**
 * Infer the failure layer from the failure category and error evidence.
 *
 * Mapping logic:
 * - network/timeout/rate_limit/auth/server_error -> 'fetch' layer
 * - parse/dom_change -> 'parse' layer
 * - data_integrity -> 'validate' layer
 * - unknown -> inferred from error type string
 */
export function inferFailureLayer(
  category: FailureCategory,
  errorType?: string,
): FailureLayer {
  switch (category) {
    case 'network':
    case 'timeout':
    case 'rate_limit':
    case 'auth':
    case 'server_error':
      return 'fetch'
    case 'parse':
    case 'dom_change':
      return 'parse'
    case 'data_integrity':
      return 'validate'
    case 'unknown': {
      if (!errorType) return 'fetch'
      const et = errorType.toLowerCase()
      if (et.includes('parse') || et.includes('type')) return 'parse'
      if (et.includes('transform') || et.includes('normalize')) return 'transform'
      if (et.includes('valid') || et.includes('integrity')) return 'validate'
      return 'fetch'
    }
    default:
      return 'fetch'
  }
}
