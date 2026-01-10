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
            Hidden Fees Explained: FX Markup vs Transfer Fee
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Learn the difference between FX markup (spread) and upfront transfer fees, and why "no fee" doesn't mean no cost.
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            When a money transfer advertises "low fees" or "no fees," it's not saying the transfer is free. It's telling you <em>where</em> they earn their money. Most remittance pricing is built from two components: <strong class="font-semibold text-neutral-900">(1) the upfront fee</strong> and <strong class="font-semibold text-neutral-900">(2) the FX markup</strong> (also called spread). If you understand both, you can spot "cheap-looking" quotes that actually deliver less money to your recipient.
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
                <span>Fees are visible; FX spread is the hidden cost.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>"No fee" can still be expensive when the exchange rate is weak.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Compare mid-market vs offered rate and the final recipient amount.</span>
              </li>
            </ul>
          </div>
          <!-- Upfront Transfer Fee -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              The upfront transfer fee (easy to see)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              This is the explicit charge you pay to send money. It might be:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>a fixed amount (e.g., $2.99),</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>a percentage (e.g., 1%), or</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>waived above a threshold (e.g., free over $500).</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed">
              Fees are visible.
            </p>
          </div>

          <!-- FX Markup -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              FX markup (the hidden one)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              FX markup is the difference between:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">mid‑market rate</strong> (a neutral reference rate between banks), and</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">rate you're offered</strong>.</span>
              </li>
            </ul>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 mb-6">
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                If the mid‑market rate is 1.0000 and you're offered 0.9750, the spread is 2.5%. That 2.5% is a cost—even if the provider charges "no fee."
              </p>
              <p class="text-base font-semibold text-neutral-900">
                Why it's hidden: you typically don't see "FX fee: $18.42" as a line item. Instead, you just get a worse exchange rate.
              </p>
            </div>
          </div>

          <!-- Why No Fee Can Be Expensive -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why "no fee" can be expensive
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              For small transfers, a fixed fee might feel painful. For larger transfers, FX markup usually dominates.
            </p>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              A simple way to think about it:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Fee</strong> is often a flat cost (or smaller, fixed cost).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">FX markup</strong> scales with amount—because it's applied to the money you convert.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed">
              So a provider that is cheaper at $50 can be more expensive at $1,000.
            </p>
          </div>

          <!-- Practical Way to Estimate -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-6">
              A practical way to estimate FX markup
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              You don't need perfect precision. You need a quick sanity check.
            </p>
            <ol class="space-y-4 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Look up a neutral reference rate (mid‑market / interbank).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Compare it to the provider's offered rate.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Compute approximate markup:</span>
              </li>
            </ol>
            <div class="bg-white rounded-xl p-6 mb-4">
              <p class="text-base font-mono text-neutral-900 mb-2">
                <strong>Markup % ≈ (mid‑market – provider rate) / mid‑market</strong>
              </p>
              <p class="text-sm text-neutral-600">Then translate that into "money lost" on your transfer:</p>
              <p class="text-base font-mono text-neutral-900 mt-2">
                <strong>Money lost to FX ≈ (send amount – fee) × (mid‑market rate – provider rate)</strong>
              </p>
              <p class="text-xs text-neutral-600 mt-2">(If your fee is charged separately, use the amount that actually converts.)</p>
            </div>
            <p class="text-base text-neutral-700 leading-relaxed">
              This isn't about being exact down to pennies. It's about identifying the cases where a "no fee" offer is quietly charging you through the rate.
            </p>
          </div>

          <!-- Where FX Markup Hides -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Where FX markup hides in plain sight
            </h2>
            <div class="space-y-3 text-base text-neutral-700">
              <div class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">"Great rate" claims without a reference:</strong> If they don't show a mid‑market comparison, assume the spread is doing work.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Different rates by payment method:</strong> Some providers offer a better rate for bank funding than card funding.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Weekend/after-hours pricing:</strong> Some products widen spreads when markets are closed.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">"Estimated" rates until checkout:</strong> If the rate can change before you confirm, the displayed rate may be optimistic.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Different payout rails:</strong> Cash pickup or home delivery can come with different spreads than bank deposits or mobile wallets.</span>
              </div>
            </div>
          </div>

          <!-- Hidden Costs -->
          <div class="mb-12 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">
              Hidden costs that aren't exactly "fees," but still hit your result
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Even after you understand fee vs spread, there are other costs that can reduce delivered value:
            </p>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Card issuer charges:</strong> Some banks treat certain transfers like cash advances or add foreign transaction fees.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Recipient-side bank fees:</strong> Some receiving banks deduct fees on incoming transfers.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Cash pickup partner rules:</strong> The pickup network may impose constraints that force re-processing or delays (not always a direct fee, but still friction).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Rounding and minimums:</strong> Some providers round rates or apply minimum fees on small transfers.</span>
              </li>
            </ul>
          </div>

          <!-- Detection Checklist -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What to do: a "hidden fee" detection checklist
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Before you send, do this:
            </p>
            <div class="space-y-3 text-base text-neutral-700">
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span><strong class="font-semibold text-neutral-900">Compare the "recipient gets" number</strong>, not just the fee.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Check the <strong class="font-semibold text-neutral-900">exchange rate</strong> at checkout and compare it with a neutral reference.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Try <strong class="font-semibold text-neutral-900">two funding methods</strong> (bank and debit card) and see which improves delivered amount.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Keep payout method constant while comparing (bank deposit vs cash pickup vs mobile money).</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                <span>If the deal looks too good ("0 fee + best rate"), confirm it again at the <strong class="font-semibold text-neutral-900">final checkout step</strong>.</span>
              </div>
            </div>
          </div>

          <!-- Simple Rule -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              The simplest rule
            </h2>
            <p class="text-lg text-white/90 leading-relaxed mb-4">
              If you remember only one thing:
            </p>
            <p class="text-xl font-bold text-white mb-6">
              A transfer can be expensive even with a $0 fee.
            </p>
            <p class="text-base text-white/90 leading-relaxed">
              The exchange rate is the other half of the price.
            </p>
            <p class="text-base text-white/90 leading-relaxed mt-4">
              A provider with a small fee but a tight exchange rate often beats a "no fee" provider with a weaker rate—especially as transfer size grows. Compare on "recipient gets," and you'll automatically capture both fee and FX markup without needing to do math every time.
            </p>
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
  title: 'Hidden Fees Explained: FX Markup vs Transfer Fee | Remit-Scout',
  description: 'Learn the difference between FX markup (spread) and upfront transfer fees, and why "no fee" doesn\'t mean no cost.',
  canonical: `${siteUrl}/learn/hidden-exchange-rate-fees-explained`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Hidden Fees', url: `${siteUrl}/learn/hidden-exchange-rate-fees-explained` },
])
</script>










