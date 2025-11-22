<template>
  <div class="min-h-screen bg-neutral-50 py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-10 rounded-3xl bg-white p-8 shadow-lg border border-neutral-200">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-brand-600 mb-2">
              Send money hub
            </p>
            <h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
              Compare the best way to send money abroad
            </h1>
            <p class="text-lg text-neutral-600 max-w-2xl">
              Jump into our most-requested corridors. We surface real fees, FX markups, speed, and payout options—so you can pick the cheapest and fastest route.
            </p>
          </div>
          <div class="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white p-6 w-full lg:w-80">
            <p class="text-sm uppercase tracking-wide font-semibold mb-2">Need a quick pick?</p>
            <p class="text-xl font-bold mb-3">Try our featured top 3</p>
            <p class="text-sm text-brand-50 mb-4">Wise, Remitly, and WorldRemit updated hourly for rates, fees, and delivery speed.</p>
            <NuxtLink to="/" class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-brand-700 font-semibold shadow hover:shadow-md transition">
              Compare now
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div
          v-for="group in corridorGroups"
          :key="group.title"
          class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-brand-600 font-semibold">{{ group.kicker }}</p>
              <h2 class="text-xl font-bold text-neutral-900">{{ group.title }}</h2>
            </div>
            <span class="text-2xl">{{ group.emoji }}</span>
          </div>
          <p class="text-sm text-neutral-600 mb-4">
            {{ group.copy }}
          </p>
          <div class="space-y-2">
            <NuxtLink
              v-for="corridor in group.corridors"
              :key="corridor.href"
              :to="corridor.href"
              class="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition"
            >
              <span>{{ corridor.label }}</span>
              <span class="text-xs text-neutral-500">{{ corridor.note }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-brand-600 font-semibold mb-2">Provider reviews</p>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Trust the right app</h3>
          <p class="text-sm text-neutral-600 mb-3">
            Deep dives on fees, FX spreads, limits, and payout coverage for top players.
          </p>
          <NuxtLink to="/reviews" class="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700">
            Browse reviews
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
        <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-brand-600 font-semibold mb-2">Guides</p>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Beat hidden fees</h3>
          <p class="text-sm text-neutral-600 mb-3">
            Learn how exchange rates work, when to send, and which payout type is fastest.
          </p>
          <NuxtLink to="/learn" class="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700">
            Read guides
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
        <div class="rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-brand-600 font-semibold mb-2">Exchange rates</p>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Know the real FX</h3>
          <p class="text-sm text-neutral-600 mb-3">
            We track USD, GBP, CAD, AED and more against popular receive currencies.
          </p>
          <NuxtLink to="/exchange-rates" class="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700">
            Check FX pairs
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
  { name: 'Send Money', path: '/send-money' },
]

const corridorGroups = [
  {
    title: 'From the United States',
    kicker: 'North America',
    emoji: '🇺🇸',
    copy: 'Most requested USD corridors with bank deposit, cash pickup, and wallet options.',
    corridors: [
      { label: 'US → India', href: '/send-money/us-to-in', note: 'UPI & bank' },
      { label: 'US → Philippines', href: '/send-money/us-to-ph', note: 'Cash pickup' },
      { label: 'US → Mexico', href: '/send-money/us-to-mx', note: 'Low fees' },
      { label: 'US → Nigeria', href: '/send-money/us-to-ng', note: 'NGN & USD' },
    ],
  },
  {
    title: 'From the United Kingdom',
    kicker: 'Europe',
    emoji: '🇬🇧',
    copy: 'Popular GBP routes for students, family support, and travel.',
    corridors: [
      { label: 'UK → India', href: '/send-money/gb-to-in', note: 'Bank & UPI' },
      { label: 'UK → Nigeria', href: '/send-money/gb-to-ng', note: 'Instant options' },
      { label: 'UK → Pakistan', href: '/send-money/gb-to-pk', note: 'Bank + cash' },
      { label: 'UK → Philippines', href: '/send-money/gb-to-ph', note: 'Wallets & cash' },
    ],
  },
  {
    title: 'From Canada',
    kicker: 'North America',
    emoji: '🇨🇦',
    copy: 'CAD transfers to South Asia and beyond, including speed vs. payout trade-offs.',
    corridors: [
      { label: 'Canada → India', href: '/send-money/ca-to-in', note: 'Bank & UPI' },
      { label: 'Canada → Philippines', href: '/send-money/ca-to-ph', note: 'Cash pickup' },
      { label: 'Canada → Nigeria', href: '/send-money/ca-to-ng', note: 'NGN & USD' },
      { label: 'Canada → Pakistan', href: '/send-money/ca-to-pk', note: 'Bank & cash' },
    ],
  },
  {
    title: 'From UAE & GCC',
    kicker: 'Middle East',
    emoji: '🇦🇪',
    copy: 'Fast remittances for migrant workers and expats across Asia and Africa.',
    corridors: [
      { label: 'UAE → India', href: '/send-money/ae-to-in', note: 'AED→INR' },
      { label: 'UAE → Philippines', href: '/send-money/ae-to-ph', note: 'Cash & bank' },
      { label: 'UAE → Pakistan', href: '/send-money/ae-to-pk', note: 'Bank & wallet' },
      { label: 'Saudi → India', href: '/send-money/sa-to-in', note: 'SAR→INR' },
    ],
  },
]

setSeo({
  title: 'Send Money Internationally | Corridor Guides & Live Comparisons | Remit-Scout',
  description:
    'Explore our most-searched money transfer corridors. Compare rates, fees, and speed for US, UK, Canada, UAE and more.',
  canonical: `${siteUrl}/send-money`,
})
</script>
