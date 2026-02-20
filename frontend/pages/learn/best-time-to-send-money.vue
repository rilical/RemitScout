<template>
  <div class="min-h-screen bg-surface">

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div class="relative mx-auto max-w-page px-page-x">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-white/10 px-4 py-2 text-body-sm font-semibold text-white shadow-md mb-6">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Money Transfer Basics
          </div>
          <h1 class="text-hero font-bold tracking-tight text-white mb-6">
            When's the <span class="text-brand-600">Best Time</span> to Send Money?
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed [text-wrap:balance]">
            How to use rate history and alerts to get a better rate — without guessing.
          </p>
          <p class="text-body-lg text-neutral-300 leading-relaxed mb-6 max-w-3xl [text-wrap:pretty]">
            Exchange rates move every day. A rate that looks good today could be worse tomorrow, or better next week. The key isn't to predict rates — it's to set a target, use alerts, and send when conditions align with your needs.
          </p>
          <div class="flex items-center gap-4 text-body-sm text-neutral-400">
            <span>9 min read</span>
            <span>•</span>
            <span>Updated February 2025</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="prose prose-lg max-w-none">

          <!-- Quick Takeaways -->
          <div class="mb-16 rounded-3xl border-2 border-brand-200 bg-surface p-8 lg:p-10 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 class="text-h3 font-bold text-neutral-900">
                Quick Takeaways
              </h2>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    1
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    Rates move daily. Timing only helps if you act on a plan — not guesses.
                  </p>
                </div>
              </div>
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    2
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    Set a target rate based on recent history, then let alerts notify you.
                  </p>
                </div>
              </div>
              <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                    3
                  </div>
                  <p class="text-body text-neutral-700 leading-relaxed">
                    When money is urgent, send it. Rate timing should never delay an essential transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Ad Slot -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- How Rates Move -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                How Exchange Rates Move Day to Day
              </h2>
            </div>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl [text-wrap:pretty]">
              Currency exchange rates are set by global markets and fluctuate continuously based on economic conditions, trade flows, and investor sentiment. For remittance corridors, daily swings of 0.5–2% are common, and larger swings of 3–5% can happen during economic events or policy announcements.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-8">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  What moves rates short-term
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="text-neutral-900">Central bank decisions</strong> — interest rate changes by the Fed, ECB, or local central banks cause the biggest single-day moves.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="text-neutral-900">Inflation reports</strong> — higher-than-expected inflation often weakens a currency relative to others.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="text-neutral-900">Political events</strong> — elections, trade negotiations, or geopolitical instability can move rates unexpectedly.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span><strong class="text-neutral-900">Market liquidity</strong> — rates can move more sharply on weekends or public holidays when fewer banks are trading.</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  What this means for your transfer
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>A 1% rate difference on a $1,000 transfer equals $10 more or less delivered. On $2,000, that's $20.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Rate differences compound if you send monthly. A consistently 0.5% better rate over 12 months adds up meaningfully.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>For small transfers (under $200), timing matters less — fees and provider differences have a bigger impact than daily rate movement.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>For larger transfers ($1,000+), a 1–2% better rate can offset weeks of waiting — if you have the flexibility.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-7 shadow-sm">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                Rate timing vs provider choice: which matters more?
              </h3>
              <p class="text-body text-neutral-700 leading-relaxed mb-4 [text-wrap:pretty]">
                Choosing the right provider typically makes a bigger difference than rate timing. A provider with a 1.5% lower FX markup applied on every transfer — every month — beats waiting a week for a 0.5% rate improvement on a single transfer.
              </p>
              <p class="text-body text-neutral-700 leading-relaxed">
                Rate timing is a secondary optimization. Get the provider right first, then refine with timing. Never delay an essential transfer waiting for a better rate from an inferior provider.
              </p>
            </div>
          </div>

          <!-- Reading Rate History -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                How to Read Rate History
              </h2>
            </div>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl [text-wrap:pretty]">
              Rate history shows you the range a corridor has traded in over a given period. The goal is to identify a reasonable target — not the absolute peak, which is unpredictable — and set an alert for when rates approach that level.
            </p>
            <div class="grid gap-6 lg:grid-cols-3 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Look at 30-day range
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Find the highest and lowest mid-market rate over the past 30 days. Your target should sit in the upper 30% of that range — achievable but better than average.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Identify the trend
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Is the rate trending up (favorable) or down (unfavorable) for you? If it's trending unfavorably, waiting may cost more. If it's trending your way, a slightly delayed transfer could be worth it.
                </p>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Set a reasonable deadline
                </h3>
                <p class="text-body-sm text-neutral-700 leading-relaxed">
                  Give yourself a 7–14 day window. If the target rate isn't reached by your deadline, send at the current rate. Rates don't always cooperate, and delays have real cost for recipients.
                </p>
              </div>
            </div>
            <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-7 shadow-sm">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                A practical example: USD to MXN
              </h3>
              <p class="text-body text-neutral-700 leading-relaxed mb-4">
                If USD to MXN has ranged between 18.20 and 18.70 over the past 30 days, the average is roughly 18.45. A reasonable target would be 18.55 or higher — that's in the upper third of the range without aiming for the absolute peak.
              </p>
              <p class="text-body text-neutral-700 leading-relaxed">
                On a $500 transfer, the difference between 18.20 and 18.55 is 175 MXN (approximately $9.50). That's a meaningful improvement — and it's realistic to hit within a 2-week window in a normal market.
              </p>
            </div>
          </div>

          <!-- When to Wait vs When to Send -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                When to Wait vs When to Send Now
              </h2>
            </div>
            <div class="grid gap-6 md:grid-cols-2 mb-8">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  Send now — don't wait
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>The money is for an emergency, rent, tuition, or medical expenses</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>The current rate is within 0.5% of recent average — the gain from waiting is marginal</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>The rate is trending unfavorably — waiting may result in a worse rate</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>You're sending a small amount (under $200) — rate differences are negligible at this size</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>You've already waited more than 2 weeks and the target hasn't been reached</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-xl border-2 border-danger-200 bg-danger-50 p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  Consider waiting — if you have flexibility
                </h3>
                <ul class="space-y-3 text-body-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-danger-600 mt-1">•</span>
                    <span>The current rate is 1–2% below recent highs and you can wait 7–14 days safely</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-danger-600 mt-1">•</span>
                    <span>The rate has been trending favorably and recent movement suggests continuation</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-danger-600 mt-1">•</span>
                    <span>You're sending a larger amount ($1,000+) where the rate difference has meaningful dollar value</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-danger-600 mt-1">•</span>
                    <span>You have a specific target rate set and an alert configured — you're not checking constantly</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-danger-600 mt-1">•</span>
                    <span>The recipient confirms they don't need the money urgently</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Don't Day Trade -->
          <div class="mb-16 rounded-3xl border-2 border-warning-200 bg-warning-50 p-8 lg:p-12 shadow-xl">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 rounded-2xl bg-warning-100 border-2 border-warning-200 flex items-center justify-center shadow-sm">
                  <ExclamationTriangleIcon class="h-8 w-8 text-warning-600" />
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-h2 font-bold text-neutral-900 mb-4">
                  Don't Day-Trade Your Transfers
                </h2>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-5 [text-wrap:pretty]">
                  Trying to time the perfect rate consistently fails. Rates move in both directions without warning, and waiting for a slightly better rate often means missing a perfectly good one. More critically: if your recipient is counting on the money, delay has real human cost that no rate improvement compensates for.
                </p>
                <p class="text-body-lg text-neutral-700 leading-relaxed mb-5 [text-wrap:pretty]">
                  Rate timing is a secondary optimization — not a primary strategy. Checking rates obsessively or changing your provider to chase a marginally better rate on a single transfer costs you time and increases the risk of errors.
                </p>
                <div class="rounded-xl bg-surface border-2 border-warning-200 p-5">
                  <p class="text-body font-bold text-neutral-900 mb-1">
                    Better approach:
                  </p>
                  <p class="text-body text-neutral-700">
                    Set a realistic target rate, configure an alert, and go back to your normal life. If the alert fires, great — send then. If not, send when you need to.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Practical 3-Step Strategy -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                The 3-Step Rate Timing Strategy
              </h2>
            </div>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl [text-wrap:pretty]">
              This is the approach that actually works for regular senders. It takes less than five minutes to set up and removes the need to watch rates constantly.
            </p>
            <div class="grid gap-6 lg:grid-cols-3">
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  1
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Set a Target Rate
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Look at the mid-market rate history for your corridor over the past 30 days. Find the upper third of that range — a rate that's been hit at least a few times recently, not just a once-off spike.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-neutral-900">Example:</strong> If USD to MXN ranged 18.20–18.70 last month, a target of 18.50 is realistic. Aiming for 18.75 is unlikely to be hit without a major market event.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  2
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Set Up Rate Alerts
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-5">
                  Configure an alert for your target rate so you're notified when conditions are right — instead of checking rates manually every day. This removes the psychological stress of watching markets and eliminates impulsive decisions.
                </p>
                <NuxtLink
                  to="/pulse"
                  class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-body-sm font-semibold text-white shadow-md hover:bg-brand-700 motion-safe:transition-all w-full justify-center"
                >
                  Set Rate Alerts on Pulse
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
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-h4 mb-4">
                  3
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Set a Deadline and Stick to It
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Decide in advance: if the target rate isn't hit within 14 days, you send anyway at the current rate. This prevents indefinite waiting and removes the temptation to keep pushing the deadline.
                </p>
                <p class="text-body text-neutral-700 leading-relaxed">
                  A good rate reached in 7 days is better than a perfect rate you're still waiting for at day 30.
                </p>
              </div>
            </div>
          </div>

          <!-- What Drives Your Corridor Rate -->
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <svg
                  class="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 class="text-h2 font-bold text-neutral-900">
                What Drives Rates on Common Corridors
              </h2>
            </div>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8 max-w-3xl [text-wrap:pretty]">
              Each currency pair has its own volatility profile. Some corridors are relatively stable; others swing more dramatically. Knowing your corridor's typical behavior helps you set realistic targets and avoid chasing outlier rates.
            </p>
            <div class="grid gap-6 lg:grid-cols-2 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-body-sm font-bold text-brand-600">MX</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD to MXN (Mexican Peso)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  USD/MXN is moderately volatile. Weekly moves of 1–2% are common, with larger swings during US employment reports, Fed rate decisions, or Mexican political events. The pair is sensitive to US-Mexico trade relations.
                </p>
                <div class="bg-brand-50 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Timing strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    If you send $500 monthly, waiting for a 0.30 MXN better rate (e.g., 18.50 vs 18.20) delivers around 150 MXN more — roughly $8. Set an alert and a 10-day window.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-body-sm font-bold text-brand-600">PH</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD to PHP (Philippine Peso)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  PHP can be more volatile during remittance-heavy periods — especially around Christmas, New Year, and mid-month payroll cycles. Rates sometimes improve slightly mid-month as demand patterns shift.
                </p>
                <div class="bg-brand-50 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Timing strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    Sending around the 15th–20th of the month tends to avoid peak demand. A 0.5–1% improvement is realistic with a 2-week window on a stable month.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-body-sm font-bold text-brand-600">IN</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD to INR (Indian Rupee)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  INR is managed by the Reserve Bank of India, which intervenes to limit extreme volatility. Daily moves are smaller than MXN or PHP — typically 0.2–0.5%. This makes rate timing less impactful but also more predictable.
                </p>
                <div class="bg-brand-50 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Timing strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    For INR, provider choice matters more than timing. Focus on finding the lowest-markup provider rather than trying to time a corridor that moves slowly by design.
                  </p>
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-surface p-7 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-body-sm font-bold text-brand-600">NG</span>
                  </div>
                  <h3 class="text-h4 font-bold text-neutral-900">
                    USD to NGN (Nigerian Naira)
                  </h3>
                </div>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  NGN is highly volatile. Policy changes, FX controls, and black-market rate dynamics create significant rate differences across providers. The official vs parallel market gap can make provider selection the dominant factor.
                </p>
                <div class="bg-brand-50 rounded-xl border border-brand-200 p-5">
                  <p class="text-body-sm font-semibold text-neutral-900 mb-2">
                    Timing strategy:
                  </p>
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    For NGN, compare providers rigorously on every transfer. Rate swings can be large and unpredictable — focus on finding who gives the best rate today, not when the best rate will occur.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Ad Slot -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Using Pulse -->
          <div
            v-if="pulseEnabled"
            class="mb-16 rounded-3xl border-2 border-neutral-700 bg-neutral-900 p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden"
          >
            <div class="relative">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M22 12h-4l-3 9L9 3l-3 9H2"
                    />
                  </svg>
                </div>
                <h2 class="text-h2 font-bold">
                  Track Rate History with Pulse
                </h2>
              </div>
              <p class="text-body-lg text-white/90 leading-relaxed mb-4 max-w-2xl [text-wrap:pretty]">
                Remit-Scout Pulse shows provider rate trends over time — not just today's snapshot. See how rates have moved over the past week, month, or quarter for your corridor, and set alerts directly from the chart when a target rate level is reached.
              </p>
              <p class="text-body-lg text-white/90 leading-relaxed mb-8 max-w-2xl [text-wrap:pretty]">
                Instead of checking manually or guessing when rates improve, Pulse does the watching for you. Alerts are sent when your corridor crosses the threshold you set — so you send when conditions are right, not when it's convenient to check.
              </p>
              <NuxtLink
                to="/pulse"
                class="inline-flex items-center gap-2 rounded-xl bg-surface px-8 py-4 text-body font-semibold text-brand-600 shadow-xl hover:bg-neutral-50 hover:shadow-2xl motion-safe:transition-all"
              >
                Explore Pulse
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

          <!-- Bottom Line -->
          <div class="mb-16">
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div class="flex flex-col h-full">
                <div class="mb-8">
                  <h2 class="text-h2 font-bold text-neutral-900 mb-4 leading-tight">
                    Rate Timing Done Right
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                    Timing exchange rates effectively means combining a realistic target, a configured alert, and a firm send deadline. It's a one-time 5-minute setup — not an ongoing habit of checking rates.
                  </p>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    The biggest mistake senders make is treating rate timing as a primary strategy and delaying urgent transfers waiting for perfect conditions. Rates rarely cooperate with urgency. Set the target, set the alert, and set a deadline.
                  </p>
                </div>
                <div class="flex-1 rounded-2xl bg-neutral-900 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed mb-4">
                    Choosing the right provider is more important than timing. A provider with 1% lower markup on every transfer beats waiting for a 0.5% rate improvement once.
                  </p>
                  <p class="text-body-lg font-medium leading-relaxed">
                    If you send regularly, combine both: find the best provider first, then use Pulse to set a rate alert for each transfer. That's the complete strategy.
                  </p>
                </div>
              </div>
              <div class="rounded-3xl border-2 border-brand-200 bg-brand-50 p-8 lg:p-10 shadow-xl">
                <h3 class="text-h4 font-bold text-neutral-900 mb-6">
                  Quick Reference
                </h3>
                <div class="grid gap-4">
                  <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Choose your provider first
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Use Remit-Scout to compare "recipient gets" across providers for your amount and corridor before anything else.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Set a target in the upper third of recent range
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Realistic targets get hit. Ambitious targets cause you to miss good rates waiting for great ones.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Set a 7–14 day send deadline
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          If the target isn't hit, send at the current rate. Recipients don't benefit from rates you're still waiting for.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl bg-surface border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Urgent transfers always go now
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          No rate improvement justifies delaying money someone urgently needs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            v-if="pulseEnabled"
            to="/pulse"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              Pulse: Rate Trends
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed flex-1 mb-3">
              Track exchange rate history and set alerts for your target rate.
            </p>
            <span class="text-body-sm font-semibold text-white/70 group-hover:text-white motion-safe:transition-colors">Read guide →</span>
          </NuxtLink>
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed flex-1 mb-3">
              Understand how FX markup works and why a "no fee" transfer can still cost you.
            </p>
            <span class="text-body-sm font-semibold text-white/70 group-hover:text-white motion-safe:transition-colors">Read guide →</span>
          </NuxtLink>
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3">
              Why Compare Every Transfer
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed flex-1 mb-3">
              Rate timing is one factor — provider choice matters more. Here's why.
            </p>
            <span class="text-body-sm font-semibold text-white/70 group-hover:text-white motion-safe:transition-colors">Read guide →</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { setSeo, jsonLdBreadcrumb } from '~/composables/useSeo'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/learn' },
  { name: 'Best Time to Send Money', path: '/learn/best-time-to-send-money' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'When\'s the Best Time to Send Money? Using Exchange Rate History + Alerts | Remit-Scout'
const seoDescription = 'Learn how to time your transfers using rate history and alerts. Practical strategies for monthly senders without day-trading your remittances.'

defineOgImage({
  component: 'OgImageArticle',
  props: {
    title: seoTitle.replace(/\s*\|\s*Remit-Scout\s*$/, ''),
    category: 'Learn',
    readTime: '9 min read',
  },
})

setSeo({
  title: seoTitle,
  description: seoDescription,
  canonical: `${siteUrl}/learn/best-time-to-send-money`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Best Time to Send', url: `${siteUrl}/learn/best-time-to-send-money` },
])
</script>
