<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>⚡</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            How Fast Is International Money Transfer?
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            What Actually Determines Delivery Time
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Delivery times range from minutes to 5 business days. Here's what actually determines speed and how to choose the right option for your urgency.
          </p>
          <div class="flex items-center gap-4 text-sm text-neutral-600">
            <span>5 min read</span>
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
          <!-- Speed Buckets -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Transfer Speed Buckets
            </h2>
            <div class="grid gap-6 md:grid-cols-3">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <div class="text-3xl mb-3">⚡</div>
                <h3 class="text-lg font-bold text-neutral-900 mb-2">Instant</h3>
                <p class="text-sm text-neutral-700 mb-3">Minutes to hours</p>
                <p class="text-xs text-neutral-600">Mobile wallets, some bank transfers</p>
              </div>
              <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div class="text-3xl mb-3">🚀</div>
                <h3 class="text-lg font-bold text-neutral-900 mb-2">Same Day</h3>
                <p class="text-sm text-neutral-700 mb-3">Within 24 hours</p>
                <p class="text-xs text-neutral-600">Express bank transfers, cash pickup</p>
              </div>
              <div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-6">
                <div class="text-3xl mb-3">📅</div>
                <h3 class="text-lg font-bold text-neutral-900 mb-2">1-5 Days</h3>
                <p class="text-sm text-neutral-700 mb-3">Standard delivery</p>
                <p class="text-xs text-neutral-600">Traditional banks, economy options</p>
              </div>
            </div>
          </div>

          <!-- What Determines Speed -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What Actually Determines Delivery Time
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🏦 Payout Method (Biggest Factor)</h3>
                <div class="space-y-3 text-sm text-neutral-700">
                  <div class="flex items-start gap-3">
                    <span class="text-emerald-600 font-bold">Fastest:</span>
                    <div>
                      <strong>Mobile Wallets</strong> (M-Pesa, Mobile Money) — Often instant or same-day
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="text-blue-600 font-bold">Fast:</span>
                    <div>
                      <strong>Cash Pickup</strong> — Usually 15 minutes to 24 hours
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="text-neutral-600 font-bold">Standard:</span>
                    <div>
                      <strong>Bank Transfer</strong> — 1-3 business days (can be instant for some providers)
                    </div>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📅 Weekends & Holidays</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Transfers initiated on weekends or holidays are typically processed on the next business day. Some providers offer 24/7 processing for certain methods (mobile wallets, cash pickup), but bank transfers almost always wait for business days.
                </p>
                <div class="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Tip:</strong> If you need money delivered by Friday, send it by Wednesday to account for processing time.
                </div>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🔐 Compliance & KYC Holds</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  First-time transfers or large amounts may trigger additional verification. This can add 1-2 business days while the provider verifies your identity and the transfer details.
                </p>
                <p class="text-sm text-neutral-600">
                  Once verified, subsequent transfers are usually faster.
                </p>
              </div>
              <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💳 Payment Method</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Card payments are often processed faster than bank transfers. Some providers offer instant processing for debit/credit card funding, while ACH bank transfers can take 1-2 days just to clear before the international transfer begins.
                </p>
              </div>
            </div>
          </div>

          <!-- Speed vs Cost Tradeoff -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              Speed vs. Cost Tradeoff
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Faster transfers usually cost more. Providers charge a premium for express delivery. Here's the typical tradeoff:
            </p>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="font-bold text-neutral-900 mb-2">Express (15 min - 24h)</h3>
                <p class="text-sm text-neutral-700 mb-2">Higher fees, better rates</p>
                <p class="text-xs text-neutral-600">Best for urgent needs</p>
              </div>
              <div class="rounded-xl border border-brand-200 bg-white p-5">
                <h3 class="font-bold text-neutral-900 mb-2">Economy (1-3 days)</h3>
                <p class="text-sm text-neutral-700 mb-2">Lower fees, similar rates</p>
                <p class="text-xs text-neutral-600">Best for cost savings</p>
              </div>
            </div>
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
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Payment Method Playbook
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how payment and payout methods affect speed and cost.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/pulse"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Pulse: Speed Trends
            </h3>
            <p class="text-sm text-neutral-600">
              See delivery time trends across providers and corridors.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Providers
            </h3>
            <p class="text-sm text-neutral-600">
              Speed is just one factor—learn what else to consider.
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Transfer Speed', path: '/learn/how-fast-is-international-money-transfer' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'How Fast Is International Money Transfer? What Determines Delivery Time | Remit-Scout',
  description: 'Learn what determines transfer speed: payout methods, weekends, compliance holds, and payment methods. Speed buckets from instant to 5 days.',
  canonical: `${siteUrl}/learn/how-fast-is-international-money-transfer`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Transfer Speed', url: `${siteUrl}/learn/how-fast-is-international-money-transfer` },
])
</script>








