const normalizeToken = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

export const countryCodeMap: Record<string, string> = {}
export const currencyCodeMap: Record<string, string> = {}

export const payinMethodMap: Record<string, string> = {
  bank_transfer: 'bank_transfer',
  bank: 'bank_transfer',
  ach: 'bank_transfer',
  debit_card: 'debit_card',
  credit_card: 'credit_card',
}

export const payoutMethodMap: Record<string, string> = {
  bank_account: 'bank_deposit',
  bank_deposit: 'bank_deposit',
  person: 'cash_pickup',
  cash_pickup: 'cash_pickup',
  wallet: 'mobile_wallet',
  alipay_wallet: 'mobile_wallet',
  i_r_d_account: 'bank_deposit',
  m_o_j_account: 'bank_deposit',
  m_s_d_account: 'bank_deposit',
}

export const mapPayinMethod = (value?: string | null) => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  return payinMethodMap[value] ?? payinMethodMap[token] ?? 'other'
}

export const mapRecipientTypeToPayoutMethod = (value?: string | null) => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  return payoutMethodMap[value] ?? payoutMethodMap[token] ?? 'other'
}

export const mapPayoutMethodToRecipientType = (
  payoutMethod?: string | null,
  currency?: string | null,
): string | null => {
  if (!payoutMethod) return null
  const token = normalizeToken(payoutMethod)
  if (token === 'cash_pickup') return 'person'
  if (token === 'mobile_wallet') {
    return currency?.toUpperCase() === 'CNY' ? 'alipay_wallet' : 'wallet'
  }
  if (token === 'bank_deposit' || token === 'bank_account') return 'bank_account'
  if (token === 'alipay_wallet') return 'alipay_wallet'
  if (token === 'wallet') return 'wallet'
  return null
}

export const getRecipientTypesForCurrency = (currency?: string | null): string[] => {
  if (!currency) return []
  const code = currency.toUpperCase()
  const types: string[] = []

  if (code === 'CNY') {
    types.push('alipay_wallet')
  }

  if (!['WST', 'FJD', 'CNY'].includes(code)) {
    types.push('bank_account')
  }

  if (code === 'NZD') {
    types.push('i_r_d_account', 'm_o_j_account', 'm_s_d_account')
  }

  if (['PHP', 'VND', 'NPR'].includes(code)) {
    types.push('person')
  }

  if (['WST', 'FJD', 'PHP', 'COP', 'BWP', 'TOP', 'GHS', 'NPR'].includes(code)) {
    types.push('wallet')
  }

  return types
}
