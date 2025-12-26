<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>⚠️</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Why Your Checkout Price Can Differ from Remit‑Scout
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            And What to Do About It
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Sometimes the amount you see at checkout differs from our quote. Here's why that happens and how to handle it.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>6 min read</span>
            <span>•</span>
            <span>Updated December 2024</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <!-- Important Note -->
          <div class="mb-12 rounded-3xl border-2 border-brand-700 bg-brand-600 p-8 text-white">
            <div class="flex items-start gap-4">
              <ExclamationTriangleIcon class="h-6 w-6 text-white flex-shrink-0 mt-1" />
              <div>
                <h3 class="text-xl font-bold mb-3">Important: Provider Checkout Is Final</h3>
                <p class="text-base text-white/90 leading-relaxed">
                  The amount shown on the provider's checkout screen is always the final source of truth. Our quotes are estimates based on data captured at a specific timestamp. Rates can change, and provider-specific rules may apply.
                </p>
              </div>
            </div>
          </div>

          <!-- Why It Happens -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why Checkout Prices Can Differ
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💳 Payment Method Differences</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Card payments often cost more than bank transfers. Some providers charge 2–3% extra for credit/debit card funding. Our quote may show bank transfer pricing, but if you choose card at checkout, the price changes.
                </p>
                <div class="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Tip:</strong> Always check if the quote matches your intended payment method.
                </div>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🎁 Promotions & First-Time Offers</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Many providers offer first-transfer promotions: fee waivers, better exchange rates, or bonus amounts. These may not be reflected in our standard quotes. If you're a new customer, you might get a better deal than shown.
                </p>
                <div class="bg-emerald-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Good news:</strong> Promos usually make the final price better, not worse.
                </div>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🔐 KYC & Compliance Status</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Your verification status can affect pricing. Unverified accounts may have higher fees or different rate tiers. Once you complete KYC, rates and fees may improve.
                </p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">⏰ Exchange Rate Movement</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  FX rates change minute-to-minute. If our quote was captured 30 minutes ago and rates moved, the provider's current rate will differ. This is normal market movement.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Our quotes show timestamps</strong> so you know how fresh the data is.
                </div>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🌍 Corridor-Specific Rules</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Some corridors have special pricing, limits, or requirements. For example, certain countries may require additional compliance checks that affect fees. Our quote may not capture all corridor-specific variations.
                </p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🏦 Bank Fees Outside Provider Control</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Your bank or the recipient's bank may charge outgoing/incoming wire fees. These aren't included in provider quotes and can add $10–$50 to the total cost.
                </p>
              </div>
            </div>
          </div>

          <!-- What to Do -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What to Do If Prices Differ
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">1</span>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-neutral-900 mb-2">Check the Quote Timestamp</h3>
                    <p class="text-sm text-neutral-700">
                      If the quote is more than 15 minutes old, rates may have moved. This is normal.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">2</span>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-neutral-900 mb-2">Verify Payment Method</h3>
                    <p class="text-sm text-neutral-700">
                      Make sure you selected the same payment method (bank vs card) that our quote assumed.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">3</span>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-neutral-900 mb-2">Look for Promotions</h3>
                    <p class="text-sm text-neutral-700">
                      Check if the provider is offering a first-time bonus or promo that improves the rate.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">4</span>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-neutral-900 mb-2">Report Significant Discrepancies</h3>
                    <p class="text-sm text-neutral-700">
                      If the difference is more than 2–3% and can't be explained by the above, please report it with a screenshot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- How to Report -->
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">
              How to Report a Pricing Issue
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              If you notice a significant discrepancy that can't be explained by rate movement or payment method, we want to know. Include:
            </p>
            <ul class="space-y-2 text-sm text-neutral-700 list-disc list-inside mb-4">
              <li>Corridor (e.g., US → Mexico)</li>
              <li>Send amount</li>
              <li>Provider name</li>
              <li>Quote timestamp from Remit-Scout</li>
              <li>Checkout screenshot (if possible)</li>
            </ul>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
            >
              Report an Issue
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How to Read a Remittance Quote
            </h3>
            <p class="text-sm text-neutral-600">
              Understand what matters in a quote and what to expect.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/promo-codes-intro-rates"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Promotions & Intro Rates
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how promos affect pricing and when they're real.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/methodology"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Our Methodology
            </h3>
            <p class="text-sm text-neutral-600">
              See how we capture quotes and handle discrepancies.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Checkout Differences', path: '/learn/why-checkout-price-differs' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Why Your Checkout Price Can Differ from Remit-Scout | Remit-Scout',
  description: 'Learn why checkout prices may differ from our quotes: payment methods, promos, KYC status, rate movement, and what to do about it.',
  canonical: `${siteUrl}/learn/why-checkout-price-differs`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Checkout Differences', url: `${siteUrl}/learn/why-checkout-price-differs` },
])
</script>











