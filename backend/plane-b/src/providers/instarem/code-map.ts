const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

export const payinMethodMap: Record<string, string> = {
  ach: 'bank_transfer',
  direct_debit: 'bank_transfer',
  ach_direct_debit: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  bank: 'bank_transfer',
  wire_transfer: 'bank_transfer',
  wire: 'bank_transfer',
  paynow: 'bank_transfer',
  instarem_as_payee: 'bank_transfer',
  instarem_payee: 'bank_transfer',
  payee: 'bank_transfer',
  online_banking: 'bank_transfer',
  debit: 'debit_card',
  debit_card: 'debit_card',
  credit: 'credit_card',
  credit_card: 'credit_card',
  card: 'debit_card',
  apple_pay: 'apple_pay',
  google_pay: 'google_pay',
}

export const payoutMethodMap: Record<string, string> = {
  bank: 'bank_deposit',
  bank_deposit: 'bank_deposit',
  cash: 'cash_pickup',
  cash_pickup: 'cash_pickup',
  wallet: 'mobile_wallet',
  mobile_wallet: 'mobile_wallet',
  airtime: 'airtime',
}

export const normalizeMethodToken = (value?: string | null): string => {
  if (!value) return ''
  return normalizeToken(value)
}

export const mapPayinMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payinMethodMap[token]) return payinMethodMap[token]
  if (token.includes('debit')) return 'debit_card'
  if (token.includes('credit')) return 'credit_card'
  if (token.includes('apple')) return 'apple_pay'
  if (token.includes('google')) return 'google_pay'
  if (token.includes('card')) return 'debit_card'
  if (token.includes('wire') || token.includes('ach') || token.includes('bank') || token.includes('transfer')) {
    return 'bank_transfer'
  }
  if (token.includes('cash')) return 'cash'
  return 'other'
}

export const mapPayoutMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payoutMethodMap[token]) return payoutMethodMap[token]
  if (token.includes('bank')) return 'bank_deposit'
  if (token.includes('cash')) return 'cash_pickup'
  if (token.includes('wallet')) return 'mobile_wallet'
  if (token.includes('airtime')) return 'airtime'
  return 'other'
}
