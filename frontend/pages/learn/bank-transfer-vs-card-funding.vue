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
            Bank Transfer vs <span class="text-brand-400">Card Funding</span>
          </h1>
          <p class="text-xl text-slate-300 sm:text-2xl font-medium mb-6 leading-relaxed">
            Which is cheaper and when? Learn how your funding method changes total cost, speed, and delivery time.
          </p>
          <p class="text-lg text-slate-300 leading-relaxed mb-6">
            Bank transfers can be cheaper but slower. Cards can be fast but often cost more. Your funding method is one of the biggest hidden levers in remittance pricing. Two transfers to the same recipient can have different fees, different FX rates, and different delivery times, just because you paid by bank transfer instead of debit or credit card.
          </p>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span>9 min read</span>
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
                    How Funding Method <span class="text-brand-600">Shapes Your Transfer</span>
                  </h2>
                  <p class="text-lg text-neutral-700 leading-relaxed mb-4">
                    The way you pay for a transfer matters more than most people realize. Your funding method determines not just the upfront fee, but also the exchange rate you get, how quickly the transfer processes, and sometimes even which payout methods are available.
                  </p>
                  <p class="text-lg text-neutral-700 leading-relaxed">
                    Bank funding usually delivers better pricing but can add 1 to 2 days to processing. Card funding is fast but often carries higher fees and issuer charges. Understanding these tradeoffs helps you choose the right method for each transfer.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-2xl mb-4">The Bottom Line</h3>
                  <p class="text-lg font-medium leading-relaxed mb-4">
                    Bank funding usually delivers better pricing, but can add 1 to 2 days. Card funding is fast but often carries higher fees and issuer charges. Always compare providers with the same funding method to see accurate differences.
                  </p>
                  <p class="text-lg font-medium leading-relaxed">
                    The same provider can be cheap with bank funding and expensive with card funding. Test both methods in your quote tool to see which gives you the best "recipient gets" for your specific transfer. The difference can be $20 to $50 on a $1,000 transfer.
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
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Bank funding is cheaper</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Lower fees, better exchange rates, but slower processing (1 to 2 days to clear).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Card funding is faster</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Instant authorization and processing, but higher fees (2 to 4%) and possible issuer charges.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Compare with same method</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Always compare providers using the same funding method. Mixing methods gives misleading results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- What Funding Method Means -->
          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              What <span class="text-brand-600">Funding Method</span> Means
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Your funding method is how money leaves your account to pay for the transfer. Providers offer different options, and each has different costs and processing times.
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Bank Transfer / Direct Debit</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-4">
                  Money is pulled directly from your bank account using ACH (US), SEPA (Europe), or local bank rails. This is the traditional banking method.
                </p>
                <div class="bg-white rounded-lg p-4 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-brand-600">Examples:</strong> ACH bank transfer, SEPA direct debit, bank wire
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Debit / Credit Card</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-4">
                  Money is charged to your debit or credit card. Debit cards pull from checking accounts. Credit cards create a charge you pay later.
                </p>
                <div class="bg-white rounded-lg p-4 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-brand-600">Note:</strong> Apple Pay and Google Pay typically use card rails underneath
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Why Bank Transfers Are Cheaper -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why Bank Transfers Are <span class="text-brand-600">Often Cheaper</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Bank funding typically costs providers less to process, which means they can pass those savings to you through lower fees and better exchange rates.
            </p>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Lower Provider Costs</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Lower processing fees for the provider (no card network fees)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Lower fraud and chargeback risk</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Fewer card network costs and interchange fees</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Simpler processing workflow</span>
                  </li>
                </ul>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">What You Get</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Lower explicit fees (often $0 to $3 flat fee)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Tighter FX rates (better exchange rate, less markup)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>No surprise issuer fees</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Higher transfer limits</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="bg-brand-50 rounded-lg p-6 border-2 border-brand-200">
              <h4 class="font-bold text-neutral-900 mb-2">The Tradeoff</h4>
              <p class="text-sm text-neutral-700 leading-relaxed">
                Bank rails can be slower (1 to 2 business days to clear) and cut-off times matter. If you initiate a transfer after the cutoff time, it may not start processing until the next business day. This delay can be worth it for the cost savings, especially on larger transfers.
              </p>
            </div>
          </div>

          <!-- Why Cards Are Faster -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Why Cards Are <span class="text-brand-600">Faster</span> (and Often More Expensive)
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Cards authorize quickly, allowing providers to start processing payouts almost immediately. But this speed comes with higher costs that providers pass on to you.
            </p>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Higher Provider Costs</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Card network fees (interchange, processing fees)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Higher fraud risk and chargeback exposure</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Disputes and chargebacks complexity</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Real-time authorization requirements</span>
                  </li>
                </ul>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">What You Pay</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Higher transfer fees (typically 2% to 4% of amount)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Worse FX rates (higher markup to offset costs)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Possible issuer fees (cash advance, foreign transaction)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Lower transfer limits</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="bg-brand-50 rounded-lg p-6 border-2 border-brand-200">
              <h4 class="font-bold text-neutral-900 mb-2">Credit Card Warnings</h4>
              <p class="text-sm text-neutral-700 leading-relaxed mb-2">
                Credit cards, in particular, can trigger issuer-side fees. Your card issuer may treat the transfer as a cash advance, charging cash advance fees (often 3% to 5%) plus interest from day one. Some issuers also charge foreign transaction fees (1% to 3%) even if the transfer is in USD.
              </p>
              <p class="text-sm text-neutral-700 leading-relaxed">
                Always check your card's terms before using credit card funding. The provider's fee might look reasonable, but issuer fees can add $30 to $80 on a $1,000 transfer.
              </p>
            </div>
          </div>

          <!-- Speed Differences -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-12 shadow-xl">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              <span class="text-brand-600">Speed Differences</span>: Typical Patterns
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Funding speed is not the same as payout speed. A provider might pay out fast once they have funds, but your funding method determines how quickly they get funds or how confidently they can advance payout.
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Debit Card</h3>
                <p class="text-sm text-neutral-700 mb-2 font-medium">Speed: Minutes to same day</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Instant authorization means provider can start payout immediately. Speed depends on corridor and payout method.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Urgent transfers, instant processing needs
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Bank Transfer</h3>
                <p class="text-sm text-neutral-700 mb-2 font-medium">Speed: Same day to several days</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Depends on rail type and cutoff times. ACH takes 1 to 2 business days. Wire transfers can be same day. SEPA is typically next day.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Non-urgent transfers, cost optimization
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Credit Card</h3>
                <p class="text-sm text-neutral-700 mb-2 font-medium">Speed: Fast authorization, sometimes extra steps</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Fast authorization, but providers may require extra verification for credit cards due to fraud risk. This can add delays.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Emergencies only, when no other option available
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- When Bank Funding Is Better -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              When <span class="text-brand-600">Bank Funding</span> Is Usually Better
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Choose bank funding when cost matters more than speed. This is especially true for larger amounts where the percentage-based fees on cards become very expensive.
            </p>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm mb-6">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">Choose Bank Funding When You Care About:</h3>
              <div class="grid md:grid-cols-2 gap-4">
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong>Lowest effective cost</strong>, especially for larger amounts ($500+)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Fewer surprises from issuer fees</span>
                  </li>
                </ul>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Transfers that are not urgent (you can wait 1 to 2 days)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Regular, recurring transfers</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
              <h4 class="font-bold text-neutral-900 mb-2">Practical Example</h4>
              <p class="text-sm text-neutral-700 leading-relaxed">
                Recurring family support where saving 1% to 2% over time matters more than instant delivery. On a $1,000 monthly transfer, bank funding might cost $3 while card funding costs $30 to $40. Over a year, that's $324 to $444 in savings. The 1 to 2 day delay is worth it for regular transfers.
              </p>
            </div>
          </div>

          <!-- When Debit Card Is Better -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              When <span class="text-brand-600">Debit Card</span> Funding Is Usually Better
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Choose debit card funding when speed and convenience matter more than saving a few dollars. Debit cards often provide the best balance for urgent transfers that still need reasonable value.
            </p>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm mb-6">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">Choose Debit Card When You Care About:</h3>
              <div class="grid md:grid-cols-2 gap-4">
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong>Speed</strong> (need money delivered quickly)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Simplicity (no separate bank transfer step)</span>
                  </li>
                </ul>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Smaller amounts where extra fee is acceptable ($100 to $500)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>One-time transfers where convenience matters</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
              <h4 class="font-bold text-neutral-900 mb-2">Cost Consideration</h4>
              <p class="text-sm text-neutral-700 leading-relaxed">
                On smaller transfers ($100 to $300), the absolute dollar difference between bank and card funding is small ($2 to $8). If speed matters, debit card might be worth the small premium. On larger transfers ($1,000+), the difference becomes significant ($20 to $40), making bank funding more attractive.
              </p>
            </div>
          </div>

          <!-- When Credit Card Makes Sense -->
          <div class="mb-12 rounded-xl border-2 border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 class="text-xl font-bold text-neutral-900 mb-4">
              When <span class="text-brand-600">Credit Card</span> Funding Can Make Sense (But Be Careful)
            </h3>
            <p class="text-base text-neutral-700 leading-relaxed mb-4">
              Credit cards can be useful for emergencies, but they're often the most expensive path because providers may surcharge and issuers may add fees.
            </p>
            <div class="grid md:grid-cols-2 gap-6 mb-4">
              <div class="bg-white rounded-lg p-4 border border-amber-200">
                <h4 class="font-bold text-neutral-900 mb-2">Provider Fees</h4>
                <p class="text-sm text-neutral-700">
                  Providers often charge higher fees for credit cards to offset the risk and processing costs. This might be 2% to 4% of the transfer amount.
                </p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-amber-200">
                <h4 class="font-bold text-neutral-900 mb-2">Issuer Fees</h4>
                <p class="text-sm text-neutral-700">
                  Your credit card issuer may charge cash advance fees (3% to 5%) plus interest from day one. Foreign transaction fees (1% to 3%) may also apply.
                </p>
              </div>
            </div>
            <div class="bg-amber-600 rounded-lg p-4 text-white">
              <h4 class="font-bold mb-2">If You Use a Credit Card:</h4>
              <ul class="space-y-2 text-sm">
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Confirm the provider's fee and rate at checkout before completing the transfer</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Check your card's terms for cash advance fees and foreign transaction fees</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Understand that issuer fees can add $30 to $80 on a $1,000 transfer</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Only use credit cards for true emergencies when no other option is available</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>


          <!-- Cost Comparison -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Real-World <span class="text-brand-600">Cost Comparison</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Here's how funding method affects the total cost of a $1,000 transfer to Mexico using the same provider:
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Bank Funding</h3>
                <div class="space-y-2 mb-4">
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Provider Fee:</strong> $0 to $3</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">FX Markup:</strong> Lower (better rate)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Issuer Fee:</strong> $0</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Total Cost:</strong> $3 to $15</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Speed:</strong> 1 to 2 business days</p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    Best for regular transfers, large amounts
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Debit Card</h3>
                <div class="space-y-2 mb-4">
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Provider Fee:</strong> $20 to $40 (2% to 4%)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">FX Markup:</strong> Higher (worse rate)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Issuer Fee:</strong> $0 (usually)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Total Cost:</strong> $25 to $50</p>
                  <p class="text-sm text-neutral-700"><strong class="text-brand-600">Speed:</strong> Minutes to same day</p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    Best for urgent transfers, convenience
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-red-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Credit Card</h3>
                <div class="space-y-2 mb-4">
                  <p class="text-sm text-neutral-700"><strong class="text-red-600">Provider Fee:</strong> $30 to $50 (3% to 5%)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-red-600">FX Markup:</strong> Highest (worst rate)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-red-600">Issuer Fee:</strong> $30 to $50 (cash advance)</p>
                  <p class="text-sm text-neutral-700"><strong class="text-red-600">Total Cost:</strong> $60 to $100+</p>
                  <p class="text-sm text-neutral-700"><strong class="text-red-600">Speed:</strong> Fast, but may have delays</p>
                </div>
                <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    Most expensive, use only for emergencies
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Refunds and Reversals -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Refunds and Reversals: How Funding Method <span class="text-brand-600">Changes the Process</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              If you need to cancel or refund a transfer, your funding method affects how quickly and easily that happens. Understanding this helps you plan ahead.
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Card Refunds</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Card refunds can be straightforward because the provider can reverse the authorization or credit your card. However, they can take time to post (3 to 7 business days).
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Note:</strong> If the transfer already processed, refunds may take longer as the provider needs to reverse the payout transaction.
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Bank Transfer Refunds</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Bank transfer refunds can be slower because they require a new ACH or wire transaction. This can take 3 to 10 business days, and you may need to provide bank account details for the refund.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Note:</strong> If the transfer already cleared, refunds require manual processing which adds delays.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-6 bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <h4 class="font-bold text-neutral-900 mb-2">Chargebacks: Use With Caution</h4>
              <p class="text-sm text-neutral-700 leading-relaxed">
                Chargebacks exist for cards and can be faster than refunds in some cases. However, using chargebacks improperly (when the provider has already completed the transfer correctly) can create account issues, blacklist you from the provider, and damage your relationship. Only use chargebacks for actual fraud or when the provider refuses a legitimate refund request.
              </p>
            </div>
            <div class="mt-4 bg-brand-600 rounded-lg p-6 text-white">
              <h4 class="font-bold mb-2">Practical Takeaway</h4>
              <p class="text-sm leading-relaxed">
                If you think you might need to cancel, understand the provider's cancellation window and act early. Most providers allow cancellation within a few hours or before the transfer starts processing. Once processing begins, refunds become more complicated regardless of funding method.
              </p>
            </div>
          </div>

          <!-- Decision Rule -->
          <div class="mb-12 rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 lg:p-10 text-white shadow-xl">
            <h2 class="text-2xl font-bold mb-4">
              A Simple <span class="text-brand-200">Decision Rule</span>
            </h2>
            <p class="text-lg text-white/90 leading-relaxed mb-6">
              Use this framework to choose the right funding method for each transfer:
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">If your priority is...</h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Cheapest possible</strong> → Try bank funding first</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Fastest possible</strong> → Debit card (or instant rails)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Emergency and no other option</strong> → Credit card, but expect higher cost</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Not sure</strong> → Quote both bank and debit, compare "recipient gets"</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">Quick decision guide:</h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Amount $500+</strong> → Usually bank funding (savings matter more)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Urgent need</strong> → Debit card (speed matters more)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Regular transfers</strong> → Bank funding (build habit, save over time)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Small amount</strong> → Either works (difference is minimal)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Quick Checklist -->
          <div class="mb-12 rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
            <h3 class="text-xl font-bold text-neutral-900 mb-4">Quick Checklist: Test Both Methods in 60 Seconds</h3>
            <p class="text-sm text-neutral-700 leading-relaxed mb-4">
              This is the easiest "free win" in international transfers: the same provider can be cheap on bank funding and expensive on card funding. Test both to find the best deal.
            </p>
            <ol class="space-y-4 text-base text-neutral-700">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">1</span>
                <span>Build your transfer (same amount, same payout method, same recipient).</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">2</span>
                <span>Toggle <strong class="font-semibold text-neutral-900">bank funding</strong> and note: recipient gets + ETA + total cost.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">3</span>
                <span>Toggle <strong class="font-semibold text-neutral-900">debit card funding</strong> and note: recipient gets + ETA + total cost.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">4</span>
                <span>Compare the "recipient gets" amounts. The difference can be $20 to $50 on a $1,000 transfer.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">5</span>
                <span>Pick the method with the best tradeoff for that specific transfer. Consider both cost and speed.</span>
              </li>
            </ol>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white mb-12">
            <h2 class="text-2xl font-bold mb-4">
              Compare Both Funding Methods Side by Side
            </h2>
            <p class="text-lg text-white/90 mb-6 leading-relaxed">
              See live rates for bank funding and card funding from 30+ providers. Compare costs, speeds, and "recipient gets" amounts to find the best option for your specific transfer.
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
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Payment Method Playbook
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how payment and payout methods affect cost, speed, and safety.
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
              Understand what "recipient gets" means and how to compare quotes across different funding methods.
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
              Learn why funding method changes can make one provider cheaper than another for the same transfer.
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
  { name: 'Bank Transfer vs Card Funding', path: '/learn/bank-transfer-vs-card-funding' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Bank Transfer vs Card Funding: Which Is Cheaper (and When)? | Remit-Scout',
  description: 'Bank transfers can be cheaper but slower. Cards can be fast but often cost more. Learn how funding method changes your total cost, speed, and delivery time.',
  canonical: `${siteUrl}/learn/bank-transfer-vs-card-funding`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Bank Transfer vs Card Funding', url: `${siteUrl}/learn/bank-transfer-vs-card-funding` },
])
</script>
