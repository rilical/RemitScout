/**
 * Country Code to Full-Name Slug Mapping
 *
 * For SEO-friendly URLs, we use full country names as slugs:
 * - /send-money/united-states-to-jordan (canonical)
 * - /send-money/us-to-jo (redirects to canonical)
 *
 * This file provides bidirectional mapping between:
 * - ISO 2-letter codes (US, GB, JP)
 * - Full-name slugs (united-states, united-kingdom, japan)
 */

import { COUNTRIES, type Country } from './countries-currencies'

// Helper to convert country name to URL slug
export const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Build code-to-slug map from COUNTRIES array
export const CODE_TO_SLUG: Record<string, string> = COUNTRIES.reduce((acc, country) => {
  acc[country.code.toLowerCase()] = nameToSlug(country.name)
  acc[country.code.toUpperCase()] = nameToSlug(country.name)
  return acc
}, {} as Record<string, string>)

// Build slug-to-code map (reverse lookup)
export const SLUG_TO_CODE: Record<string, string> = COUNTRIES.reduce((acc, country) => {
  acc[nameToSlug(country.name)] = country.code
  return acc
}, {} as Record<string, string>)

// Common aliases (short codes that should resolve to full slugs)
export const SLUG_ALIASES: Record<string, string> = {
  us: 'united-states',
  usa: 'united-states',
  america: 'united-states',

  uk: 'united-kingdom',
  gb: 'united-kingdom',
  britain: 'united-kingdom',
  england: 'united-kingdom',

  uae: 'united-arab-emirates',
  ae: 'united-arab-emirates',
  dubai: 'united-arab-emirates',

  // Common short codes (ISO 2-letter)
  ...Object.entries(CODE_TO_SLUG).reduce((acc, [code, slug]) => {
    acc[code.toLowerCase()] = slug
    return acc
  }, {} as Record<string, string>),
}

// Get canonical slug from any input (code, alias, or slug)
export const getCanonicalSlug = (input: string): string => {
  const normalized = input.toLowerCase().trim()

  // Check if it's already a canonical slug
  if (SLUG_TO_CODE[normalized]) {
    return normalized
  }

  // Check aliases (includes ISO codes)
  if (SLUG_ALIASES[normalized]) {
    return SLUG_ALIASES[normalized]
  }

  // Check if it's a direct code lookup
  if (CODE_TO_SLUG[normalized]) {
    return CODE_TO_SLUG[normalized]
  }

  // Return as-is if not found (fallback)
  return normalized
}

// Get country code from slug
export const getCodeFromSlug = (slug: string): string | undefined => {
  const canonical = getCanonicalSlug(slug)
  return SLUG_TO_CODE[canonical]
}

// Get country data from slug
export const getCountryFromSlug = (slug: string): Country | undefined => {
  const code = getCodeFromSlug(slug)
  if (!code) return undefined
  return COUNTRIES.find(c => c.code === code)
}

// Generate corridor URL with full-name slugs
export const getCorridorUrl = (fromCode: string, toCode: string): string => {
  const fromSlug = CODE_TO_SLUG[fromCode.toUpperCase()] || fromCode.toLowerCase()
  const toSlug = CODE_TO_SLUG[toCode.toUpperCase()] || toCode.toLowerCase()
  return `/send-money/${fromSlug}-to-${toSlug}`
}

// Check if URL needs redirect to canonical
export const needsCanonicalRedirect = (fromInput: string, toInput: string): boolean => {
  const canonicalFrom = getCanonicalSlug(fromInput)
  const canonicalTo = getCanonicalSlug(toInput)
  return fromInput !== canonicalFrom || toInput !== canonicalTo
}

// Get canonical URL for redirect
export const getCanonicalCorridorUrl = (fromInput: string, toInput: string): string => {
  const canonicalFrom = getCanonicalSlug(fromInput)
  const canonicalTo = getCanonicalSlug(toInput)
  return `/send-money/${canonicalFrom}-to-${canonicalTo}`
}

/**
 * Popular corridors for sitemap and internal linking
 * These are used for generating static pages and sitemap entries
 */
export const POPULAR_CORRIDOR_CODES = [
  // US Outbound (top remittance destinations)
  { from: 'US', to: 'IN' },
  { from: 'US', to: 'MX' },
  { from: 'US', to: 'PH' },
  { from: 'US', to: 'CN' },
  { from: 'US', to: 'VN' },
  { from: 'US', to: 'NG' },
  { from: 'US', to: 'PK' },
  { from: 'US', to: 'BD' },
  { from: 'US', to: 'GT' },
  { from: 'US', to: 'DO' },
  { from: 'US', to: 'JO' },
  { from: 'US', to: 'EG' },
  { from: 'US', to: 'CO' },
  { from: 'US', to: 'BR' },
  { from: 'US', to: 'JP' },

  // UK Outbound
  { from: 'GB', to: 'IN' },
  { from: 'GB', to: 'PK' },
  { from: 'GB', to: 'NG' },
  { from: 'GB', to: 'PH' },
  { from: 'GB', to: 'PL' },
  { from: 'GB', to: 'BD' },
  { from: 'GB', to: 'GH' },

  // Canada Outbound
  { from: 'CA', to: 'IN' },
  { from: 'CA', to: 'PH' },
  { from: 'CA', to: 'PK' },
  { from: 'CA', to: 'CN' },

  // Australia Outbound
  { from: 'AU', to: 'IN' },
  { from: 'AU', to: 'PH' },
  { from: 'AU', to: 'VN' },
  { from: 'AU', to: 'CN' },

  // UAE Outbound
  { from: 'AE', to: 'IN' },
  { from: 'AE', to: 'PK' },
  { from: 'AE', to: 'PH' },
  { from: 'AE', to: 'BD' },

  // Germany Outbound
  { from: 'DE', to: 'TR' },
  { from: 'DE', to: 'PL' },
  { from: 'DE', to: 'RO' },
]

// Generate all corridor URLs for sitemap
export const getAllCorridorUrls = (): string[] => {
  return POPULAR_CORRIDOR_CODES.map(({ from, to }) => getCorridorUrl(from, to))
}

// Generate corridor URL with full-name slugs from codes
export const getCorridorUrlFromCodes = (fromCode: string, toCode: string): string => {
  return getCorridorUrl(fromCode, toCode)
}
