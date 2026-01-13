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
  bank_deposit: 'bank_deposit',
  bank: 'bank_deposit',
  cash_pickup: 'cash_pickup',
  mobile_wallet: 'mobile_wallet',
}
