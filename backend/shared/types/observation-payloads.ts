/**
 * Observation payload types for the agent-native observation pipeline.
 *
 * Each observation type has a corresponding payload schema.
 */

/**
 * Quote observation payload — emitted when a quote is successfully collected.
 */
export type QuoteObservationPayload = {
  provider_id: string
  exchange_rate: number
  implied_fx_rate: number
  send_amount: number
  receive_amount: number
  fee_amount: number
  total_debit_amount: number
  payin_method: string
  payout_method: string
  method_profile: string | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  quality_flags: string[]
  parser_version: string
  bronze_object_key: string
}

/**
 * Status observation payload — emitted when a provider status check is performed.
 */
export type StatusObservationPayload = {
  httpStatus: number | null
  responseTimeMs: number
  isAvailable: boolean
  errorCode: string | null
  errorMessage: string | null
}

/**
 * Card baseline observation payload — emitted for card network rate captures.
 */
export type CardBaselineObservationPayload = {
  network: string
  sendCurrency: string
  receiveCurrency: string
  rate: number
  rateType: 'mid_market' | 'card_network' | 'interbank'
  source: string
  capturedAt: string
}

/**
 * Failure observation payload — emitted when a collection attempt fails.
 */
export type FailureObservationPayload = {
  errorType: string
  errorMessage: string
  httpStatus: number | null
  retryable: boolean
  attempt: number
  maxAttempts: number
  /** DOM fingerprint if applicable (for playwright collectors) */
  domSignature: string | null
}

/**
 * Health check observation payload — emitted during provider health probes.
 */
export type HealthCheckObservationPayload = {
  endpoint: string
  httpStatus: number | null
  responseTimeMs: number
  healthy: boolean
  checkType: 'probe' | 'synthetic' | 'canary'
}

/**
 * Rate limit observation payload — emitted when a rate limit is encountered.
 */
export type RateLimitObservationPayload = {
  httpStatus: number
  retryAfterMs: number | null
  limitType: 'provider' | 'corridor' | 'global'
  windowMs: number
  currentCount: number
  maxCount: number
}

/**
 * DOM signature observation payload — tracks structural changes to provider pages.
 */
export type DomSignatureObservationPayload = {
  url: string
  signatureHash: string
  previousHash: string | null
  structuralDelta: number
  selectors: string[]
  changedSelectors: string[]
}

/**
 * Event observation payload — generic system events.
 */
export type EventObservationPayload = {
  eventName: string
  severity: 'info' | 'warn' | 'error' | 'critical'
  metadata: Record<string, unknown>
}

/**
 * Union type mapping observation types to their payloads.
 */
export type ObservationPayloadMap = {
  quote: QuoteObservationPayload
  status: StatusObservationPayload
  card_baseline: CardBaselineObservationPayload
  failure: FailureObservationPayload
  health_check: HealthCheckObservationPayload
  rate_limit: RateLimitObservationPayload
  dom_signature: DomSignatureObservationPayload
  event: EventObservationPayload
  maritime: EventObservationPayload
  migration: EventObservationPayload
  displacement: EventObservationPayload
  telecom: EventObservationPayload
}
