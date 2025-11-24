<template>
  <div class="min-h-screen bg-neutral-50 py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 text-white p-8 shadow-lg mb-10">
        <p class="text-sm uppercase tracking-wide font-semibold text-brand-50 mb-2">
          FX center
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold mb-3">
          Best exchange rates by currency pair
        </h1>
        <p class="text-lg text-brand-50 max-w-3xl">
          Check today’s mid-market rate, see how providers price each pair, and learn when to send to keep more in your recipient’s currency.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink
            v-for="pair in highlightedPairs"
            :key="pair.href"
            :to="pair.href"
            class="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
          >
            {{ pair.label }}
          </NuxtLink>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div
          v-for="bundle in pairBundles"
          :key="bundle.base"
          class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-xs uppercase tracking-wide font-semibold text-brand-600">
                {{ bundle.kicker }}
              </p>
              <h2 class="text-xl font-bold text-neutral-900">
                {{ bundle.title }}
              </h2>
            </div>
            <span class="text-2xl">{{ bundle.emoji }}</span>
          </div>
          <p class="text-sm text-neutral-600 mb-4">
            {{ bundle.copy }}
          </p>
          <div class="space-y-2">
            <NuxtLink
              v-for="pair in bundle.pairs"
              :key="pair.href"
              :to="pair.href"
              class="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition"
            >
              <span>{{ pair.label }}</span>
              <span class="text-xs text-neutral-500">{{ pair.note }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide font-semibold text-brand-600">
              Why it matters
            </p>
            <h3 class="text-xl font-bold text-neutral-900">
              Rates plus fees = real transfer cost
            </h3>
            <p class="text-sm text-neutral-600">
              We explain mid-market vs. provider markup, weekend spreads, and best payment/payout combinations.
            </p>
          </div>
          <NuxtLink
            to="/learn/how-exchange-rates-work"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700 transition"
          >
            Understand FX basics
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

const { public: { siteUrl } } = useRuntimeConfig()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Exchange Rates', path: '/exchange-rates' },
]

const highlightedPairs = [
  { label: 'USD → INR', href: '/exchange-rates/usd-inr' },
  { label: 'USD → PHP', href: '/exchange-rates/usd-php' },
  { label: 'USD → MXN', href: '/exchange-rates/usd-mxn' },
  { label: 'GBP → NGN', href: '/exchange-rates/gbp-ngn' },
  { label: 'CAD → INR', href: '/exchange-rates/cad-inr' },
  { label: 'EUR → USD', href: '/exchange-rates/eur-usd' },
]

const pairBundles = [
  {
    base: 'USD',
    kicker: 'Popular from the US',
    title: 'USD pairs',
    emoji: '🇺🇸',
    copy: 'Live USD rates for India, Philippines, Mexico and beyond with fee context.',
    pairs: [
      { label: 'USD → INR rate', href: '/exchange-rates/usd-inr', note: 'UPI & bank' },
      { label: 'USD → PHP rate', href: '/exchange-rates/usd-php', note: 'Cash pickup too' },
      { label: 'USD → MXN rate', href: '/exchange-rates/usd-mxn', note: 'Borderless payments' },
      { label: 'USD → NGN rate', href: '/exchange-rates/usd-ngn', note: 'Naira & USD' },
    ],
  },
  {
    base: 'GBP',
    kicker: 'Popular from the UK',
    title: 'GBP pairs',
    emoji: '🇬🇧',
    copy: 'Track GBP exchange rates for South Asia and Africa.',
    pairs: [
      { label: 'GBP → INR rate', href: '/exchange-rates/gbp-inr', note: 'Bank + UPI' },
      { label: 'GBP → NGN rate', href: '/exchange-rates/gbp-ngn', note: 'Cash & bank' },
      { label: 'GBP → PKR rate', href: '/exchange-rates/gbp-pkr', note: 'Local payout' },
      { label: 'GBP → USD rate', href: '/exchange-rates/gbp-usd', note: 'FX transfer' },
    ],
  },
  {
    base: 'CAD',
    kicker: 'Popular from Canada',
    title: 'CAD pairs',
    emoji: '🇨🇦',
    copy: 'Rates for Canada’s most common remittance destinations.',
    pairs: [
      { label: 'CAD → INR rate', href: '/exchange-rates/cad-inr', note: 'Bank & UPI' },
      { label: 'CAD → PHP rate', href: '/exchange-rates/cad-php', note: 'Cash & bank' },
      { label: 'CAD → NGN rate', href: '/exchange-rates/cad-ngn', note: 'NGN & USD' },
      { label: 'CAD → USD rate', href: '/exchange-rates/cad-usd', note: 'Cross-border' },
    ],
  },
  {
    base: 'EUR',
    kicker: 'Eurozone',
    title: 'EUR pairs',
    emoji: '🇪🇺',
    copy: 'Track Euro rates to USD, GBP, and popular remittance markets.',
    pairs: [
      { label: 'EUR → USD rate', href: '/exchange-rates/eur-usd', note: 'Bank vs. fintech' },
      { label: 'EUR → INR rate', href: '/exchange-rates/eur-inr', note: 'UPI & bank' },
      { label: 'EUR → GBP rate', href: '/exchange-rates/eur-gbp', note: 'Low spread' },
      { label: 'EUR → NGN rate', href: '/exchange-rates/eur-ngn', note: 'Cards & bank' },
    ],
  },
]

setSeo({
  title: 'Best Exchange Rates for Remittances | Live USD, GBP, CAD, EUR Pairs | Remit-Scout',
  description:
    'See live FX pairs for USD, GBP, CAD, and EUR to top remittance destinations. Understand mid-market vs. provider fees before you send.',
  canonical: `${siteUrl}/exchange-rates`,
  ogImage: `${siteUrl}/images/og/exchange-rates.jpg`,
})
</script>
