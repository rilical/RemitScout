<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>💸</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Why Comparing Money Transfer Providers Can Save You Hundreds
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Even on the same $500 transfer, the difference between providers can be hundreds of dollars. Here's why you must compare before every transfer.
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
          <!-- Real Example Section -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              Real Example: $500 Transfer to Mexico
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Let's say you want to send $500 from the US to Mexico. Here's what different providers would deliver:
            </p>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-brand-200 bg-white p-6">
                <div class="text-sm font-semibold text-neutral-600 mb-2">Provider A (Bank)</div>
                <div class="text-3xl font-bold text-neutral-900 mb-1">8,910 MXN</div>
                <div class="text-xs text-neutral-500">$5 fee + 2.7% FX markup</div>
              </div>
              <div class="rounded-xl border-2 border-brand-600 bg-white p-6 shadow-md">
                <div class="text-sm font-semibold text-brand-600 mb-2">Provider B (Specialist)</div>
                <div class="text-3xl font-bold text-brand-600 mb-1">9,188 MXN</div>
                <div class="text-xs text-neutral-500">$1.99 fee + 0.4% FX markup</div>
              </div>
            </div>
            <p class="text-base font-semibold text-neutral-900 mt-6">
              That's <span class="text-brand-600">278 MXN more</span> delivered to your recipient—even though both providers advertise "low fees."
            </p>
          </div>

          <!-- Why Compare Section -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why "Recipient Gets" Is the Only Number That Matters
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Most comparison sites rank providers by headline fees or exchange rates. But the real question is: <strong class="font-semibold text-neutral-900">how much money actually reaches your recipient?</strong>
            </p>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              A provider might advertise "$0 fees" but charge you 3–5% more than the real exchange rate. That hidden markup can cost you hundreds on a single transfer—money that could go to your family instead of fees.
            </p>
            <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 mb-6">
              <p class="text-base font-semibold text-neutral-900 mb-2">
                The True Cost Formula
              </p>
              <p class="text-base text-neutral-700">
                <code class="text-sm bg-white px-2 py-1 rounded">Recipient Gets = (Send Amount − Fees) × Provider FX Rate</code>
              </p>
              <p class="text-sm text-neutral-600 mt-3">
                We calculate this for every provider so you can see the actual outcome, not marketing promises.
              </p>
            </div>
          </div>

          <!-- Banks vs Specialists -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Banks vs. Money Transfer Specialists: The Real Difference
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Traditional banks often hide their real costs in exchange rate markups. A bank might charge a $5 transfer fee but then give you an exchange rate that's 3–5% worse than the mid-market rate. That's where the real cost comes from.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🏦 Traditional Banks</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600">✗</span>
                    <span>3–9% FX markup hidden in rates</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600">✗</span>
                    <span>Higher fees ($10–$50 per transfer)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600">✗</span>
                    <span>Slower delivery (3–5 business days)</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💸 Money Transfer Specialists</h3>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600">✓</span>
                    <span>Lower FX markups (0.5–2%)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600">✓</span>
                    <span>Transparent fees ($0–$5 typically)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600">✓</span>
                    <span>Faster delivery (minutes to 1 day)</span>
                  </li>
                </ul>
              </div>
            </div>
            <p class="text-base font-semibold text-neutral-900">
              Typical savings: <span class="text-brand-600">3–9% per transfer</span> when you choose a specialist over a bank.
            </p>
          </div>

          <!-- What Changes Section -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What Changes Between Providers (And What Doesn't)
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">💰 Fees</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Transfer fees range from $0 to $50+ depending on the provider, amount, and payment method. Some providers charge more for card payments vs. bank transfers.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">📊 FX Markup</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  This is often the biggest hidden cost. Providers add a markup to the exchange rate (typically 0.5–5%). A 3% markup on a $1,000 transfer costs you $30—even if they advertise "$0 fees."
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">⚡ Speed</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Delivery times vary from minutes (instant transfers) to 3–5 business days (traditional banks). Speed often comes with a premium—faster transfers may cost more.
                </p>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">🛡️ Safety & Regulation</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  All providers we compare are fully licensed and regulated (FCA, FinCEN, ASIC, etc.). Safety doesn't vary—but cost and speed do.
                </p>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              Ready to Find Your Best Rate?
            </h2>
            <p class="text-lg text-white/90 mb-6 leading-relaxed">
              Compare live rates from 30+ licensed providers in seconds. See exactly how much your recipient will get—no hidden fees, no marketing fluff.
            </p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all"
            >
              Compare Providers Now
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
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how FX markup works and why "$0 fee" can still be expensive.
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
              Understand what matters in a quote and what's just noise.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Payment Method Playbook
            </h3>
            <p class="text-sm text-neutral-600">
              Choose the right payment and payout method for your needs.
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
  { name: 'Why Compare', path: '/learn/why-compare-before-every-transfer' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Why Comparing Money Transfer Providers Can Save You Hundreds | Remit-Scout',
  description: 'Learn why comparing providers before every transfer can save you hundreds of dollars. Real examples, banks vs specialists, and what actually changes between providers.',
  canonical: `${siteUrl}/learn/why-compare-before-every-transfer`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Why Compare', url: `${siteUrl}/learn/why-compare-before-every-transfer` },
])
</script>

