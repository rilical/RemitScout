<template>
  <div class="min-h-screen bg-surface">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="relative mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div class="mb-6 flex items-center gap-4">
              <div class="flex h-40 w-40 items-center justify-center rounded-2xl bg-surface p-3 shadow-xl">
                <ProviderLogo
                  :slug="providerSlug"
                  :alt="providerName"
                  size="xlarge"
                />
              </div>
              <div>
                <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-surface/10 px-3 py-1 text-body-sm font-medium text-white">
                  <svg
                    class="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Provider Review
                </div>
                <h1 class="mb-2 text-h1 font-bold text-white">
                  {{ providerName }} Review
                </h1>
                <p class="text-h4 text-neutral-300">
                  Independent Remit-Scout Analysis
                </p>
              </div>
            </div>

            <p class="mb-8 text-body-lg leading-relaxed text-white/90">
              A data-driven review based on real transfer outcomes — not paid endorsements. We evaluate what matters most: <strong class="text-white">how much money actually arrives</strong>.
            </p>

            <div class="flex flex-wrap gap-4">
              <a
                href="#quote"
                class="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-600 px-6 py-3 text-body font-semibold text-white motion-safe:transition-all"
              >
                See Live Quote
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>
              <a
                v-if="outboundUrl"
                :href="outboundUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-body font-semibold text-white hover:bg-white/10 motion-safe:transition-all"
              >
                Visit {{ providerName }}
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          <!-- Score Card -->
          <div class="flex justify-center lg:justify-end">
            <div class="w-full max-w-sm rounded-3xl bg-surface p-8 shadow-2xl">
              <div class="mb-6 text-center">
                <div class="mb-2 text-body-sm font-semibold uppercase tracking-wider text-rs-muted">
                  REMIT-SCOUT SCORE
                </div>
                <div class="flex justify-center">
                  <RemitScoreRing :score="remitScore" />
                </div>
              </div>

              <div class="space-y-3">
                <div
                  v-for="item in breakdownDisplay"
                  :key="item.label"
                >
                  <div class="mb-2 flex justify-between text-body-sm">
                    <span class="text-black">{{ item.label }}</span>
                    <span class="font-semibold text-black">{{ item.tier }}</span>
                  </div>
                  <div class="h-1 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      class="h-full rounded-full"
                      :class="item.barColor"
                      :style="{ width: `${item.pct}%` }"
                    />
                  </div>
                </div>
              </div>

              <div class="mt-6 border-t border-rs-border pt-6 text-center">
                <p class="text-body-sm text-neutral-900">
                  Based on our independent methodology.<br>
                  <NuxtLink
                    to="/methodology"
                    class="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Learn how we score →
                  </NuxtLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Score Breakdown Detail -->
    <section class="border-y border-rs-border bg-neutral-50 py-12">
      <div class="mx-auto max-w-page px-page-x">
        <h2 class="mb-8 flex items-center gap-3 text-h3 font-bold text-rs-fg">
          <div class="h-8 w-1 rounded-full bg-brand-600" />
          Score Breakdown
        </h2>
        <div class="grid gap-4 md:grid-cols-5">
          <div
            v-for="item in breakdownDisplay"
            :key="`detail-${item.label}`"
            class="rounded-2xl border border-rs-border bg-surface p-5"
          >
            <div class="mb-2 flex items-center justify-between">
              <div class="text-body-sm font-semibold text-rs-fg">
                {{ item.label }}
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-body-sm font-bold"
                :class="item.badgeClass"
              >
                {{ item.tier }}
              </span>
            </div>
            <div class="mb-3 text-body-sm text-rs-muted">
              {{ item.weight }}
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div
                class="h-full rounded-full"
                :class="item.barColor"
                :style="{ width: `${item.pct}%` }"
              />
            </div>
            <div class="mt-2 text-right text-body-sm font-semibold text-rs-fg">
              {{ item.display }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ad Placement -->
    <div class="mx-auto max-w-page px-page-x py-6">
      <AdPlacement
        placement="blog_inline"
        wrapper-class="rounded-xl"
        min-height="120px"
      />
    </div>

    <!-- Live Quote Section -->
    <section
      id="quote"
      class="bg-surface py-12"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-md">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-h3 font-bold text-neutral-900">
                Current quote for {{ from }} → {{ to }}
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
      </div>
    </section>

    <!-- Compare Widget -->
    <section class="bg-surface py-12">
      <div class="mx-auto max-w-page px-page-x">
        <div class="rounded-2xl border border-rs-border bg-surface p-6 shadow-md">
          <h2 class="mb-2 text-h3 font-bold text-neutral-900">
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
    </section>

    <!-- Methodology Sidebar / Trust Signals -->
    <section class="bg-neutral-50 py-12">
      <div class="mx-auto max-w-page px-page-x">
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="rounded-2xl border border-rs-border bg-surface p-6">
            <h3 class="mb-4 text-body-lg font-semibold text-rs-fg">
              How We Score Providers
            </h3>
            <p class="mb-4 text-body-sm text-neutral-600">
              Remit-Scout scores providers using a weighted rubric focused on what actually happens to your money:
            </p>
            <ul class="space-y-3 text-body-sm text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="mt-0.5 font-bold text-brand-600">40%</span>
                <span><strong>Delivered Value</strong> — how much money actually arrives</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 font-bold text-brand-600">20%</span>
                <span><strong>Reliability</strong> — consistent execution vs. quoted rates</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 font-bold text-brand-600">15%</span>
                <span><strong>Friction & Speed</strong> — how fast transfers land in practice</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 font-bold text-brand-600">15%</span>
                <span><strong>Support & Refunds</strong> — dispute handling quality</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 font-bold text-brand-600">10%</span>
                <span><strong>Trust & Safety</strong> — licensing and regulatory signals</span>
              </li>
            </ul>
            <NuxtLink
              to="/methodology"
              class="mt-4 inline-flex items-center gap-1 text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              See our full methodology
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </NuxtLink>
          </div>

          <div class="rounded-2xl border border-rs-border bg-surface p-6">
            <h3 class="mb-4 text-body-lg font-semibold text-rs-fg">
              Why Trust This Review
            </h3>
            <ul class="space-y-3 text-body-sm text-neutral-700">
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>No pay-to-play — we earn from affiliate links, not rankings</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Based on real transfer data across 49,000+ corridors</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Transparent methodology published openly</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>Scores updated regularly as providers change</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-brand-600 py-16">
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2 class="mb-4 text-h2 font-bold text-white">
          Ready to See How {{ providerName }} Compares?
        </h2>
        <p class="mb-8 text-body-lg text-white/90">
          Enter your transfer details to see real-time rates from {{ providerName }} and 30+ other providers.
        </p>
        <NuxtLink
          to="/send-money"
          class="inline-flex items-center gap-2 rounded-xl bg-surface px-8 py-4 text-body-lg font-semibold text-neutral-900 shadow-lg hover:bg-neutral-50 motion-safe:transition-all"
        >
          Compare Rates Now
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </NuxtLink>
      </div>
    </section>
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
import { getProviderScore } from '~/lib/providerScores'

const route = useRoute()
const slug = route.params.slug as string

const { data: provider } = await useProvider(slug)
const localScore = getProviderScore(slug)

const providerSlug = computed(() => provider.value?.slug || localScore?.slug || slug)
const providerName = computed(() => provider.value?.name || localScore?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
const remitScore = computed(() => provider.value?.remitScore || localScore?.remitScore || 0)

const breakdown = computed(() => {
  return provider.value?.scoreBreakdown || localScore?.scoreBreakdown || null
})

function scoreTier(value: number): { tier: string, barColor: string, badgeClass: string } {
  if (value >= 0.90) return { tier: 'Elite', barColor: 'bg-success-600', badgeClass: 'bg-success-100 text-success-700' }
  if (value >= 0.80) return { tier: 'Strong', barColor: 'bg-brand-600', badgeClass: 'bg-primary-100 text-primary-800' }
  if (value >= 0.70) return { tier: 'Good', barColor: 'bg-warning-500', badgeClass: 'bg-warning-100 text-warning-700' }
  if (value >= 0.60) return { tier: 'Fair', barColor: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700' }
  return { tier: 'Needs Work', barColor: 'bg-danger-500', badgeClass: 'bg-danger-100 text-danger-700' }
}

const BREAKDOWN_META = [
  { key: 'deliveredValue' as const, label: 'Delivered Value', weight: '40% weight' },
  { key: 'reliability' as const, label: 'Reliability', weight: '20% weight' },
  { key: 'frictionSpeed' as const, label: 'Friction & Speed', weight: '15% weight' },
  { key: 'supportRefunds' as const, label: 'Support & Refunds', weight: '15% weight' },
  { key: 'trustSafety' as const, label: 'Trust & Safety', weight: '10% weight' },
]

const breakdownDisplay = computed(() => {
  const bd = breakdown.value
  if (!bd) return []
  return BREAKDOWN_META.map((meta) => {
    const raw = bd[meta.key]
    const { tier, barColor, badgeClass } = scoreTier(raw)
    return {
      ...meta,
      tier,
      barColor,
      badgeClass,
      pct: Math.round(raw * 100),
      display: `${(raw * 10).toFixed(1)}/10`,
    }
  })
})

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
  if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed)
  return form.value.amount || 500
})
const method = computed(() => {
  const raw = getQueryString('method')
  if (raw === 'cash' || raw === 'wallet' || raw === 'bank') return raw
  return form.value.method || 'bank'
})

