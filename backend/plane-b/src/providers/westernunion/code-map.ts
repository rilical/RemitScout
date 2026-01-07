export const countryCodeMap: Record<string, string> = {}

export const currencyCodeMap: Record<string, string> = {}

const DELIVERY_SERVICE_CODES: Record<string, string> = {
  '000': 'CASH_PICKUP',
  '200': 'DIRECT_TO_CARD',
  '001': 'ACCOUNT_DEPOSIT',
  '002': 'ACCOUNT_DEPOSIT',
  '500': 'ACCOUNT_DEPOSIT',
  '501': 'ACCOUNT_DEPOSIT',
  '50A': 'ACCOUNT_DEPOSIT',
  '100': 'CASH_HOME_DELIVERY',
  '700': 'CASH_HOME_DELIVERY',
  '050': 'MOBILE_MONEY',
  '060': 'WALLET_ACCOUNT',
  '115': 'UPI',
  '080': 'PREPAID_CARD',
  '800': 'MOBILE_MONEY',
  '801': 'MOBILE_MONEY',
}

const PAYMENT_METHOD_CODES: Record<string, string> = {
  CC: 'CREDITCARD',
  DC: 'DEBITCARD',
  BA: 'BANKACCOUNT',
  AC: 'BANKACCOUNT',
  CA: 'CASH',
  AP: 'APPLEPAY',
  PA: 'PAYNOW',
  PB: 'PAY_BY_BANK',
  IR: 'INTERAC',
  EB: 'ONLINE_BANKING',
  GP: 'GOOGLEPAY',
  TR: 'TRUSTLY',
  TK: 'TRUSTLY',
  SO: 'SOFORT',
}

const DELIVERY_TO_CANONICAL: Record<string, string> = {
  CASH_PICKUP: 'cash_pickup',
  ACCOUNT_DEPOSIT: 'bank_deposit',
  MOBILE_MONEY: 'mobile_wallet',
  WALLET_ACCOUNT: 'mobile_wallet',
  CASH_HOME_DELIVERY: 'cash_pickup',
  UPI: 'bank_deposit',
  PREPAID_CARD: 'other',
  DIRECT_TO_CARD: 'other',
}

const PAYMENT_TO_CANONICAL: Record<string, string> = {
  CREDITCARD: 'credit_card',
  DEBITCARD: 'debit_card',
  BANKACCOUNT: 'bank_transfer',
  CASH: 'cash',
  APPLEPAY: 'apple_pay',
  GOOGLEPAY: 'google_pay',
  PAYNOW: 'bank_transfer',
  PAY_BY_BANK: 'bank_transfer',
  INTERAC: 'bank_transfer',
  ONLINE_BANKING: 'bank_transfer',
  TRUSTLY: 'bank_transfer',
  SOFORT: 'bank_transfer',
}

export const payinMethodMap: Record<string, string> = Object.fromEntries(
  Object.entries(PAYMENT_METHOD_CODES)
    .flatMap(([code, name]) => [
      [code, PAYMENT_TO_CANONICAL[name] ?? 'other'],
      [name, PAYMENT_TO_CANONICAL[name] ?? 'other'],
    ])
    .concat(Object.entries(PAYMENT_TO_CANONICAL)),
)

export const payoutMethodMap: Record<string, string> = Object.fromEntries(
  Object.entries(DELIVERY_SERVICE_CODES)
    .flatMap(([code, name]) => [
      [code, DELIVERY_TO_CANONICAL[name] ?? 'other'],
      [name, DELIVERY_TO_CANONICAL[name] ?? 'other'],
    ])
    .concat(Object.entries(DELIVERY_TO_CANONICAL)),
)

const CANONICAL_PAYIN_TO_CODE: Record<string, string> = {
  bank_transfer: 'AC',
  debit_card: 'DC',
  credit_card: 'CC',
  cash: 'CA',
}

const CANONICAL_PAYOUT_TO_CODE: Record<string, string> = {
  cash_pickup: '000',
  bank_deposit: '001',
  mobile_wallet: '050',
}

export const getPaymentCodeForPayin = (payinMethod?: string | null) => {
  if (!payinMethod) return CANONICAL_PAYIN_TO_CODE.bank_transfer
  return CANONICAL_PAYIN_TO_CODE[payinMethod] ?? CANONICAL_PAYIN_TO_CODE.bank_transfer
}

export const getServiceCodeForPayout = (payoutMethod?: string | null) => {
  if (!payoutMethod) return null
  return CANONICAL_PAYOUT_TO_CODE[payoutMethod] ?? null
}
