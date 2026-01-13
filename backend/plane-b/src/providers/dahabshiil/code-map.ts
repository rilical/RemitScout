export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')

const PAYIN_TO_CANONICAL: Record<string, string> = {
  Cash: 'cash',
  CashIn: 'cash',
  Bank: 'bank_transfer',
  BankTransfer: 'bank_transfer',
}

const PAYOUT_TO_CANONICAL: Record<string, string> = {
  CashCollection: 'cash_pickup',
  Cash_Collection: 'cash_pickup',
  CashCollectionPickup: 'cash_pickup',
  CashPickup: 'cash_pickup',
  CashPayout: 'cash_pickup',
  BankDeposit: 'bank_deposit',
  Bank_Deposit: 'bank_deposit',
  BankAccount: 'bank_deposit',
  MobileWallet: 'mobile_wallet',
  Mobile_Wallet: 'mobile_wallet',
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

const CANONICAL_PAYOUT_TO_DAHABSHIIL: Record<string, string> = {
  cash_pickup: 'Cash Collection',
  bank_deposit: 'Bank Deposit',
  mobile_wallet: 'Mobile Wallet',
}

export const getPayoutTypeForMethod = (payoutMethod?: string | null) => {
  if (!payoutMethod) return CANONICAL_PAYOUT_TO_DAHABSHIIL.cash_pickup
  return CANONICAL_PAYOUT_TO_DAHABSHIIL[payoutMethod] ?? CANONICAL_PAYOUT_TO_DAHABSHIIL.cash_pickup
}
