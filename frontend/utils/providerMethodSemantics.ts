import type { Method } from '~/types/remit'

export const providerMethodOrder: Method[] = ['bank', 'cash', 'wallet', 'airtime', 'home', 'card']

export const normalizeProviderMethod = (value?: string | null): Method | null => {
  if (!value || typeof value !== 'string') return null
  const token = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'bank' || token === 'bank_deposit') return 'bank'
  if (token === 'cash' || token === 'cash_pickup') return 'cash'
  if (token === 'wallet' || token === 'mobile_wallet') return 'wallet'
  if (token === 'airtime') return 'airtime'
  if (token === 'home' || token === 'home_delivery') return 'home'
  if (token === 'card' || token === 'card_delivery' || token === 'debit_card') return 'card'
  return null
}

export const orderProviderMethods = (
  values: Iterable<string | Method | null | undefined>,
): Method[] => {
  const methods = new Set<Method>()
  for (const value of values) {
    const normalized = typeof value === 'string'
      ? normalizeProviderMethod(value)
      : (value ?? null)
    if (normalized) methods.add(normalized)
  }
  return providerMethodOrder.filter(method => methods.has(method))
}

type ProviderSuccessLike = {
  data?: unknown[] | null
  error?: { code?: string | null } | null
}

export const shouldCacheProviderSuccess = (response?: ProviderSuccessLike | null): boolean => {
  if (!response) return false
  if (response.error?.code === 'quotes_unavailable') return false
  return Array.isArray(response.data) && response.data.length > 0
}

export const resolvePayoutMethodSelection = (
  currentMethod: Method,
  availableMethods: Method[],
): Method => {
  if (!availableMethods.length || availableMethods.includes(currentMethod)) {
    return currentMethod
  }
  return availableMethods[0]
}
