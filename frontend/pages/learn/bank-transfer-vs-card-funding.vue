<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-md mb-6">
            <span>💳</span>
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
            Bank Transfer vs Card Funding: Which Is Cheaper (and When)?
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            Bank transfers can be cheaper but slower. Cards can be fast but often cost more. Learn how funding method changes your total cost and delivery time.
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Your funding method is one of the biggest hidden levers in remittance pricing. Two transfers to the same recipient can have different fees, different FX rates, and different delivery times—just because you paid by bank transfer instead of debit/credit card.
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
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold text-neutral-900 mb-3">Quick takeaways</h2>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Bank funding usually delivers better pricing, but can add 1–2 days.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Card funding is fast but often carries higher fees and issuer charges.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Always compare providers with the same funding method.</span>
              </li>
            </ul>
          </div>
          <!-- What Funding Method Means -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What "funding method" means
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              It's how money leaves your account to pay for the transfer:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Bank transfer / direct debit</strong> (ACH, SEPA, local bank rails)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Debit card</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Credit card</strong></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>Sometimes: <strong class="font-semibold text-neutral-900">Apple Pay / Google Pay</strong> (still usually card rails underneath)</span>
              </li>
            </ul>
          </div>

          <!-- Why Bank Transfers Are Cheaper -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why bank transfers are often cheaper
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Bank funding typically has:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>lower processing fees for the provider,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>lower fraud/chargeback risk,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>fewer card network costs.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Because the provider's cost is lower, they can often offer:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 mt-1">•</span>
                <span>a lower explicit fee, and/or</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 mt-1">•</span>
                <span>a tighter FX rate.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed">
              But: bank rails can be slower, and cut-off times matter.
            </p>
          </div>

          <!-- Why Cards Are Faster -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why cards are often faster (and sometimes more expensive)
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Cards authorize quickly. That can allow the provider to start processing the payout almost immediately. But cards come with:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>network fees (interchange/processing),</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>higher fraud risk,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>disputes/chargebacks complexity.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Providers often price that in via:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>higher transfer fees,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>worse FX rates, or</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>both.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              Credit cards, in particular, can also trigger issuer-side fees.
            </p>
          </div>

          <!-- Speed Differences -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">Speed differences (typical patterns)</h3>
            <ul class="space-y-3 text-base text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Debit card:</strong> often minutes to same-day (corridor dependent)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-blue-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Bank transfer:</strong> often same-day to several business days (depends on rail and cutoffs)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-purple-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Credit card:</strong> fast authorization, but sometimes extra verification steps</span>
              </li>
            </ul>
            <p class="text-sm text-neutral-600">
              The key: "funding speed" is not the same as "payout speed." A provider might pay out fast once they have funds—but your funding method determines how quickly they <em>get</em> funds or how confidently they can advance payout.
            </p>
          </div>

          <!-- When Bank Funding Is Better -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              When bank funding is usually the better choice
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Choose bank funding when you care about:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">lowest effective cost</strong>, especially for larger amounts,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span>fewer surprises from issuer fees,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span>transfers that aren't urgent (you can wait).</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              Practical example: recurring family support where saving 1–2% over time matters more than instant delivery.
            </p>
          </div>

          <!-- When Debit Card Is Better -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              When debit card funding is usually the better choice
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Choose debit card funding when you care about:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">speed</strong>,</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span>simplicity (no separate bank transfer step),</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">•</span>
                <span>smaller amounts where the extra fee is acceptable.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              Debit is often the "best balance" for urgent transfers that still need reasonable value.
            </p>
          </div>

          <!-- When Credit Card Makes Sense -->
          <div class="mb-12 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">When credit card funding can make sense (but be careful)</h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Credit cards can be useful for emergencies, but they're often the most expensive path because:
            </p>
            <ul class="space-y-2 text-base text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>providers may surcharge, and</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span>issuers may add fees.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              If you use a credit card:
            </p>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span>confirm the provider's fee and rate at checkout, and</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span>check your card's terms for cash advance/foreign transaction fees.</span>
              </li>
            </ul>
          </div>

          <!-- Refunds and Reversals -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Refunds and reversals: how funding method changes the pain
            </h2>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Card refunds</strong> can be straightforward but can take time to post.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Bank transfer refunds</strong> can be slower and may require more manual tracing.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Chargebacks</strong> exist for cards, but they can create account issues if used improperly.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              The practical takeaway: if you think you might need to cancel, understand the provider's cancellation window—and act early.
            </p>
          </div>

          <!-- Decision Rule -->
          <div class="mb-12 rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              A simple decision rule
            </h2>
            <p class="text-lg text-white/90 leading-relaxed mb-6">
              If your priority is…
            </p>
            <ul class="space-y-3 text-base text-white/90">
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">•</span>
                <span><strong class="font-semibold text-white">Cheapest possible</strong> → try bank funding first</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">•</span>
                <span><strong class="font-semibold text-white">Fastest possible</strong> → debit card (or instant rails)</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">•</span>
                <span><strong class="font-semibold text-white">Emergency and no other option</strong> → credit card, but expect higher cost</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-white font-bold">•</span>
                <span><strong class="font-semibold text-white">Not sure</strong> → quote both bank and debit, compare "recipient gets"</span>
              </li>
            </ul>
          </div>

          <!-- Quick Checklist -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">Quick checklist: test both methods in 60 seconds</h3>
            <ol class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Build your transfer (same amount, same payout method).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Toggle <strong class="font-semibold text-neutral-900">bank funding</strong> and note: recipient gets + ETA.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Toggle <strong class="font-semibold text-neutral-900">debit card funding</strong> and note: recipient gets + ETA.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Pick the method with the best tradeoff for that specific transfer.</span>
              </li>
            </ol>
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              This is the easiest "free win" in international transfers: the same provider can be cheap on bank funding and expensive on card funding.
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
            to="/learn/choose-right-delivery-method"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              Choose the Right Delivery Method
            </h3>
            <p class="text-sm text-neutral-600">
              Learn how payout method affects price, speed, and success rate.
            </p>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-brand-300"
          >
            <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600">
              How to Read a Quote
            </h3>
            <p class="text-sm text-neutral-600">
              Understand what "recipient gets" means and how to compare quotes.
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
              Learn why funding method changes can make one provider cheaper than another.
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
  { name: 'Bank Transfer vs Card Funding', path: '/learn/bank-transfer-vs-card-funding' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://remit-scout.com'

setSeo({
  title: 'Bank Transfer vs Card Funding: Which Is Cheaper (and When)? | Remit-Scout',
  description: 'Bank transfers can be cheaper but slower. Cards can be fast but often cost more. Learn how funding method changes your total cost and delivery time.',
  canonical: `${siteUrl}/learn/bank-transfer-vs-card-funding`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Bank Transfer vs Card Funding', url: `${siteUrl}/learn/bank-transfer-vs-card-funding` },
])
</script>
