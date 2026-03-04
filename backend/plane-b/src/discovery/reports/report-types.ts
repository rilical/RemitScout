/**
 * Diff report types for discovery results.
 *
 * Produced by comparing discovery output against the current
 * rights_matrix + code-maps. Human reviewers use these diffs
 * to approve or reject rights matrix updates.
 */

// ── Corridor diff ────────────────────────────────────────────────────

export type CorridorDelta = {
  /** Countries the provider serves but we don't have in rights_matrix.source_countries */
  newSourceCountries: string[]
  /** Countries the provider serves but we don't have in rights_matrix.destination_countries */
  newDestinationCountries: string[]
  /** Countries in our rights_matrix but provider no longer appears to serve */
  removedSourceCountries: string[]
  /** Countries in our rights_matrix but provider no longer appears to serve */
  removedDestinationCountries: string[]
  /** Full corridors discovered (for detailed reference) */
  newCorridorIds: string[]
}

// ── Delivery method diff ─────────────────────────────────────────────

export type DeliveryMethodDelta = {
  /** Payin methods discovered on provider but not in our code-map */
  newPayinMethods: string[]
  /** Payout methods discovered on provider but not in our code-map */
  newPayoutMethods: string[]
  /** Methods flagged as unmapped (no code-map match) */
  unmappedLabels: Array<{ raw: string; direction: 'payin' | 'payout' }>
}

// ── Promotion diff ───────────────────────────────────────────────────

export type PromotionDelta = {
  /** Promotions found during discovery */
  discoveredPromos: Array<{
    type: string
    corridorId: string | null
    rawText: string
    strikethroughDetected: boolean
  }>
  /** Whether the provider currently has promo detection in parse.ts */
  hasExistingPromoDetection: boolean
}

// ── Provider diff report ─────────────────────────────────────────────

export type ProviderDiffReport = {
  providerId: string
  scanId: number
  scannedAt: string
  corridorDelta: CorridorDelta
  deliveryMethodDelta: DeliveryMethodDelta
  promotionDelta: PromotionDelta
  /** Aggregate recommendation */
  recommendation: 'no_action' | 'review_corridors' | 'review_methods' | 'review_promos' | 'review_all'
  /** Summary statistics */
  stats: {
    totalCorridorsDiscovered: number
    totalDeliveryMethodsDiscovered: number
    totalPromotionsDetected: number
    totalErrors: number
  }
}

// ── Batch diff report ────────────────────────────────────────────────

export type BatchDiffReport = {
  generatedAt: string
  providerReports: ProviderDiffReport[]
  summary: {
    providersScanned: number
    providersWithChanges: number
    totalNewSourceCountries: number
    totalNewDestinationCountries: number
    totalNewPayinMethods: number
    totalNewPayoutMethods: number
    totalPromotionsDetected: number
  }
}
