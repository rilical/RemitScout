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
            How Fast Is <span class="text-brand-600">International Money Transfer</span>?
          </h1>
          <p class="text-h4 text-neutral-300 font-medium mb-6 leading-relaxed">
            Delivery times range from <span class="font-bold text-brand-600">minutes to 5 business days</span>. Here's what actually determines speed, why it varies, and how to choose the right option for your urgency.
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
                    What Actually Determines <span class="text-brand-600">Transfer Speed</span>
                  </h2>
                  <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                    You see "instant" promises, "same day" guarantees, and "1-3 business days" estimates. But the reality is more nuanced. Transfer speed isn't just about the provider—it's about payout method, timing, compliance checks, payment method, and the corridor you're sending money through.
                  </p>
                  <p class="text-body-lg text-neutral-700 leading-relaxed">
                    Understanding these factors helps you make smarter decisions. Sometimes you can save money by choosing economy instead of express without sacrificing much time. Other times, paying extra for speed makes sense if your recipient needs funds urgently.
                  </p>
                </div>

                <div class="flex-1 rounded-2xl bg-brand-600 text-white p-8 lg:p-10 shadow-xl flex flex-col justify-center">
                  <h3 class="font-bold text-h3 mb-4">
                    The Bottom Line
                  </h3>
                  <p class="text-body-lg font-medium leading-relaxed mb-4">
                    Payout method is the biggest speed lever—mobile wallets and cash pickup tend to be fastest, while bank transfers can take several business days. Weekends, holidays, and verification checks add delays. Faster usually costs more, so match speed to your actual urgency.
                  </p>
                  <p class="text-body-lg font-medium leading-relaxed">
                    The fastest transfers can complete in 15 minutes to 2 hours for mobile wallets and cash pickup. Bank transfers typically take 1-3 business days, but some providers offer instant bank deposits for specific corridors.
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
                          Payout method drives speed
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Mobile wallets and cash pickup are fastest (minutes to hours). Bank transfers are slower (1-3 business days).
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
                          Timing matters
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Weekend and holiday transfers wait until the next business day. Send by Wednesday if you need Friday delivery.
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
                          Speed costs money
                        </h4>
                        <p class="text-body-sm text-neutral-600 leading-relaxed">
                          Express delivery charges premium fees. Economy options save money but take longer. Match speed to urgency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Speed Buckets -->
          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Transfer Speed <span class="text-brand-600">Buckets</span>
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8">
              Most transfers fall into three speed categories. Understanding these helps set realistic expectations and choose the right option for your needs.
            </p>
            <div class="grid gap-6 md:grid-cols-3 mb-8">
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  1
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  Instant to Same Day
                </h3>
                <p class="text-body text-neutral-700 mb-3 font-medium">
                  15 minutes to 24 hours
                </p>
                <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
                  Mobile wallets (M-Pesa, Mobile Money, Airtel Money), cash pickup, and instant bank deposits for specific corridors. Ideal for urgent needs.
                </p>
                <div class="text-body-sm text-brand-600 font-semibold">
                  Providers: Remitly Express, Xoom, WorldRemit Express
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  2
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  1-2 Business Days
                </h3>
                <p class="text-body text-neutral-700 mb-3 font-medium">
                  Next day to 48 hours
                </p>
                <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
                  Standard bank transfers, card-funded transfers, and express options for most corridors. Balances speed and cost well.
                </p>
                <div class="text-body-sm text-brand-600 font-semibold">
                  Providers: Wise, Remitly Economy, Western Union
                </div>
              </div>
              <div class="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm">
                <div class="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-h4 mb-4">
                  3
                </div>
                <h3 class="text-h4 font-bold text-neutral-900 mb-3">
                  3-5 Business Days
                </h3>
                <p class="text-body text-neutral-700 mb-3 font-medium">
                  Economy delivery
                </p>
                <p class="text-body-sm text-neutral-600 leading-relaxed mb-4">
                  Traditional bank transfers, ACH-funded transfers, and economy options. Cheapest but slowest. Best for non-urgent transfers.
                </p>
                <div class="text-body-sm text-brand-600 font-semibold">
                  Providers: Banks, Wise Economy, Remitly Economy+
                </div>
              </div>
            </div>
          </div>

          <!-- What Determines Speed -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              What Actually Determines <span class="text-brand-600">Delivery Time</span>
            </h2>
            <p class="text-body-lg text-neutral-700 leading-relaxed mb-8">
              Speed isn't random. It's determined by five key factors. Understanding these helps you predict how long your transfer will take and whether paying for express makes sense.
            </p>

            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  1. <span class="text-brand-600">Payout Method</span> (The Biggest Factor)
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  This is the single most important factor in transfer speed. The payout method determines how your recipient receives the money, and each method has different processing times and requirements.
                </p>
                <div class="grid md:grid-cols-3 gap-4 mb-4">
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Mobile Wallets
                    </h4>
                    <p class="text-body-sm text-neutral-700 mb-2 font-medium">
                      Fastest: 15 minutes to 2 hours
                    </p>
                    <p class="text-body-sm text-neutral-600 leading-relaxed">
                      Services like M-Pesa (Kenya), Mobile Money (Ghana), Airtel Money (East Africa). Almost instant delivery once processed. Limited to specific countries.
                    </p>
                  </div>
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Cash Pickup
                    </h4>
                    <p class="text-body-sm text-neutral-700 mb-2 font-medium">
                      Very Fast: 15 minutes to 24 hours
                    </p>
                    <p class="text-body-sm text-neutral-600 leading-relaxed">
                      Recipient collects cash from agent locations (Western Union, Xoom). Available 24/7 in many locations. Requires recipient to visit a location.
                    </p>
                  </div>
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Bank Transfer
                    </h4>
                    <p class="text-body-sm text-neutral-700 mb-2 font-medium">
                      Standard: 1-3 business days
                    </p>
                    <p class="text-body-sm text-neutral-600 leading-relaxed">
                      Money sent directly to recipient's bank account. Some providers offer instant bank deposits for specific corridors. Most reliable but often slowest.
                    </p>
                  </div>
                </div>
                <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Key insight:</strong> Mobile wallets and cash pickup bypass traditional banking systems, which is why they're faster. Bank transfers must go through multiple intermediaries and clearing systems, adding delays.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  2. <span class="text-brand-600">Weekends & Holidays</span>
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Banking systems operate on business days, not calendar days. A transfer initiated on Friday evening might not start processing until Monday morning, even if the provider accepts it immediately.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 mb-4 border border-brand-200">
                  <h4 class="font-bold text-neutral-900 mb-2">
                    How it works:
                  </h4>
                  <ul class="space-y-2 text-body-sm text-neutral-700">
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Bank transfers typically wait for the next business day to process</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Mobile wallets and cash pickup often process 24/7, including weekends</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-brand-600 mt-1">•</span>
                      <span>Holidays in either country can delay processing by additional days</span>
                    </li>
                  </ul>
                </div>
                <div class="bg-brand-600 rounded-lg p-4 text-white">
                  <p class="text-body-sm font-medium">
                    <strong>Pro tip:</strong> If you need money delivered by Friday, send it by Wednesday morning to account for processing time. This gives you two full business days for processing and delivery.
                  </p>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  3. <span class="text-brand-600">Compliance & Verification</span> Checks
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Anti-money laundering (AML) and know-your-customer (KYC) regulations require providers to verify transfers. First-time transfers, large amounts, or unusual patterns can trigger additional checks that add 1-2 business days.
                </p>
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                  <div class="rounded-lg border-2 border-brand-200 bg-surface p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      When checks are likely:
                    </h4>
                    <ul class="space-y-1.5 text-body-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>First transfer to a new recipient</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Large amounts (usually $1,000+)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Unusual patterns or high-risk corridors</span>
                      </li>
                    </ul>
                  </div>
                  <div class="rounded-lg border-2 border-brand-200 bg-surface p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      How to avoid delays:
                    </h4>
                    <ul class="space-y-1.5 text-body-sm text-neutral-700">
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Complete verification early (before urgent transfers)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Start with smaller test transfers</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-brand-600 mt-1">•</span>
                        <span>Use the same recipient details consistently</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <p class="text-body-sm text-neutral-600 italic">
                  Once you're verified and have sent to a recipient before, subsequent transfers are usually much faster.
                </p>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  4. <span class="text-brand-600">Payment Method</span> (How You Fund the Transfer)
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  How you pay for the transfer affects how quickly it can be processed. Card payments are typically faster than bank transfers because cards authorize instantly, while bank transfers need to clear.
                </p>
                <div class="space-y-4">
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Debit/Credit Cards
                    </h4>
                    <p class="text-body-sm text-neutral-700 leading-relaxed">
                      Instant authorization means the provider can start processing immediately. Some providers offer instant processing for card-funded transfers, especially for mobile wallets and cash pickup. Higher fees but faster start.
                    </p>
                  </div>
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Bank Transfer (ACH/Direct Debit)
                    </h4>
                    <p class="text-body-sm text-neutral-700 leading-relaxed">
                      ACH transfers take 1-2 business days to clear before the provider can start the international transfer. This adds significant delay, but fees are often lower. Best for non-urgent, cost-sensitive transfers.
                    </p>
                  </div>
                  <div class="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
                    <h4 class="font-bold text-neutral-900 mb-2">
                      Bank Wire
                    </h4>
                    <p class="text-body-sm text-neutral-700 leading-relaxed">
                      Wire transfers clear within hours but come with high fees (often $25-50). Rarely worth it unless transferring very large amounts where speed is critical.
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  5. <span class="text-brand-600">Corridor & Provider</span> Infrastructure
                </h3>
                <p class="text-body text-neutral-700 leading-relaxed mb-4">
                  Some corridors (country pairs) have better infrastructure and established relationships, making transfers faster. Providers also have different partnerships and network capabilities.
                </p>
                <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                  <p class="text-body-sm text-neutral-700 leading-relaxed">
                    <strong class="text-brand-600">Example:</strong> US to Mexico transfers are often faster than US to Bangladesh because the infrastructure and partnerships are more established. Popular corridors typically have faster processing times due to high volume and optimized systems.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Speed vs Cost Tradeoff -->
          <div class="mb-12 rounded-3xl border-2 border-brand-200 bg-brand-50 p-8 lg:p-12 shadow-xl">
            <h2 class="text-h3 font-bold text-neutral-900 mb-4">
              <span class="text-brand-600">Speed vs. Cost</span> Tradeoff
            </h2>
            <p class="text-body text-neutral-700 leading-relaxed mb-6">
              Faster transfers usually cost more. Providers charge premium fees for express delivery because they use faster payment rails and prioritize processing. Understanding this tradeoff helps you make smarter decisions.
            </p>
            <div class="grid gap-6 md:grid-cols-2 mb-6">
              <div class="rounded-xl border-2 border-brand-300 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Express (15 min - 24h)
                </h3>
                <div class="space-y-2 mb-4">
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Speed:</strong> Minutes to 24 hours
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Cost:</strong> Higher fees ($5-15 more than economy)
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Best for:</strong> Urgent needs, emergencies, time-sensitive payments
                  </p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-body-sm text-neutral-600">
                    Often uses premium payment rails, instant processing, and prioritized clearing. Worth it when time is money.
                  </p>
                </div>
              </div>
              <div class="rounded-xl border-2 border-brand-300 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                  Economy (1-5 days)
                </h3>
                <div class="space-y-2 mb-4">
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Speed:</strong> 1-5 business days
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Cost:</strong> Lower fees, similar exchange rates
                  </p>
                  <p class="text-body-sm text-neutral-700">
                    <strong class="text-brand-600">Best for:</strong> Non-urgent transfers, cost savings, regular remittances
                  </p>
                </div>
                <div class="bg-brand-50 rounded-lg p-3 border border-brand-200">
                  <p class="text-body-sm text-neutral-600">
                    Uses standard banking rails and batch processing. Can save $5-20 per transfer compared to express.
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-brand-600 rounded-lg p-6 text-white">
              <h4 class="font-bold mb-2">
                When to Choose Each
              </h4>
              <ul class="space-y-2 text-body-sm">
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span><strong>Choose Express</strong> if your recipient needs money urgently (medical emergency, last-minute bill, unexpected expense)</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span><strong>Choose Economy</strong> if you can wait a few days and want to save money (regular remittances, non-urgent support, planned expenses)</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span><strong>Compare both options</strong> — sometimes the speed difference is minimal (economy might arrive in 1 day instead of same day), making the savings worth it</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="my-10">
            <AdPlacement
              placement="blog_inline"
              wrapper-class="rounded-xl"
              min-height="120px"
            />
          </div>

          <!-- Real-World Examples -->
          <div class="mb-12">
            <h2 class="text-h2 font-bold text-neutral-900 mb-6">
              Real-World <span class="text-brand-600">Speed Examples</span>
            </h2>
            <div class="space-y-6">
              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  US to Kenya: M-Pesa Mobile Wallet
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                    <p class="text-body-sm font-semibold text-brand-600 mb-2">
                      Express Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 15 minutes to 2 hours
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $5.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> Card funding → Instant processing → M-Pesa delivery
                    </p>
                  </div>
                  <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p class="text-body-sm font-semibold text-neutral-600 mb-2">
                      Economy Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 1-2 business days
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $3.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> ACH funding → 1-2 day clearing → Bank transfer → M-Pesa delivery
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  US to Mexico: Cash Pickup
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                    <p class="text-body-sm font-semibold text-brand-600 mb-2">
                      Express Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 15 minutes to 4 hours
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $4.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> Card funding → Instant processing → Cash ready at agent
                    </p>
                  </div>
                  <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p class="text-body-sm font-semibold text-neutral-600 mb-2">
                      Economy Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 1 business day
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $2.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> ACH funding → 1 day clearing → Cash ready next day
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border-2 border-brand-200 bg-surface p-6 shadow-sm">
                <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                  US to Philippines: Bank Transfer
                </h3>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                    <p class="text-body-sm font-semibold text-brand-600 mb-2">
                      Express Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 1-2 business days
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $7.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> Card funding → Priority processing → Bank deposit
                    </p>
                  </div>
                  <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p class="text-body-sm font-semibold text-neutral-600 mb-2">
                      Economy Option
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Time:</strong> 3-5 business days
                    </p>
                    <p class="text-body-sm text-neutral-700 mb-1">
                      <strong>Fee:</strong> $4.99
                    </p>
                    <p class="text-body-sm text-neutral-700">
                      <strong>Method:</strong> ACH funding → 2 day clearing → Standard bank processing → Deposit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- How to Choose -->
          <div class="mb-12 rounded-2xl border-2 border-brand-600 bg-brand-600 p-8 lg:p-10 text-white shadow-xl">
            <h2 class="text-h3 font-bold mb-4">
              How to Choose the Right <span class="text-brand-200">Speed Option</span>
            </h2>
            <p class="text-body-lg text-white/90 leading-relaxed mb-6">
              Here's a simple decision framework to help you choose between express and economy:
            </p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white/10 rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-body-lg mb-3">
                  Ask yourself:
                </h3>
                <ul class="space-y-2 text-body-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span>Does my recipient need the money urgently (within 24 hours)?</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span>Is this for an emergency or time-sensitive expense?</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span>How much is the speed premium ($5-15 extra)?</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span>Can I send earlier to avoid needing express?</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white/10 rounded-xl p-5 border border-white/20">
                <h3 class="font-bold text-body-lg mb-3">
                  Decision guide:
                </h3>
                <ul class="space-y-2 text-body-sm text-white/90">
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Choose Express</strong> if it's an emergency or time is worth more than the fee</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Choose Economy</strong> if you can wait and want to save money</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Compare both</strong> to see if the speed difference justifies the cost</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1">•</span>
                    <span><strong>Plan ahead</strong> — sending earlier with economy beats last-minute express</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="rounded-3xl border-2 border-brand-500 bg-brand-600 p-8 lg:p-12 text-white mb-12">
            <h2 class="text-h3 font-bold mb-4">
              Ready to Send Money Fast?
            </h2>
            <p class="text-body-lg text-white/90 mb-6 leading-relaxed">
              Compare live rates and delivery times from 30+ licensed providers. See exactly how fast your money will arrive and how much it costs.
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
            to="/learn/bank-transfer-vs-card-vs-cash-pickup"
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Payment Method Playbook
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Learn how payment and payout methods affect speed, cost, and reliability.
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
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Why Compare Before Every Transfer
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Speed is just one factor. Learn what else to consider when choosing a provider.
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
            class="group flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm motion-safe:transition-all hover:shadow-lg hover:border-white/30 hover:bg-white/15"
          >
            <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-brand-200 transition-colors">
              Hidden Exchange Rate Fees Explained
            </h3>
            <p class="text-body-sm text-white/90 leading-relaxed mb-4 flex-1">
              Speed isn't the only cost. Learn how FX markup can cost more than fees.
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
  { name: 'Transfer Speed', path: '/learn/how-fast-is-international-money-transfer' },
]

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'

const seoTitle = 'How Fast Is International Money Transfer? What Determines Delivery Time | Remit-Scout'
const seoDescription = 'Learn what determines transfer speed: payout methods, weekends, compliance holds, and payment methods. Speed buckets from instant to 5 days. Real-world examples and decision guide.'

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
  canonical: `${siteUrl}/learn/how-fast-is-international-money-transfer`,
  ogImage: false,
})

jsonLdBreadcrumb([
  { name: 'Home', url: `${siteUrl}/` },
  { name: 'Learn', url: `${siteUrl}/learn` },
  { name: 'Transfer Speed', url: `${siteUrl}/learn/how-fast-is-international-money-transfer` },
])
</script>
