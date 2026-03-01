/**
 * Factor types for the Factor Normalization Plane.
 *
 * Factors represent external signals that influence remittance pricing:
 * FX rates, economic indicators, regulatory changes, etc.
 */

/**
 * Factor source categories.
 */
export type FactorSource =
  | 'fx_mid_market'
  | 'fx_card_network'
  | 'fx_interbank'
  | 'economic_indicator'
  | 'regulatory'
  | 'volume_proxy'
  | 'geopolitical'
  | 'infrastructure'

/**
 * Factor confidence level — how reliable the data source is.
 */
export type FactorConfidence = 'authoritative' | 'high' | 'medium' | 'low' | 'estimated'

/**
 * Factor record — persisted to `gold.factor`.
 *
 * Factors enrich gold index computation by providing context signals
 * beyond the raw quote data.
 */
export type Factor = {
  /** Unique factor ID */
  factorId: string
  /** Factor name (e.g., 'usd_ngn_mid_market', 'nigeria_cpi', 'cbn_policy_rate') */
  name: string
  /** Source category */
  source: FactorSource
  /** Corridor this factor applies to (null = global) */
  corridorId: string | null
  /** Currency pair (e.g., 'USD/NGN') if applicable */
  currencyPair: string | null
  /** Factor value */
  value: number
  /** Previous value for delta computation */
  previousValue: number | null
  /** Unit of measurement */
  unit: string
  /** Confidence in the data */
  confidence: FactorConfidence
  /** ISO 8601 timestamp when the factor was observed */
  observedAt: string
  /** ISO 8601 timestamp when the factor was ingested */
  ingestedAt: string
  /** Data source identifier */
  dataSource: string
  /** Schema version */
  schemaVersion: number
}
