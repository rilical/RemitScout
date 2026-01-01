export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

export const payinMethodMap: Record<string, string> = {
  BANK_TRANSFER: 'bank_transfer',
  BANK: 'bank_transfer',
  DEBIT: 'debit_card',
  CARD: 'debit_card',
  MAESTRO: 'debit_card',
  MC_DEBIT_OR_PREPAID: 'debit_card',
  VISA_DEBIT_OR_PREPAID: 'debit_card',
  VISA_BUSINESS_DEBIT: 'debit_card',
  MC_BUSINESS_DEBIT: 'debit_card',
  INTERNATIONAL_DEBIT: 'debit_card',
  INT_DEBIT_WITH_EUROPEAN_CARD: 'debit_card',
  CREDIT: 'credit_card',
  MC_CREDIT: 'credit_card',
  VISA_CREDIT: 'credit_card',
  INTERNATIONAL_CREDIT: 'credit_card',
  INT_CREDIT_WITH_EUROPEAN_CARD: 'credit_card',
  MC_BUSINESS_CREDIT: 'credit_card',
  VISA_BUSINESS_CREDIT: 'credit_card',
  BALANCE: 'bank_transfer',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CASH: 'cash',
}

export const payoutMethodMap: Record<string, string> = {
  BANK_TRANSFER: 'bank_deposit',
  BANK: 'bank_deposit',
  CASH: 'cash_pickup',
  MOBILE_WALLET: 'mobile_wallet',
  AIRTIME: 'airtime',
}
