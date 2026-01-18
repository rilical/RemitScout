/**
 * Shared utility for provider logo sizing and path resolution
 */

/**
 * Get the logo file path for a provider slug
 */
export function getProviderLogoPath(slug: string): string {
  const slugMap: Record<string, string> = {
    'wise': '/png/SVG/PROVIDERS/WISE_LOGO.svg',
    'remitly': '/png/SVG/PROVIDERS/REMITLY_LOGO.svg',
    'worldremit': '/png/SVG/PROVIDERS/WORLD_REMIT_LOGO.svg',
    'western-union': '/png/SVG/PROVIDERS/WESTERN_UNION_LOGO.svg',
    'westernunion': '/png/SVG/PROVIDERS/WESTERN_UNION_LOGO.svg',
    'xe': '/png/SVG/PROVIDERS/XE_LOGO.svg',
    'xe-money': '/png/SVG/PROVIDERS/XE_LOGO.svg',
    'sendwave': '/png/SVG/PROVIDERS/SENDWAVE_LOGO.svg',
    'xoom': '/png/SVG/PROVIDERS/XOOM_LOGO.svg',
    'transfergo': '/png/SVG/PROVIDERS/TRANSFERGO_LOGO.svg',
    'paysend': '/png/SVG/PROVIDERS/PAYSEND_LOGO.svg',
    'pangea': '/png/SVG/PROVIDERS/PANGEA_LOGO.webp',
    'orbitremit': '/png/SVG/PROVIDERS/ORBITREMIT_LOGO.png',
    'bossmoney': '/png/SVG/PROVIDERS/BOSSMONEY_LOGO.png',
    'boss-money': '/png/SVG/PROVIDERS/BOSSMONEY_LOGO.png',
    'instarem': '/png/SVG/PROVIDERS/INSTAREM_LOGO.svg',
    'wirebarley': '/png/SVG/PROVIDERS/WIREBARLEY_LOGO.png',
    'intermex': '/png/SVG/PROVIDERS/INTERMEX_LOGO.png',
    'koronapay': '/png/SVG/PROVIDERS/KORONAPAY_LOGO.svg',
    'remitbee': '/png/SVG/PROVIDERS/REMITBEE_LOGO.svg',
    'ria': '/png/SVG/PROVIDERS/RIA_LOGO.svg',
    'al-ansari-exchange': '/png/SVG/PROVIDERS/ALANSARI_LOGO.svg',
    'alansari': '/png/SVG/PROVIDERS/ALANSARI_LOGO.svg',
    'mukuru': '/png/SVG/PROVIDERS/MUKURU_LOGO.png',
    'wellsfargo': '/png/SVG/PROVIDERS/WELLS_FARGO_LOGO.svg',
    'wells-fargo': '/png/SVG/PROVIDERS/WELLS_FARGO_LOGO.svg',
    'singx': '/png/SVG/PROVIDERS/SINGX_LOGO.png',
    'placid': '/png/SVG/PROVIDERS/PLACID_LOGO.png',
    'dahabshiil': '/png/SVG/PROVIDERS/DAHABSHIIL_LOGO.svg',
  }

  const normalizedSlug = slug.toLowerCase().trim()
  const logoFile = slugMap[normalizedSlug]
  if (logoFile) return logoFile
  
  // Fallback: try to construct path from slug
  const fallbackPath = `/png/SVG/PROVIDERS/${normalizedSlug.toUpperCase().replace(/-/g, '_')}_LOGO.svg`
  return fallbackPath
}

/**
 * Get the appropriate size classes for a provider logo based on its aspect ratio
 * Sizes are optimized for each provider's logo dimensions
 */
export function getProviderLogoSize(slug: string, context: 'default' | 'large' | 'small' | 'xlarge' = 'default'): string {
  const normalizedSlug = slug.toLowerCase().trim()

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
      'pangea': 'h-16 w-auto', // 289x105 (2.8:1) - moderate
      'orbitremit': 'h-16 w-auto',
      'bossmoney': 'h-16 w-auto',
      'boss-money': 'h-16 w-auto',
      'instarem': 'h-12 w-auto', // viewBox 182x32 (5.7:1) - very wide
      'wirebarley': 'h-12 w-auto', // 492x96 (5.1:1) - very wide
      'intermex': 'h-12 w-auto',
      'koronapay': 'h-14 w-auto', // viewBox 1450x362 (4:1) - wide
      'remitbee': 'h-16 w-auto', // square-ish logo mark
      'singx': 'h-16 w-auto',
      'placid': 'h-16 w-auto',
      'mukuru': 'h-16 w-auto',
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
