<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="container py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-surface p-6 shadow-md">
        <div class="mb-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center">
            <ProviderLogo
              :slug="provider?.slug || ''"
              :alt="provider?.name"
              size="large"
              class="mr-4"
            />
            <div>
              <h1 class="mb-2 text-h1 font-bold text-neutral-900">
                {{ provider?.name }}
              </h1>
              <p class="text-body-sm text-neutral-500">
                {{ providerTypeLabel }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Badge
              v-if="provider?.isAffiliate"
              variant="primary"
            >
              Affiliate
            </Badge>
            <a
              v-if="outboundUrl"
              :href="outboundUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-surface px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:border-brand-500 hover:text-brand-600"
            >
              Visit provider
            </a>
          </div>
        </div>

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="flex flex-col items-center">
            <RemitScoreRing :score="provider?.remitScore ?? 0" />
            <div class="mt-2 text-neutral-600">
              Remit-Scout Score
            </div>
          </div>
          <div class="text-center">
            <div class="text-h3 font-bold text-primary-600">
              {{ provider?.type || 'N/A' }}
            </div>
            <div class="text-neutral-600">
              Provider Type
            </div>
          </div>
          <div class="text-center">
            <div class="text-h3 font-bold text-primary-600">
              {{ provider?.slug?.toUpperCase() || 'N/A' }}
            </div>
            <div class="text-neutral-600">
              Provider ID
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-neutral-50 p-6">
          <h3 class="mb-4 text-body-lg font-semibold text-neutral-900">
            Score Breakdown
          </h3>
          <div
            v-if="scoreBreakdownItems.length"
            class="space-y-3"
          >
            <div
              v-for="item in scoreBreakdownItems"
              :key="item.label"
              class="flex items-center justify-between"
            >
              <span class="text-body-sm text-neutral-600">{{ item.label }}</span>
              <span class="text-body-sm font-semibold text-neutral-900">{{ item.value }}</span>
            </div>
          </div>
          <p
            v-else
            class="text-body-sm text-neutral-500"
          >
            Score breakdown is unavailable for this provider.
          </p>
        </div>
      </div>

      <div class="mb-8">
        <AdPlacement
          placement="blog_inline"
          wrapper-class="rounded-xl"
          min-height="120px"
        />
      </div>
      <div class="mb-8 rounded-lg bg-surface p-6 shadow-md">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-h3 font-bold text-neutral-900">
              Current quote for {{ from }} -> {{ to }}
            </h2>
            <p class="text-body-sm text-neutral-600">
              Based on {{ amountDisplay }} via {{ methodLabel }}.
            </p>
            <p class="text-body-sm text-neutral-500">
              Updated {{ quoteUpdatedLabel }}
            </p>
          </div>
          <NuxtLink
            :to="compareUrl"
            class="inline-flex items-center justify-center rounded-lg border border-brand-600 px-4 py-2 text-body-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            Compare all providers
          </NuxtLink>
        </div>

        <div
          v-if="quotesPending"
          class="mt-6 text-body-sm text-neutral-500"
        >
          Loading the latest quote...
        </div>
        <div
          v-else-if="quotesError || !providerQuote"
          class="mt-6 text-body-sm text-neutral-500"
        >
          No live quote is available for this corridor yet.
        </div>
        <div
          v-else
          class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          <div>
            <p class="text-body-sm text-neutral-500">
              Recipient gets
            </p>
            <p class="text-body-lg font-semibold text-neutral-900">
              {{ formatMoney(providerQuote.recipientGets, toCurrency) }}
            </p>
          </div>
          <div>
            <p class="text-body-sm text-neutral-500">
              Fee
            </p>
            <p class="text-body-lg font-semibold text-neutral-900">
              {{ formatMoney(providerQuote.fee, fromCurrency) }}
            </p>
          </div>
          <div>
            <p class="text-body-sm text-neutral-500">
              FX rate
            </p>
            <p class="text-body-sm font-semibold text-neutral-900">
              {{ formatRate(providerQuote.fxRate, fromCurrency, toCurrency) }}
            </p>
          </div>
          <div>
            <p class="text-body-sm text-neutral-500">
              Delivery
            </p>
            <p class="text-body-sm font-semibold text-neutral-900">
              {{ providerQuote.delivery || 'Unknown' }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-surface p-6 shadow-md">
        <h2 class="mb-4 text-h3 font-bold text-neutral-900">
          Compare Live Rates
        </h2>
        <p class="mb-4 text-neutral-600">
          Compare live rates across providers for your corridor and amount.
        </p>
        <MiniCompareWidget
          :initial-from="from"
          :initial-to="to"
          :initial-amount="amount"
          :initial-from-currency="fromCurrency"
          :initial-to-currency="toCurrency"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MiniCompareWidget from '~/components/shared/MiniCompareWidget.vue'
import { useCompareForm } from '~/composables/useCompareForm'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useProvider } from '~/composables/useProvider'
import { getProviderLogoPath } from '~/composables/useProviderLogo'
import { getCountryByCode } from '~/utils/countries-currencies'
import { getCorridorUrl } from '~/utils/country-slugs'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { buildOutboundUrl, extractUtmParams } from '~/lib/outbound'

const route = useRoute()

const slug = route.params.slug as string

// Provider data
const { data: provider } = await useProvider(slug)

const { form } = useCompareForm()
const { useProviders, formatMoney, formatRate, getRelativeTime } = useRemittanceApi()

const getQueryString = (key: string) => {
  const value = route.query[key]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value : undefined
}

const from = computed(() => (getQueryString('from') || form.value.from || 'US').toUpperCase())
const to = computed(() => (getQueryString('to') || form.value.to || 'PH').toUpperCase())
const amount = computed(() => {
  const raw = getQueryString('amount')
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed)
  }
  return form.value.amount || 500
})
const method = computed(() => {
  const raw = getQueryString('method')
  if (raw === 'cash' || raw === 'wallet' || raw === 'bank') return raw
  return form.value.method || 'bank'
})

