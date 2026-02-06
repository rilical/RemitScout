<template>
  <div class="min-h-screen bg-white">
    <CompareWidget />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-slate-900 py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-12 max-w-4xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white shadow-md mb-6">
            Money Transfer Basics
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            Payment Method <span class="text-brand-400">Playbook</span>
          </h1>
          <p class="text-xl text-slate-300 sm:text-2xl font-medium mb-6 leading-relaxed">
            Bank Transfer vs Card vs Cash Pickup vs Mobile Wallet: Which is <span class="font-bold text-brand-400">cheapest and safest</span>?
          </p>
          <p class="text-lg text-slate-300 leading-relaxed mb-6">
            Your choice of payment method and payout method dramatically affects cost, speed, and safety. Here's how to choose the right option for your needs.
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
                    How Payment & Payout Methods <span class="text-brand-600">Shape Your Transfer</span>
                  </h2>
                  <p class="text-lg text-neutral-700 leading-relaxed mb-4">
                    Every money transfer involves two critical choices: how you pay for it (payment method) and how your recipient receives it (payout method). These choices determine cost, speed, safety, and accessibility more than any other factor.
                  </p>
                  <p class="text-lg text-neutral-700 leading-relaxed">
                    Bank funding is cheapest, cards are fastest, and mobile wallets or cash pickup maximize access for recipients without bank accounts. Understanding the tradeoffs helps you match the method to your recipient's needs and your urgency, not just headline fees.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-2xl mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-lg font-medium leading-relaxed mb-4">
                    Funding method and payout method both shape total cost and delivery time. Bank funding is cheapest, cards are fastest, and wallets or cash maximize access. Match the method to recipient access and urgency, not just headline fees.
                  </p>
                  <p class="text-lg font-medium leading-relaxed">
                    For regular, cost-sensitive transfers, use bank funding with bank payout. For urgent transfers, card funding with cash pickup or mobile wallet works best. Always verify recipient details and check limits before sending large amounts.
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-10 shadow-xl">
                <h3 class="text-xl font-bold text-neutral-900 mb-6">
                  Quick Takeaways
                </h3>
                <div class="grid gap-4">
                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Payment method affects cost
                        </h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Bank transfers are cheapest (often $0-3), cards are expensive (2-4% fees). Choose based on urgency and amount.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Payout method affects speed
                        </h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Mobile wallets and cash pickup are fastest (minutes to hours). Bank transfers take 1-3 business days.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl bg-white/90 border border-brand-100 p-5 shadow-sm">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral-900 mb-1.5">
                          Match method to needs
                        </h4>
                        <p class="text-sm text-neutral-600 leading-relaxed">
                          Consider recipient access, urgency, and cost. Rural areas often need mobile wallets or cash pickup.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Methods Comparison -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Payment Methods: <span class="text-brand-600">How You Fund the Transfer</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-8">
              The payment method (how you pay for the transfer) affects cost, speed of processing, and transfer limits. Choose based on urgency, amount, and cost sensitivity.
            </p>
            <div class="grid md:grid-cols-2 gap-6 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">
                  Bank Transfer (ACH/Wire)
                </h3>
                <div class="grid gap-4 mb-4">
                  <div class="bg-white rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-semibold text-brand-600 mb-2">
                      Pros:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Lowest fees (often $0-3 flat fee)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Best exchange rates (lower FX markup)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Higher transfer limits ($5,000-50,000+)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>No cash advance fees or interest</span>
                      </li>
                    </ul>
                  </div>
                  <div class="bg-white rounded-lg p-4 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-2">
                      Cons:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Slower processing (1-2 business days to clear)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Requires bank account</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>May require verification setup time</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-sm font-medium">
                    <strong>Best for:</strong> Regular senders, large amounts ($500+), cost optimization, non-urgent transfers
                  </p>
                </div>
                <div class="mt-4 text-xs text-neutral-600">
                  <strong class="text-brand-600">Cost example:</strong> $1,000 transfer = $0-3 fee vs. $30-40 with card
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">
                  Debit/Credit Card
                </h3>
                <div class="grid gap-4 mb-4">
                  <div class="bg-white rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-semibold text-brand-600 mb-2">
                      Pros:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Instant processing and authorization</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Convenient (no bank account linking needed)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Widely accepted by all providers</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Good for urgent transfers</span>
                      </li>
                    </ul>
                  </div>
                  <div class="bg-white rounded-lg p-4 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-2">
                      Cons:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Higher fees (typically 2-4% of transfer amount)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Lower transfer limits ($500-3,000 typically)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Credit cards may charge cash advance fees</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>May have worse exchange rates than bank transfers</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-sm font-medium">
                    <strong>Best for:</strong> Urgent transfers, small amounts ($100-500), convenience, one-time transfers
                  </p>
                </div>
                <div class="mt-4 text-xs text-neutral-600">
                  <strong class="text-brand-600">Cost example:</strong> $1,000 transfer = $20-40 fee (2-4%)
                </div>
              </div>
            </div>
          </div>

          <!-- Payout Methods Comparison -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Payout Methods: <span class="text-brand-600">How Recipient Gets Money</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-8">
              The payout method (how your recipient receives the money) affects speed, accessibility, and sometimes cost. Choose based on recipient's location, access to banking, and urgency.
            </p>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">
                  Mobile Wallet
                </h3>
                <div class="space-y-4 mb-4">
                  <div class="bg-white rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-semibold text-brand-600 mb-2">
                      Pros:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Often instant (15 min - 2 hours)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>No bank account needed</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Great for rural areas</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>24/7 availability</span>
                      </li>
                    </ul>
                  </div>
                  <div class="bg-white rounded-lg p-4 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-2">
                      Cons:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>May have daily withdrawal limits</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Not available in all countries</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Recipient needs smartphone and app</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-sm font-medium">
                    <strong>Best for:</strong> Africa (M-Pesa, Airtel Money), parts of Asia, instant delivery needs, recipients without bank accounts
                  </p>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">
                  Cash Pickup
                </h3>
                <div class="space-y-4 mb-4">
                  <div class="bg-white rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-semibold text-brand-600 mb-2">
                      Pros:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Very fast (15 minutes to 24 hours)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>No bank account needed</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Widely available (thousands of locations)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>24/7 pickup in many locations</span>
                      </li>
                    </ul>
                  </div>
                  <div class="bg-white rounded-lg p-4 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-2">
                      Cons:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Name must match ID exactly</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Recipient must visit pickup location</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Slightly higher fees than bank transfer</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-sm font-medium">
                    <strong>Best for:</strong> Urgent needs, recipients without bank accounts, maximum accessibility
                  </p>
                </div>
              </div>

              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4">
                  Bank Transfer
                </h3>
                <div class="space-y-4 mb-4">
                  <div class="bg-white rounded-lg p-4 border border-brand-200">
                    <p class="text-sm font-semibold text-brand-600 mb-2">
                      Pros:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Lowest cost option</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Most secure (direct deposit)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>No pickup needed (convenient)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Good for large amounts</span>
                      </li>
                    </ul>
                  </div>
                  <div class="bg-white rounded-lg p-4 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-2">
                      Cons:
                    </p>
                    <ul class="space-y-1.5 text-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Slower (1-3 business days typically)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Requires recipient bank account</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-red-600 mt-1">•</span>
                        <span>Account details must be accurate</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-sm font-medium">
                    <strong>Best for:</strong> Regular transfers, large amounts, cost savings, recipients with bank accounts
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Cost Comparison -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-8 lg:p-12 shadow-xl">
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              <span class="text-brand-600">Cost Comparison</span>: Real Examples
            </h2>
            <p class="text-base text-neutral-700 leading-relaxed mb-6">
              Here's how different payment and payout method combinations affect the total cost of a $1,000 transfer to Mexico:
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">
                  Bank + Bank
                </h3>
                <div class="space-y-2 text-sm text-neutral-700 mb-4">
                  <p><strong class="text-brand-600">Fee:</strong> $0-3</p>
                  <p><strong class="text-brand-600">Speed:</strong> 1-2 days</p>
                  <p><strong class="text-brand-600">Cost:</strong> Lowest</p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    Best for regular, cost-sensitive transfers
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">
                  Card + Cash
                </h3>
                <div class="space-y-2 text-sm text-neutral-700 mb-4">
                  <p><strong class="text-brand-600">Fee:</strong> $20-40</p>
                  <p><strong class="text-brand-600">Speed:</strong> 15 min - 4 hours</p>
                  <p><strong class="text-brand-600">Cost:</strong> Highest</p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    Best for urgent needs when speed matters most
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-white p-6 shadow-sm">
                <h3 class="font-bold text-neutral-900 mb-3">
                  Bank + Mobile
                </h3>
                <div class="space-y-2 text-sm text-neutral-700 mb-4">
                  <p><strong class="text-brand-600">Fee:</strong> $3-5</p>
                  <p><strong class="text-brand-600">Speed:</strong> 15 min - 2 hours</p>
                  <p><strong class="text-brand-600">Cost:</strong> Low</p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-xs text-neutral-600">
                    Best balance of cost and speed for rural areas
                  </p>
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

          <!-- Safety Tips -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Safety Tips by <span class="text-brand-600">Method</span>
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-8">
              Each payment and payout method has specific safety considerations. Understanding these helps you avoid common mistakes and protect your money.
            </p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">
                  Cash Pickup
                </h3>
                <div class="space-y-3">
                  <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-1">
                      Critical: Name Matching
                    </p>
                    <p class="text-xs text-neutral-700">
                      The recipient's name must match their ID exactly. Middle names, accents, spelling, and order matter. Double-check before sending.
                    </p>
                  </div>
                  <ul class="space-y-2 text-sm text-neutral-700">
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Send recipient the MTCN (money transfer control number)</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Confirm pickup location and hours</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Recipient must bring valid government ID</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">
                  Mobile Wallet
                </h3>
                <div class="space-y-3">
                  <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-1">
                      Check Limits First
                    </p>
                    <p class="text-xs text-neutral-700">
                      Some wallets have daily withdrawal limits ($500-2,000). Recipients may need to verify their account before receiving large amounts.
                    </p>
                  </div>
                  <ul class="space-y-2 text-sm text-neutral-700">
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Verify recipient has the wallet app installed</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Confirm phone number matches wallet account</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Check if verification documents are needed</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-4">
                  Bank Transfer
                </h3>
                <div class="space-y-3">
                  <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p class="text-sm font-semibold text-red-600 mb-1">
                      Verify Account Details
                    </p>
                    <p class="text-xs text-neutral-700">
                      Always verify account numbers and routing codes. One wrong digit can send money to the wrong account, making recovery difficult.
                    </p>
                  </div>
                  <ul class="space-y-2 text-sm text-neutral-700">
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Double-check account number and SWIFT/IBAN codes</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Confirm account name matches recipient</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Send a small test transfer first for new recipients</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Common Gotchas -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-neutral-900 mb-6">
              Common <span class="text-brand-600">Gotchas</span> to Avoid
            </h2>
            <p class="text-lg text-neutral-700 leading-relaxed mb-6">
              These mistakes cost people time and money. Avoid them by understanding how payment and payout methods work.
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">
                  Choosing Card Payment for Large Amounts
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Card fees are percentage-based. On a $2,000 transfer, a 3% card fee costs $60 vs. $3 for a bank transfer. That's a $57 difference for the same transfer.
                </p>
                <div class="bg-white rounded-lg p-3 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Solution:</strong> Use bank funding for amounts over $500. The 1-2 day delay is worth the savings.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">
                  Cash Pickup Name Mismatch
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  If the name doesn't match the recipient's ID exactly, they can't pick up the money. You'll need to cancel and resend with correct name, losing time and possibly paying fees twice.
                </p>
                <div class="bg-white rounded-lg p-3 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Solution:</strong> Verify exact name spelling from recipient's ID before sending. Include middle names if on ID.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">
                  Mobile Wallet Daily Limits
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  Some wallets limit how much can be received per day ($500-2,000). Sending $3,000 might require the recipient to wait 2-3 days to receive it all, or they may need to upgrade their account.
                </p>
                <div class="bg-white rounded-lg p-3 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Solution:</strong> Check wallet limits before sending large amounts. Consider bank transfer or cash pickup for large sums.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-neutral-900 mb-3">
                  Assuming Bank Transfer is Always Cheapest
                </h3>
                <p class="text-sm text-neutral-700 leading-relaxed mb-3">
                  While bank transfers usually have the lowest fees, some providers charge higher FX markup on bank transfers. Always compare "recipient gets" not just fees.
                </p>
                <div class="bg-white rounded-lg p-3 border border-red-200">
                  <p class="text-xs text-neutral-600">
                    <strong>Solution:</strong> Compare total cost ("recipient gets") across all methods, not just fees. FX markup can offset fee savings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Decision Framework -->
          <div class="mb-12 rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 lg:p-10 text-white shadow-xl">
            <h2 class="text-2xl font-bold mb-4">
              How to <span class="text-brand-200">Choose the Right Method</span>
            </h2>
            <p class="text-lg text-white/90 leading-relaxed mb-6">
              Use this decision framework to match payment and payout methods to your needs:
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">
                  For Regular Transfers
                </h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payment:</strong> Bank transfer (lowest cost)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payout:</strong> Bank transfer (if recipient has account) or mobile wallet (if rural)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Why:</strong> Optimize for cost, speed is less critical</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">
                  For Urgent Transfers
                </h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payment:</strong> Card (instant processing) or bank (if already linked)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payout:</strong> Cash pickup or mobile wallet (fastest)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Why:</strong> Speed matters more than cost in emergencies</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">
                  For Large Amounts ($1,000+)
                </h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payment:</strong> Bank transfer (avoid percentage fees)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payout:</strong> Bank transfer (safest, lowest cost) or cash pickup (if no account)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Why:</strong> Percentage fees on cards become very expensive</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-lg mb-3">
                  For Rural Recipients
                </h3>
                <ul class="space-y-2 text-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payment:</strong> Bank transfer (lowest cost)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Payout:</strong> Mobile wallet or cash pickup (best access)</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Why:</strong> Recipients may not have bank accounts nearby</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-600 to-blue-600 p-8 lg:p-12 text-white mb-12">
            <h2 class="text-2xl font-bold mb-4">
              Compare All Methods Side by Side
            </h2>
            <p class="text-lg text-white/90 mb-6 leading-relaxed">
              See live rates for different payment and payout method combinations. Compare costs, speeds, and availability across 30+ providers to find the best option for your specific needs.
            </p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-600 shadow-lg hover:bg-neutral-50 transition-all"
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
              Learn how FX markup works and why "$0 fee" can still be expensive, regardless of payment method.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
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
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              How to Read a Remittance Quote
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Understand what matters in a quote and how to spot hidden costs across different payment methods.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
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
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15 hover:-translate-y-1"
          >
            <h3 class="text-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how comparing can save you hundreds, especially when choosing between different payment methods.
            </p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
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
  { name: 'Payment Methods', path: '/learn/bank-transfer-vs-card-vs-cash-pickup' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

setSeo({
  title: 'Payment Method Playbook: Bank Transfer vs Card vs Cash Pickup vs Mobile Wallet | Remit-Scout',
  description: 'Compare payment and payout methods: bank transfer, card, cash pickup, and mobile wallet. Learn pros, cons, safety tips, common gotchas, and how to choose the right method.',
  canonical: `${siteUrl}/learn/bank-transfer-vs-card-vs-cash-pickup`,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Payment Methods', url: `${siteUrl}/learn/bank-transfer-vs-card-vs-cash-pickup` },
])
</script>
