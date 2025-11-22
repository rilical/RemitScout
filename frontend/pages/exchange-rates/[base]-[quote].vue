<template>
  <div class="min-h-screen bg-neutral-50 py-12 sm:py-16">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="rounded-3xl bg-white p-8 shadow-lg border border-neutral-200 mb-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-wide font-semibold text-brand-600 mb-2">Exchange rate</p>
            <h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
              {{ pairLabel }} rate & transfer costs
            </h1>
            <p class="text-lg text-neutral-600">
              Check today’s mid-market {{ base }}/{{ quote }} rate, see typical provider markups, and learn how to keep more in {{ quote }} when you transfer.
            </p>
          </div>
          <div class="rounded-2xl bg-neutral-100 p-6 w-full lg:w-72">
            <p class="text-sm text-neutral-600 mb-2">Mid-market rate</p>
            <p class="text-3xl font-bold text-neutral-900 mb-1">{{ midMarketRate }}</p>
            <p class="text-xs text-neutral-500">Updated hourly • For illustration</p>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
          <h2 class="text-xl font-bold text-neutral-900 mb-3">Provider markups</h2>
          <p class="text-sm text-neutral-600 mb-4">
            We track how providers price {{ base }}/{{ quote }} relative to mid-market. Lower markup means your recipient keeps more.
          </p>
          <div class="space-y-3">
            <div
              v-for="row in providerPricing"
              :key="row.name"
              class="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
            >
              <div>
                <p class="text-sm font-semibold text-neutral-900">{{ row.name }}</p>
                <p class="text-xs text-neutral-500">{{ row.speed }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-neutral-900">{{ row.rate }}</p>
                <p class="text-xs text-neutral-500">~{{ row.markup }}% vs mid</p>
              </div>
            </div>
          </div>
        </div>
        <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
          <h2 class="text-xl font-bold text-neutral-900 mb-3">When to send</h2>
          <p class="text-sm text-neutral-600 mb-4">
            Timing and pay-in method both impact the real cost. Weekends often widen spreads; bank transfers are cheaper than cards.
          </p>
          <ul class="space-y-2 text-sm text-neutral-700">
            <li class="flex items-start gap-2">
              <span class="text-brand-600 mt-0.5">•</span>
              Aim for weekday daytime transfers to avoid weekend FX buffers.
            </li>
            <li class="flex items-start gap-2">
              <span class="text-brand-600 mt-0.5">•</span>
              Use bank transfer pay-in to slash card fees; choose bank or wallet payout for better rates.
            </li>
            <li class="flex items-start gap-2">
              <span class="text-brand-600 mt-0.5">•</span>
              Compare at least two providers for {{ base }} {{ exampleAmount }}—differences add up.
            </li>
          </ul>
          <NuxtLink
            to="/reviews"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700 transition"
          >
            See provider reviews
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <div class="mt-8 rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
        <h2 class="text-xl font-bold text-neutral-900 mb-3">Popular corridors using {{ base }}/{{ quote }}</h2>
        <p class="text-sm text-neutral-600 mb-4">
          See full comparison results for the most common remittance paths that rely on this pair.
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            v-for="corridor in corridorLinks"
            :key="corridor.href"
            :to="corridor.href"
            class="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-brand-300 hover:text-brand-700 transition"
          >
            {{ corridor.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

const base = computed(() => (route.params.base as string || '').toUpperCase())
const quote = computed(() => (route.params.quote as string || '').toUpperCase())
const pairLabel = computed(() => `${base.value} → ${quote.value}`)
const exampleAmount = computed(() => `${base.value} 1,000`)
const midMarketRate = computed(() => `${base.value} 1 = ${quote.value} ${mockMidMarket(quote.value)}`)

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Exchange Rates', path: '/exchange-rates' },
  { name: `${base.value} to ${quote.value}`, path: route.path },
])

const providerPricing = computed(() => [
  { name: 'Wise', rate: `${quote.value} ${mockRate(quote.value, 0.35)}`, markup: 0.35, speed: 'Same-day bank' },
  { name: 'Remitly', rate: `${quote.value} ${mockRate(quote.value, 0.65)}`, markup: 0.65, speed: 'Minutes cash; bank same-day' },
  { name: 'WorldRemit', rate: `${quote.value} ${mockRate(quote.value, 0.8)}`, markup: 0.8, speed: 'Minutes to hours' },
  { name: 'Xoom', rate: `${quote.value} ${mockRate(quote.value, 1.2)}`, markup: 1.2, speed: 'Minutes–1 day' },
])

const corridorLinks = computed(() => [
  { label: `${pairLabel.value} money transfers`, href: `/send-money/${base.value.toLowerCase()}-to-${quote.value.toLowerCase()}` },
  { label: 'Provider reviews', href: '/reviews' },
  { label: 'Hidden fees guide', href: '/learn/hidden-fees-money-transfers' },
  { label: 'FAQ', href: '/faq' },
])

setSeo({
  title: `${base.value} to ${quote.value} Exchange Rate & Transfer Fees | Remit-Scout`,
  description: `See today’s ${base.value}/${quote.value} rate, typical provider markups, and timing tips to keep more in ${quote.value}.`,
  canonical: `${siteUrl}/exchange-rates/${route.params.base}-${route.params.quote}`,
})

function mockMidMarket(currency: string) {
  const sampleValues: Record<string, string> = {
    INR: '83.10',
    PHP: '58.20',
    MXN: '17.10',
    NGN: '1400.00',
    USD: '1.10',
    GBP: '0.84',
    EUR: '0.92',
    PKR: '278.00',
    CAD: '1.36',
  }
  return sampleValues[currency] || '—'
}

function mockRate(currency: string, markup: number) {
  const baseValue = Number(mockMidMarket(currency)) || 0
  if (!baseValue) return '—'
  const adjusted = (baseValue * (1 - markup / 100)).toFixed(2)
  return adjusted
}
</script>
