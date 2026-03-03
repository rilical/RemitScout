// NOTE:
// These constants are used by Nitro server routes (bundled by Rollup),
// which cannot import/parse `.vue` SFCs.
// If you add/remove learn guide pages under `frontend/pages/learn/*.vue`,
// update the LEARN_GUIDE_SLUGS list accordingly.

export const LEARN_GUIDE_SLUGS = [
  'bank-transfer-vs-card-funding',
  'bank-transfer-vs-card-vs-cash-pickup',
  'best-time-to-send-money',
  'choose-right-delivery-method',
  'embed-remit-scout-on-your-site',
  'hidden-exchange-rate-fees-explained',
  'how-exchange-rates-work',
  'how-fast-is-international-money-transfer',
  'how-remit-score-works',
  'how-to-read-remittance-quote',
  'money-transfer',
  'promo-codes-intro-rates',
  'why-checkout-price-differs',
  'why-compare-before-every-transfer',
] as const

// Exchange rate pairs - keep in sync with the curated list on `/exchange-rates`.
export const EXCHANGE_RATE_PAIR_SLUGS = [
  'usd-inr',
  'usd-php',
  'usd-mxn',
  'usd-ngn',
  'gbp-inr',
  'gbp-ngn',
  'gbp-pkr',
  'gbp-usd',
  'cad-inr',
  'cad-php',
  'cad-ngn',
  'cad-usd',
  'eur-usd',
  'eur-inr',
  'eur-gbp',
  'eur-ngn',
] as const

// Provider head-to-head comparison slugs.
export const PROVIDER_COMPARISONS = [
  'wise-vs-remitly',
  'wise-vs-western-union',
  'wise-vs-xoom',
  'remitly-vs-western-union',
] as const
