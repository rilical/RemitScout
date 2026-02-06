/**
 * Fixed exchange rates relative to USD
 * These are approximate rates for validation purposes
 * Used to convert minimum ($50) and maximum ($15,000) amounts
 */
// Exchange rates below are rough estimates to USD for every supported currency, updated June 2024.
// To add a new country or currency, insert the correct ISO code and an approximate USD rate.
// This list is comprehensive and includes all countries/currencies in our system.
export const FIXED_EXCHANGE_RATES: Record<string, number> = {
  // North America
  USD: 1,
  CAD: 1.37,
  MXN: 17.5,
  // Central America & Caribbean
  GTQ: 7.8,
  HNL: 24.5,
  SVC: 8.75,
  NIO: 36.8,
  CRC: 520.0,
  PAB: 1.0,
  BZD: 2.02,
  DOP: 59.1,
  JMD: 156.0,
  HTG: 132.0,
  XCD: 2.7,
  BBD: 2.0,
  BSD: 1.0,
  TTD: 6.8,
  // South America
  ARS: 930,
  BRL: 5.3,
  CLP: 930,
  COP: 3920,
  PEN: 3.8,
  UYU: 39.0,
  PYG: 7350,
  BOB: 6.93,
  VES: 36.5,
  // Western Europe
  EUR: 0.93,
  GBP: 0.79,
  CHF: 0.9,
  ISK: 137,
  NOK: 10.7,
  SEK: 10.9,
  DKK: 6.9,
  // Central/Eastern Europe
  CZK: 22.9,
  HUF: 355.0,
  PLN: 4.0,
  RON: 4.6,
  HRK: 6.9,
  BGN: 1.8,
  RSD: 107.0,
  MDL: 18.0,
  UAH: 40.5,
  BYN: 3.3,
  // Russia/Caucasus
  RUB: 89.0,
  GEL: 2.75,
  AMD: 387.0,
  AZN: 1.7,
  // Middle East
  ILS: 3.68,
  TRY: 32.0,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.65,
  KWD: 0.31,
  OMR: 0.38,
  BHD: 0.38,
  JOD: 0.71,
  LBP: 89000,
  SYP: 13700,
  EGP: 48.0,
  // North Africa
  MAD: 10.2,
  TND: 3.1,
  DZD: 134,
  LYD: 4.85,
  SDG: 600,
  // Sub-Saharan Africa
  ZAR: 18.5,
  NGN: 1500,
  GHS: 15.0,
  KES: 130.0,
  UGX: 3800.0,
  TZS: 2550.0,
  RWF: 1300,
  BIF: 2900,
  XOF: 615.0,
  XAF: 610.0,
  CFA: 610.0, // alias for XOF/XAF
  SZL: 18.5,
  NAD: 18.5,
  MWK: 1700,
  MZN: 64.0,
  MUR: 46.0,
  SCR: 14.0,
  DJF: 178,
  SOS: 570,
  ETB: 57.0,
  SLL: 23.0,
  GMD: 67.0,
  LRD: 190.0,
  GNF: 8600,
  CVE: 102.0,
  // South Asia
  INR: 83.5,
  PKR: 277.0,
  BDT: 118.0,
  NPR: 133.0,
  LKR: 305.0,
  MVR: 15.3,
  AFN: 73.0,
  // Southeast Asia
  SGD: 1.36,
  MYR: 4.7,
  THB: 36.7,
  IDR: 16200,
  VND: 25600,
  PHP: 57.0,
  MMK: 2090,
  KHR: 4080,
  LAK: 21500,
  // East Asia
  CNY: 7.26,
  JPY: 157.0,
  KRW: 1380,
  HKD: 7.79,
  TWD: 32.0,
  MOP: 8.1,
  // Central Asia
  KZT: 445,
  UZS: 12600,
  KGS: 89.2,
  TJS: 10.8,
  // Pacific/Oceania
  AUD: 1.52,
  NZD: 1.67,
  SBD: 8.5,
  TOP: 2.36,
  WST: 2.8,
  VUV: 120.0,
  FJD: 2.25,
  PGK: 3.75,
  // Middle America microstates
  XAG: 0.04, // Silver ounce (not legal tender, placeholder)
  XAU: 0.0005, // Gold ounce (not legal tender, placeholder)
  KYD: 0.82,
  ANG: 1.8,
  AWG: 1.8,
  BMD: 1.0,
  // Others & territories
  SHP: 0.79,
  GIP: 0.79,
  IMP: 0.79,
  JEP: 0.79,
  FKP: 0.79,
  // Cryptocurrency (if supported)
  USDT: 1.0,
  USDC: 1.0,
  BTC: 0.000014, // 1 USD = 0.000014 BTC @ $70k/BTC
  ETH: 0.00024, // 1 USD = 0.00024 ETH @ $4100/ETH
  // Aliases & others (ensure these don't break forms)
  UNKNOWN: 1.0,
}

