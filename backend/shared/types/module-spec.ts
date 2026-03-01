import type { ProviderId } from '../provider-catalog'

/**
 * Module lifecycle states.
 *
 * Modules progress through these states during onboarding:
 * - candidate: discovered or proposed, not yet integrated
 * - sandbox: running in shadow mode, data not published
 * - beta: data flowing to silver, awaiting quality gate
 * - production: fully live, data published to gold
 * - deprecated: scheduled for removal
 * - quarantined: temporarily disabled due to failures
 */
export type ModuleStatus = 'candidate' | 'sandbox' | 'beta' | 'production' | 'deprecated' | 'quarantined'

/**
 * Reasons a module may be quarantined.
 */
export type ModuleQuarantineReason =
  | 'consecutive_failures'
  | 'parse_error_spike'
  | 'rate_limit_exceeded'
  | 'data_integrity_violation'
  | 'manual_intervention'
  | 'contract_test_failure'
  | 'security_concern'

/**
 * Policy flags that govern module behavior.
 */
export type PolicyFlags = {
  /** Whether the module can auto-heal without human approval */
  autoHealEnabled: boolean
  /** Whether observations are emitted to the observation pipeline */
  emitObservations: boolean
  /** Whether the module is included in gold index computation */
  includeInGold: boolean
  /** Maximum consecutive failures before quarantine */
  maxConsecutiveFailures: number
  /** Maximum parse error rate (0-1) before quarantine */
  maxParseErrorRate: number
  /** Cooldown period in ms after quarantine before retry */
  quarantineCooldownMs: number
}

/**
 * Runtime state snapshot for a module.
 */
export type ModuleRuntimeState = {
  status: ModuleStatus
  lastSuccessAt: string | null
  lastFailureAt: string | null
  consecutiveFailures: number
  parseErrorRate: number
  quarantineReason: ModuleQuarantineReason | null
  quarantinedAt: string | null
  lastHealthCheckAt: string | null
}

/**
 * Module specification — the canonical definition of a data source module.
 *
 * Each provider + collector_type combination maps to one ModuleSpec entry.
 * This replaces ad-hoc provider registration with a structured, policy-governed contract.
 */
export type ModuleSpec = {
  /** Unique module identifier: `${providerId}:${collectorType}` */
  moduleId: string
  /** Provider this module belongs to */
  providerId: ProviderId
  /** Collector type (e.g., 'http', 'playwright', 'api') */
  collectorType: string
  /** Human-readable display name */
  displayName: string
  /** Current lifecycle status */
  status: ModuleStatus
  /** Corridors this module covers */
  supportedCorridors: string[]
  /** Amount buckets this module covers */
  supportedAmountBuckets: number[]
  /** Payin method */
  payinMethod: string
  /** Payout method */
  payoutMethod: string
  /** Policy flags governing behavior */
  policy: PolicyFlags
  /** Runtime state (populated from DB/cache at runtime) */
  runtime?: ModuleRuntimeState
  /** Version of the module specification schema */
  specVersion: number
  /** When this module was registered */
  registeredAt: string
  /** When this module spec was last updated */
  updatedAt: string
}

/**
 * Default policy flags for new modules.
 */
export const DEFAULT_POLICY_FLAGS: PolicyFlags = {
  autoHealEnabled: false,
  emitObservations: false,
  includeInGold: true,
  maxConsecutiveFailures: 5,
  maxParseErrorRate: 0.3,
  quarantineCooldownMs: 300_000, // 5 minutes
}
