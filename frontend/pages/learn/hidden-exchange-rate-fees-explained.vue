<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>💰</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Hidden Exchange Rate Fees Explained
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            FX Markup vs Fees (and How to Spot It in 10 Seconds)
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Many providers hide their real costs in exchange rate markups. A provider might advertise "$0 fees" but charge you 3–5% more than the real exchange rate. Here's how to spot it.
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
          <!-- What is Mid-Market Rate -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What Is the "Mid-Market Rate"?
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              The <strong class="font-semibold text-neutral-900">mid-market rate</strong> (also called the interbank rate or spot rate) is the exchange rate banks use when trading currencies with each other. It's the "true" exchange rate—no markup, no fees, just the market price.
            </p>
            <div class="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-6 mb-6">
              <p class="text-base font-semibold text-neutral-900 mb-2">
                Example: USD to MXN
              </p>
              <p class="text-base text-neutral-700">
                If the mid-market rate is <strong>18.50 MXN per USD</strong>, that means $1 USD = 18.50 MXN at the real market rate.
              </p>
            </div>
            <p class="text-base text-neutral-700 leading-relaxed">
              You can check the mid-market rate on sites like XE.com, Google Finance, or Reuters. This is the baseline—the rate providers should give you if they're being transparent.
            </p>
          </div>

          <!-- How Markup Works -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              How FX Markup Works (The Hidden Cost)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Most providers don't give you the mid-market rate. Instead, they add a <strong class="font-semibold text-neutral-900">markup</strong>—a percentage they keep as profit. This markup is often hidden because it's built into the exchange rate they show you.
            </p>
            <div class="rounded-xl border border-neutral-200 bg-white p-6 mb-6">
              <p class="text-base font-semibold text-neutral-900 mb-4">
                Worked Example: $500 USD → MXN
              </p>
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <span class="text-sm text-neutral-600">Mid-market rate:</span>
                  <span class="text-base font-semibold text-neutral-900">18.50 MXN</span>
                </div>
                <div class="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <span class="text-sm text-neutral-600">Provider rate (3% markup):</span>
                  <span class="text-base font-semibold text-red-600">17.95 MXN</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600">Hidden cost on $500:</span>
                  <span class="text-lg font-bold text-red-600">~275 MXN ($15)</span>
                </div>
              </div>
            </div>
            <p class="text-base text-neutral-700 leading-relaxed">
              That $15 is pure profit for the provider—and you never see it as a "fee." It's hidden in the exchange rate.
            </p>
          </div>

          <!-- Why $0 Fee Can Still Be Expensive -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why "$0 Fee" Can Still Be Expensive
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Many providers advertise "$0 transfer fees" or "no fees" to attract customers. But they make up for it (and more) by giving you a worse exchange rate.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Provider A: "$0 Fee"</h3>
                <div class="space-y-2 text-sm text-neutral-700">
                  <div>Transfer fee: <strong>$0</strong></div>
                  <div>FX rate: <strong>17.80 MXN</strong> (3.8% markup)</div>
                  <div class="pt-2 border-t border-red-200">
                    <div class="text-xs text-neutral-600">$500 →</div>
                    <div class="text-xl font-bold text-red-600">8,900 MXN</div>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Provider B: "$2.99 Fee"</h3>
                <div class="space-y-2 text-sm text-neutral-700">
                  <div>Transfer fee: <strong>$2.99</strong></div>
                  <div>FX rate: <strong>18.45 MXN</strong> (0.3% markup)</div>
                  <div class="pt-2 border-t border-brand-200">
                    <div class="text-xs text-neutral-600">$500 →</div>
                    <div class="text-xl font-bold text-brand-600">9,170 MXN</div>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-base font-semibold text-neutral-900">
              Provider B delivers <span class="text-brand-600">270 MXN more</span>—even though they charge a fee and Provider A doesn't.
            </p>
          </div>

          <!-- True Cost Formula -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              The True Cost Formula
            </h2>
            <div class="bg-white/10 rounded-xl p-6 mb-6">
              <code class="text-lg font-mono text-white block mb-4">
                True Cost = Transfer Fee + (FX Markup × Send Amount)
              </code>
              <code class="text-lg font-mono text-white block">
                Recipient Gets = (Send Amount − Transfer Fee) × Provider FX Rate
              </code>
            </div>
            <p class="text-base text-white/90 leading-relaxed">
              Always calculate both the fee and the FX markup. A provider with a $5 fee but 0.5% markup is often cheaper than a "$0 fee" provider with a 3% markup.
            </p>
          </div>

          <!-- How to Spot It -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              How to Spot FX Markup in 10 Seconds
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">1</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Check the mid-market rate</h3>
                    <p class="text-sm text-neutral-700">
                      Look up the current rate on XE.com or Google. This is your baseline.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">2</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Compare provider's rate</h3>
                    <p class="text-sm text-neutral-700">
                      If the provider's rate is more than 1–2% worse than mid-market, they're adding a significant markup.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span class="text-xl font-bold text-brand-600">3</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 mb-2">Calculate the difference</h3>
                    <p class="text-sm text-neutral-700">
                      Multiply the rate difference by your send amount. That's your hidden cost.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              We Do the Math for You
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Remit-Scout compares providers based on what your recipient actually receives—fees and FX markup included. No hidden costs, no surprises.
            </p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
            >
              Compare Providers
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
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how comparing can save you hundreds on the same transfer.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How to Read a Remittance Quote
            </h3>
            <p class="text-sm text-neutral-600">
              Understand what matters in a quote and spot hidden costs.
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
              See how we calculate true costs and compare providers.
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
  { name: 'Hidden Fees', path: '/learn/hidden-exchange-rate-fees-explained' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Hidden Exchange Rate Fees Explained: FX Markup vs Fees | Remit-Scout',
  description: 'Learn how FX markup works, why "$0 fee" can still be expensive, and how to spot hidden exchange rate fees in 10 seconds.',
  canonical: `${siteUrl}/learn/hidden-exchange-rate-fees-explained`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Hidden Fees', url: `${siteUrl}/learn/hidden-exchange-rate-fees-explained` },
])
</script>








