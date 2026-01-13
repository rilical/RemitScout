const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

export const countryCodeMap: Record<string, string> = {}
export const currencyCodeMap: Record<string, string> = {}

export const payinMethodMap: Record<string, string> = {
  credit: 'credit_card',
  credit_card: 'credit_card',
  debit: 'debit_card',
  debit_card: 'debit_card',
  ach: 'bank_transfer',
  bank: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  mobile_pay: 'apple_pay',
  mobilepay: 'apple_pay',
  mobile: 'apple_pay',
  apple_pay: 'apple_pay',
  google_pay: 'google_pay',
  boss_money_wallet: 'other',
  wallet: 'other',
}

export const payoutMethodMap: Record<string, string> = {
  bank: 'bank_deposit',
  bank_account: 'bank_deposit',
  bank_deposit: 'bank_deposit',
}

export const normalizeMethodToken = (value?: string | null): string => {
  if (!value) return ''
  return normalizeToken(value)
}

export const mapPayinMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payinMethodMap[token]) return payinMethodMap[token]
  if (token.includes('credit')) return 'credit_card'
  if (token.includes('debit')) return 'debit_card'
  if (token.includes('ach') || token.includes('bank')) return 'bank_transfer'
  if (token.includes('apple')) return 'apple_pay'
  if (token.includes('google')) return 'google_pay'
  if (token.includes('mobile')) return 'apple_pay'
  return 'other'
}

export const mapPayoutMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (payoutMethodMap[token]) return payoutMethodMap[token]
  if (token.includes('bank') || token.includes('account')) return 'bank_deposit'
  return 'other'
}
