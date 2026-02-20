<template>
  <div class="min-h-screen bg-surface">


    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-white/10 px-4 py-2 text-body-sm font-semibold text-white shadow-md mb-6">
            Money Transfer Basics
          </div>
          <h1 class="text-hero font-bold tracking-tight text-white mb-6">
            <span class="text-brand-600">Hidden Fees</span> Explained:<br>
            <span class="text-brand-600">FX Markup vs Transfer Fee</span>
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            Learn the difference between FX markup (spread) and upfront transfer fees, and why <span class="font-bold text-brand-600">"no fee" doesn't mean no cost</span>.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-400">
            <span>6 min read</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="prose prose-lg max-w-none">
          <!-- Introduction -->
          <div class="mb-16">
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <!-- Left Column -->
              <div class="flex flex-col h-full">
                <div class="mb-8">
                  <h2 class="text-h2 font-bold text-neutral-900 mb-4 leading-tight">
                    Why <span class="text-brand-600">"No Fee"</span> Can Still Cost You
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    When a money transfer advertises "low fees" or "no fees," it's not saying the transfer is free. It's telling you <strong class="font-semibold text-neutral-900">where</strong> they earn their money. Most remittance pricing is built from two components: <strong class="font-semibold text-neutral-900">(1) the upfront fee</strong> and <strong class="font-semibold text-neutral-900">(2) the FX markup</strong> (also called spread). If you understand both, you can spot "cheap-looking" quotes that actually deliver less money to your recipient.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Simple Rule
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed mb-4">
                    A transfer can be <strong class="font-bold">expensive even with a $0 fee</strong>. The exchange rate is the other half of the price.
                  </p>
                  <p class="text-body-lg font-medium leading-relaxed">
                    A provider with a small fee but a tight exchange rate usually beats a "no fee" provider with a weaker rate, especially on larger transfers. Compare on "recipient gets" to see both fee and FX markup.
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="rounded-3xl border-2 border-brand-200 bg-brand-50 p-8 lg:p-10 shadow-xl">
                <h3 class="text-h4 font-bold text-neutral-900 mb-6">
                  Quick Takeaways
                </h3>
                <div class="grid gap-4">
                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Fees are visible
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          FX spread is the hidden cost. You see the upfront fee, but the exchange rate markup is built into the rate you're offered.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          "No fee" can still be expensive
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          When the exchange rate is weak, you're paying through the spread, even if the upfront fee is zero.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Compare the final amount
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Compare mid market vs offered rate and focus on the final "recipient gets" amount, not just the fee.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Upfront Transfer Fee -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              The <span class="text-brand-600">upfront transfer fee</span> (easy to see)
            </h2>
            <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
              <p class="text-body text-neutral-700 leading-relaxed mb-6">
                This is the explicit charge you pay to send money. It might be:
              </p>
              <ul class="space-y-3 text-body text-neutral-700 mb-6">
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
              <p class="text-body font-semibold text-neutral-900">
                Fees are visible. You see them on your quote.
              </p>
            </div>
          </div>

          <!-- FX Markup -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              <span class="text-brand-600">FX markup</span> (the hidden one)
            </h2>
            <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
              <p class="text-body text-neutral-700 leading-relaxed mb-6">
                FX markup is the difference between:
              </p>
              <ul class="space-y-3 text-body text-neutral-700 mb-6">
                <li class="flex items-start gap-3">
                  <span class="text-brand-600 mt-1">•</span>
                  <span>the <strong class="font-semibold text-neutral-900">mid market rate</strong> (a neutral reference rate between banks), and</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-brand-600 mt-1">•</span>
                  <span>the <strong class="font-semibold text-neutral-900">rate you're offered</strong>.</span>
                </li>
              </ul>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <p class="text-body text-neutral-700 leading-relaxed mb-3">
                  If the mid market rate is 1.0000 and you're offered 0.9750, the spread is 2.5%. That 2.5% is a cost, even if the provider charges "no fee."
                </p>
                <p class="text-body font-semibold text-neutral-900">
                  Why it's hidden: you don't see "FX fee: $18.42" as a line item. Instead, you just get a worse exchange rate.
                </p>
              </div>
            </div>
          </div>

          <!-- Why No Fee Can Be Expensive -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Why <span class="text-brand-600">"no fee"</span> can be expensive
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Fee (fixed cost)
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Often a flat or percentage charge. Visible and doesn't scale with transfer size.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  FX markup (scales with amount)
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Applied to the money you convert. On larger transfers, this usually dominates the total cost.
                </p>
              </div>
            </div>
            <div class="mt-6 rounded-xl border-2 border-brand-600 bg-brand-600 p-6">
              <p class="text-body font-semibold text-white">
                So a provider that is cheaper at $50 can be more expensive at $1,000.
              </p>
            </div>
          </div>

          <!-- Practical Way to Estimate -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              How to estimate <span class="text-brand-600">FX markup</span> (quick sanity check)
            </h2>
            <ol class="space-y-4 text-body text-neutral-700 mb-8">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">1</span>
                <span>Look up a neutral reference rate (mid market or interbank).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">2</span>
                <span>Compare it to the provider's offered rate.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">3</span>
                <span>Calculate the difference as a percentage.</span>
              </li>
            </ol>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                Quick Formula
              </h3>
              <div class="bg-surface rounded-lg p-4 mb-3 border border-brand-200">
                <p class="text-body-sm font-medium text-neutral-500 mb-2">
                  Markup Percentage
                </p>
                <p class="text-body-lg font-bold text-brand-600 font-mono tracking-tight">
                  (Mid-market rate &minus; Provider rate) &divide; Mid-market rate
                </p>
              </div>
              <div class="bg-surface rounded-lg p-4 border border-brand-200">
                <p class="text-body-sm font-medium text-neutral-500 mb-2">
                  Money Lost to FX
                </p>
                <p class="text-body-lg font-bold text-brand-600 font-mono tracking-tight">
                  (Send amount &minus; Fee) &times; Rate difference
                </p>
              </div>
            </div>
          </div>

          <!-- Where FX Markup Hides -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Where FX markup hides
            </h2>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  <span class="text-brand-600">"Great rate"</span> claims
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Without a mid market comparison, assume the spread is doing work.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Different rates by <span class="text-brand-600">payment method</span>
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Bank funding often gets better rates than card funding.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  <span class="text-brand-600">Weekend/after-hours</span> pricing
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Some providers widen spreads when markets are closed.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  <span class="text-brand-600">"Estimated"</span> rates until checkout
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Rates can change before you confirm. The displayed rate may be optimistic.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Different <span class="text-brand-600">payout rails</span>
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Cash pickup or home delivery can have different spreads than bank deposits.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Other <span class="text-brand-600">hidden costs</span>
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Card issuer fees, recipient bank charges, rounding, and minimums can also reduce delivered value.
                </p>
              </div>
            </div>
          </div>

          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Detection Checklist -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              What to do: a "hidden fee" detection checklist
            </h2>
            <div class="rounded-3xl border-2 border-brand-200 bg-neutral-50 p-8 lg:p-12">
              <p class="text-body text-neutral-700 leading-relaxed mb-6">
                Before you send, do this:
              </p>
              <div class="space-y-4 text-body text-neutral-700">
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">1</span>
                  <span><strong class="font-semibold text-neutral-900">Compare the "recipient gets" number</strong>, not just the fee.</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">2</span>
                  <span>Check the <strong class="font-semibold text-neutral-900">exchange rate</strong> at checkout and compare it to a neutral reference.</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">3</span>
                  <span>Try <strong class="font-semibold text-neutral-900">two funding methods</strong> (bank and debit card) and see which one delivers more.</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">4</span>
                  <span>Keep payout method the same while comparing (bank deposit vs cash pickup vs mobile money).</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">5</span>
                  <span>If the deal looks too good ("0 fee plus best rate"), confirm it again at the <strong class="font-semibold text-neutral-900">final checkout step</strong>.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-brand-600 p-8 lg:p-12 text-white">
            <h2 class="text-h3 font-bold mb-4">
              Ready to Find Your Best Rate?
            </h2>
            <p class="text-body-lg text-white/90 mb-6 leading-relaxed">
              Compare live rates from 30+ licensed providers in seconds. See exactly how much your recipient will get, no hidden fees.
            </p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center gap-2 rounded-xl bg-surface px-6 py-3 text-body font-semibold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all"
            >
              Compare Providers Now
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section class="py-16 lg:py-20 bg-brand-600">
      <div class="mx-auto max-w-page px-page-x">
        <h2 class="text-h2 font-bold text-white mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how comparing can save you hundreds on the same transfer.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              How to Read a Remittance Quote
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Understand what matters in a quote and spot hidden costs.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Payment Method Playbook
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Choose the right payment and payout method for your needs.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/learn' },
  { name: 'Hidden Exchange Rate Fees', path: '/learn/hidden-exchange-rate-fees-explained' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'Hidden Fees Explained: FX Markup vs Transfer Fee | Remit-Scout'
const seoDescription = 'Learn the difference between FX markup (spread) and upfront transfer fees, and why "no fee" doesn\'t mean no cost.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '6 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/hidden-exchange-rate-fees-explained`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Hidden Fees', url: `${siteUrl}/learn/hidden-exchange-rate-fees-explained` },
])
</script>
