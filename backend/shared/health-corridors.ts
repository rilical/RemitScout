/**
 * Health check corridors for provider probes and ops endpoints.
 *
 * These corridors are used for:
 * - Provider health probes (scripts/*-probe.ts)
 * - Ops health endpoints (plane-a/src/routes/ops/*-health.ts)
 *
 * Selection criteria:
 * - High-volume corridors (US-MX, US-PH, US-IN, etc.)
 * - Geographic diversity (US, GB, CA, AU, etc.)
 * - Currency diversity (USD, GBP, CAD, AUD, EUR)
 */

export type ProviderId = 'remitly' | 'wise' | 'xe' | 'worldremit' | 'westernunion'

export const HEALTH_CORRIDORS: Record<ProviderId, readonly string[]> = {
  remitly: [
    'US-MX-USD-MXN',
    'US-PH-USD-PHP',
    'US-IN-USD-INR',
    'US-NG-USD-NGN',
    'CA-IN-CAD-INR',
    'CA-PH-CAD-PHP',
    'GB-IN-GBP-INR',
    'GB-NG-GBP-NGN',
    'AU-IN-AUD-INR',
    'SG-IN-SGD-INR',
  ] as const,

  wise: [
    'US-IN-USD-INR',
    'US-PH-USD-PHP',
    'US-MX-USD-MXN',
    'US-GB-USD-GBP',
    'US-AE-USD-AED',
    'GB-IN-GBP-INR',
    'GB-PK-GBP-PKR',
    'CA-PH-CAD-PHP',
    'AU-IN-AUD-INR',
    'NZ-PH-NZD-PHP',
  ] as const,

  xe: [
    'US-IN-USD-INR',
    'US-PH-USD-PHP',
    'US-MX-USD-MXN',
    'US-GB-USD-GBP',
    'US-AE-USD-AED',
    'GB-IN-GBP-INR',
    'GB-MX-GBP-MXN',
    'CA-PH-CAD-PHP',
    'AU-IN-AUD-INR',
    'NZ-PH-NZD-PHP',
  ] as const,

  worldremit: [
    'US-IN-USD-INR',
    'US-PH-USD-PHP',
    'US-MX-USD-MXN',
    'US-NG-USD-NGN',
    'US-KE-USD-KES',
    'GB-IN-GBP-INR',
    'GB-PK-GBP-PKR',
    'CA-PH-CAD-PHP',
    'AU-IN-AUD-INR',
    'FR-MA-EUR-MAD',
  ] as const,

  westernunion: [
    'US-MX-USD-MXN',
    'US-CO-USD-COP',
    'US-PH-USD-PHP',
    'US-IN-USD-INR',
    'US-DO-USD-DOP',
    'US-NG-USD-NGN',
    'GB-IN-GBP-INR',
    'GB-PH-GBP-PHP',
    'CA-IN-CAD-INR',
    'AU-PH-AUD-PHP',
  ] as const,
} as const

/**
 * Get health corridors for a provider.
 *
 * @param providerId - Provider identifier
 * @returns Array of corridor IDs for health checks
 */
export const getHealthCorridors = (providerId: ProviderId): readonly string[] => {
  return HEALTH_CORRIDORS[providerId] ?? []
}

/**
 * Validate that a corridor is in the health set for a provider.
 *
 * @param providerId - Provider identifier
 * @param corridorId - Corridor ID to check
 * @returns True if corridor is in health set
 */
export const isHealthCorridor = (providerId: ProviderId, corridorId: string): boolean => {
  return HEALTH_CORRIDORS[providerId]?.includes(corridorId) ?? false
}