/**
 * Base minimum amount in USD
 */
export const MIN_AMOUNT_USD = 50

/**
 * Base maximum amount in USD
 */
export const MAX_AMOUNT_USD = 15000

export type AmountLimitOverrides = {
  minAmount?: number | null
  maxAmount?: number | null
  strict?: boolean
}

const resolveAmountLimits = (currencyCode: string, overrides?: AmountLimitOverrides) => {
  const hasMin = overrides && Object.prototype.hasOwnProperty.call(overrides, 'minAmount')
  const hasMax = overrides && Object.prototype.hasOwnProperty.call(overrides, 'maxAmount')
  const min = hasMin ? (overrides?.minAmount ?? null) : getMinAmount(currencyCode)
  const max = hasMax ? (overrides?.maxAmount ?? null) : getMaxAmount(currencyCode)
  const strict = overrides?.strict ?? true
  return { min, max, strict }
}

/**
 * Get the minimum amount for a given currency
 * Converts $50 USD to the target currency using fixed rates
 */
export function getMinAmount(currencyCode: string): number {
  const currency = currencyCode.toUpperCase()
  const rate = FIXED_EXCHANGE_RATES[currency] || 1.0

  // Convert $50 USD to target currency and round up to nearest reasonable number
  const minAmount = MIN_AMOUNT_USD * rate

  // Round to reasonable precision based on currency value
  if (minAmount >= 1000) {
    return Math.ceil(minAmount / 100) * 100 // Round up to nearest 100
  }
  else if (minAmount >= 100) {
    return Math.ceil(minAmount / 10) * 10 // Round up to nearest 10
  }
  else if (minAmount >= 10) {
    return Math.ceil(minAmount) // Round up to nearest integer
  }
  else {
    return Math.ceil(minAmount * 10) / 10 // Round up to 1 decimal
  }
}

/**
 * Get the maximum amount for a given currency
 * Converts $15,000 USD to the target currency using fixed rates
 */
export function getMaxAmount(currencyCode: string): number {
  const currency = currencyCode.toUpperCase()
  const rate = FIXED_EXCHANGE_RATES[currency] || 1.0

  // Convert $15,000 USD to target currency and round down to nearest reasonable number
  const maxAmount = MAX_AMOUNT_USD * rate

  // Round to reasonable precision based on currency value
  if (maxAmount >= 1000000) {
    return Math.floor(maxAmount / 10000) * 10000 // Round down to nearest 10,000
  }
  else if (maxAmount >= 100000) {
    return Math.floor(maxAmount / 1000) * 1000 // Round down to nearest 1,000
  }
  else if (maxAmount >= 10000) {
    return Math.floor(maxAmount / 100) * 100 // Round down to nearest 100
  }
  else if (maxAmount >= 1000) {
    return Math.floor(maxAmount / 10) * 10 // Round down to nearest 10
  }
  else {
    return Math.floor(maxAmount) // Round down to nearest integer
  }
}

/**
 * Validate and sanitize amount based on currency limits
 * Returns the sanitized amount (clamped between min and max)
 */
export function sanitizeAmount(
  amount: number | string,
  currencyCode: string,
  overrides?: AmountLimitOverrides,
): number {
  const currency = currencyCode.toUpperCase()
  const { min: minAmount, max: maxAmount, strict } = resolveAmountLimits(currency, overrides)

  let numAmount: number
  if (typeof amount === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleaned = amount.replace(/[^\d.]/g, '')
    numAmount = Number.parseFloat(cleaned) || 0
  }
  else {
    numAmount = amount || 0
  }

  // Ensure positive number
  if (numAmount < 0 || isNaN(numAmount)) {
    return strict && minAmount !== null ? minAmount : 0
  }

  // Clamp between min and max
  if (!strict) {
    return numAmount
  }
  let clamped = numAmount
  if (minAmount !== null) {
    clamped = Math.max(minAmount, clamped)
  }
  if (maxAmount !== null) {
    clamped = Math.min(maxAmount, clamped)
  }
  return clamped
}

/**
 * Check if an amount is valid for a given currency
 */
export function isValidAmount(
  amount: number | string,
  currencyCode: string,
  overrides?: AmountLimitOverrides,
): boolean {
  const currency = currencyCode.toUpperCase()
  const { min: minAmount, max: maxAmount, strict } = resolveAmountLimits(currency, overrides)

  let numAmount: number
  if (typeof amount === 'string') {
    numAmount = Number.parseFloat(amount.replace(/[^\d.]/g, '')) || 0
  }
  else {
    numAmount = amount || 0
  }

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return false
  }
  if (!strict) {
    return true
  }
  if (minAmount !== null && numAmount < minAmount) {
    return false
  }
  if (maxAmount !== null && numAmount > maxAmount) {
    return false
  }
  return true
}

/**
 * Format an amount as currency for display
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  catch {
    // Fallback if currency is invalid
    return `${currencyCode.toUpperCase()} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
}
