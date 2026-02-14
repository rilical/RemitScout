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
            Promo Codes & <span class="text-brand-400">Intro Rates</span>
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            When <span class="font-bold text-brand-400">"Best Deal"</span> is real savings versus temporary marketing tactics. Here's how to tell the difference and use promos wisely.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-400">
            <span>8 min read</span>
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
                    Promotions: <span class="text-brand-600">Real Savings or Marketing Tactics?</span>
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                    Providers frequently offer promotions that make them appear like the best deal today—but won't be tomorrow. You'll see "first transfer free," "fee waivers," and "intro rates" that promise significant savings. Some are genuine value, while others are designed to hook you with a temporary discount before switching to less competitive standard rates.
                  </p>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    The key is understanding which promotions offer real savings, how long they last, and what happens after they expire. This knowledge helps you take advantage of legitimate deals while avoiding the trap of switching providers repeatedly just to chase one-time promos.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed mb-4">
                    Promos can be real savings, but they're temporary and often limited. Fee waivers don't fix FX markup, so still check "recipient gets" to see the actual cost. Use promos once for genuine savings, then compare standard rates for repeat transfers.
                  </p>
                  <p class="text-body-lg font-medium leading-relaxed">
                    First-transfer promos are usually legitimate deals worth taking advantage of. But don't assume the promo rate will last. After the promo expires, you'll pay standard rates, which may not be as competitive. Always compare standard rates, not just promo rates, when choosing a provider for regular transfers.
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
                          Promos are temporary
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Most promotions expire after your first transfer or within 30 days. Standard rates are what you'll pay long-term.
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
                          Check "recipient gets"
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Fee waivers don't fix FX markup. Always compare "recipient gets" to see the actual cost, not just fees.
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
                          Compare standard rates
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Don't chase one-time promos. Compare standard rates for repeat transfers to find providers with consistently good pricing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Types of Promos -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Types of <span class="text-brand-600">Promotions</span>
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8">
              Providers use different types of promotions to attract customers. Understanding what each type offers and their limitations helps you evaluate whether a promo is worth it.
            </p>
            <div class="grid md:grid-cols-3 gap-6 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  1
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  First-Transfer Promos
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Fee waivers or better rates exclusively for your first transfer. This is usually a real deal, but only applies once.
                </p>
                <div class="bg-surface rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm font-medium text-brand-600 mb-1">
                    Example
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    "First transfer free" means $0 fee on transfer #1, but standard $3.99 fee on transfer #2 and beyond.
                  </p>
                </div>
                <div class="mt-4 text-body-sm text-neutral-600">
                  <strong class="text-brand-600">Worth it?</strong> Yes, if you're a new customer. Use it for genuine savings.
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  2
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  Fee Waivers
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Temporary removal of transfer fees for a limited time or on specific corridors. Exchange rate typically stays the same.
                </p>
                <div class="bg-surface rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm font-medium text-brand-600 mb-1">
                    Example
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    "No fees for 30 days" means $0 transfer fee, but FX markup remains unchanged, so you still pay hidden costs.
                  </p>
                </div>
                <div class="mt-4 text-body-sm text-neutral-600">
                  <strong class="text-brand-600">Worth it?</strong> Partial savings. Check "recipient gets" to see if FX markup offsets the fee savings.
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  3
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  FX Rate Boosts
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Temporary improvements to exchange rates, such as "0% markup" or "mid-market rate" offers. These are real savings but expire after the promo period.
                </p>
                <div class="bg-surface rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm font-medium text-brand-600 mb-1">
                    Example
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    "0% markup for 30 days" means you get mid-market rate, saving typically 1-3% on FX costs. After 30 days, standard markup applies.
                  </p>
                </div>
                <div class="mt-4 text-body-sm text-neutral-600">
                  <strong class="text-brand-600">Worth it?</strong> Yes, if FX rate boosts are real (verify against mid-market rate).
                </div>
              </div>
            </div>
          </div>

          <!-- Limits & Eligibility -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Limits & <span class="text-brand-600">Eligibility</span>
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
              Most promotions come with restrictions and eligibility requirements. Understanding these limits helps you avoid disappointment when a promo doesn't apply to your transfer.
            </p>
            <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm mb-6">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                Common Promotion Limits
              </h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Amount limits
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Promos often apply only to transfers under $500 or $1,000. Larger amounts may be excluded or have reduced discount rates.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        New customers only
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Many promos are restricted to first-time users. Existing customers typically don't qualify, even if they haven't sent money in months.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Corridor restrictions
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Some promos only work for specific country pairs. A promo for US to Mexico may not apply to US to Philippines.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Time limits
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Must complete transfer within 7-30 days of signup or promo activation. Promos often expire if not used quickly.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Payment method
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        May only apply to bank transfers, not cards. Card-funded transfers sometimes have separate (or no) promo eligibility.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      6
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        One-time use
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Most first-transfer promos can only be used once per account. After using it, you're ineligible even if the promo period hasn't expired.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-brand-600 rounded-lg p-6 text-white">
              <h4 class="font-bold mb-2">
                How to Check Eligibility
              </h4>
              <ul class="space-y-2 text-body-sm">
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Read the fine print carefully before assuming a promo applies to your transfer</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Check the provider's terms and conditions for specific restrictions</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>Verify eligibility at checkout, not just in the quote tool (some promos only apply after login)</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>If unsure, contact customer support before initiating the transfer</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Why Rankings Change -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Why Rankings <span class="text-brand-600">Change</span> (Promos Expire)
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
              Provider rankings on comparison sites change frequently, and promotions are a major reason why. Understanding this helps you interpret rankings correctly and make better decisions.
            </p>
            <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-primary-50 p-8 lg:p-12 shadow-xl mb-6">
              <h3 class="text-h3 font-bold text-neutral-900 mb-4">
                Why Provider A May Be #1 Today and #5 Tomorrow
              </h3>
              <p class="text-body text-neutral-700 leading-relaxed mb-4">
                If Provider A offers a first-transfer promo that makes them the cheapest option today, they'll rank #1 in comparisons. But once that promo expires (or once you've used it), they'll drop in rankings because their standard rates aren't as competitive.
              </p>
              <p class="text-body text-neutral-700 leading-relaxed mb-4">
                This is why quote timestamps matter. A quote from yesterday may show a different ranking than today's quote—not because the comparison methodology changed, but because promos expired, new ones started, or exchange rates moved.
              </p>
              <div class="bg-surface rounded-lg p-5 border border-brand-200">
                <h4 class="font-bold text-neutral-900 mb-2">
                  Real Example
                </h4>
                <div class="space-y-2 text-body-sm text-neutral-700">
                  <p><strong>Monday:</strong> Provider X offers "first transfer free" promo → ranks #1</p>
                  <p><strong>Tuesday:</strong> You use the promo → Provider X's standard rates apply</p>
                  <p><strong>Wednesday:</strong> You check again → Provider X now ranks #5 because standard rates aren't competitive</p>
                  <p><strong>Thursday:</strong> Provider Y launches new promo → Provider Y now ranks #1</p>
                </div>
              </div>
            </div>
          </div>

          <!-- How Remit-Scout Handles Promos -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              How We <span class="text-brand-600">Handle Promos</span> (Quote Timestamps)
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
              Every quote we show includes a timestamp indicating when it was captured. This transparency helps you understand when the quote was generated, whether promos were active, and how rates change over time.
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  When the quote was generated
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed mb-3">
                  Fresh quotes (within 15 minutes) are more reliable than older ones. Exchange rates move continuously, and promos can expire at any time.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200 text-body-sm text-neutral-600">
                  <strong>Tip:</strong> Always check the timestamp. A 2-hour-old quote may no longer reflect current rates or active promos.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Whether promos were active
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed mb-3">
                  If a quote shows a great rate, check the timestamp to see if it's from a promo period. Compare with current quotes to see if the promo is still active.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200 text-body-sm text-neutral-600">
                  <strong>Tip:</strong> If the current quote is much worse, the promo may have expired.
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Rate movement over time
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed mb-3">
                  Compare quotes from different times to see how rates and rankings change. This helps you spot trends and understand provider consistency.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200 text-body-sm text-neutral-600">
                  <strong>Tip:</strong> Providers with stable rankings (even without promos) are often better for repeat transfers.
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

          <!-- How to Use Promos Wisely -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              How to Use Promos <span class="text-brand-600">Wisely</span>
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
              Promotions can offer real savings, but only if used strategically. Here's a practical guide to maximizing promo value while avoiding common pitfalls.
            </p>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div class="rounded-xl border-2 border-brand-300 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  Do's
                </h3>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Take advantage of first-transfer promos
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        If you're a new customer, first-transfer promos are usually real savings. Use them for genuine cost reduction on your initial transfer.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Check standard rates for repeat transfers
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Don't assume the promo rate will last. Check what you'll pay on transfer #2, #3, and beyond. Compare standard rates, not just promo rates.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Verify "recipient gets" with promos
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Fee waivers don't fix FX markup. Always compare "recipient gets" to see the actual cost, not just the fee. A $0 fee with bad FX markup can still be expensive.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Time large transfers with promos
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        If you have a large transfer planned, use a promo for maximum savings. Larger amounts benefit more from fee waivers and rate boosts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-danger-600 bg-danger-600 p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  Don'ts
                </h3>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-danger-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✗
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Don't switch providers just for promos
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        If you send money regularly, a provider with consistently good standard rates is better than chasing one-time promos. Switching repeatedly creates hassle and may not save money long-term.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-danger-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✗
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Don't assume promos stack
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Most providers don't allow multiple promos on the same transfer. Read terms carefully to understand what combinations are allowed.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-danger-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✗
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Don't ignore standard rates
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        A great promo doesn't mean a great provider. Always check standard rates to see what you'll pay after the promo expires. This is especially important for regular transfers.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-lg bg-danger-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0 mt-0.5">
                      ✗
                    </div>
                    <div>
                      <h4 class="font-bold text-neutral-900 mb-1">
                        Don't wait too long to use promos
                      </h4>
                      <p class="text-body-sm text-neutral-700">
                        Most promos expire within 7-30 days. If you sign up for a promo, use it before it expires. Don't delay your transfer just to keep the promo available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-World Strategy -->
          <div class="mb-12 rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 lg:p-10 text-white shadow-xl">
            <h2 class="text-h3 font-bold mb-4">
              A Practical <span class="text-brand-200">Promo Strategy</span>
            </h2>
            <p class="text-body-lg text-white/90 leading-relaxed mb-6">
              Here's a smart approach to using promos without getting trapped in a cycle of provider switching:
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="bg-surface/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div class="w-10 h-10 rounded-lg bg-surface text-brand-600 flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 class="font-bold text-body-lg mb-3">
                  For Your First Transfer
                </h3>
                <p class="text-body-sm text-white/90 leading-relaxed">
                  Use the best first-transfer promo available. This is legitimate savings, so take advantage of it. But while you're at it, check what the standard rates will be for future transfers.
                </p>
              </div>
              <div class="bg-surface/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div class="w-10 h-10 rounded-lg bg-surface text-brand-600 flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 class="font-bold text-body-lg mb-3">
                  For Regular Transfers
                </h3>
                <p class="text-body-sm text-white/90 leading-relaxed">
                  Compare standard rates across providers (ignore promos for this comparison). Find 2-3 providers with consistently good rates for your corridor and stick with them.
                </p>
              </div>
              <div class="bg-surface/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div class="w-10 h-10 rounded-lg bg-surface text-brand-600 flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 class="font-bold text-body-lg mb-3">
                  For Large Transfers
                </h3>
                <p class="text-body-sm text-white/90 leading-relaxed">
                  If you have a large transfer planned ($1,000+), compare both promos and standard rates. A promo on a large transfer can save $50-100, making it worth considering even if you don't usually use promos.
                </p>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-brand-600 p-8 lg:p-12 text-white mb-12">
            <h2 class="text-h3 font-bold mb-4">
              Compare Live Rates with Promos Included
            </h2>
            <p class="text-body-lg text-white/90 mb-6 leading-relaxed">
              See current rates from 30+ providers, including active promotions. Compare both promo rates and standard rates to find the best deal for your first transfer and beyond.
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
            to="/learn/why-checkout-price-differs"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Why Checkout Price Can Differ
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Promos are one reason final amounts may differ from quotes. Learn what else causes differences.
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
              Rankings change as promos expire and new ones start. Here's why you should compare every time.
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
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group flex flex-col rounded-2xl border border-white/20 bg-surface/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-surface/15 hover:-translate-y-1"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Fee waivers don't fix FX markup. Learn how to spot hidden costs even with promos.
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
import CompareWidget from '~/components/shared/CompareWidget.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Promotions', path: '/learn/promo-codes-intro-rates' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'Promo Codes & Intro Rates: When Best Deal Is Real (and When Temporary) | Remit-Scout'
const seoDescription = 'Learn how promotions work, why rankings change, and how to use promo codes wisely. Understand first-transfer promos, fee waivers, FX rate boosts, and limits.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '8 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/promo-codes-intro-rates`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Promotions', url: `${siteUrl}/learn/promo-codes-intro-rates` },
])
</script>
