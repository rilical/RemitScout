/**
 * Weighting Model — quality-adjusted weighting for provider aggregation.
 *
 * This module defines the constants and type used by the triangulation engine
 * (`plane-b/src/triangulation/engine.ts`) and gold publisher jobs
 * (`scripts/gold-indices-job.ts`, `scripts/gold-indices-live.ts`) to select
 * which weighting model is applied when aggregating provider quotes into
 * composite indices (TEER, RCI, RVI).
 *
 * ## How it fits into the pipeline
 *
 * 1. **Bronze**: Raw observations collected from providers.
 * 2. **Silver**: Quotes normalized with amount buckets and fees.
 * 3. **Gold**: Aggregated indices computed from silver quotes, where each
 *    provider's contribution is scaled by a weight stored in
 *    `gold.provider_weight_snapshot`. The `weight_model` column in that
 *    table references the model name exported here.
 *
 * ## Current state
 *
 * This file is intentionally minimal — it is a **constants/type stub**, not a
 * calculation engine. The actual weighting logic lives in:
 * - `scripts/provider-weighting-job.ts` (computes & persists weight snapshots)
 * - `plane-b/src/scoring/provider-reliability.ts` (reliability scoring input)
 * - `plane-b/src/triangulation/engine.ts` (consumes weights during aggregation)
 *
 * ## Assumptions & limitations
 *
 * - Only one weight model (`synthetic_seed_v1`) exists today. Adding a new
 *   model requires updating the weighting job and potentially the gold publisher.
 * - `WeightingModel` is a plain string alias (not a union) to allow future
 *   models to be added without touching every import site.
 * - The global corridor sentinel (`__global__`) is used for weights that apply
 *   across all corridors when no corridor-specific override exists.
 */

/**
 * Default weighting model identifier used when no explicit model is specified.
 * Currently the only model: a synthetic seed based on provider reliability
 * and freshness scoring.
 */
export const DEFAULT_WEIGHT_MODEL = 'synthetic_seed_v1'

/**
 * Methodology version tag stamped on every gold index record.
 * Bumped when the aggregation formula or weighting strategy changes materially,
 * so downstream consumers can detect methodology breaks.
 */
export const INDICES_METHODOLOGY_VERSION = 'indices_v2'

/**
 * Sentinel corridor ID representing "all corridors". Used in
 * `gold.provider_weight_snapshot` for weights that apply globally
 * when no corridor-specific weight exists.
 */
export const GLOBAL_WEIGHT_CORRIDOR_ID = '__global__'

/**
 * Opaque identifier for a weighting model. Kept as a plain `string` alias
 * (rather than a string union) so new models can be introduced without
 * updating every import site. Validated at runtime by the weighting job.
 */
export type WeightingModel = string
