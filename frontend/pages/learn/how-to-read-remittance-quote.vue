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
            How to Read a Quote: "Recipient Gets"
          </h1>
          <p class="text-xl text-neutral-600 sm:text-2xl font-medium mb-6 leading-relaxed">
            "Recipient Gets" is the number that matters. It captures the money lost from a bad exchange rate (FX spread) plus the upfront fee—so you can compare providers correctly.
          </p>
          <p class="text-lg text-neutral-700 leading-relaxed mb-6">
            Most people compare transfers the wrong way: they look at the fee. A $0 fee feels like a win. But the fee is only part of the cost. The best single metric is what we call <strong class="font-semibold text-neutral-900">Recipient Gets</strong>—the exact amount your recipient receives in the destination currency.
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
                <span>"Recipient gets" is the best single metric because it includes fees and FX spread.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Compare the offered rate to mid-market to spot hidden markup.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-brand-600 mt-1">•</span>
                <span>Keep inputs identical and compare at checkout for a fair match.</span>
              </li>
            </ul>
          </div>
          <!-- What Recipient Gets Means -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What "Recipient Gets" really means
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              "Recipient gets" is the end result after all costs are applied.
            </p>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              It indirectly includes:
            </p>
            <ul class="space-y-3 text-base text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">upfront fee</strong> you pay, and</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">money lost through a weaker exchange rate</strong> (FX spread/markup), because both reduce the amount that converts or the rate applied to it.</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed">
              That's why it's the cleanest number to compare providers: it's outcome-based.
            </p>
          </div>

          <!-- Quote Breakdown -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-8 lg:p-12">
            <h2 class="text-2xl font-bold text-neutral-900 mb-6">
              The basic anatomy of a quote
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              When you're looking at a quote screen, you'll usually see:
            </p>
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
            <p class="text-base text-neutral-700 leading-relaxed mt-6">
              To compare providers accurately, keep the last two constant: funding method and payout method. Otherwise you're not comparing like-for-like.
            </p>
          </div>

          <!-- Simple Formula -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">A simple formula (so you understand the mechanics)</h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              For a typical transfer where the fee is charged upfront in your currency:
            </p>
            <ol class="space-y-2 text-base text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="font-semibold text-brand-600">1.</span>
                <span><strong class="font-semibold text-neutral-900">Amount converted</strong> = Send amount – Fee</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="font-semibold text-brand-600">2.</span>
                <span><strong class="font-semibold text-neutral-900">Recipient gets</strong> = Amount converted × Provider exchange rate</span>
              </li>
            </ol>
            <p class="text-sm text-neutral-600">
              This is the skeleton. Real products may fold the fee into "total to pay," or charge fees differently, but the idea stays: fees reduce the amount that gets converted, and rates determine the conversion outcome.
            </p>
          </div>

          <!-- FX Cost -->
          <div class="mb-12">
            <h3 class="text-xl font-bold text-neutral-900 mb-3">"Recipient gets" also tells you your hidden FX cost</h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              If you want to understand the FX part, compare your quote to a neutral reference rate:
            </p>
            <ul class="space-y-2 text-base text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Mid‑market conversion (ideal)</strong> = (Send amount – fee) × Mid‑market rate</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Quoted conversion (actual)</strong> = (Send amount – fee) × Provider rate</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Money lost to FX</strong> = Mid‑market conversion – Quoted conversion</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed">
              That "money lost" is the cost of the exchange rate being worse than mid‑market. Add the upfront fee and you have your total effective cost.
            </p>
            <p class="text-base text-neutral-700 leading-relaxed mt-3">
              You don't need to compute this every time to compare providers, but it's useful when a quote feels confusing or too good to be true.
            </p>
          </div>

          <!-- How to Compare -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              How to compare two quotes correctly (step-by-step)
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Step 1: Pick the comparison style</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  There are two common ways to quote a transfer:
                </p>
                <ul class="space-y-2 text-base text-neutral-700 mt-3">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="font-semibold text-neutral-900">Fixed send:</strong> "I will send $500." Recipient gets varies by provider.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="font-semibold text-neutral-900">Fixed receive:</strong> "Recipient must get 10,000." You pay varies by provider.</span>
                  </li>
                </ul>
                <p class="text-base text-neutral-700 leading-relaxed mt-3">
                  Both are valid, but don't mix them while comparing. Choose one.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Step 2: Hold the rails constant</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-3">
                  Match:
                </p>
                <ul class="space-y-2 text-base text-neutral-700">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>funding method (bank vs card), and</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>payout method (bank vs cash vs mobile money).</span>
                  </li>
                </ul>
                <p class="text-base text-neutral-700 leading-relaxed mt-3">
                  Otherwise you can accidentally compare a cheap bank-funded bank deposit against a card-funded cash pickup. That's apples-to-oranges.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Step 3: Compare Recipient Gets at the final step</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  Many providers show a "marketing quote" early, then refine it at checkout. The checkout screen is what you should compare.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">Step 4: Check speed and constraints</h3>
                <p class="text-base text-neutral-700 leading-relaxed">
                  If Quote A gives $5 more but takes 3 days, and Quote B arrives in 5 minutes, the "best" quote depends on urgency.
                </p>
              </div>
            </div>
          </div>

          <!-- Example -->
          <div class="mb-12 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-3">A quick example (hypothetical)</h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              You send $500.
            </p>
            <ul class="space-y-3 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Provider A:</strong> $0 fee, rate = 1.20 → recipient gets = 500 × 1.20 = 600</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span><strong class="font-semibold text-neutral-900">Provider B:</strong> $3.99 fee, rate = 1.22 → recipient gets = (500 – 3.99) × 1.22 ≈ 605. (rounded)</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-4">
              Even though Provider B charges a fee, it delivers more because the FX rate is better. This is exactly why "fee-only" comparisons fail.
            </p>
          </div>

          <!-- Quote Traps -->
          <div class="mb-12">
            <h3 class="text-xl font-bold text-neutral-900 mb-4">Common quote traps (and how to avoid them)</h3>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Different payout methods:</strong> Cash pickup may have different pricing than bank deposit.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Rate not locked:</strong> If the rate changes before you confirm, the quote you saw earlier isn't the final.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Recipient-side fees:</strong> Rare, but some banks deduct fees from incoming transfers.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Incorrect recipient details:</strong> Can delay payout or force reprocessing.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-amber-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Card issuer charges:</strong> Your bank may add fees on top of what the provider shows.</span>
              </li>
            </ul>
          </div>

          <!-- Checklist -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">A "Recipient Gets" checklist</h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Before you press send:
            </p>
            <ul class="space-y-2 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">✅</span>
                <span>Same amount, same payout method, same funding method across providers</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">✅</span>
                <span>Compare at checkout, not on the homepage</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">✅</span>
                <span>Use Recipient Gets as the primary metric</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">✅</span>
                <span>Verify recipient details and payout method requirements</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-emerald-600 font-bold">✅</span>
                <span>Only then consider speed, limits, and refunds</span>
              </li>
            </ul>
            <p class="text-base text-neutral-700 leading-relaxed mt-4">
              If you compare using "recipient gets," you're automatically comparing the <em>real</em> cost: the upfront fee plus the money lost through a weaker exchange rate.
            </p>
          </div>

          <div class="mb-12">
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
  title: 'How to Read a Quote: "Recipient Gets" | Remit-Scout',
  description: '"Recipient Gets" is the number that matters. It captures the money lost from a bad exchange rate (FX spread) plus the upfront fee—so you can compare providers correctly.',
  canonical: `${siteUrl}/learn/how-to-read-remittance-quote`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Reading Quotes', url: `${siteUrl}/learn/how-to-read-remittance-quote` },
])
</script>








