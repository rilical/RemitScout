const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

export const normalizeMethodToken = (value?: string | null): string => {
  if (!value) return ''
  return normalizeToken(value)
}

export const mapPayinMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (token.includes('open_api')) return 'bank_transfer'
  if (token.includes('bank_account') || token.includes('bank')) return 'bank_transfer'
  if (token.includes('card')) return 'debit_card'
  return 'other'
}

export const mapPayoutMethod = (value?: string | null): string => {
  const token = normalizeMethodToken(value)
  if (!token) return 'other'
  if (token.includes('mobile_wallet') || token.includes('wallet') || token.includes('alipay') || token.includes('wechat')) {
    return 'mobile_wallet'
  }
  if (token.includes('cash_pickup') || token.includes('cash') || token.includes('home_delivery')) {
    return 'cash_pickup'
  }
  if (token.includes('bank_account') || token.includes('bank') || token.includes('card')) {
    return 'bank_deposit'
  }
  return 'other'
}
