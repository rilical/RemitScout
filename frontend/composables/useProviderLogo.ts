/**
 * Shared utility for provider logo sizing and path resolution
 */

const PROVIDER_LOGO_ALIASES: Record<string, string> = {
  'westernunion': 'western-union',
  'xe': 'xe-money',
  'alansari': 'al-ansari-exchange',
  'bossmoney': 'boss-money',
  'wellsfargo': 'wells-fargo',
}

const PROVIDER_LOGO_CANDIDATES: Record<string, { logos: string[], providers: string[] }> = {
  'wise': { logos: ['/logos/wise.svg'], providers: ['/png/SVG/PROVIDERS/WISE_LOGO.svg'] },
  'remitly': { logos: ['/logos/remitly.svg'], providers: ['/png/SVG/PROVIDERS/REMITLY_LOGO.svg'] },
  'worldremit': { logos: ['/logos/worldremit.svg'], providers: ['/png/SVG/PROVIDERS/WORLD_REMIT_LOGO.svg'] },
  'western-union': { logos: ['/logos/western-union.svg'], providers: ['/png/SVG/PROVIDERS/WESTERN_UNION_LOGO.svg'] },
  'xe-money': { logos: ['/logos/xe-money.svg'], providers: ['/png/SVG/PROVIDERS/XE_LOGO.svg'] },
  'sendwave': { logos: ['/logos/sendwave.svg'], providers: ['/png/SVG/PROVIDERS/SENDWAVE_LOGO.svg'] },
  'xoom': { logos: ['/logos/xoom.svg'], providers: ['/png/SVG/PROVIDERS/XOOM_LOGO.svg'] },
  'transfergo': { logos: ['/logos/transfergo.svg'], providers: ['/png/SVG/PROVIDERS/TRANSFERGO_LOGO.svg'] },
  'paysend': { logos: ['/logos/paysend.svg'], providers: ['/png/SVG/PROVIDERS/PAYSEND_LOGO.svg'] },
  'pangea': {
    logos: ['/logos/pangea.webp', '/logos/pangea.png'],
    providers: ['/png/SVG/PROVIDERS/PANGEA_LOGO.webp', '/png/SVG/PROVIDERS/PANGEA_LOGO.png'],
  },
  'orbitremit': { logos: ['/logos/orbitremit.png'], providers: ['/png/SVG/PROVIDERS/ORBITREMIT_LOGO.png'] },
  'boss-money': { logos: ['/logos/boss-money.svg', '/logos/boss-money.png'], providers: ['/png/SVG/PROVIDERS/BOSSMONEY_LOGO.png'] },
  'instarem': { logos: ['/logos/instarem.svg'], providers: ['/png/SVG/PROVIDERS/INSTAREM_LOGO.svg'] },
  'wirebarley': {
    logos: ['/logos/wirebarley.png', '/logos/WIREBARELY_LOGO.PNG'],
    providers: ['/png/SVG/PROVIDERS/WIREBARLEY_LOGO.png'],
  },
  'intermex': { logos: ['/logos/intermex.svg', '/logos/intermex.png'], providers: ['/png/SVG/PROVIDERS/INTERMEX_LOGO.png'] },
  'koronapay': { logos: ['/logos/koronapay.svg'], providers: ['/png/SVG/PROVIDERS/KORONAPAY_LOGO.svg'] },
  'remitbee': {
    logos: ['/logos/remitbee.svg', '/logos/remitbee.jpeg', '/logos/remitbee.jpg'],
    providers: ['/png/SVG/PROVIDERS/REMITBEE_LOGO.svg', '/png/SVG/PROVIDERS/REMITBEE_LOGO.jpeg'],
  },
  'ria': { logos: ['/logos/ria.svg'], providers: ['/png/SVG/PROVIDERS/RIA_LOGO.svg'] },
  'al-ansari-exchange': { logos: ['/logos/alansari.png'], providers: ['/png/SVG/PROVIDERS/ALANSARI_LOGO.svg'] },
  'mukuru': {
    logos: ['/logos/mukuru.png', '/logos/MUKURU_LOGO.PNG'],
    providers: ['/png/SVG/PROVIDERS/MUKURU_LOGO.png'],
  },
  'wells-fargo': { logos: ['/logos/wellsfargo.svg'], providers: ['/png/SVG/PROVIDERS/WELLS_FARGO_LOGO.svg'] },
  'singx': { logos: ['/logos/singx.png'], providers: ['/png/SVG/PROVIDERS/SINGX_LOGO.png'] },
  'placid': { logos: ['/logos/placid.png'], providers: ['/png/SVG/PROVIDERS/PLACID_LOGO.png'] },
  'dahabshiil': { logos: ['/logos/dahabshiil.png'], providers: ['/png/SVG/PROVIDERS/DAHABSHIIL_LOGO.png'] },
}

