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

export type ProviderId = 'remitly' | 'wise' | 'xe' | 'transfergo' | 'paysend' | 'pangea' | 'orbitremit' | 'bossmoney' | 'koronapay' | 'remitbee' | 'singx' | 'placid' | 'ria' | 'worldremit' | 'westernunion' | 'xoom' | 'instarem' | 'dahabshiil' | 'sendwave' | 'mukuru' | 'wirebarley' | 'alansari' | 'intermex'

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

  transfergo: [
    'GB-PL-GBP-PLN',
    'GB-RO-GBP-RON',
    'DE-UA-EUR-UAH',
    'PL-UA-PLN-UAH',
    'LT-UA-EUR-UAH',
    'RO-MD-RON-MDL',
    'IT-AL-EUR-ALL',
    'ES-MA-EUR-MAD',
    'NL-TR-EUR-TRY',
    'SE-GB-SEK-GBP',
  ] as const,

  paysend: [
    'US-MX-USD-MXN',
    'GB-IN-GBP-INR',
    'GB-PH-GBP-PHP',
    'DE-TR-EUR-TRY',
    'FR-MA-EUR-MAD',
    'IT-RO-EUR-RON',
    'ES-CO-EUR-COP',
    'CA-PH-CAD-PHP',
    'AU-NZ-AUD-NZD',
    'NL-NG-EUR-NGN',
  ] as const,

  pangea: [
    'US-MX-USD-MXN',
    'US-PH-USD-PHP',
    'US-GT-USD-GTQ',
    'US-IN-USD-INR',
    'US-GH-USD-GHS',
    'US-KE-USD-KES',
    'US-VN-USD-VND',
    'US-BD-USD-BDT',
    'US-DO-USD-DOP',
    'US-TH-USD-THB',
  ] as const,
  orbitremit: [
    'AU-PH-AUD-PHP',
    'AU-BR-AUD-BRL',
    'AU-CN-AUD-CNY',
    'AU-IN-AUD-INR',
    'AU-GB-AUD-GBP',
    'NZ-IN-NZD-INR',
    'NZ-PH-NZD-PHP',
    'NZ-US-NZD-USD',
  ] as const,
  bossmoney: [
    'US-MX-USD-MXN',
    'US-PH-USD-PHP',
    'US-IN-USD-INR',
    'US-GT-USD-GTQ',
    'US-NG-USD-NGN',
    'US-DO-USD-DOP',
    'CA-PH-CAD-PHP',
    'AU-PH-AUD-PHP',
    'US-GN-USD-GNF',
    'US-GB-USD-GBP',
  ] as const,

  koronapay: [
    'BE-UZ-EUR-UZS',
    'DE-TR-EUR-TRY',
    'GB-KZ-GBP-KZT',
    'FR-AM-EUR-AMD',
    'IT-GE-EUR-GEL',
    'ES-MA-EUR-MAD',
    'NL-AZ-EUR-AZN',
    'PL-BY-PLN-BYN',
    'SE-KG-SEK-KGS',
    'RO-MN-RON-MNT',
  ] as const,

  remitbee: [
    'CA-IN-CAD-INR',
    'CA-PH-CAD-PHP',
    'CA-GH-CAD-GHS',
    'CA-KE-CAD-KES',
    'CA-CO-CAD-COP',
    'CA-CR-CAD-USD',
    'CA-DO-CAD-USD',
    'CA-PE-CAD-PEN',
    'CA-UA-CAD-UAH',
    'CA-UY-CAD-UYU',
    'CA-LK-CAD-LKR',
  ] as const,
  singx: [
    'SG-IN-SGD-INR',
    'SG-PH-SGD-PHP',
    'SG-GB-SGD-GBP',
    'SG-DE-SGD-EUR',
    'SG-AU-SGD-AUD',
    'US-IN-USD-INR',
    'US-PK-USD-PKR',
    'US-NG-USD-NGN',
    'US-KE-USD-KES',
    'US-JP-USD-JPY',
  ] as const,
  placid: [
    'US-IN-USD-INR',
    'US-PH-USD-PHP',
    'US-PK-USD-PKR',
    'US-BD-USD-BDT',
    'US-KE-USD-KES',
    'US-LK-USD-LKR',
    'US-TH-USD-THB',
    'US-VN-USD-VND',
    'US-GH-USD-GHS',
    'US-SN-USD-XOF',
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

  xoom: [
    'US-MX-USD-MXN',
    'US-PH-USD-PHP',
    'US-IN-USD-INR',
    'US-CO-USD-COP',
    'US-NG-USD-NGN',
    'CA-IN-CAD-INR',
    'CA-PH-CAD-PHP',
    'GB-IN-GBP-INR',
    'AU-IN-AUD-INR',
    'DE-MA-EUR-MAD',
  ] as const,

  ria: [
    'US-MX-USD-MXN',
    'US-PH-USD-PHP',
    'US-IN-USD-INR',
    'US-CO-USD-COP',
    'US-DO-USD-DOP',
    'CA-IN-CAD-INR',
    'CA-PH-CAD-PHP',
    'GB-IN-GBP-INR',
    'GB-PK-GBP-PKR',
    'AU-IN-AUD-INR',
  ] as const,
  dahabshiil: [
    'US-KE-USD-USD',
    'US-KE-USD-KES',
    'US-SO-USD-USD',
    'US-SD-USD-USD',
    'US-DJ-USD-USD',
    'US-UG-USD-USD',
  ] as const,
  sendwave: [
    'US-PH-USD-PHP',
    'US-KE-USD-KES',
    'US-NG-USD-NGN',
    'GB-NG-GBP-NGN',
    'FR-PH-EUR-PHP',
    'DE-GH-EUR-GHS',
    'CA-PH-CAD-PHP',
    'ES-MA-EUR-MAD',
    'IT-SN-EUR-XOF',
    'BE-RW-EUR-RWF',
  ] as const,
  mukuru: [
    'ZA-ZW-ZAR-ZAR',
    'ZA-ZW-ZAR-USD',
    'ZA-KE-ZAR-KES',
    'ZA-GB-ZAR-GBP',
    'ZA-US-ZAR-USD',
    'GB-ZW-GBP-USD',
    'US-ZW-USD-ZAR',
    'BW-KE-BWP-KES',
  ] as const,
  instarem: [
    'US-IN-USD-INR',
    'US-PH-USD-PHP',
    'US-MX-USD-MXN',
    'US-NG-USD-NGN',
    'SG-IN-SGD-INR',
    'GB-IN-GBP-INR',
    'AU-IN-AUD-INR',
    'CA-IN-CAD-INR',
    'HK-IN-HKD-INR',
    'JP-IN-JPY-INR',
  ] as const,
  wirebarley: [
    'KR-PH-KRW-PHP',
    'KR-VN-KRW-VND',
    'KR-IN-KRW-INR',
    'KR-US-KRW-USD',
    'KR-JP-KRW-JPY',
    'KR-AU-KRW-AUD',
    'KR-CA-KRW-CAD',
    'KR-HK-KRW-HKD',
    'KR-TH-KRW-THB',
    'KR-NZ-KRW-NZD',
  ] as const,
  alansari: [
    'AE-IN-AED-INR',
    'AE-PK-AED-PKR',
    'AE-PH-AED-PHP',
    'AE-EG-AED-EGP',
    'AE-BD-AED-BDT',
    'AE-LK-AED-LKR',
    'AE-NP-AED-NPR',
    'AE-SA-AED-SAR',
    'AE-GB-AED-GBP',
    'AE-US-AED-USD',
  ] as const,
  intermex: [
    'US-MX-USD-MXN',
    'US-GT-USD-GTQ',
    'US-SV-USD-USD',
    'US-HN-USD-HNL',
    'US-DO-USD-DOP',
    'US-CO-USD-COP',
    'US-PE-USD-PEN',
    'US-AR-USD-ARS',
    'US-EC-USD-USD',
    'US-PH-USD-PHP',
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
