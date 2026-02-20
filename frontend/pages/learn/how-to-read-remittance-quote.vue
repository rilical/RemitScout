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
            How to Read a Quote:<br>
            <span class="text-brand-400">"Recipient Gets"</span>
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            <span class="font-bold text-brand-400">"Recipient Gets"</span> is the number that matters. It captures the money lost from a bad exchange rate (FX spread) plus the upfront fee, so you can compare providers correctly.
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
                    Why <span class="text-brand-600">"Recipient Gets"</span> Is the Only Number That Matters
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    Most people compare transfers the wrong way: they look at the fee. A $0 fee feels like a win. But the fee is only part of the cost. The best single metric is what we call <strong class="font-semibold text-neutral-900">Recipient Gets</strong>—the exact amount your recipient receives in the destination currency.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed">
                    "Recipient gets" is the best single metric because it includes fees and FX spread. Compare the offered rate to mid market to spot hidden markup. Keep inputs identical and compare at checkout for a fair match.
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-primary-50 p-8 lg:p-10 shadow-xl">
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
                          The complete picture
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          "Recipient gets" captures both the upfront fee and money lost through FX spread.
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
                          Compare at checkout
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Rates can change. Always compare quotes at the final checkout step, not the homepage.
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
                          Keep inputs identical
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Use the same send amount, funding method, and payout method across all comparisons.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- What Recipient Gets Means -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              What <span class="text-brand-600">"Recipient Gets"</span> really means
            </h2>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              "Recipient gets" is the end result after all costs are applied.
            </p>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              It indirectly includes:
            </p>
            <ul class="space-y-3 text-body text-neutral-700 mb-6">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">upfront fee</strong> you pay, and</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span>the <strong class="font-semibold text-neutral-900">money lost through a weaker exchange rate</strong> (FX spread or markup), because both reduce the amount that converts or the rate applied to it.</span>
              </li>
            </ul>
            <p class="text-body text-neutral-700 leading-relaxed">
              That's why it's the cleanest number to compare providers: it's outcome-based.
            </p>
          </div>

          <!-- Quote Breakdown -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-primary-50 p-8 lg:p-12">
            <h2 class="text-h3 font-bold text-neutral-900 mb-6">
              The basic <span class="text-brand-600">anatomy of a quote</span>
            </h2>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              When you're looking at a quote screen, you'll usually see:
            </p>
            <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-6 mb-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-body-sm font-semibold text-neutral-600 mb-1">
                      Transfer Fee
                    </div>
                    <div class="text-h3 font-bold text-neutral-900">
                      $2.99
                    </div>
                  </div>
                  <div class="text-body-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                    Fixed fee
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-body-sm font-semibold text-neutral-600 mb-1">
                      Exchange Rate
                    </div>
                    <div class="text-h3 font-bold text-neutral-900">
                      18.45 MXN
                    </div>
                    <div class="text-body-sm text-neutral-500 mt-1">
                      vs 18.50 mid-market (0.3% markup)
                    </div>
                  </div>
                  <div class="text-body-sm text-neutral-500 bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-semibold">
                    Low markup
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-body-sm font-semibold text-neutral-600 mb-1">
                      Delivery Method
                    </div>
                    <div class="text-body font-semibold text-neutral-900">
                      Bank Transfer
                    </div>
                  </div>
                  <div class="text-body-sm text-neutral-500 bg-primary-100 text-brand-700 px-3 py-1 rounded-full">
                    Bank account
                  </div>
                </div>
                <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <div class="text-body-sm font-semibold text-neutral-600 mb-1">
                      Estimated Delivery
                    </div>
                    <div class="text-body font-semibold text-neutral-900">
                      1-2 business days
                    </div>
                  </div>
                  <div class="text-body-sm text-neutral-500 bg-success-100 text-success-700 px-3 py-1 rounded-full">
                    Fast
                  </div>
                </div>
                <div class="pt-4 bg-gradient-to-br from-brand-50 to-primary-50 rounded-xl p-4">
                  <div class="text-body-sm font-semibold text-neutral-600 mb-1">
                    Recipient Gets
                  </div>
                  <div class="text-h2 font-bold text-brand-600">
                    9,188 MXN
                  </div>
                  <div class="text-body-sm text-neutral-500 mt-1">
                    This is the number that matters
                  </div>
                </div>
                <div class="text-body-sm text-neutral-500 pt-2 border-t border-neutral-200">
                  Quote timestamp: December 15, 2024 at 2:30 PM UTC
                </div>
              </div>
            </div>
            <p class="text-body text-neutral-700 leading-relaxed mt-6">
              To compare providers accurately, keep the last two constant: funding method and payout method. Otherwise you're not comparing like-for-like.
            </p>
          </div>

          <!-- Simple Formula -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
              A simple formula (so you understand the mechanics)
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              For a typical transfer where the fee is charged upfront in your currency:
            </p>
            <ol class="space-y-2 text-body text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="font-semibold text-brand-600">1.</span>
                <span><strong class="font-semibold text-neutral-900">Amount converted</strong> = Send amount minus Fee</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="font-semibold text-brand-600">2.</span>
                <span><strong class="font-semibold text-neutral-900">Recipient gets</strong> = Amount converted times Provider exchange rate</span>
              </li>
            </ol>
            <p class="text-body-sm text-neutral-600">
              This is the skeleton. Real products may fold the fee into "total to pay," or charge fees differently, but the idea stays: fees reduce the amount that gets converted, and rates determine the conversion outcome.
            </p>
          </div>

          <!-- FX Cost -->
          <div class="mb-12">
            <h3 class="text-h4 font-bold text-neutral-900 mb-3">
              "Recipient gets" also tells you your hidden FX cost
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              If you want to understand the FX part, compare your quote to a neutral reference rate:
            </p>
            <ul class="space-y-2 text-body text-neutral-700 mb-4">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Mid market conversion (ideal)</strong> = (Send amount minus fee) times Mid market rate</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Quoted conversion (actual)</strong> = (Send amount minus fee) times Provider rate</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Money lost to FX</strong> = Mid market conversion minus Quoted conversion</span>
              </li>
            </ul>
            <p class="text-body text-neutral-700 leading-relaxed">
              That "money lost" is the cost of the exchange rate being worse than mid market. Add the upfront fee and you have your total effective cost.
            </p>
            <p class="text-body text-neutral-700 leading-relaxed mt-3">
              You don't need to compute this every time to compare providers, but it's useful when a quote feels confusing or too good to be true.
            </p>
          </div>

          <!-- How to Compare -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              How to compare two quotes correctly <span class="text-brand-600">(step by step)</span>
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Step 1: Pick the comparison style
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  There are two common ways to quote a transfer:
                </p>
                <ul class="space-y-2 text-body text-neutral-700 mt-3">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="font-semibold text-neutral-900">Fixed send:</strong> "I will send $500." Recipient gets varies by provider.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="font-semibold text-neutral-900">Fixed receive:</strong> "Recipient must get 10,000." You pay varies by provider.</span>
                  </li>
                </ul>
                <p class="text-body text-neutral-700 leading-relaxed mt-3">
                  Both are valid, but don't mix them while comparing. Choose one.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Step 2: Hold the rails constant
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-3">
                  Match:
                </p>
                <ul class="space-y-2 text-body text-neutral-700">
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>funding method (bank vs card), and</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>payout method (bank vs cash vs mobile money).</span>
                  </li>
                </ul>
                <p class="text-body text-neutral-700 leading-relaxed mt-3">
                  Otherwise you can accidentally compare a cheap bank-funded bank deposit against a card-funded cash pickup. That's apples-to-oranges.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Step 3: Compare Recipient Gets at the final step
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  Many providers show a "marketing quote" early, then refine it at checkout. The checkout screen is what you should compare.
                </p>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Step 4: Check speed and constraints
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed">
                  If Quote A gives $5 more but takes 3 days, and Quote B arrives in 5 minutes, the "best" quote depends on urgency.
                </p>
              </div>
            </div>
          </div>

          <!-- Example -->
          <div class="mb-12 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
              A quick example (hypothetical)
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              You send $500.
            </p>
            <ul class="space-y-3 text-body text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span>
                  <strong class="font-semibold text-neutral-900">Provider A:</strong> $0 fee, rate = 1.20.
                  <span class="ml-1 inline-block align-baseline">
                    <LaTeXFormula
                      size="small"
                      formula="\text{recipient gets} = 500 \times 1.20 = 600"
                    />
                  </span>
                </span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold">•</span>
                <span>
                  <strong class="font-semibold text-neutral-900">Provider B:</strong> $3.99 fee, rate = 1.22.
                  <span class="ml-1 inline-block align-baseline">
                    <LaTeXFormula
                      size="small"
                      formula="\text{recipient gets} = (500 - 3.99) \times 1.22 \approx 605"
                    />
                  </span>
                </span>
              </li>
            </ul>
            <p class="text-body text-neutral-700 leading-relaxed mt-4">
              Even though Provider B charges a fee, it delivers more because the FX rate is better. This is exactly why "fee-only" comparisons fail.
            </p>
          </div>

          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Quote Traps -->
          <div class="mb-12">
            <h3 class="text-h4 font-bold text-neutral-900 mb-4">
              Common quote traps (and how to avoid them)
            </h3>
            <ul class="space-y-2 text-body text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-warning-800 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Different payout methods:</strong> Cash pickup may have different pricing than bank deposit.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-warning-800 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Rate not locked:</strong> If the rate changes before you confirm, the quote you saw earlier isn't the final.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-warning-800 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Recipient-side fees:</strong> Rare, but some banks deduct fees from incoming transfers.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-warning-800 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Incorrect recipient details:</strong> Can delay payout or force reprocessing.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-warning-800 mt-1">•</span>
                <span><strong class="font-semibold text-neutral-900">Card issuer charges:</strong> Your bank may add fees on top of what the provider shows.</span>
              </li>
            </ul>
          </div>

          <!-- Checklist -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
            <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
              A "Recipient Gets" checklist
            </h3>
            <p class="text-body text-neutral-700 leading-relaxed mb-4">
              Before you press send:
            </p>
            <ul class="space-y-2 text-body text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold mt-1">•</span>
                <span>Same amount, same payout method, same funding method across providers</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold mt-1">•</span>
                <span>Compare at checkout, not on the homepage</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold mt-1">•</span>
                <span>Use Recipient Gets as the primary metric</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold mt-1">•</span>
                <span>Verify recipient details and payout method requirements</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-brand-600 font-bold mt-1">•</span>
                <span>Only then consider speed, limits, and refunds</span>
              </li>
            </ul>
            <p class="text-body text-neutral-700 leading-relaxed mt-4">
              If you compare using "recipient gets," you're automatically comparing the <em>real</em> cost: the upfront fee plus the money lost through a weaker exchange rate.
            </p>
          </div>

          <div class="mb-12">
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      <span class="text-brand-600">Recipient Gets</span> (Most Important)
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      This is the actual amount your recipient will receive after all fees and FX markup. Compare this number across providers. It's the only metric that matters.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Total Cost <span class="text-brand-600">(Fee plus FX Markup)</span>
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      Don't just look at the transfer fee. Add the FX markup cost. A $0 fee with 3% markup is often more expensive than a $3 fee with 0.5% markup.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      <span class="text-brand-600">Delivery Speed</span> (If Urgent)
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      Speed matters if you need money delivered quickly. But remember: faster often costs more. Balance urgency with cost.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Quote Timestamp <span class="text-brand-600">(Context Only)</span>
                    </h3>
                    <p class="text-body text-neutral-700 leading-relaxed">
                      Exchange rates change minute to minute. A quote from 2 hours ago may be outdated. Always check when the quote was generated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-brand-600 p-8 lg:p-12 text-white">
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
              Hidden Exchange Rate Fees
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how FX markup works and how to spot hidden costs.
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
            to="/learn/why-compare-before-every-transfer"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
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
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
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
import { useStructuredData } from '~/composables/useStructuredData'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import CompareWidget from '~/components/shared/CompareWidget.vue'
import LaTeXFormula from '~/components/shared/LaTeXFormula.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Reading Quotes', path: '/learn/how-to-read-remittance-quote' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'How to Read a Quote: "Recipient Gets" | Remit-Scout'
const seoDescription = '"Recipient Gets" is the number that matters. It captures the money lost from a bad exchange rate (FX spread) plus the upfront fee—so you can compare providers correctly.'

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
  canonical: `${siteUrl}/learn/how-to-read-remittance-quote`,
  ogImage: false,
})

const { addHowToSchema } = useStructuredData()

addHowToSchema({
  name: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
  description: seoDescription,
  steps: [
    {
      name: 'Fix the inputs',
      text: 'Pick the same send amount, corridor, funding method, payout method, and speed tier before comparing providers.',
    },
    {
      name: 'Compare the recipient gets number',
      text: 'Compare providers on the final checkout quote using “recipient gets”, not marketing rates or fee-only claims.',
    },
    {
      name: 'Check fees and FX markup',
      text: 'Review the upfront fee and the effective exchange rate to understand the true cost baked into the quote.',
    },
    {
      name: 'Confirm speed and constraints',
      text: 'Verify delivery time, limits, and any ID or pickup requirements before you send.',
    },
  ],
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Reading Quotes', url: `${siteUrl}/learn/how-to-read-remittance-quote` },
])
</script>
