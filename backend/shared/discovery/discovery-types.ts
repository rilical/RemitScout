/**
 * Discovery system output types.
 *
 * Used by provider discovery scripts to report discovered corridors,
 * delivery methods, and promotional offers. Results feed into the
 * diff reporter for human review before rights-matrix updates.
 *
 * Canonical location: backend/shared/discovery/discovery-types.ts
 * Re-exported from plane-b for backward compatibility.
 */

// ── Discovered corridor ──────────────────────────────────────────────

export type DiscoveredCorridor = {
  /** ISO 3166 alpha-2 source country */
  sourceCountry: string
  /** ISO 3166 alpha-2 destination country */
  destinationCountry: string
  /** ISO 4217 source currency */
  sourceCurrency: string
  /** ISO 4217 destination currency */
  destinationCurrency: string
  /** Computed corridor ID in "US-MX-USD-MXN" format */
  corridorId: string
  /** Canonical payin methods available for this corridor */
  payinMethods: string[]
  /** Canonical payout methods available for this corridor */
  payoutMethods: string[]
}

// ── Discovered delivery method ───────────────────────────────────────

export type DiscoveredDeliveryMethod = {
  /** Corridor this method applies to (null = applies globally) */
  corridorId: string | null
  /** Exact text label from provider UI */
  rawPayinLabel: string
  /** Mapped to canonical method via code-map */
  normalizedPayin: string
  /** Exact text label from provider UI */
  rawPayoutLabel: string
  /** Mapped to canonical method via code-map */
  normalizedPayout: string
  /** True if no code-map match exists (needs manual review) */
  unmapped: boolean
}

// ── Discovered promotion ─────────────────────────────────────────────

export type DiscoveredPromotionType =
  | 'zero_fee'
  | 'reduced_fee'
  | 'bonus_rate'
  | 'first_transfer'
  | 'referral'
  | 'seasonal'
  | 'unknown'

export type DiscoveredPromotion = {
  /** Classification of the promotion */
  type: DiscoveredPromotionType
  /** Corridor this promo applies to (null = global) */
  corridorId: string | null
  /** Exact promo text from the page */
  rawText: string
  /** Whether a strikethrough price was detected */
  strikethroughDetected: boolean
  /** Original value before promo (e.g., "$4.99") */
  originalValue: string | null
  /** Promotional value (e.g., "$0.00") */
  promoValue: string | null
  /** ISO date if an expiry was detected */
  expiresAt: string | null
  /** CSS selector where the promo was found (for debugging) */
  bannerSelector: string | null
}

// ── Discovery errors ─────────────────────────────────────────────────

export type DiscoveryError = {
  /** Step where the error occurred */
  step: string
  /** CSS selector that failed (if applicable) */
  selector: string | null
  /** Error message */
  message: string
  /** S3 key of debug screenshot (if captured) */
  screenshot: string | null
  /** Whether the discovery can continue past this error */
  recoverable: boolean
}

// ── Discovery result (top-level output) ──────────────────────────────

export type DiscoveryResult = {
  /** Provider ID from catalog */
  providerId: string
  /** ISO 8601 timestamp when the scan started */
  scannedAt: string
  /** All discovered corridors */
  corridors: DiscoveredCorridor[]
  /** All discovered delivery methods */
  deliveryMethods: DiscoveredDeliveryMethod[]
  /** All detected promotions */
  promotions: DiscoveredPromotion[]
  /** Errors encountered during discovery */
  errors: DiscoveryError[]
  /** Scan metadata */
  metadata: {
    durationMs: number
    pagesVisited: number
    screenshotCount: number
    sessionReused: boolean
    robotsTxtHonored: boolean
  }
}

// ── Discovery run options ────────────────────────────────────────────

export type DiscoveryRunOptions = {
  /** Maximum corridors to probe per provider */
  maxCorridors?: number
  /** Whether to capture screenshots for debugging */
  screenshotsEnabled?: boolean
  /** Navigation timeout per page in ms */
  navigationTimeoutMs?: number
  /** Source of this scan trigger */
  triggeredBy: 'schedule' | 'agent' | 'manual'
  /** Correlation ID for tracing */
  correlationId?: string
}
