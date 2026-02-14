<template>
  <div class="min-h-screen bg-surface">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-surface/10 backdrop-blur-sm px-4 py-2 text-body-sm font-semibold text-white shadow-md mb-6">
            Money Transfer Basics
          </div>
          <h1 class="text-hero font-bold tracking-tight text-white mb-6">
            Why You Must<br>
            <span class="text-brand-500">Compare Before</span> Every Transfer
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            Even on the same transfer, the difference between providers can be <span class="font-bold text-brand-400">hundreds of dollars</span>. Here's why you must compare before every transfer, and what to compare.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-400">
            <span>5 min read</span>
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
                    Why Past Performance <span class="text-brand-600">Doesn't Predict</span> Future Savings
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    If you send money abroad more than once, it's tempting to pick a provider you like and stick with it. The problem: <strong class="font-semibold text-neutral-900">remittance pricing isn't static</strong>.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed mb-4">
                    That's why "I used them last month and it was cheap" isn't reliable. The only number that matters is what your recipient gets <strong class="font-bold">this time</strong>, for <strong class="font-bold">this exact</strong> transfer.
                  </p>
                  <p class="text-body-lg font-medium leading-relaxed">
                    Providers optimize their pricing based on market conditions, competition levels, and their own cost structures. What worked for your last transfer might not work for this one, even if you're sending to the same country. The exchange rate spread, fees, and promotional offers all fluctuate. That's why comparing rates right before you send gives you the most accurate picture and ensures you're getting the best deal available at that exact moment.
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-primary-50 p-8 lg:p-10 shadow-xl">
                <h3 class="text-h4 font-bold text-neutral-900 mb-6">
                  What Changes the Price
                </h3>
                <div class="grid gap-4">
                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Corridor Changes
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Pricing shifts dramatically based on where you're sending from/to. A provider great for US→Mexico may be expensive for US→Kenya.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Funding Method
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Bank transfer vs debit card vs credit card can flip the winner. A provider cheap on bank funding can become expensive on card funding.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Payout Method
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Bank deposit vs cash pickup vs mobile money changes the total cost. Some providers excel at one method but struggle with others.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-surface/90 border border-brand-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Amount & Timing
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Transfer amount and even time of day can affect rates. FX spreads widen and tighten throughout the day.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
          <div class="mb-12 rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
            <h2 class="text-h4 font-bold text-neutral-900 mb-3">
              Quick takeaways
            </h2>
            <ul class="space-y-2 text-body text-neutral-700">
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Pricing shifts with corridor, funding method, payout rail, and timing.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Compare at checkout and prioritize "recipient gets" for the real price.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Test at least two funding methods to catch hidden cost swings.</span>
              </li>
            </ul>
          </div>

          <!-- Why Best Provider Changes -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Why the "best" provider changes from transfer to transfer
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  1. FX rates move constantly
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Providers earn money through a combination of fees and the exchange rate they offer you. Even if a provider's fee stays the same, the "spread" in their FX rate can widen or tighten throughout the day. Two providers can swap places as the best deal without any announcement.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  2. Pricing depends on the corridor and payout rails
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Many providers are strong specialists. One may be excellent for US→Mexico bank deposits but uncompetitive for US→Kenya mobile money. Another may be great for cash pickup but weaker for bank deposits. If you change the destination country, or even the payout method inside the same country, your "best" option can change.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  3. Funding method can flip the winner
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Bank transfer vs debit card vs credit card often changes the total cost. Cards are convenient and fast, but providers (and card networks) incur costs and risk. Some providers pass that on through higher fees or a worse FX rate. A provider that looks cheap on bank funding can become expensive on card funding.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  4. Promotions and tiers distort expectations
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  First transfer discounts, fee free thresholds, "VIP" tiers, and corridor promotions can make a provider look amazing once, and average the next time. You don't want your budgeting to depend on a promo you didn't realize was temporary.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  5. Checkout is where truth happens
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Many price comparisons happen too early (homepage calculators, marketing pages, or "starting from" claims). The real price is the final screen where you confirm funding method + payout method + recipient details. That final quote can differ from earlier estimates, so comparing at checkout is what actually protects you.
                </p>
              </div>
            </div>
          </div>

          <!-- What to Compare -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              What to compare (a practical checklist)
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
              When you compare providers, don't just compare the fee. Compare these items in order:
            </p>
            <div class="space-y-4">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Recipient gets (the most important)
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      This is the amount your recipient actually receives in the destination currency.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Total cost (how much leaves your pocket)
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      This includes the upfront fee and the value lost via a weaker exchange rate. If your provider shows "Total to pay," use it.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Speed (ETA) and delivery method
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      A cheap bank transfer that arrives in 3 days may be worse than a slightly more expensive mobile money payout that arrives in minutes, depending on the situation.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Payout reliability for that method
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      Cash pickup requires correct name + ID. Mobile money requires the right wallet network and number. Bank deposits require correct account details. Some methods fail more often if details are slightly wrong.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Refund/cancellation reality
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      If you're sending a large amount or you're not 100% sure about recipient details, check whether cancellation is possible before payout, how long refunds take, and whether fees are refundable.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    6
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Limits and verification
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      If you're near a limit, you may trigger ID checks that slow the transfer. That can matter when timing is critical.
                    </p>
                  </div>
                </div>
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

          <!-- Comparison Workflow -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-primary-50 p-8 lg:p-12">
            <h2 class="text-h3 font-bold text-neutral-900 mb-4">
              A simple comparison workflow (takes 3 to 5 minutes once you get used to it)
            </h2>
            <ol class="space-y-4 text-body text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">1</span>
                <span>Pick your <strong class="font-semibold text-neutral-900">send amount</strong> and <strong class="font-semibold text-neutral-900">destination</strong> (don't change them while comparing).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">2</span>
                <span>Choose the <strong class="font-semibold text-neutral-900">same payout method</strong> for all quotes (bank deposit vs cash pickup vs mobile money).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">3</span>
                <span>Test <strong class="font-semibold text-neutral-900">two funding methods</strong> if you can: bank and debit card.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">4</span>
                <span>For each provider, go to the <strong class="font-semibold text-neutral-900">last step before paying</strong> and write down: recipient gets, total cost / fees, ETA</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-body-sm font-bold">5</span>
                <span>Choose the best fit for that transfer (sometimes it's cheapest; sometimes it's fastest; sometimes it's most reliable).</span>
              </li>
            </ol>
          </div>

          <!-- Example -->
          <div class="mb-12 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
              A quick example (hypothetical, but realistic)
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              You're sending the equivalent of $1,000 to a relative. Provider A charges a $0 fee but offers a slightly weaker FX rate. Provider B charges a $4.99 fee but offers a better rate. The "no-fee" option can still deliver less because the FX spread is applied to the full amount. On larger transfers, that spread can outweigh a small fee very quickly.
            </p>
          </div>

          <!-- Bottom Line -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
              Bottom line
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed">
              Comparing before every transfer isn't about being obsessive, it's about preventing invisible losses. The best providers are often <strong class="font-semibold text-neutral-900">specialists</strong>, and pricing is dynamic. If you compare on <strong class="font-semibold text-neutral-900">recipient gets</strong> at checkout, you'll avoid the most common (and costly) mistake: trusting a past transfer to predict today's price.
            </p>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-brand-600 p-8 lg:p-12 text-white">
            <h2 class="text-h3 font-bold mb-4">
              Ready to Find Your Best Rate?
            </h2>
            <p class="text-body-lg text-white/90 mb-6 leading-relaxed">
              Compare live rates from 30+ licensed providers in seconds. See exactly how much your recipient will get, no hidden fees, no marketing fluff.
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
    <section class="py-16 lg:py-20 bg-gradient-to-r from-brand-600 to-brand-700">
      <div class="mx-auto max-w-page px-page-x">
        <h2 class="text-h2 font-bold text-white mb-8 text-center">
          Related Guides
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how FX markup works and why "$0 fee" can still be expensive.
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
            class="group flex flex-col rounded-2xl border border-neutral-700 bg-neutral-800/50 p-6 shadow-sm transition-all hover:shadow-lg hover:border-brand-500/50 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
              How to Read a Remittance Quote
            </h3>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4 flex-1">
              Understand what matters in a quote and what's just noise.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-400 group-hover:gap-2 transition-all">
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
            class="group flex flex-col rounded-2xl border border-neutral-700 bg-neutral-800/50 p-6 shadow-sm transition-all hover:shadow-lg hover:border-brand-500/50 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
              Payment Method Playbook
            </h3>
            <p class="text-body-sm text-neutral-300 leading-relaxed mb-4 flex-1">
              Choose the right payment and payout method for your needs.
            </p>
            <span class="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-400 group-hover:gap-2 transition-all">
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
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Why Compare', path: '/learn/why-compare-before-every-transfer' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'Why You Must Compare Before Every Transfer | Remit-Scout'
const seoDescription = 'Even on the same transfer, the difference between providers can be hundreds of dollars. Here\'s why you must compare before every transfer - and what to compare.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '5 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/why-compare-before-every-transfer`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Why Compare', url: `${siteUrl}/learn/why-compare-before-every-transfer` },
])
</script>
