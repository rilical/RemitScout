<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-b from-neutral-50 via-white to-white py-16 lg:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-10">
          <!-- Trust badges -->
          <div class="flex flex-wrap gap-3 mb-6">
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-blue-200/50">
              <span>🛡️</span>
              Independent reviews
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-emerald-200/50">
              <span>🧪</span>
              Spot-check tested
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-md ring-1 ring-blue-200/50">
              <span>📊</span>
              Live rate data
            </div>
          </div>

          <h1 class="text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl mb-4">
            Money Transfer Provider Reviews
          </h1>
          <p class="max-w-3xl text-xl leading-relaxed text-neutral-600 mb-2">
            Compare top money transfer companies and find the best provider for your needs.
          </p>
          <p class="text-sm text-neutral-500 mb-8">
            Updated for 2025 · Fees, FX markups, payout and speed tested
          </p>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span>🏦</span>
                <span>30+</span>
              </div>
              <div class="text-sm text-neutral-600">
                Providers tested
              </div>
            </div>

            <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <span>🌍</span>
                <span>200+</span>
              </div>
              <div class="text-sm text-neutral-600">
                Countries covered
              </div>
            </div>

            <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span>⚡</span>
                <span>5 min</span>
              </div>
              <div class="text-sm text-neutral-600">
                Update frequency
              </div>
            </div>

            <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div class="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <span>💰</span>
                <span>$2.5M+</span>
              </div>
              <div class="text-sm text-neutral-600">
                Saved by users
              </div>
            </div>
          </div>

          <FiltersBar v-model="filters" />
        </div>
      </div>
    </section>

    <!-- Provider Cards Section -->
    <section class="py-12 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProviderCard
            v-for="provider in filteredProviders"
            :key="provider.id"
            :provider="provider"
          />
        </div>
      </div>
    </section>

    <!-- Why Choose Section -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-neutral-900 mb-4">
            Why Choose These Providers?
          </h2>
          <p class="max-w-2xl mx-auto text-lg text-neutral-600">
            All providers listed are licensed, regulated, and verified by our team
          </p>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold text-neutral-900">
              Regulated & Secure
            </h3>
            <p class="text-sm text-neutral-600">
              All providers are fully regulated and use bank-level security to protect your transfers.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <svg class="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold text-neutral-900">
              Competitive Rates
            </h3>
            <p class="text-sm text-neutral-600">
              Get the best exchange rates and lowest transfer fees compared in real-time.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold text-neutral-900">
              Fast Transfers
            </h3>
            <p class="text-sm text-neutral-600">
              Most transfers complete within minutes or hours, not days. Get your money there faster.
            </p>
          </div>

          <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <svg class="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold text-neutral-900">
              Global Coverage
            </h3>
            <p class="text-sm text-neutral-600">
              Send money to over 200 countries worldwide with multiple payout options.
            </p>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="mt-12 text-center">
          <div class="inline-flex flex-col sm:flex-row gap-4">
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              Compare Rates Now
            </NuxtLink>
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-8 py-3 text-base font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              How We Test
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import FiltersBar from '~/components/shared/FiltersBar.vue'
import ProviderCard from '~/components/shared/ProviderCard.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import { useProviders } from '~/composables/useProviders'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'

definePageMeta({
  alias: ['/reviews'],
})

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Providers', path: '/providers' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Money Transfer Provider Reviews | Compare Top Companies | Remit-Scout',
  description:
    'Read independent reviews of Wise, Western Union, Remitly and more. Compare fees, FX rates, payout coverage, and transfer speed to choose the best provider.',
  canonical: `${siteUrl}/providers`,
  ogImage: `${siteUrl}/images/og/providers.jpg`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Providers', url: `${siteUrl}/providers` },
])

// Data
const filters = ref({
  region: '',
  features: [],
  rating: 0,
})

// Providers data (mock for now)
const { data: providers } = await useProviders()
const filteredProviders = computed(() => {
  return providers.value || []
})
</script>
