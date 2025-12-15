<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>📊</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            How to Read a Remittance Quote
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            "Recipient Gets" vs Fees vs Exchange Rate
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Learn what matters in a money transfer quote and what's just noise. Make faster, smarter decisions with confidence.
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
          <!-- Quote Breakdown -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-6">
              Quote Card Breakdown
            </h2>
            <div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 mb-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-sm font-semibold text-neutral-600 mb-1">Transfer Fee</div>
                    <div class="text-2xl font-bold text-neutral-900">$2.99</div>
                  </div>
                  <div class="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                    Fixed fee
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-sm font-semibold text-neutral-600 mb-1">Exchange Rate</div>
                    <div class="text-2xl font-bold text-neutral-900">18.45 MXN</div>
                    <div class="text-xs text-neutral-500 mt-1">vs 18.50 mid-market (0.3% markup)</div>
                  </div>
                  <div class="text-xs text-neutral-500 bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-semibold">
                    Low markup
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-sm font-semibold text-neutral-600 mb-1">Delivery Method</div>
                    <div class="text-base font-semibold text-neutral-900">Bank Transfer</div>
                  </div>
                  <div class="text-xs text-neutral-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Bank account
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-sm font-semibold text-neutral-600 mb-1">Estimated Delivery</div>
                    <div class="text-base font-semibold text-neutral-900">1-2 business days</div>
                  </div>
                  <div class="text-xs text-neutral-500 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                    Fast
                  </div>
                </div>
                <div class="pt-4 bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-4">
                  <div class="text-sm font-semibold text-neutral-600 mb-1">Recipient Gets</div>
                  <div class="text-3xl font-bold text-brand-600">9,188 MXN</div>
                  <div class="text-xs text-neutral-500 mt-1">This is the number that matters</div>
                </div>
                <div class="text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                  Quote timestamp: December 15, 2024 at 2:30 PM UTC
                </div>
              </div>
            </div>
          </div>

          <!-- What Matters -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What Actually Matters (And What Doesn't)
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span class="text-2xl">⭐</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Recipient Gets (Most Important)</h3>
                    <p class="text-base text-neutral-700 leading-relaxed">
                      This is the actual amount your recipient will receive after all fees and FX markup. Compare this number across providers—it's the only metric that matters.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span class="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Total Cost (Fee + FX Markup)</h3>
                    <p class="text-base text-neutral-700 leading-relaxed">
                      Don't just look at the transfer fee. Add the FX markup cost. A $0 fee with 3% markup is often more expensive than a $3 fee with 0.5% markup.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span class="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Delivery Speed (If Urgent)</h3>
                    <p class="text-base text-neutral-700 leading-relaxed">
                      Speed matters if you need money delivered quickly. But remember: faster often costs more. Balance urgency with cost.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-200 flex items-center justify-center">
                    <span class="text-xl">📅</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Quote Timestamp (Context Only)</h3>
                    <p class="text-base text-neutral-700 leading-relaxed">
                      Exchange rates change minute-to-minute. A quote from 2 hours ago may be outdated. Always check when the quote was generated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- What's Noise -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What's Just Noise (Don't Get Distracted)
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ Headline Exchange Rate</h3>
                <p class="text-sm text-neutral-700">
                  Providers often show a "great" exchange rate but hide the markup. Always compare to mid-market.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ "$0 Fee" Claims</h3>
                <p class="text-sm text-neutral-700">
                  If the fee is $0, check the FX markup. They're making money somewhere—usually in the rate.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">❌ Marketing Badges</h3>
                <p class="text-sm text-neutral-700">
                  "Best Rate" or "Lowest Fee" badges are marketing. The actual "recipient gets" number tells the truth.
                </p>
              </div>
            </div>
          </div>

          <!-- Quick Decision Guide -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              Quick Decision Guide
            </h2>
            <div class="space-y-4">
              <div class="bg-white/10 rounded-xl p-4">
                <p class="text-base font-semibold mb-2">1. Compare "Recipient Gets" across all providers</p>
                <p class="text-sm text-white/90">This is your primary sorting criteria.</p>
              </div>
              <div class="bg-white/10 rounded-xl p-4">
                <p class="text-base font-semibold mb-2">2. Check delivery speed if you need it urgently</p>
                <p class="text-sm text-white/90">Faster delivery may cost more—decide if it's worth it.</p>
              </div>
              <div class="bg-white/10 rounded-xl p-4">
                <p class="text-base font-semibold mb-2">3. Verify the quote timestamp</p>
                <p class="text-sm text-white/90">Rates change. Get a fresh quote if it's been more than 15 minutes.</p>
              </div>
              <div class="bg-white/10 rounded-xl p-4">
                <p class="text-base font-semibold mb-2">4. Confirm on provider's checkout screen</p>
                <p class="text-sm text-white/90">Final amount may differ due to promos, KYC, or rate changes.</p>
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
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Hidden Exchange Rate Fees
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how FX markup works and how to spot hidden costs.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-checkout-price-differs"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Checkout Price Can Differ
            </h3>
            <p class="text-sm text-neutral-600">
              Understand why final amounts may differ from quotes.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/faq"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              FAQ
            </h3>
            <p class="text-sm text-neutral-600">
              Common questions about reading quotes and comparing providers.
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
  { name: 'Reading Quotes', path: '/learn/how-to-read-remittance-quote' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'How to Read a Remittance Quote: Recipient Gets vs Fees vs Exchange Rate | Remit-Scout',
  description: 'Learn what matters in a money transfer quote and what to ignore. Understand recipient gets, fees, exchange rates, and delivery methods.',
  canonical: `${siteUrl}/learn/how-to-read-remittance-quote`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Reading Quotes', url: `${siteUrl}/learn/how-to-read-remittance-quote` },
])
</script>

