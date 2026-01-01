export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

export const payinMethodMap: Record<string, string> = {
  BANK_TRANSFER: 'bank_transfer',
  BANK: 'bank_transfer',
  TRANSFER: 'bank_transfer',
  DEBIT_CARD: 'debit_card',
  CREDIT_CARD: 'credit_card',
  CARD: 'debit_card',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CASH: 'cash',
}

export const payoutMethodMap: Record<string, string> = {
  BNK: 'bank_deposit',
  CSH: 'cash_pickup',
  MOB: 'mobile_wallet',
  ATP: 'airtime',
  BANK: 'bank_deposit',
  CASH: 'cash_pickup',
}
