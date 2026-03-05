import type { ProviderQuote } from '~/types/remit'

const SINGX_ALLOWED_SOURCE_COUNTRIES = new Set(['SG', 'HK', 'AU'])

const normalizeToken = (value: string | null | undefined): string => {
  if (!value) return ''
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const isSingxQuote = (quote: ProviderQuote): boolean => {
  return (
    normalizeToken(quote.id) === 'singx'
    || normalizeToken(quote.providerId) === 'singx'
    || normalizeToken(quote.name) === 'singx'
  )
}

const isSingxProviderLabel = (value: unknown): boolean => {
  if (typeof value !== 'string') return false
  return normalizeToken(value) === 'singx'
}

const filterProviderLabels = (values: unknown): string[] | undefined => {
  if (!Array.isArray(values)) return undefined
  return values.filter(value => !isSingxProviderLabel(value)) as string[]
}

export const applyProviderSourceVisibility = <T extends Record<string, unknown>>(
  response: T,
  sourceCountry: string,
): T => {
  const normalizedSource = sourceCountry.trim().toUpperCase()
  if (SINGX_ALLOWED_SOURCE_COUNTRIES.has(normalizedSource)) {
    return response
  }

  const quotes = (Array.isArray(response.data) ? response.data : []) as ProviderQuote[]
  if (!quotes.length) return response

  const filteredData = quotes.filter(quote => !isSingxQuote(quote))
  if (filteredData.length === quotes.length) return response

  const next: Record<string, unknown> = {
    ...response,
    data: filteredData,
  }

  const providerQuotes = Array.isArray(response.providerQuotes)
    ? (response.providerQuotes as ProviderQuote[])
    : null
  if (providerQuotes) {
    next.providerQuotes = providerQuotes.filter(quote => !isSingxQuote(quote))
  }

  if (response.availableMethodsByProvider && typeof response.availableMethodsByProvider === 'object') {
    const entries = Object.entries(response.availableMethodsByProvider as Record<string, string[]>)
      .filter(([provider]) => !isSingxProviderLabel(provider))
    next.availableMethodsByProvider = Object.fromEntries(entries)
  }

  if (Array.isArray(response.excludedProviders)) {
    next.excludedProviders = response.excludedProviders.filter((entry) => {
      if (!entry || typeof entry !== 'object') return true
      return !isSingxProviderLabel((entry as { provider?: unknown }).provider)
    })
  }

  if (Array.isArray(response.excludedProvidersDetailed)) {
    next.excludedProvidersDetailed = response.excludedProvidersDetailed.filter((entry) => {
      if (!entry || typeof entry !== 'object') return true
      return !isSingxProviderLabel((entry as { provider?: unknown }).provider)
    })
  }

  if (response.refresh && typeof response.refresh === 'object') {
    const refresh = { ...(response.refresh as Record<string, unknown>) }
    const providers = filterProviderLabels(refresh.providers)
    if (providers) refresh.providers = providers
    const dedupedProviders = filterProviderLabels(refresh.dedupedProviders)
    if (dedupedProviders) refresh.dedupedProviders = dedupedProviders
    next.refresh = refresh
  }

  return next as T
}
