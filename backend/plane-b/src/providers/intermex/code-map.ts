import { INTERMEX_DESTINATION_OPTIONS } from './supported-corridors'

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

const payinMethodIdMap: Record<string, number> = {
  debit_card: 3,
  credit_card: 4,
}

const payoutTranTypeIdMap: Record<string, number> = {
  cash_pickup: 1,
  bank_deposit: 3,
}

const payinMethodMap: Record<string, string> = {
  debit_card: 'debit_card',
  debitcard: 'debit_card',
  debit: 'debit_card',
  credit_card: 'credit_card',
  creditcard: 'credit_card',
  credit: 'credit_card',
  card: 'debit_card',
}

const payoutMethodMap: Record<string, string> = {
  cash_pickup: 'cash_pickup',
  cash: 'cash_pickup',
  bank_deposit: 'bank_deposit',
  bank: 'bank_deposit',
}

const payoutMethodByTranTypeId: Record<number, string> = {
  1: 'cash_pickup',
  3: 'bank_deposit',
}

const payinMethodById: Record<number, string> = {
  3: 'debit_card',
  4: 'credit_card',
}

export const normalizeMethodToken = (value?: string | null): string => {
  if (!value) return ''
  return normalizeToken(value)
}

export const mapPayinMethod = (value?: string | number | null): string => {
  if (typeof value === 'number') {
    return payinMethodById[value] ?? 'other'
  }
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payinMethodMap[token]) return payinMethodMap[token]
  if (token.includes('debit')) return 'debit_card'
  if (token.includes('credit')) return 'credit_card'
  if (token.includes('card')) return 'debit_card'
  return 'other'
}

export const mapPayoutMethod = (value?: string | number | null): string => {
  if (typeof value === 'number') {
    return payoutMethodByTranTypeId[value] ?? 'other'
  }
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payoutMethodMap[token]) return payoutMethodMap[token]
  if (token.includes('cash')) return 'cash_pickup'
  if (token.includes('bank')) return 'bank_deposit'
  return 'other'
}

export const resolvePayinMethodId = (method?: string | null): number => {
  if (!method) return payinMethodIdMap.debit_card
  const token = normalizeMethodToken(method)
  return payinMethodIdMap[token] ?? payinMethodIdMap.debit_card
}

export const resolveTranTypeId = (method?: string | null): number => {
  if (!method) return payoutTranTypeIdMap.bank_deposit
  const token = normalizeMethodToken(method)
  return payoutTranTypeIdMap[token] ?? payoutTranTypeIdMap.bank_deposit
}

const destinationCodeMap = new Map<string, string>()

for (const option of INTERMEX_DESTINATION_OPTIONS) {
  const key = `${option.country}-${option.currency}`
  if (!destinationCodeMap.has(key)) {
    destinationCodeMap.set(key, option.intermexCode)
  }
}

export const resolveIntermexDestinationCode = (
  country: string,
  currency: string,
): string | null => {
  const key = `${country}-${currency}`
  return destinationCodeMap.get(key) ?? null
}

export const DEFAULT_INTERMEX_STYLE_ID = 3
export const DEFAULT_INTERMEX_DELIVERY_TYPE = 'W'
export const DEFAULT_INTERMEX_ORIGIN_COUNTRY = 'USA'
export const DEFAULT_INTERMEX_ORIGIN_STATE = 'PA'
