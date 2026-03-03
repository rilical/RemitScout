import { defineEventHandler, setHeader } from 'h3'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { POPULAR_CORRIDOR_CODES, getCorridorUrl } from '~/utils/country-slugs'

// NOTE:
// This route is bundled by Nitro (Rollup), which cannot import/parse `.vue` SFCs.
// If you add/remove learn guide pages under `frontend/pages/learn/*.vue`,
// update this list accordingly.
const LEARN_GUIDE_SLUGS = [
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

const LEARN_GUIDE_DESCRIPTIONS: Record<string, string> = {
  'bank-transfer-vs-card-funding': 'Compares bank transfer and card funding methods for international transfers, including fees, speed, and when to use each.',
  'bank-transfer-vs-card-vs-cash-pickup': 'Breaks down the three main delivery methods — bank deposit, card, and cash pickup — with pros and cons of each.',
  'best-time-to-send-money': 'Explains how exchange rate timing affects the total cost of a transfer and strategies for getting better rates.',
  'choose-right-delivery-method': 'Guide to selecting between bank deposit, mobile wallet, cash pickup, and card delivery based on your needs.',
  'embed-remit-scout-on-your-site': 'Instructions for embedding the Remit-Scout comparison widget on your own website or blog.',
  'hidden-exchange-rate-fees-explained': 'Reveals how providers mark up the mid-market exchange rate and how to spot hidden fees in quotes.',
  'how-exchange-rates-work': 'Explains mid-market rates, buy/sell spreads, and how exchange rates impact the total cost of remittances.',
  'how-fast-is-international-money-transfer': 'Compares delivery speeds across providers and methods, from instant to 3-5 business days.',
  'how-remit-score-works': 'Details the Remit-Score methodology: how we weight delivered value, reliability, speed, support, and trust.',
  'how-to-read-remittance-quote': 'Teaches you how to interpret a remittance quote — exchange rate, fees, delivery amount, and total cost.',
  'money-transfer': 'Comprehensive guide to international money transfers: how they work, what to compare, and how to save.',
  'promo-codes-intro-rates': 'How first-time promotional rates and coupon codes work, and why ongoing rates matter more.',
  'why-checkout-price-differs': 'Explains why the price you see at checkout can differ from the comparison page and how to handle it.',
  'why-compare-before-every-transfer': 'Makes the case for comparing providers before each transfer, since rates and fees change constantly.',
}

// Exchange rate pairs - keep in sync with the curated list on `/exchange-rates`.
const EXCHANGE_RATE_PAIR_SLUGS = [
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

const EXCHANGE_RATE_NAMES: Record<string, string> = {
  'usd-inr': 'US Dollar to Indian Rupee',
  'usd-php': 'US Dollar to Philippine Peso',
  'usd-mxn': 'US Dollar to Mexican Peso',
  'usd-ngn': 'US Dollar to Nigerian Naira',
  'gbp-inr': 'British Pound to Indian Rupee',
  'gbp-ngn': 'British Pound to Nigerian Naira',
  'gbp-pkr': 'British Pound to Pakistani Rupee',
  'gbp-usd': 'British Pound to US Dollar',
  'cad-inr': 'Canadian Dollar to Indian Rupee',
  'cad-php': 'Canadian Dollar to Philippine Peso',
  'cad-ngn': 'Canadian Dollar to Nigerian Naira',
  'cad-usd': 'Canadian Dollar to US Dollar',
  'eur-usd': 'Euro to US Dollar',
  'eur-inr': 'Euro to Indian Rupee',
  'eur-gbp': 'Euro to British Pound',
  'eur-ngn': 'Euro to Nigerian Naira',
}

// Country code to human-readable name for corridor descriptions.
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  AE: 'United Arab Emirates',
  DE: 'Germany',
  IN: 'India',
  MX: 'Mexico',
  PH: 'Philippines',
  CN: 'China',
  VN: 'Vietnam',
  NG: 'Nigeria',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  GT: 'Guatemala',
  DO: 'Dominican Republic',
  JO: 'Jordan',
  EG: 'Egypt',
  CO: 'Colombia',
  BR: 'Brazil',
  JP: 'Japan',
  PL: 'Poland',
  GH: 'Ghana',
  TR: 'Turkey',
  RO: 'Romania',
}

const PROVIDER_COMPARISONS = [
  'wise-vs-remitly',
  'wise-vs-western-union',
  'wise-vs-xoom',
  'remitly-vs-western-union',
]

const slugToTitle = (slug: string): string =>
  slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const formatScoreBreakdown = (breakdown: { deliveredValue: number; reliability: number; frictionSpeed: number; supportRefunds: number; trustSafety: number }): string => {
  return [
    `  Delivered Value: ${(breakdown.deliveredValue * 10).toFixed(1)}/10`,
    `  Reliability: ${(breakdown.reliability * 10).toFixed(1)}/10`,
    `  Speed & Friction: ${(breakdown.frictionSpeed * 10).toFixed(1)}/10`,
    `  Support & Refunds: ${(breakdown.supportRefunds * 10).toFixed(1)}/10`,
    `  Trust & Safety: ${(breakdown.trustSafety * 10).toFixed(1)}/10`,
  ].join('\n')
}

export const buildLlmsFullTxt = (siteUrl: string) => {
  const base = siteUrl.replace(/\/$/, '')
  const lines: string[] = []

  // ── Header ──
  lines.push('# Remit-Scout')
  lines.push('')
  lines.push('> Remit-Scout is an independent comparison platform for international money transfers. We aggregate live quotes from 25+ licensed providers (Wise, Remitly, Western Union, etc.) and rank them by total cost, speed, and trust score across 200+ corridors worldwide.')
  lines.push('')

  // ── Key Pages ──
  lines.push('## Key Pages')
  lines.push('')
  lines.push(`- [Compare Money Transfers](${base}/send-money)`)
  lines.push(`- [All Corridors](${base}/corridors)`)
  lines.push(`- [Exchange Rates](${base}/exchange-rates)`)
  lines.push(`- [Provider Directory](${base}/learn/providers)`)
  lines.push(`- [Methodology](${base}/methodology)`)
  lines.push('')

  // ── Corridor Comparisons (expanded) ──
  lines.push('## Corridor Comparisons')
  lines.push('')
  lines.push('Compare providers for sending money between countries. Each corridor page shows live quotes ranked by total cost.')
  lines.push('')

  // Group corridors by source country
  const corridorsBySource: Record<string, Array<{ from: string; to: string }>> = {}
  for (const corridor of POPULAR_CORRIDOR_CODES) {
    if (!corridorsBySource[corridor.from]) {
      corridorsBySource[corridor.from] = []
    }
    corridorsBySource[corridor.from].push(corridor)
  }

  for (const [sourceCode, corridors] of Object.entries(corridorsBySource)) {
    const sourceName = COUNTRY_NAMES[sourceCode] || sourceCode
    lines.push(`### From ${sourceName}`)
    for (const corridor of corridors) {
      const fromName = COUNTRY_NAMES[corridor.from] || corridor.from
      const toName = COUNTRY_NAMES[corridor.to] || corridor.to
      const url = getCorridorUrl(corridor.from, corridor.to)
      lines.push(`- [${fromName} to ${toName}](${base}${url})`)
    }
    lines.push('')
  }

  // ── Provider Reviews (expanded) ──
  lines.push('## Provider Reviews')
  lines.push('')

  const sortedProviders = Object.values(PROVIDER_SCORES).sort((a, b) => b.remitScore - a.remitScore)
  for (const provider of sortedProviders) {
    lines.push(`### ${provider.name}`)
    lines.push(`URL: ${base}/learn/providers/${provider.slug}`)
    lines.push(`Remit-Score: ${provider.remitScore}/10`)
    if (provider.scoreBreakdown) {
      lines.push(formatScoreBreakdown(provider.scoreBreakdown))
    }
    lines.push('')
  }

  // ── Provider Comparisons ──
  lines.push('## Provider Comparisons')
  lines.push('')
  for (const slug of PROVIDER_COMPARISONS) {
    const title = slug
      .split('-vs-')
      .map(s => slugToTitle(s))
      .join(' vs ')
    lines.push(`- [${title}](${base}/compare/${slug})`)
  }
  lines.push('')

  // ── Exchange Rates (expanded) ──
  lines.push('## Exchange Rates')
  lines.push('')
  lines.push('Live mid-market exchange rates with provider markup comparison.')
  lines.push('')
  for (const slug of EXCHANGE_RATE_PAIR_SLUGS) {
    const name = EXCHANGE_RATE_NAMES[slug] || slug.toUpperCase().replace('-', '/')
    lines.push(`- [${name}](${base}/exchange-rates/${slug})`)
  }
  lines.push('')

  // ── Learn Guides (expanded) ──
  lines.push('## Learn Guides')
  lines.push('')
  for (const slug of LEARN_GUIDE_SLUGS) {
    const title = slugToTitle(slug)
    const description = LEARN_GUIDE_DESCRIPTIONS[slug] || ''
    lines.push(`### ${title}`)
    lines.push(`URL: ${base}/learn/${slug}`)
    if (description) {
      lines.push(description)
    }
    lines.push('')
  }

  // ── FAQ ──
  lines.push('## Frequently Asked Questions')
  lines.push('')

  lines.push('### What is Remit-Scout?')
  lines.push('Remit-Scout is a free, independent comparison platform for international money transfers. We collect live quotes from 25+ licensed remittance providers and rank them by total delivered cost, speed, and trust score so users can find the cheapest way to send money abroad.')
  lines.push('')

  lines.push('### How does Remit-Scout make money?')
  lines.push('Remit-Scout earns referral commissions when users click through to a provider and complete a transfer. Our rankings are never influenced by commercial relationships — the cheapest option always ranks first. See our full disclosure at /legal/how-we-make-money.')
  lines.push('')

  lines.push('### What is the Remit-Score?')
  lines.push('The Remit-Score is our proprietary rating (0-10) for each provider. It is a weighted composite of five factors: Delivered Value (how much money actually arrives), Reliability (uptime and success rate), Speed & Friction (transfer speed and UX quality), Support & Refunds (customer service and refund policy), and Trust & Safety (licensing, encryption, regulatory compliance). See /learn/how-remit-score-works for the full methodology.')
  lines.push('')

  lines.push('### How many providers does Remit-Scout compare?')
  lines.push('We currently compare 25+ licensed money transfer providers including Wise, Remitly, Western Union, Xoom, WorldRemit, RIA, Sendwave, TransferGo, and others. Each provider is monitored in real time across all supported corridors.')
  lines.push('')

  lines.push('### How often are quotes updated?')
  lines.push('Quotes are refreshed continuously throughout the day. Exchange rates and fees change frequently, which is why we recommend comparing before every transfer. Our data pipeline ingests fresh quotes from each provider multiple times per hour.')
  lines.push('')

  lines.push('### What corridors does Remit-Scout cover?')
  lines.push('We cover 200+ corridors worldwide, with deep coverage of major send markets (United States, United Kingdom, Canada, Australia, UAE, Germany) and top receive markets (India, Mexico, Philippines, Nigeria, Pakistan, Bangladesh, and more). See /corridors for the full list.')
  lines.push('')

  lines.push('### Is Remit-Scout free to use?')
  lines.push('Yes, Remit-Scout is completely free for consumers. There is no sign-up required to compare quotes. We also offer Remit-Scout Plus, a premium tier with additional features like price alerts and historical rate data.')
  lines.push('')

  // ── API Documentation ──
  lines.push('## API Documentation')
  lines.push('')
  lines.push(`- [OpenAPI Spec (JSON)](${base}/api-docs/json)`)
  lines.push('')

  return lines.join('\n')
}

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig()
  const base = siteUrl || 'https://remitscout.com'

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

  return buildLlmsFullTxt(base)
})
