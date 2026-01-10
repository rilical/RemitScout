<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>🎁</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Promo Codes & Intro Rates
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            When "Best Deal" Is Real (and When It's Temporary)
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Providers often offer promotions that make them look like the best deal today—but won't be tomorrow. Here's how to tell the difference between real value and temporary marketing.
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
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold text-neutral-900 mb-3">Quick takeaways</h2>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Promos can be real savings, but they're temporary and often limited.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Fee waivers don't fix FX markup, so still check "recipient gets."</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Use promos once, then compare standard rates for repeat transfers.</span>
              </li>
            </ul>
          </div>
          <!-- Types of Promos -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Types of Promotions
            </h2>
            <div class="space-y-6">
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🎯 First-Transfer Promos</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Many providers offer fee waivers or better rates for your first transfer. This is a real deal—but only applies once. After that, you'll pay standard rates.
                </p>
                <div class="bg-white rounded-lg p-4 text-sm text-neutral-700">
                  <strong>Example:</strong> "First transfer free" means $0 fee on transfer #1, but $3.99 on transfer #2.
                </div>
              </div>
              <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💰 Fee Waivers</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Some providers waive transfer fees for a limited time or on specific corridors. The exchange rate usually stays the same, so you save on fees but not on FX markup.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📈 FX Rate Boosts</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Temporary improvements to exchange rates (e.g., "0% markup for 30 days"). These are real savings but expire after the promo period.
                </p>
              </div>
            </div>
          </div>

          <!-- Limits & Eligibility -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Limits & Eligibility
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Most promotions have restrictions. Common limits include:
            </p>
            <div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
              <ul class="space-y-3 text-sm text-neutral-700">
                <li class="flex items-start gap-3">
                  <span class="text-neutral-400">•</span>
                  <span><strong>Amount limits:</strong> Promos often apply only to transfers under $500 or $1,000</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-neutral-400">•</span>
                  <span><strong>New customers only:</strong> Existing users don't qualify</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-neutral-400">•</span>
                  <span><strong>Corridor restrictions:</strong> Some promos only work for specific country pairs</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-neutral-400">•</span>
                  <span><strong>Time limits:</strong> Must complete transfer within 7–30 days of signup</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-neutral-400">•</span>
                  <span><strong>Payment method:</strong> May only apply to bank transfers, not cards</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Why Rankings Change -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              Why a Provider May Be #1 Today and Not Tomorrow
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              If Provider A offers a first-transfer promo that makes them the cheapest today, they'll rank #1. But once that promo expires (or you've used it), they'll drop in rankings because their standard rates aren't as competitive.
            </p>
            <p class="text-base text-neutral-700 leading-relaxed">
              This is why we timestamp our quotes. A quote from yesterday may show a different ranking than today's quote—not because we changed our methodology, but because promos expired or new ones started.
            </p>
          </div>

          <!-- How Remit-Scout Handles Promos -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              How Remit-Scout Timestamps Quotes
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Every quote we show includes a timestamp indicating when it was captured. This helps you understand:
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">When the quote was generated</h3>
                <p class="text-sm text-neutral-700">
                  Fresh quotes (within 15 minutes) are more reliable than older ones.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">Whether promos were active</h3>
                <p class="text-sm text-neutral-700">
                  If a quote shows a great rate, check the timestamp to see if it's from a promo period.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">Rate movement over time</h3>
                <p class="text-sm text-neutral-700">
                  Compare quotes from different times to see how rates and rankings change.
                </p>
              </div>
            </div>
          </div>

          <!-- How to Use Promos Wisely -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              How to Use Promos Wisely
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✓ Take advantage of first-transfer promos</h3>
                <p class="text-sm text-neutral-700">
                  If you're a new customer, first-transfer promos are usually real savings. Use them.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✓ Check standard rates for repeat transfers</h3>
                <p class="text-sm text-neutral-700">
                  Don't assume the promo rate will last. Check what you'll pay on transfer #2, #3, etc.
                </p>
              </div>
              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-5">
                <h3 class="text-base font-bold text-neutral-900 mb-2">✗ Don't switch providers just for promos</h3>
                <p class="text-sm text-neutral-700">
                  If you send regularly, a provider with consistently good standard rates is better than chasing one-time promos.
                </p>
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
            to="/learn/why-checkout-price-differs"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Checkout Price Can Differ
            </h3>
            <p class="text-sm text-neutral-600">
              Promos are one reason final amounts may differ from quotes.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-sm text-neutral-600">
              Rankings change as promos expire and new ones start.
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
              See how we handle promos and timestamp quotes.
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
  { name: 'Promotions', path: '/learn/promo-codes-intro-rates' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Promo Codes & Intro Rates: When Best Deal Is Real (and When Temporary) | Remit-Scout',
  description: 'Learn how promotions work, why rankings change, and how to use promo codes wisely. Understand first-transfer promos, fee waivers, and FX rate boosts.',
  canonical: `${siteUrl}/learn/promo-codes-intro-rates`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Promotions', url: `${siteUrl}/learn/promo-codes-intro-rates` },
])
</script>










