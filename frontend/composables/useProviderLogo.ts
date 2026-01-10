/**
 * Shared utility for provider logo sizing and path resolution
 */

/**
 * Get the logo file path for a provider slug
 */
export function getProviderLogoPath(slug: string): string {
  const slugMap: Record<string, string> = {
    'wise': 'wise.svg',
    'remitly': 'remitly.svg',
    'worldremit': 'worldremit.svg',
    'western-union': 'western-union.svg',
    'westernunion': 'western-union.svg',
    'xe': 'xe-money.svg',
    'xe-money': 'xe-money.svg',
    'sendwave': 'sendwave.svg',
  }

  const normalizedSlug = slug.toLowerCase().trim()
  const logoFile = slugMap[normalizedSlug] || `${normalizedSlug}.svg`
  return `/logos/${logoFile}`
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
      'sendwave': 'h-16 w-auto',
    },
    default: {
      'wise': 'h-18 w-auto', // viewBox 219.7x50 (4.4:1) (30% bigger: h-14 -> h-18)
      'remitly': 'h-22 w-auto', // viewBox 1000x428 (2.3:1) (35% bigger: h-16 -> h-22)
      'worldremit': 'h-16 w-auto', // viewBox 1062x326 (3.3:1)
      'western-union': 'h-18 w-auto', // viewBox 299.7x70 (4.3:1) (30% bigger: h-14 -> h-18)
      'westernunion': 'h-18 w-auto',
      'xe-money': 'h-22 w-auto', // viewBox 600x484 (1.24:1) (10% bigger: h-20 -> h-22)
      'xe': 'h-22 w-auto',
      'sendwave': 'h-20 w-auto',
    },
    large: {
      'wise': 'h-20 w-auto', // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-24 w-auto', // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-24 w-auto', // viewBox 1062x326 (3.3:1)
      'western-union': 'h-20 w-auto', // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-20 w-auto',
      'xe-money': 'h-28 w-auto', // viewBox 600x484 (1.24:1)
      'xe': 'h-28 w-auto',
      'sendwave': 'h-24 w-auto',
    },
    xlarge: {
      'wise': 'h-28 w-auto', // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-32 w-auto', // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-32 w-auto', // viewBox 1062x326 (3.3:1)
      'western-union': 'h-28 w-auto', // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-28 w-auto',
      'xe-money': 'h-36 w-auto', // viewBox 600x484 (1.24:1)
      'xe': 'h-36 w-auto',
      'sendwave': 'h-32 w-auto',
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