function toCanonicalProviderSlug(slug: string): string {
  const normalized = slug.toLowerCase().trim()
  return PROVIDER_LOGO_ALIASES[normalized] || normalized
}

/**
 * Get ordered logo candidates for a provider slug.
 * Order: preferred source -> canonical /logos variants -> /png provider assets -> generated fallback paths.
 */
export function getProviderLogoSources(slug: string, preferredSource?: string | null): string[] {
  const canonicalSlug = toCanonicalProviderSlug(slug)
  const candidates = PROVIDER_LOGO_CANDIDATES[canonicalSlug]
  const fallbackStem = canonicalSlug.toUpperCase().replace(/-/g, '_')
  const ordered = [
    preferredSource || null,
    ...(candidates?.logos || []),
    ...(candidates?.providers || []),
    `/png/SVG/PROVIDERS/${fallbackStem}_LOGO.svg`,
    `/png/SVG/PROVIDERS/${fallbackStem}_LOGO.png`,
    `/png/SVG/PROVIDERS/${fallbackStem}_LOGO.webp`,
    `/png/SVG/PROVIDERS/${fallbackStem}_LOGO.jpeg`,
    `/png/SVG/PROVIDERS/${fallbackStem}_LOGO.jpg`,
  ]

  const unique: string[] = []
  const seen = new Set<string>()
  for (const candidate of ordered) {
    const value = String(candidate || '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    unique.push(value)
  }
  return unique
}

/**
 * Get the logo file path for a provider slug
 */
export function getProviderLogoPath(slug: string): string {
  const [primary] = getProviderLogoSources(slug)
  return primary || '/logos/remit-scout.svg'
}

/**
 * Get the appropriate size classes for a provider logo based on its aspect ratio
 * Sizes are optimized for each provider's logo dimensions
 */
export function getProviderLogoSize(slug: string, context: 'default' | 'large' | 'small' | 'xlarge' = 'default'): string {
  const normalizedSlug = toCanonicalProviderSlug(slug)

  // Base sizes for different contexts
  const contextSizes: Record<string, Record<string, string>> = {
    small: {
      'wise': 'h-12 w-auto', // viewBox 219.7x50 (4.4:1) - very wide (15% bigger: h-10 -> h-12)
      'remitly': 'h-16 w-auto', // viewBox 1000x428 (2.3:1) (bigger on cards: h-14 -> h-16)
      'worldremit': 'h-14 w-auto', // viewBox 1062x326 (3.3:1) (15% bigger: h-12 -> h-14)
      'western-union': 'h-12 w-auto', // viewBox 299.7x70 (4.3:1) - very wide (15% bigger: h-10 -> h-12)
      'westernunion': 'h-12 w-auto',
      'xe-money': 'h-16 w-auto', // viewBox 600x484 (1.24:1) - almost square (15% bigger: h-14 -> h-16)
      'xe': 'h-16 w-auto',
      'ria': 'h-16 w-auto', // viewBox 145x67 (2.16:1) - moderate
      'dahabshiil': 'h-16 w-auto',
      'sendwave': 'h-16 w-auto',
      'xoom': 'h-16 w-auto', // viewBox 200x69 (2.9:1) - moderate
      'transfergo': 'h-12 w-auto', // viewBox 121x20 (6:1) - very wide
      'paysend': 'h-16 w-auto', // viewBox 220x60 (3.7:1) - moderate
      'orbitremit': 'h-12 w-auto',
      'bossmoney': 'h-12 w-auto',
      'boss-money': 'h-12 w-auto',
      'instarem': 'h-10 w-auto', // viewBox 182x32 (5.7:1) - very wide
      'wirebarley': 'h-10 w-auto', // 492x96 (5.1:1) - very wide
      'intermex': 'h-10 w-auto',
      'koronapay': 'h-12 w-auto', // viewBox 1450x362 (4:1) - wide
      'remitbee': 'h-14 w-auto', // square-ish logo mark
      'singx': 'h-12 w-auto',
      'placid': 'h-12 w-auto',
      'mukuru': 'h-12 w-auto',
      'pangea': 'h-12 w-auto', // 289x105 (2.8:1) - moderate
      'al-ansari-exchange': 'h-12 w-auto',
      'alansari': 'h-12 w-auto',
    },
    default: {
      'wise': 'h-18 w-auto', // viewBox 219.7x50 (4.4:1) (30% bigger: h-14 -> h-18)
      'remitly': 'h-22 w-auto', // viewBox 1000x428 (2.3:1) (35% bigger: h-16 -> h-22)
      'worldremit': 'h-16 w-auto', // viewBox 1062x326 (3.3:1)
      'western-union': 'h-18 w-auto', // viewBox 299.7x70 (4.3:1) (30% bigger: h-14 -> h-18)
      'westernunion': 'h-18 w-auto',
      'xe-money': 'h-22 w-auto', // viewBox 600x484 (1.24:1) (10% bigger: h-20 -> h-22)
      'xe': 'h-22 w-auto',
      'ria': 'h-22 w-auto', // viewBox 145x67 (2.16:1) - moderate
      'dahabshiil': 'h-22 w-auto',
      'sendwave': 'h-20 w-auto',
      'xoom': 'h-20 w-auto', // viewBox 200x69 (2.9:1) - moderate
      'transfergo': 'h-18 w-auto', // viewBox 121x20 (6:1) - very wide
      'paysend': 'h-20 w-auto', // viewBox 220x60 (3.7:1) - moderate
      'pangea': 'h-20 w-auto', // 289x105 (2.8:1) - moderate
      'orbitremit': 'h-20 w-auto',
      'bossmoney': 'h-20 w-auto',
      'boss-money': 'h-20 w-auto',
      'instarem': 'h-18 w-auto', // viewBox 182x32 (5.7:1) - very wide
      'wirebarley': 'h-18 w-auto', // 492x96 (5.1:1) - very wide
      'intermex': 'h-18 w-auto',
      'koronapay': 'h-16 w-auto', // viewBox 1450x362 (4:1) - wide
      'remitbee': 'h-20 w-auto', // square-ish logo mark
      'singx': 'h-20 w-auto',
      'placid': 'h-20 w-auto',
      'mukuru': 'h-20 w-auto',
    },
    large: {
      'wise': 'h-24 w-auto', // viewBox 219.7x50 (4.4:1) - increased to h-24
      'remitly': 'h-24 w-auto', // viewBox 1000x428 (2.3:1) - increased to h-24
      'worldremit': 'h-24 w-auto', // viewBox 1062x326 (3.3:1) - increased to h-24
      'western-union': 'h-24 w-auto', // viewBox 299.7x70 (4.3:1) - increased to h-24
      'westernunion': 'h-24 w-auto', // increased to h-24
      'xe-money': 'h-24 w-auto', // viewBox 600x484 (1.24:1) - increased to h-24
      'xe': 'h-24 w-auto', // increased to h-24
      'ria': 'h-24 w-auto', // viewBox 145x67 (2.16:1) - increased to h-24
      'dahabshiil': 'h-24 w-auto', // increased to h-24
      'sendwave': 'h-24 w-auto', // increased to h-24
      'xoom': 'h-24 w-auto', // viewBox 200x69 (2.9:1) - increased to h-24
      'transfergo': 'h-24 w-auto', // viewBox 121x20 (6:1) - increased to h-24
      'paysend': 'h-24 w-auto', // viewBox 220x60 (3.7:1) - increased to h-24
      'pangea': 'h-24 w-auto', // 289x105 (2.8:1) - increased to h-24
      'orbitremit': 'h-24 w-auto', // increased to h-24
      'bossmoney': 'h-24 w-auto', // increased to h-24
      'boss-money': 'h-24 w-auto', // increased to h-24
      'instarem': 'h-24 w-auto', // viewBox 182x32 (5.7:1) - increased to h-24
      'wirebarley': 'h-24 w-auto', // 492x96 (5.1:1) - increased to h-24
      'intermex': 'h-24 w-auto', // increased to h-24
      'koronapay': 'h-24 w-auto', // viewBox 1450x362 (4:1) - increased to h-24
      'remitbee': 'h-24 w-auto', // square-ish logo mark - increased to h-24
      'singx': 'h-24 w-auto', // increased to h-24
      'placid': 'h-24 w-auto', // increased to h-24
      'mukuru': 'h-24 w-auto', // increased to h-24
    },
    xlarge: {
      'wise': 'h-28 w-auto', // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-32 w-auto', // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-32 w-auto', // viewBox 1062x326 (3.3:1)
      'western-union': 'h-28 w-auto', // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-28 w-auto',
      'xe-money': 'h-36 w-auto', // viewBox 600x484 (1.24:1)
      'xe': 'h-36 w-auto',
      'ria': 'h-36 w-auto', // viewBox 145x67 (2.16:1) - moderate
      'dahabshiil': 'h-36 w-auto',
      'sendwave': 'h-32 w-auto',
      'xoom': 'h-32 w-auto', // viewBox 200x69 (2.9:1) - moderate
      'transfergo': 'h-28 w-auto', // viewBox 121x20 (6:1) - very wide
      'paysend': 'h-32 w-auto', // viewBox 220x60 (3.7:1) - moderate
      'pangea': 'h-32 w-auto', // 289x105 (2.8:1) - moderate
      'orbitremit': 'h-32 w-auto',
      'bossmoney': 'h-32 w-auto',
      'boss-money': 'h-32 w-auto',
      'instarem': 'h-28 w-auto', // viewBox 182x32 (5.7:1) - very wide
      'wirebarley': 'h-28 w-auto', // 492x96 (5.1:1) - very wide
      'intermex': 'h-28 w-auto',
      'koronapay': 'h-32 w-auto', // viewBox 1450x362 (4:1) - wide
      'remitbee': 'h-32 w-auto', // square-ish logo mark
      'singx': 'h-32 w-auto',
      'placid': 'h-32 w-auto',
      'mukuru': 'h-32 w-auto',
    },
  }

  const sizeMap = contextSizes[context]
  return sizeMap[normalizedSlug] || 'h-16 w-auto'
}

/**
 * Get IPX request dimensions per provider to preserve aspect ratio and avoid cropping.
 * Used for small context (provider cards).
 */
export function getProviderLogoDimensions(slug: string): { width: number, height: number } {
  const normalizedSlug = toCanonicalProviderSlug(slug)
  const dimensions: Record<string, { width: number, height: number }> = {
    'wise': { width: 220, height: 50 },
    'remitly': { width: 230, height: 100 },
    'worldremit': { width: 320, height: 98 },
    'western-union': { width: 300, height: 70 },
    'westernunion': { width: 300, height: 70 },
    'xe-money': { width: 96, height: 96 },
    'xe': { width: 96, height: 96 },
    'ria': { width: 145, height: 67 },
    'dahabshiil': { width: 192, height: 51 },
    'sendwave': { width: 200, height: 69 },
    'xoom': { width: 200, height: 69 },
    'transfergo': { width: 240, height: 40 },
    'paysend': { width: 220, height: 60 },
    'orbitremit': { width: 192, height: 58 },
    'bossmoney': { width: 128, height: 128 },
    'boss-money': { width: 128, height: 128 },
    'instarem': { width: 182, height: 32 },
    'wirebarley': { width: 128, height: 128 },
    'intermex': { width: 192, height: 47 },
    'koronapay': { width: 192, height: 48 },
    'remitbee': { width: 128, height: 128 },
    'singx': { width: 128, height: 128 },
    'placid': { width: 192, height: 97 },
    'mukuru': { width: 192, height: 61 },
    'pangea': { width: 289, height: 105 },
    'al-ansari-exchange': { width: 192, height: 64 },
    'alansari': { width: 192, height: 64 },
    'wellsfargo': { width: 192, height: 64 },
    'wells-fargo': { width: 192, height: 64 },
  }
  return dimensions[normalizedSlug] ?? { width: 192, height: 64 }
}

/**
 * Normalize provider name to slug format
 */
export function normalizeProviderSlug(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/western-union/g, 'western-union')
    .replace(/xe\s*money?/gi, 'xe-money')
    .replace(/world-?remit/gi, 'worldremit')
    .trim()
}
