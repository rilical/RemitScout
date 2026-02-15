<template>
  <FxPairExchangeRatesPage
    :base="base"
    :quote="quote"
    :pair-label="pairLabel"
    :example-amount="exampleAmount"
    :mid-market-rate="midMarketRate"
    :watch-target="watchTarget"
    :provider-pricing-rows="providerPricingRows"
    :provider-pricing-loading="pending"
    :corridor-links="corridorLinks"
    :breadcrumb-items="breadcrumbItems"
  />
</template>

<script setup lang="ts">
import { FxPairExchangeRatesPage, useFxPairExchangeRates } from '~/domains/market-data'
import { useStructuredData } from '~/composables/useStructuredData'

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

const base = computed(() => (route.params.base as string || '').toUpperCase())
const quote = computed(() => (route.params.quote as string || '').toUpperCase())
const pairLabel = computed(() => `${base.value} → ${quote.value}`)
const exampleAmount = computed(() => `${base.value} 1,000`)
const watchTarget = computed(() => ({ type: 'fxPair' as const, base: base.value, quote: quote.value }))

defineOgImage({
  component: 'OgImageDefault',
  props: {
    title: pairLabel,
    description: computed(() => `See today’s ${base.value}/${quote.value} mid-market rate and typical provider markups.`),
  },
})

const { pending, midMarketRate, providerPricingRows } = useFxPairExchangeRates(base, quote)

const seoTitle = computed(() => `${base.value} to ${quote.value} Exchange Rate & Transfer Fees | Remit-Scout`)
const seoDescription = computed(() => `See today’s ${base.value}/${quote.value} rate, typical provider markups, and timing tips to keep more in ${quote.value}.`)

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

// Get country codes from currency codes for corridor URL
const baseCountryCode = computed(() => SLUG_TO_CODE[getCanonicalSlug(base.value)] || base.value)
const quoteCountryCode = computed(() => SLUG_TO_CODE[getCanonicalSlug(quote.value)] || quote.value)

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Exchange Rates', path: '/exchange-rates' },
  { name: `${base.value} to ${quote.value}`, path: route.path },
])

const corridorLinks = computed(() => [
  { label: `${pairLabel.value} money transfers`, href: getCorridorUrl(baseCountryCode.value, quoteCountryCode.value) },
  { label: 'Provider reviews', href: '/learn/providers' },
  { label: 'Hidden fees guide', href: '/learn/hidden-exchange-rate-fees-explained' },
  { label: 'FAQ', href: '/faq' },
])

setSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  canonical: `${siteUrl}/exchange-rates/${route.params.base}-${route.params.quote}`,
  ogImage: false,
})

const { addBreadcrumbSchema, addExchangeRateSchema } = useStructuredData()

addBreadcrumbSchema([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Exchange Rates', url: `${siteUrl}/exchange-rates` },
  { name: `${base.value} to ${quote.value}`, url: `${siteUrl}${route.path}` },
])

watchEffect(() => {
  const rate = Number(midMarketRate.value)
  if (!Number.isFinite(rate) || rate <= 0) return
  addExchangeRateSchema({
    baseCurrency: base.value,
    quoteCurrency: quote.value,
    rate,
    provider: 'Remit-Scout',
  })
})
</script>
