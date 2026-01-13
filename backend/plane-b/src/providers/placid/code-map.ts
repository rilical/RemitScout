const normalizeToken = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_')

const PAYIN_TO_CANONICAL: Record<string, string> = {
  debit: 'debit_card',
  debit_card: 'debit_card',
  card: 'debit_card',
  credit: 'credit_card',
  credit_card: 'credit_card',
  bank: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  bank_account: 'bank_transfer',
  ach: 'bank_transfer',
}

const PAYOUT_TO_CANONICAL: Record<string, string> = {
  bank: 'bank_deposit',
  bank_deposit: 'bank_deposit',
  bank_account: 'bank_deposit',
  deposit: 'bank_deposit',
}

const PLACID_PAYIN_CODE_TO_CANONICAL: Record<string, string> = {
  cc: 'debit_card',
  dc: 'debit_card',
  ba: 'bank_transfer',
  pm: 'other',
}

const CANONICAL_TO_PLACID_PAYIN_CODE: Record<string, string> = {
  debit_card: 'CC',
  credit_card: 'CC',
  bank_transfer: 'BA',
  bank_account: 'BA',
}

const buildMethodMap = (mapping: Record<string, string>) => {
  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(mapping)) {
    entries.push([key, value])
    entries.push([normalizeToken(key), value])
  }
  return Object.fromEntries(entries)
}

export const payinMethodMap: Record<string, string> = buildMethodMap(PAYIN_TO_CANONICAL)
export const payoutMethodMap: Record<string, string> = buildMethodMap(PAYOUT_TO_CANONICAL)

export const mapPayinMethod = (value?: string | null) => {
  if (!value) return 'bank_transfer'
  const token = normalizeToken(value)
  return payinMethodMap[value] ?? payinMethodMap[token] ?? 'bank_transfer'
}

export const mapPayoutMethod = (value?: string | null) => {
  if (!value) return 'bank_deposit'
  const token = normalizeToken(value)
  return payoutMethodMap[value] ?? payoutMethodMap[token] ?? 'bank_deposit'
}

export const mapPlacidPaymentType = (value?: string | null) => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  return PLACID_PAYIN_CODE_TO_CANONICAL[token] ?? 'other'
}

export const mapPayinToPlacidCode = (value?: string | null) => {
  if (!value) return 'BA'
  const token = normalizeToken(value)
  return CANONICAL_TO_PLACID_PAYIN_CODE[value]
    ?? CANONICAL_TO_PLACID_PAYIN_CODE[token]
    ?? 'BA'
}

export const normalizeMethodToken = normalizeToken
