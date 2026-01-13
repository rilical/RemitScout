export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

const PAYMENT_TYPE_TO_CANONICAL: Record<string, string> = {
  ACH: 'bank_transfer',
  BANK_ACCOUNT: 'bank_transfer',
  BANK_TRANSFER: 'bank_transfer',
  DEBIT_CARD: 'debit_card',
  CREDIT_CARD: 'credit_card',
  PAYPAL_BALANCE: 'other',
  PAYPAL: 'other',
  CRYPTO_PYUSD: 'other',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CASH: 'cash',
}

const DISBURSEMENT_TYPE_TO_CANONICAL: Record<string, string> = {
  DEPOSIT: 'bank_deposit',
  BANK_DEPOSIT: 'bank_deposit',
  UPI_DEPOSIT: 'bank_deposit',
  PICKUP: 'cash_pickup',
  CASH_PICKUP: 'cash_pickup',
  CARD_DEPOSIT: 'bank_deposit',
  DELIVERY: 'cash_pickup',
  MOBILE_WALLET: 'mobile_wallet',
}

const expandKeys = (key: string) => {
  const lowered = key.toLowerCase()
  return [key, lowered, lowered.replace(/_/g, '-'), lowered.replace(/_/g, ' ')]
}

export const payinMethodMap: Record<string, string> = Object.fromEntries(
  Object.entries(PAYMENT_TYPE_TO_CANONICAL)
    .flatMap(([key, value]) => expandKeys(key).map(expanded => [expanded, value]))
    .concat(Object.entries(PAYMENT_TYPE_TO_CANONICAL).map(([key, value]) => [value, value])),
)

export const payoutMethodMap: Record<string, string> = Object.fromEntries(
  Object.entries(DISBURSEMENT_TYPE_TO_CANONICAL)
    .flatMap(([key, value]) => expandKeys(key).map(expanded => [expanded, value]))
    .concat(Object.entries(DISBURSEMENT_TYPE_TO_CANONICAL).map(([key, value]) => [value, value])),
)
