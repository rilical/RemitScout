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
  const contextSizes = {
    small: {
      'wise': 'h-10 w-auto',           // viewBox 219.7x50 (4.4:1) - very wide
      'remitly': 'h-12 w-auto',        // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-12 w-auto',     // viewBox 1062x326 (3.3:1)
      'western-union': 'h-10 w-auto',  // viewBox 299.7x70 (4.3:1) - very wide
      'westernunion': 'h-10 w-auto',
      'xe-money': 'h-14 w-auto',       // viewBox 600x484 (1.24:1) - almost square
      'xe': 'h-14 w-auto',
    },
    default: {
      'wise': 'h-14 w-auto',           // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-16 w-auto',        // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-16 w-auto',     // viewBox 1062x326 (3.3:1)
      'western-union': 'h-14 w-auto',  // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-14 w-auto',
      'xe-money': 'h-20 w-auto',       // viewBox 600x484 (1.24:1)
      'xe': 'h-20 w-auto',
    },
    large: {
      'wise': 'h-20 w-auto',           // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-24 w-auto',        // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-24 w-auto',     // viewBox 1062x326 (3.3:1)
      'western-union': 'h-20 w-auto',  // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-20 w-auto',
      'xe-money': 'h-28 w-auto',       // viewBox 600x484 (1.24:1)
      'xe': 'h-28 w-auto',
    },
    xlarge: {
      'wise': 'h-28 w-auto',           // viewBox 219.7x50 (4.4:1)
      'remitly': 'h-32 w-auto',        // viewBox 1000x428 (2.3:1)
      'worldremit': 'h-32 w-auto',     // viewBox 1062x326 (3.3:1)
      'western-union': 'h-28 w-auto',  // viewBox 299.7x70 (4.3:1)
      'westernunion': 'h-28 w-auto',
      'xe-money': 'h-36 w-auto',       // viewBox 600x484 (1.24:1)
      'xe': 'h-36 w-auto',
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