const fromCurrency = computed(() => {
  return (getQueryString('fromCurrency') || form.value.fromCurrency || getCountryByCode(from.value)?.currency || 'USD').toUpperCase()
})
const toCurrency = computed(() => {
  return (getQueryString('toCurrency') || form.value.toCurrency || getCountryByCode(to.value)?.currency || 'USD').toUpperCase()
})

const methodLabel = computed(() => {
  if (method.value === 'cash') return 'Cash pickup'
  if (method.value === 'wallet') return 'Mobile wallet'
  return 'Bank transfer'
})

const { data: quotesData, pending: quotesPending, error: quotesError } = await useProviders(
  from.value,
  to.value,
  amount.value,
  method.value,
  { key: `provider-quote-${from.value}-${to.value}-${amount.value}-${method.value}` },
)

const normalizeProvider = (value?: string | null) => {
  if (!value) return ''
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const providerQuote = computed(() => {
  const quotes = quotesData.value?.data || []
  if (!provider.value) return null
  const keys = [
    normalizeProvider(provider.value.id),
    normalizeProvider(provider.value.slug),
    normalizeProvider(provider.value.name),
  ].filter(Boolean)
  return quotes.find((quote) => {
    const quoteKey = normalizeProvider(quote.id)
    const quoteName = normalizeProvider(quote.name)
    return keys.includes(quoteKey) || keys.includes(quoteName)
  }) || null
})

const quoteUpdatedLabel = computed(() => {
  const updatedAt = quotesData.value?.updatedAt
  if (!updatedAt) return 'recently'
  return getRelativeTime(updatedAt)
})

const compareUrl = computed(() => {
  const params = new URLSearchParams({
    amount: String(amount.value),
    method: method.value,
    fromCurrency: fromCurrency.value,
    toCurrency: toCurrency.value,
  })
  return `${getCorridorUrl(from.value, to.value)}?${params.toString()}`
})

const providerTypeLabel = computed(() => {
  const type = provider.value?.type
  if (!type) return 'Provider profile'
  return type.replace(/_/g, ' ')
})

const outboundUrl = computed(() => {
  const providerId = provider.value?.id || provider.value?.slug
  const targetUrl = provider.value?.affiliateUrl || provider.value?.url || null
  if (!providerId || !targetUrl) return ''
  return buildOutboundUrl({
    providerId,
    targetUrl,
    isAffiliate: Boolean(provider.value?.affiliateUrl),
    source: 'provider-profile',
    utm: extractUtmParams(route.query as Record<string, unknown>),
  })
})

const scoreBreakdownItems = computed(() => {
  const breakdown = provider.value?.scoreBreakdown
  if (!breakdown) return []
  return [
    { label: 'Delivered Value', value: (breakdown.deliveredValue * 10).toFixed(1) },
    { label: 'Reliability', value: (breakdown.reliability * 10).toFixed(1) },
    { label: 'Friction & Speed', value: (breakdown.frictionSpeed * 10).toFixed(1) },
    { label: 'Support & Refunds', value: (breakdown.supportRefunds * 10).toFixed(1) },
    { label: 'Trust & Safety', value: (breakdown.trustSafety * 10).toFixed(1) },
  ]
})

const amountDisplay = computed(() => formatMoney(amount.value, fromCurrency.value))

// Meta
const runtimeConfig = useRuntimeConfig()
const siteBaseUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const seoTitle = computed(() => `${provider.value?.name || 'Provider'} Review | Remit-Scout`)
const seoDescription = computed(() => `Compare ${provider.value?.name || 'this provider'} on Remit-Scout and see live rates across providers.`)

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

setSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  canonical: `${siteBaseUrl}${route.path}`,
  ogImage: false,
})

defineOgImage({
  component: 'OgImageProvider',
  props: {
    providerName: provider.value?.name || 'Provider',
    remitScore: provider.value?.remitScore || 0,
    logoUrl: `${siteBaseUrl}${getProviderLogoPath(provider.value?.slug || '')}`,
  },
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: provider.value?.name || 'Provider', path: route.path },
])

// Review schema
const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addBreadcrumbSchema(breadcrumbItems.value.map(item => ({
  name: item.name,
  url: `${siteBaseUrl}${item.path}`,
})))

if (provider.value?.remitScore && typeof provider.value.remitScore === 'number') {
  const reviewBody = `${provider.value.name} earns a Remit-Score of ${provider.value.remitScore.toFixed(1)}/10 based on our independent analysis of delivered value, reliability, speed, support, and trust factors.`

  addAggregateRatingSchema({
    name: provider.value.name || 'Provider',
    ratingValue: provider.value.remitScore,
    bestRating: 10,
    worstRating: 1,
    reviewCount: 1,
  })
}
</script>
