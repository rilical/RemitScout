import type { TraceCorrelation } from './correlation'

/**
 * Observation types emitted by the collection pipeline.
 *
 * Observations form the universal event stream for the agent-native platform.
 * Every meaningful event — quote collected, status checked, failure detected — is
 * wrapped in an ObservationEnvelope and persisted to `silver.observation`.
 */
export type ObservationType =
  | 'quote'
  | 'status'
  | 'card_baseline'
  | 'maritime'
  | 'migration'
  | 'displacement'
  | 'telecom'
  | 'event'
  | 'failure'
  | 'health_check'
  | 'rate_limit'
  | 'dom_signature'

/**
 * Observation confidence level.
 */
export type ObservationConfidence = 'high' | 'medium' | 'low' | 'unknown'

/**
 * Universal observation envelope.
 *
 * Every observation emitted by the collection pipeline is wrapped in this envelope.
 * The `payload` field is typed per observation type (see observation-payloads.ts).
 */
export type ObservationEnvelope<T = unknown> = {
  /** Unique observation ID (UUID v4) */
  observationId: string
  /** Module that produced this observation */
  moduleId: string
  /** Provider ID */
  providerId: string
  /** Type of observation */
  type: ObservationType
  /** Corridor this observation relates to (null for provider-level observations) */
  corridorId: string | null
  /** Amount bucket context (null if not applicable) */
  amountBucket: number | null
  /** Confidence in data quality */
  confidence: ObservationConfidence
  /** ISO 8601 timestamp when the observation was collected */
  observedAt: string
  /** ISO 8601 timestamp when the observation was ingested */
  ingestedAt: string
  /** Ingestion run ID for lineage */
  ingestionRunId: string
  /** Type-specific payload */
  payload: T
  /** Trace correlation for distributed tracing */
  trace?: TraceCorrelation
  /** Schema version of this envelope */
  schemaVersion: number
}
