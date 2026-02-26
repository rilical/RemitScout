export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')

const PAYIN_TO_CANONICAL: Record<string, string> = {
  card: 'debit_card',
  debit: 'debit_card',
  debitcard: 'debit_card',
  debit_card: 'debit_card',
  credit: 'credit_card',
  creditcard: 'credit_card',
  credit_card: 'credit_card',
  bank_transfer: 'bank_transfer',
}

const PAYOUT_TO_CANONICAL: Record<string, string> = {
  bank: 'bank_deposit',
  bank_account: 'bank_deposit',
  bank_deposit: 'bank_deposit',
  bank_transfer: 'bank_deposit',
  cash: 'cash_pickup',
  cash_pickup: 'cash_pickup',
  cash_collection: 'cash_pickup',
  mobile: 'mobile_wallet',
  mobile_money: 'mobile_wallet',
  mobile_wallet: 'mobile_wallet',
  wallet: 'mobile_wallet',
  gcash: 'mobile_wallet',
  bkash: 'mobile_wallet',
  wave: 'mobile_wallet',
  chipper: 'mobile_wallet',
  ecocash: 'mobile_wallet',
  mtn: 'mobile_wallet',
  mtn_mobile_money: 'mobile_wallet',
  vodafone: 'mobile_wallet',
  vodafone_cash: 'mobile_wallet',
  airtel_money: 'mobile_wallet',
  tigo_pesa: 'mobile_wallet',
  orange_money: 'mobile_wallet',
  mpesa: 'mobile_wallet',
  m_pesa: 'mobile_wallet',
  momo: 'mobile_wallet',
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

export const mapSendwavePayinMethod = (value?: string | null) => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  return payinMethodMap[value] ?? payinMethodMap[token] ?? 'other'
}

export const mapSendwavePayoutMethod = (value?: string | null) => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  const mapped = payoutMethodMap[value] ?? payoutMethodMap[token]
  if (mapped) return mapped

  if (token.includes('cash')) return 'cash_pickup'
  if (token.includes('bank') || token.includes('account') || token.includes('deposit')) return 'bank_deposit'
  if (
    token.includes('mobile')
    || token.includes('wallet')
    || token.includes('gcash')
    || token.includes('mpesa')
    || token.includes('m_pesa')
    || token.includes('momo')
    || token.includes('airtel')
    || token.includes('tigo')
    || token.includes('orange')
  ) {
    return 'mobile_wallet'
  }

  return 'other'
}
