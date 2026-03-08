export const DEFAULT_AMOUNT_BUCKET = 500

// Plane A (B2C) hard ceiling for quote freshness requests.
export const MAX_B2C_QUOTE_AGE_SECONDS = 4 * 60 * 60

// Cache defaults.
export const WEIGHT_SNAPSHOT_TTL_MS = 10 * 60 * 1000
export const DEFAULT_FALLBACK_TTL_SECONDS = 60 * 60

// Alerts defaults.
export const ALERT_COOLDOWN_MINUTES = 360
export const SMART_ALERT_MIN_CONFIDENCE = 70
export const SMART_ALERT_MIN_SAMPLE_DAYS = 21

// API defaults.
export const DEFAULT_LIMIT_MAX = 200

// Exports defaults.
// Hard cap across all plans/environments to prevent accidental huge exports and keep latency predictable.
export const EXPORTS_MAX_WINDOW_DAYS_HARD_CAP = 365
