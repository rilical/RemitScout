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
            Choose the Right <span class="text-brand-400">Delivery Method</span>
          </h1>
          <p class="text-xl text-slate-300 sm:text-2xl font-medium mb-6 leading-relaxed">
            Bank Deposit vs Cash Pickup vs Mobile Money: The payout method changes price, speed, and success rate. Here's how to pick the best option for your recipient.
          </p>
          <p class="text-lg text-slate-300 leading-relaxed mb-6">
            When people say a provider is "fast" or "cheap," they're often describing a specific payout method. In international transfers, the delivery method isn't a detail—it's the product. Picking the wrong delivery method is one of the fastest ways to get delays, failures, or unnecessary costs.
          </p>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span>10 min read</span>
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
                    Why Delivery Method <span class="text-brand-600">Matters</span>
                  </h2>
                  <p class="text-lg text-neutral-700 leading-relaxed mb-4">
                    Your choice of delivery method (how your recipient receives the money) dramatically affects cost, speed, and success rate. Bank deposit favors convenience, cash pickup favors access, and mobile money favors instant delivery. Understanding these tradeoffs helps you avoid common mistakes that lead to failed payouts or unnecessary costs.
                  </p>
                  <p class="text-lg text-neutral-700 leading-relaxed">
                    The same provider can offer different rates, fees, and speeds depending on whether you choose bank deposit, cash pickup, or mobile money. Accuracy of recipient details is critical for every method, but the requirements differ. This guide helps you match the delivery method to your recipient's real-world needs.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-2xl mb-4">The Bottom Line</h3>
                  <p class="text-lg font-medium leading-relaxed mb-4">
                    Delivery method changes speed, cost, and success rates more than most people expect. Bank deposit favors convenience, cash pickup favors access, and mobile money favors instant delivery. Accuracy of recipient details is critical for every method.
                  </p>
                  <p class="text-lg font-medium leading-relaxed">
                    Always compare providers using the same delivery method to get accurate results. The safest comparison method is to compare on "recipient gets" using the same payout method. Different methods have different pricing structures, so mixing methods gives misleading results.
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
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Bank deposit</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Best for convenience and recipients with bank accounts. Often lowest cost but slower (1 to 3 business days).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Cash pickup</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Best for speed and accessibility. Great for unbanked recipients. Fast (15 minutes to 24 hours) but requires exact name match.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">Mobile money</h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Best for instant delivery in supported corridors. Often minutes-level speed, great for recipients who use mobile wallets regularly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Three Common Methods -->
          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              The Three Common <span class="text-brand-600">Delivery Methods</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-8">
              Most international money transfers use one of three delivery methods. Each has different tradeoffs for cost, speed, accessibility, and reliability. Understanding these helps you choose the right option for each transfer.
            </p>
            <div class="grid md:grid-cols-3 gap-6 mb-8">
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-3">Bank Deposit</h3>
                <p class="text-sm text-neutral-700 mb-4">
                  Money is sent directly to the recipient's bank account. This is the traditional method for international transfers.
                </p>
                <div class="bg-white rounded-lg p-4 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-brand-600">Speed:</strong> 1 to 3 business days<br>
                    <strong class="text-brand-600">Cost:</strong> Usually lowest<br>
                    <strong class="text-brand-600">Access:</strong> Requires bank account
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-3">Cash Pickup</h3>
                <p class="text-sm text-neutral-700 mb-4">
                  Recipient collects cash from an agent location (Western Union, Xoom, etc.). Widely available worldwide.
                </p>
                <div class="bg-white rounded-lg p-4 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-brand-600">Speed:</strong> 15 minutes to 24 hours<br>
                    <strong class="text-brand-600">Cost:</strong> Slightly higher<br>
                    <strong class="text-brand-600">Access:</strong> No bank account needed
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-3">Mobile Money</h3>
                <p class="text-sm text-neutral-700 mb-4">
                  Money is sent to a mobile wallet (M-Pesa, Mobile Money, Airtel Money, etc.). Popular in Africa and parts of Asia.
                </p>
                <div class="bg-white rounded-lg p-4 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-brand-600">Speed:</strong> Minutes to 2 hours<br>
                    <strong class="text-brand-600">Cost:</strong> Varies by corridor<br>
                    <strong class="text-brand-600">Access:</strong> Requires smartphone and wallet
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Deposit -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Bank Deposit: Best for <span class="text-brand-600">Convenience</span> (When Details Are Correct)
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Bank deposits send money directly to the recipient's bank account. This is the most traditional method and works well when the recipient has reliable bank access and you have accurate account details.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Convenient for recipients with stable bank access (no pickup needed)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Often good value (can be competitive on fees and FX rates)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Lower in-person friction (money appears in account automatically)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Good for large amounts (fewer limits than mobile wallets)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Most secure method (direct deposit, less fraud risk)</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Can be bank-timed (hours to days, depends on banking systems)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Sensitive to account detail accuracy (wrong number = failed transfer)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Some receiving banks may deduct fees (varies by bank and country)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Requires recipient to have a bank account</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Weekends and holidays can add delays (banking hours apply)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
              <h3 class="text-lg font-bold text-neutral-900 mb-3">Best When</h3>
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                Recipient has a reliable bank account and you don't need instant cash. Ideal for regular transfers, large amounts, and cost optimization.
              </p>
              <div class="bg-white rounded-lg p-4 border border-brand-200">
                <h4 class="font-bold text-neutral-900 mb-2">Avoid Mistakes</h4>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Double-check account number or IBAN (one wrong digit = failure)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Verify bank name and routing codes match exactly</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Confirm recipient name matches the account holder name</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Check if the account accepts the currency you're sending</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>For first-time transfers, consider sending a small test amount first</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Cash Pickup -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Cash Pickup: Best for <span class="text-brand-600">Speed + Accessibility</span> (But Detail Sensitive)
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Cash pickup allows recipients to collect money from agent locations. This method is fast, widely available, and doesn't require bank accounts, making it ideal for urgent transfers and recipients without banking access.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Great for unbanked recipients (no bank account needed)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Often fast once transfer is available (15 minutes to 24 hours)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Recipients can choose a nearby location (thousands of locations worldwide)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>24/7 availability at many locations</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Immediate cash access (no waiting for bank processing)</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Requires correct legal name that matches ID exactly</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Pickup hours and agent availability matter (not all locations are 24/7)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Higher fraud risk if sent to wrong person (harder to reverse)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Can be pricier than bank deposit in some corridors</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Recipient must physically visit location (inconvenient for some)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
              <h3 class="text-lg font-bold text-neutral-900 mb-3">Best When</h3>
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                Recipient needs cash quickly and has valid ID. Ideal for urgent needs, recipients without bank accounts, and maximum accessibility.
              </p>
              <div class="bg-white rounded-lg p-4 border border-brand-200">
                <h4 class="font-bold text-neutral-900 mb-2">Avoid Mistakes</h4>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Ensure name matches ID exactly (middle names, accents, spelling, order all matter)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Confirm pickup location and hours before sending</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Share the reference number (MTCN) securely with recipient</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Recipient must bring valid government ID (passport, national ID, driver's license)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Verify recipient has access to a pickup location nearby</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Mobile Money -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Mobile Money: Best for <span class="text-brand-600">Instant Delivery</span> in Supported Corridors
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Mobile money sends funds directly to a mobile wallet. This method is fastest and most accessible in regions where mobile money is widely adopted, particularly Africa and parts of Asia.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Pros</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Often minutes-level speed (15 minutes to 2 hours typically)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Great for recipients who rely on mobile wallets for daily spending</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Can reduce physical pickup friction (money appears on phone)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>24/7 availability (no banking hours restrictions)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Good for rural areas where bank branches are far away</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Cons</h3>
                <ul class="space-y-3 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Requires correct wallet number and sometimes the right network</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Recipient may face cash-out fees (wallet provider dependent)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Limits and KYC rules can block large transfers</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Not available in all countries or corridors</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-600 mt-1">•</span>
                    <span>Recipient needs smartphone and active wallet account</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
              <h3 class="text-lg font-bold text-neutral-900 mb-3">Best When</h3>
              <p class="text-base text-neutral-700 leading-relaxed mb-3">
                Recipient actively uses mobile money and your corridor supports it reliably. Ideal for instant delivery needs, rural recipients, and regions where mobile money is dominant.
              </p>
              <div class="bg-white rounded-lg p-4 border border-brand-200">
                <h4 class="font-bold text-neutral-900 mb-2">Avoid Mistakes</h4>
                <ul class="space-y-2 text-sm text-neutral-700">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Verify wallet provider or network (M-Pesa, Airtel Money, etc.)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Confirm phone number format matches wallet requirements</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Check if wallet is active and verified (some require KYC for large amounts)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Check daily withdrawal limits (may restrict large transfers)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Verify the corridor supports mobile money (not all do)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- How Delivery Method Changes Price -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-12 shadow-xl">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              How Delivery Method <span class="text-brand-600">Changes Price</span>
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Even with the same provider, different delivery methods can have different pricing structures. Understanding this helps you compare accurately and avoid overpaying.
            </p>
            <div class="grid md:grid-cols-3 gap-6 mb-6">
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Bank Deposit</h3>
                <ul class="space-y-2 text-sm text-neutral-700 mb-4">
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Often best FX rate (lower markup)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>Lower fees (often $0 to $3)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-brand-600 mt-1">•</span>
                    <span>May have receiving bank fees (check with recipient)</span>
                  </li>
                </ul>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Cost optimization, large amounts
                  </p>
                </div>
              </div>
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Cash Pickup</h3>
                <ul class="space-y-2 text-sm text-neutral-700 mb-4">
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-1">•</span>
                    <span>Higher fees than bank deposit (often $5 to $15 more)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-1">•</span>
                    <span>FX rate may be slightly worse</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 mt-1">•</span>
                    <span>No receiving fees (money is cash)</span>
                  </li>
                </ul>
                <div class="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Tradeoff:</strong> Higher cost for speed and access
                  </p>
                </div>
              </div>
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Mobile Money</h3>
                <ul class="space-y-2 text-sm text-neutral-700 mb-4">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-1">•</span>
                    <span>Pricing varies by corridor</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-1">•</span>
                    <span>May be cheapest for small amounts</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 mt-1">•</span>
                    <span>Recipient may pay cash-out fees</span>
                  </li>
                </ul>
                <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Check:</strong> Compare total cost including cash-out fees
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-brand-600 rounded-lg p-6 text-white">
              <h4 class="font-bold mb-2">The Key Rule</h4>
              <p class="text-sm leading-relaxed">
                The safest comparison method is: compare on "recipient gets" using the same payout method. Bank deposit might have a better FX rate than cash pickup, and cash pickup might have higher fees. Mobile money might be cheapest for small amounts but limited for large ones. Always compare like with like.
              </p>
            </div>
          </div>

          <div class="my-10">
            <AdSlot placement="blog_inline" wrapper-class="rounded-xl" min-height="120px" />
          </div>


          <!-- Decision Framework -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              A Decision <span class="text-brand-600">Framework</span> (Simple and Reliable)
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              Use these three questions to choose the right delivery method for each transfer. This framework helps you match the method to your recipient's actual needs rather than assumptions.
            </p>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">1</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">What Does the Recipient Actually Want?</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  Some recipients prefer cash in hand. Others prefer bank deposit for convenience. Don't assume what they want—ask. Understanding their preference and circumstances helps you choose the right method.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                  <p class="text-sm text-neutral-700">
                    <strong class="text-brand-600">Consider:</strong> Do they need cash immediately? Do they have a bank account? Do they use mobile money regularly? Are they in a rural area with limited banking access?
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">2</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">How Urgent Is It?</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  Urgency determines which methods are viable. If you need money delivered in minutes, mobile money or cash pickup are your options. If you can wait a few days, bank deposit might offer better value.
                </p>
                <div class="grid md:grid-cols-3 gap-4">
                  <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-bold text-brand-600 mb-2">Minutes</p>
                    <p class="text-xs text-neutral-700">Mobile money or cash pickup (if available)</p>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p class="text-sm font-bold text-blue-600 mb-2">Same Day/Next Day</p>
                    <p class="text-xs text-neutral-700">Depends on corridor and funding method</p>
                  </div>
                  <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p class="text-sm font-bold text-purple-600 mb-2">Flexible</p>
                    <p class="text-xs text-neutral-700">Bank deposit can be best value</p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">3</div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">How Confident Are You in the Details?</h3>
                <p class="text-base text-neutral-700 leading-relaxed mb-4">
                  Different methods have different accuracy requirements. If you're not 100% sure about bank details, cash pickup may reduce "wrong account" risk—assuming the recipient name and ID match.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                  <ul class="space-y-2 text-sm text-neutral-700">
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span><strong>Bank deposit:</strong> Requires exact account number, routing codes, and name match</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span><strong>Cash pickup:</strong> Requires exact name match with ID, but no account details</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span><strong>Mobile money:</strong> Requires correct phone number and wallet provider</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Failed Payout Mistakes -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Common <span class="text-brand-600">"Failed Payout"</span> Mistakes (and How to Prevent Them)
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              These mistakes cause most failed payouts. Understanding and preventing them saves time, money, and frustration. Each delivery method has specific requirements that, if not met, will cause the transfer to fail.
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Name Mismatch (Cash Pickup)</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  The recipient's name must match their ID exactly. Even small differences (middle name, accent, spelling variation, name order) can prevent pickup.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Use the recipient's legal name exactly as it appears on their government ID. Include middle names if on ID. Check spelling and accents carefully.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Wrong Wallet Network (Mobile Money)</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Some countries have multiple wallet systems (e.g., M-Pesa vs Airtel Money in Kenya). The phone number must match the correct network.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Confirm which wallet provider the phone number belongs to. Verify the number format is correct for that network.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Wrong Bank Code/Account Format (Bank Deposit)</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Each country has specific account number formats and routing codes. Using the wrong format (e.g., wrong IBAN length, incorrect SWIFT code) will cause failure.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Use the exact format required for that country. Verify IBAN, SWIFT, or routing codes with the recipient's bank. One wrong digit fails the transfer.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Recipient Can't Receive That Currency</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Some accounts only accept local currency. Sending USD to an account that only accepts pesos will fail or cause issues.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Confirm with the recipient what currency their account accepts. Most providers can convert, but verify this before sending.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Recipient Isn't Registered/Verified</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Mobile wallets may require KYC (Know Your Customer) verification before receiving larger amounts. Unverified wallets may have low limits or reject transfers.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Check if the recipient's wallet is verified. For large amounts, confirm they've completed KYC requirements. Start with smaller test amounts if unsure.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">Account Closed or Inactive</h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Bank accounts can be closed, and mobile wallets can be inactive. Sending to a closed account or inactive wallet will cause the transfer to fail.
                </p>
                <div class="bg-white rounded-lg p-4 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong class="text-red-600">Prevention:</strong> Verify the account or wallet is active before sending. For bank deposits, confirm the account hasn't been closed. For mobile money, check if the wallet is active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Speed Comparison -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-12 shadow-xl">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              <span class="text-brand-600">Speed Comparison</span>: Typical Delivery Times
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Delivery speed varies significantly by method. Here's what to expect for each:
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Mobile Money</h3>
                <p class="text-sm font-medium text-brand-600 mb-2">Fastest: 15 minutes to 2 hours</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Almost instant delivery once processed. Limited to supported corridors. Recipient receives notification immediately.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Urgent needs, instant delivery
                  </p>
                </div>
              </div>
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Cash Pickup</h3>
                <p class="text-sm font-medium text-brand-600 mb-2">Very Fast: 15 minutes to 24 hours</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Available once transfer is processed. Recipient can collect as soon as money is ready at location. Many locations are 24/7.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Urgent needs, wide accessibility
                  </p>
                </div>
              </div>
              <div class="bg-white rounded-lg p-6 border-2 border-brand-200 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">Bank Deposit</h3>
                <p class="text-sm font-medium text-brand-600 mb-2">Standard: 1 to 3 business days</p>
                <p class="text-xs text-neutral-600 leading-relaxed mb-3">
                  Depends on banking systems and cutoff times. Some corridors offer instant bank deposits. Weekends and holidays add delays.
                </p>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Best for:</strong> Non-urgent, cost optimization
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Checklist -->
          <div class="mb-12 rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 lg:p-10 text-white shadow-xl">
            <h2 class="text-2xl font-bold mb-4">
              Quick Checklist: Choose the <span class="text-brand-200">Best Delivery Method</span>
            </h2>
            <p class="text-lg text-white/90 leading-relaxed mb-6">
              Use this checklist before every transfer to ensure you choose the right method and provide accurate details:
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">Before Choosing Method</h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Confirm recipient preference (cash vs bank vs wallet)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Check urgency (minutes, hours, or days acceptable?)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Verify recipient has required access (bank account, ID, wallet, etc.)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Confirm corridor supports your chosen method</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">Before Sending</h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Confirm recipient details (name, ID, account/wallet number)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Compare "recipient gets" across providers using the same method</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Check ETA and pickup hours if using cash pickup</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>For mobile money, confirm wallet provider and any limits</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">✓</span>
                    <span>Double-check all numbers and codes (account, routing, wallet, etc.)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white mb-12">
            <h2 class="text-2xl font-bold mb-4">
              Compare All Delivery Methods Side by Side
            </h2>
            <p class="text-lg text-white/90 mb-6 leading-relaxed">
              See live rates for bank deposit, cash pickup, and mobile money from 30+ providers. Compare costs, speeds, and "recipient gets" amounts to find the best option for your specific transfer.
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
            to="/learn/bank-transfer-vs-card-funding"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Bank Transfer vs Card Funding
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how funding method (how you pay) affects cost and speed.
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
              Understand "recipient gets" and how to compare quotes correctly across different delivery methods.
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
              Learn why payout method changes affect pricing and how to save money by comparing correctly.
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
  { name: 'Choose Right Delivery Method', path: '/learn/choose-right-delivery-method' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Choose the Right Delivery Method: Bank Deposit vs Cash Pickup vs Mobile Money | Remit-Scout',
  description: 'The payout method can change the price, speed, and success rate. Learn how to pick the best option for your recipient and avoid common failed payout mistakes.',
  canonical: `${siteUrl}/learn/choose-right-delivery-method`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Choose Right Delivery Method', url: `${siteUrl}/learn/choose-right-delivery-method` },
])
</script>
