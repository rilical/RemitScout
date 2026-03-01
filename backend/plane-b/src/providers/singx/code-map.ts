const normalizeToken = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_')

export const payinMethodMap: Record<string, string> = {
  bank_transfer: 'bank_transfer',
  bank: 'bank_transfer',
  transfer: 'bank_transfer',
  debit: 'debit_card',
  debit_card: 'debit_card',
  card: 'debit_card',
  credit: 'credit_card',
  credit_card: 'credit_card',
}

export const payoutMethodMap: Record<string, string> = {
  bank_deposit: 'bank_deposit',
  bank: 'bank_deposit',
  deposit: 'bank_deposit',
  cash: 'cash_pickup',
  wallet: 'mobile_wallet',
}

export const mapPayinMethod = (value?: string | null) => {
  if (!value) return 'bank_transfer'
  const token = normalizeToken(value)
  return payinMethodMap[value] ?? payinMethodMap[token] ?? 'bank_transfer'
}

export const mapPayoutMethod = (value?: string | null) => {
  if (!value) return 'bank_deposit'
  const token = normalizeToken(value)
  return payoutMethodMap[value] ?? payoutMethodMap[token] ?? 'other'
}

export const normalizeMethodToken = normalizeToken