const fromCurrency = computed(() => (getQueryString('fromCurrency') || form.value.fromCurrency || getCountryByCode(from.value)?.currency || 'USD').toUpperCase())
const toCurrency = computed(() => (getQueryString('toCurrency') || form.value.toCurrency || getCountryByCode(to.value)?.currency || 'USD').toUpperCase())

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
  if (!provider.value && !localScore) return null
  const keys = [
    normalizeProvider(provider.value?.id || localScore?.id),
    normalizeProvider(provider.value?.slug || localScore?.slug),
    normalizeProvider(provider.value?.name || localScore?.name),
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

const amountDisplay = computed(() => formatMoney(amount.value, fromCurrency.value))

// Meta
const runtimeConfig = useRuntimeConfig()
const siteBaseUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

const seoTitle = computed(() => `${providerName.value} Review ${new Date().getFullYear()} — Remit-Score ${remitScore.value.toFixed(1)}/10 | Remit-Scout`)
const seoDescription = computed(() => `Independent ${providerName.value} review with Remit-Score ${remitScore.value.toFixed(1)}/10. Detailed breakdown of fees, speed, reliability, and delivered value based on real transfer data.`)

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
    providerName: providerName.value,
    remitScore: remitScore.value,
    logoUrl: `${siteBaseUrl}${getProviderLogoPath(providerSlug.value)}`,
  },
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Providers', path: '/learn/providers' },
  { name: `${providerName.value} Review`, path: route.path },
])

// Structured data
const { addAggregateRatingSchema, addBreadcrumbSchema } = useStructuredData()

addBreadcrumbSchema(breadcrumbItems.value.map(item => ({
  name: item.name,
  url: `${siteBaseUrl}${item.path}`,
})))

if (remitScore.value && typeof remitScore.value === 'number') {
  addAggregateRatingSchema({
    name: providerName.value,
    ratingValue: remitScore.value,
    bestRating: 10,
    worstRating: 1,
    reviewCount: 1,
  })
}
</script>
