export const countryCodeMap: Record<string, string> = {
  XK: 'KV',
}

export const currencyCodeMap: Record<string, string> = {}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const PAYIN_TO_CANONICAL: Record<string, string> = {
  DirectDebit: 'bank_transfer',
  BankTransfer: 'bank_transfer',
  DebitCard: 'debit_card',
  CreditCard: 'credit_card',
  ApplePay: 'apple_pay',
  GooglePay: 'google_pay',
  Cash: 'cash',
}

const PAYOUT_TO_CANONICAL: Record<string, string> = {
  BankAccount: 'bank_deposit',
  BankDeposit: 'bank_deposit',
  CashPayout: 'cash_pickup',
  CashPickup: 'cash_pickup',
  MobileWallet: 'mobile_wallet',
  FundsOnBalance: 'other',
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

const CANONICAL_PAYIN_TO_RIA: Record<string, string> = {
  bank_transfer: 'DirectDebit',
  debit_card: 'DebitCard',
  credit_card: 'CreditCard',
  apple_pay: 'ApplePay',
  google_pay: 'GooglePay',
  cash: 'Cash',
}

const CANONICAL_PAYOUT_TO_RIA: Record<string, string> = {
  bank_deposit: 'BankDeposit',
  cash_pickup: 'CashPayout',
  mobile_wallet: 'MobileWallet',
}

export const getPaymentMethodForPayin = (payinMethod?: string | null) => {
  if (!payinMethod) return CANONICAL_PAYIN_TO_RIA.bank_transfer
  return CANONICAL_PAYIN_TO_RIA[payinMethod] ?? CANONICAL_PAYIN_TO_RIA.bank_transfer
}

export const getDeliveryMethodForPayout = (payoutMethod?: string | null) => {
  if (!payoutMethod) return CANONICAL_PAYOUT_TO_RIA.bank_deposit
  return CANONICAL_PAYOUT_TO_RIA[payoutMethod] ?? CANONICAL_PAYOUT_TO_RIA.bank_deposit
}
