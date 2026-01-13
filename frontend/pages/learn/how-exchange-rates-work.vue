<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-slate-900 py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs :items="breadcrumbItems" :dark="true" />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white shadow-md mb-6">
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            How <span class="text-brand-400">Exchange Rates</span> Work<br>
            (and why they change)
          </h1>
          <p class="text-xl text-slate-300 sm:text-2xl font-medium mb-6 leading-relaxed">
            Learn mid-market vs. send rate, FX spreads, and the levers that move your transfer price—so you keep more on every remittance.
          </p>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span>6 min read</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <!-- Introduction -->
          <div class="mb-16">
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <!-- Left Column -->
              <div class="flex flex-col h-full">
                <div class="mb-8">
                  <h2 class="text-3xl font-bold text-neutral-900 mb-4 leading-tight">
                    Understanding <span class="text-brand-600">Exchange Rates</span>
                  </h2>
                  <p class="text-lg text-neutral-700 leading-relaxed">
                    If you've ever wondered why the exchange rate you get isn't the same as Google shows, or why rates seem to change constantly, you're in the right place. Exchange rates determine how much money your recipient receives, and understanding how they work is key to keeping more money in your remittances. The key is knowing <strong class="font-semibold text-neutral-900">how rates are set</strong> and <strong class="font-semibold text-neutral-900">how to compare effectively</strong>.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-2xl mb-4">The Bottom Line</h3>
                  <p class="text-lg font-medium leading-relaxed mb-4">
                    The mid-market rate is your anchor; anything worse is a markup. Total cost = fee + FX spread vs. mid-market.
                  </p>
                  <p class="text-lg font-medium leading-relaxed">
                    Compare per corridor—rates and fees differ by route, method, and amount. Always compare the final "recipient gets" amount, not just the upfront fee.
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-10 shadow-xl">
                <h3 class="text-xl font-bold text-neutral-900 mb-6">Quick Takeaways</h3>
                <div class="grid gap-4">
                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Mid-market is your anchor</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          The mid-market rate is a neutral reference; anything worse is a markup.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Total cost = fee + spread</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Both the upfront fee and the FX spread (markup) determine your total cost.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Compare per corridor</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Rates and fees differ by route, method, and amount. Compare the final amount received.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- What Shapes the FX Rate -->
          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What shapes the <span class="text-brand-600">FX rate</span>
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">1. <span class="text-brand-600">Supply & Demand</span> (most common)</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Capital flows, trade balances, and sentiment move currencies. When demand for a currency increases, its value goes up. Economic news, political events, and market sentiment all drive currency movements in real-time.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">What to do:</strong> Compare providers at the <strong>final step</strong> before you pay. If the quote drifts, refresh both providers and compare again at the same time.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">2. <span class="text-brand-600">Interest Rates & Inflation</span></h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Central bank policy shifts FX relative values. Higher interest rates typically strengthen a currency as investors seek better returns. Inflation expectations also drive currency movements.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">What this means:</strong> When a country raises interest rates, its currency often strengthens because investors move money there for better returns.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">3. <span class="text-brand-600">News & Risk Events</span></h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Geo events, data releases, and risk-on/off swings drive intraday moves. Major announcements can cause rapid rate changes. Elections, trade deals, and economic data releases all impact rates.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">What to know:</strong> Rates can move 1-2% in minutes around major news. This is why providers refresh rates frequently during market hours.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">4. <span class="text-brand-600">Market Liquidity</span></h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Thin trading volumes widen spreads. Popular currency pairs (USD/EUR) have tighter spreads than exotic pairs. Weekend and holiday trading also affects liquidity.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">Practical tip:</strong> Major pairs like USD → MXN usually have better rates than less common routes like USD → ZAR.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">5. <span class="text-brand-600">Provider Pricing Models</span></h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Different providers use different pricing strategies. Some offer lower fees but wider FX spreads, while others charge higher fees but offer better exchange rates. The provider's cost structure and target market affect how they price each corridor.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">What to do:</strong> Always compare the final "recipient gets" amount rather than just the fee or exchange rate alone.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">6. <span class="text-brand-600">Payment Method & Corridor</span></h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Bank transfers usually get better rates than card payments. Popular corridors (like USD → MXN) often have tighter spreads than less common routes. The payout method (bank deposit vs cash pickup) can also affect the rate.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 text-sm text-neutral-700">
                  <strong class="text-brand-600">What to do:</strong> Compare rates for your specific corridor and payment method. What's cheapest for one route may not be cheapest for another.
                </div>
              </div>
            </div>
          </div>

          <!-- Right Way to Compare -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              The right way to compare <span class="text-brand-600">(so you get the best rate)</span>
            </h2>
            <div class="space-y-4">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #1: <span class="text-brand-600">Compare "recipient gets"</span>, not just fees.</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  The final amount your recipient receives is what matters. A zero-fee provider with a worse exchange rate can deliver less money than a provider with a small fee but a better rate.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #2: Compare providers <span class="text-brand-600">at the same moment</span>.</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Exchange rates move continuously. Comparing one provider now and another five minutes later can mislead you because rates change in real-time.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Rule #3: <span class="text-brand-600">Match the same inputs</span>.</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Same:
                </p>
                <ul class="space-y-2 text-base text-neutral-700">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>send amount (or receive amount),</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>funding method,</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>payout method,</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>recipient country and currency.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- What to Do When Comparing Rates -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What to do when <span class="text-brand-600">comparing rates</span>
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Follow these steps to ensure you're comparing accurately:
            </p>
            <ol class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Start with the <strong class="font-semibold text-neutral-900">mid-market rate</strong> as your baseline reference.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Get quotes from multiple providers <strong class="font-semibold text-neutral-900">at the same time</strong> for the exact same transfer details.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Note the <strong class="font-semibold text-neutral-900">exchange rate</strong> each provider offers and the <strong class="font-semibold text-neutral-900">final amount</strong> your recipient will receive.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Calculate the total cost including both <strong class="font-semibold text-neutral-900">fee and FX spread</strong>.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                <span>Compare at <strong class="font-semibold text-neutral-900">checkout</strong>—the final step before payment is the only quote that matters.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">6</span>
                <span>Choose the provider that delivers the <strong class="font-semibold text-neutral-900">most money</strong> to your recipient.</span>
              </li>
            </ol>
          </div>

          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>


          <!-- How to Lock In Best Outcome -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-6">
              How to lock in the best outcome
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              You can't control FX markets, but you can control how you compare:
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Move quickly once you're ready</strong>—rates change constantly, so compare and send when you find a good rate.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Compare at checkout</strong>—the final step before payment shows the real rate and fees you'll pay.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Avoid last-minute changes</strong>—switching funding or payout methods can change the rate and fees.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Prefer bank funding for better rates</strong>—card funding is faster but usually costs more through higher fees or worse rates.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Use rate alerts for volatile corridors</strong>—set a target rate and get notified when it's reached instead of constantly checking.</span>
              </li>
            </ul>
          </div>

          <!-- Simple Takeaway -->
          <div class="mb-12 rounded-xl border-2 border-brand-600 bg-brand-600 p-6">
            <h3 class="text-lg font-bold text-white mb-3">The simple takeaway</h3>
            <p class="text-base text-white leading-relaxed">
              Exchange rates move continuously, but you don't need to be a forex trader. The <strong class="font-semibold">mid-market rate</strong> is your anchor—compare providers on the final "recipient gets" amount, including both fee and FX spread. Focus on comparing at checkout with identical inputs.
            </p>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white">
            <h2 class="text-2xl font-bold mb-4">
              Ready to Find Your Best Rate?
            </h2>
            <p class="text-lg text-white/90 mb-6 leading-relaxed">
              Compare live rates from 30+ licensed providers in seconds. See exactly how much your recipient will get, no hidden fees.
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
    <section class="py-16 lg:py-20 bg-gradient-to-r from-brand-600 to-brand-700">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how FX markup works and why "$0 fee" can still be expensive.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              How to Read a Remittance Quote
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Understand what matters in a quote and spot hidden costs.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how comparing can save you hundreds on the same transfer.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'How Exchange Rates Work', path: '/learn/how-exchange-rates-work' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'How Exchange Rates Work (and why they change) | Remit-Scout',
  description: 'Learn mid-market vs. send rate, FX spreads, and the levers that move your transfer price—so you keep more on every remittance.',
  canonical: `${siteUrl}/learn/how-exchange-rates-work`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'How Exchange Rates Work', url: `${siteUrl}/learn/how-exchange-rates-work` },
])
</script>
