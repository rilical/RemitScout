<template>
  <div class="min-h-screen bg-surface">
    <!-- Hero Section -->
    <section class="bg-surface">
      <CenteredPage
        as="div"
        max-width="7xl"
        padding-y="lg"
        section-gap-class="space-y-10"
      >
        <div class="text-center">
          <div class="flex justify-center mb-8">
            <NuxtImg
              src="/png/SVG/FULL_LOGO_PLUS.svg"
              alt="Remit-Scout Plus"
              width="456"
              height="96"
              loading="eager"
              preload
              class="h-20 sm:h-24 object-contain"
            />
          </div>
          <h1 class="text-hero font-bold text-rs-fg mb-6">
            Never miss a great rate
          </h1>
          <p class="text-h4 text-neutral-700 max-w-3xl mx-auto mb-4 leading-relaxed">
            Set alerts for your corridors. Track changes automatically. Export your history when you need records.
          </p>
          <p class="text-body-lg text-neutral-600 max-w-3xl mx-auto">
            Plus is a feature upgrade. It never changes provider rankings.
          </p>

          <!-- Auth Status Display -->
          <div
            v-if="isAuthenticated"
            class="inline-flex items-center gap-3 px-6 py-3 bg-neutral-800 border border-neutral-700 rounded-lg mt-8"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-success-600" />
              <span class="text-body-sm text-neutral-300">Signed in</span>
            </div>
            <span class="text-neutral-600">•</span>
            <div class="flex items-center gap-2">
              <span
                class="text-body-sm font-semibold"
                :class="isPlus ? 'text-primary-400' : 'text-neutral-400'"
              >
                {{ isPlus ? 'Plus Member' : 'Free Plan' }}
              </span>
            </div>
          </div>
        </div>
      </CenteredPage>
    </section>

    <!-- Pricing Comparison -->
    <section class="py-16 sm:py-20 bg-neutral-900">
      <div class="container">
        <div class="text-center mb-12">
          <h2 class="text-h1 font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p class="text-body-lg text-neutral-300">
            Get the best rates automatically. Plus saves you time and money on every transfer.
          </p>
        </div>

        <!-- Billing Toggle -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <span class="text-body-sm font-medium text-white">Monthly</span>
          <button
            :class="['relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-rs-fg', billingInterval === 'year' ? 'bg-brand-600' : 'bg-brand-700']"
            role="switch"
            :aria-checked="billingInterval === 'year'"
            @click="billingInterval = billingInterval === 'month' ? 'year' : 'month'"
          >
            <span
              :class="['inline-block h-5 w-5 transform rounded-full bg-surface transition-transform', billingInterval === 'year' ? 'translate-x-8' : 'translate-x-1']"
            />
          </button>
          <span class="text-body-sm font-medium text-white">Annual</span>
          <span
            v-if="billingInterval === 'year' && annualSavingsPct !== null && annualSavingsPct > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-sm font-medium bg-success-600 text-success-600"
          >
            Save {{ annualSavingsPct }}%
          </span>
        </div>

        <div :class="['grid grid-cols-1 gap-8 max-w-6xl mx-auto', enterpriseEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2']">
          <!-- Free Plan -->
          <div class="bg-surface rounded-3xl border-4 border-neutral-300 p-8 flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-h3 font-bold text-rs-fg mb-2">
                Free
              </h3>
              <p class="text-neutral-600 mb-4">
                For occasional senders
              </p>
              <div class="text-hero font-bold text-rs-fg mb-1">
                $0
              </div>
              <div class="text-body-sm text-rs-muted font-medium">
                forever
              </div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-success-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-700 font-medium">3 watchlist corridors</span>
                  <p class="text-body-sm text-rs-muted mt-1">
                    Save your most-used routes
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-success-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-700 font-medium">1 active alert</span>
                  <p class="text-body-sm text-rs-muted mt-1">
                    Get notified when rates change
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-success-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-700 font-medium">30-day transfer history</span>
                  <p class="text-body-sm text-rs-muted mt-1">
                    See recent trends
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-success-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-700 font-medium">Ads and sponsored placements</span>
                  <p class="text-body-sm text-rs-muted mt-1">
                    Keeps the free plan free
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="x"
                  :size="20"
                  class="text-danger-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-400 line-through">Pulse access</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Plus only
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="x"
                  :size="20"
                  class="text-danger-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-400 line-through">Export data</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Plus only
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="x"
                  :size="20"
                  class="text-danger-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-neutral-400 line-through">Ad-free experience</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Plus only
                  </p>
                </div>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              class="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all mt-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              @click="navigateTo('/sign-up')"
            >
              Get Started Free
            </button>
            <div
              v-else-if="!isPlus"
              class="w-full py-3.5 bg-neutral-100 text-neutral-600 rounded-xl font-semibold text-center mt-auto border-2 border-rs-border"
            >
              Current Plan
            </div>
            <button
              v-else
              disabled
              class="w-full py-3.5 bg-neutral-100 text-neutral-400 rounded-xl font-semibold cursor-not-allowed mt-auto border-2 border-rs-border"
            >
              Not Available
            </button>
          </div>

          <!-- Plus Plan -->
          <div class="bg-brand-600 rounded-3xl border-4 border-primary-400 p-8 relative flex flex-col shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
            <div class="text-center mb-6">
              <h3 class="text-h3 font-bold text-white mb-2">
                Plus
              </h3>
              <p class="text-white/90 mb-4">
                For regular senders
              </p>
              <div class="text-hero font-bold text-white mb-1">
                <span v-if="pricingLoading">—</span>
                <span v-else-if="billingInterval === 'year' && billedAnnuallyMonthlyPrice">{{ billedAnnuallyMonthlyPrice }}</span>
                <span v-else-if="plusPriceDisplay">{{ plusPriceDisplay }}</span>
                <span v-else>Pricing at checkout</span>
              </div>
              <div class="text-body-sm text-white/80 font-medium">
                {{ plusPriceSuffix }}
              </div>
              <p
                v-if="billedAnnuallyMonthlyDisplay"
                class="mt-1 text-body-sm text-white/80"
              >
                {{ plusPriceDisplay }} per year, billed annually
              </p>
              <p class="mt-2 text-body-sm text-white/80">
                <span v-if="trialDays > 0">{{ trialDays }}-day free trial • Cancel anytime</span>
                <span v-else>Cancel anytime</span>
              </p>
              <p
                v-if="!pricingConfigured"
                class="mt-2 text-[11px] text-white/70"
              >
                Pricing is shown at checkout in this environment.
              </p>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Pulse access</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    Best time to send + latest provider quotes
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">16 smart alerts</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    Send-score windows and target-rate alerts (eligible corridors)
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">365-day rate history</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    Full year of data
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">16 watchlist corridors</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    Track the routes you actually use
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Export data</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    CSV and PDF formats
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Ad-free experience</span>
                  <p class="text-body-sm text-white/80 mt-1">
                    No banners or ads
                  </p>
                </div>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              class="w-full py-3.5 bg-surface text-brand-600 hover:bg-primary-50 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] mt-auto"
              @click="navigateTo('/sign-up')"
            >
              Get Started
            </button>
            <button
              v-else-if="!isPlus"
              class="w-full py-3.5 bg-surface text-brand-600 hover:bg-primary-50 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] mt-auto disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="checkoutLoading || portalLoading"
              @click="handleUpgrade"
            >
              {{ checkoutLoading ? 'Starting…' : 'Upgrade to Plus' }}
            </button>
            <div
              v-else
              class="w-full py-3.5 bg-surface/20 border-2 border-white/40 text-white rounded-xl font-bold text-center mt-auto"
            >
              Current Plan
            </div>
          </div>

          <!-- Enterprise Plan -->
          <div
            v-if="enterpriseEnabled"
            class="bg-neutral-900 rounded-3xl border-4 border-neutral-600 p-8 flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div class="text-center mb-6">
              <h3 class="text-h3 font-bold text-white mb-2">
                Enterprise
              </h3>
              <p class="text-neutral-300 mb-4">
                For businesses
              </p>
              <div class="text-hero font-bold text-white mb-1">
                Let's talk
              </div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Everything in Plus</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    All Plus features included
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Custom reports</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Tailored to your business needs
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Extended rate history</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Access historical data beyond 365 days for deeper analysis and trend identification
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Priority support</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Dedicated account manager
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">Data integrations</span>
                  <p class="text-body-sm text-neutral-400 mt-1">
                    Custom delivery formats for your systems
                  </p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <Icon
                  name="check"
                  :size="20"
                  class="text-white flex-shrink-0 mt-0.5"
                />
                <div>
                  <span class="text-white font-semibold">And more</span>
                </div>
              </li>
            </ul>

            <NuxtLink
              to="/contact"
              class="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-all text-center block mt-auto shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Contact Sales
            </NuxtLink>
          </div>
        </div>

        <p class="text-center text-body-sm text-neutral-300 mt-8">
          All plans include access to compare 30+ providers across 150+ corridors • Cancel anytime
        </p>
      </div>
    </section>

    <!-- Pulse Included -->
    <section class="py-16 sm:py-20 bg-neutral-900">
      <div class="container">
        <div class="text-center mb-10">
          <h2 class="text-h2 font-bold text-white mb-3">
            Pulse is Included with Plus
          </h2>
          <p class="text-body-lg text-neutral-300 max-w-3xl mx-auto">
            Stop guessing. See send timing signals and the latest provider quotes for your corridor.
          </p>
        </div>

        <div class="rounded-2xl border border-neutral-700 bg-neutral-900/40 p-6">
          <PulseSenderPreview />
        </div>

        <div class="mt-8 text-center">
          <NuxtLink
            to="/pulse"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-body-lg font-semibold text-white hover:bg-brand-700 transition-colors shadow-lg"
          >
            {{ pulseCtaLabel }}
            <Icon
              name="arrow-right"
              :size="20"
              class="text-current"
            />
          </NuxtLink>
          <p class="mt-3 text-body-sm text-neutral-400">
            Plus members get full Pulse access, exports, and an ad-free experience.
          </p>
        </div>
      </div>
    </section>

    <!-- Our Impact -->
    <TrustMetricsStrip bg-class="bg-brand-600" />

    <!-- Features Breakdown -->
    <section class="py-16 bg-neutral-900">
      <div class="container">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-white mb-4">
            Everything You Get with Plus
          </h2>
          <p class="text-body-lg text-neutral-300">
            Built for people who send money regularly
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-neutral-700 flex items-center justify-center mb-4">
              <Icon
                name="bell-alert"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              Smart Rate Alerts
            </h3>
            <p class="text-body-sm text-neutral-300">
              Set target rates and get notified instantly when the market hits your price. Never miss a good rate again.
            </p>
          </div>

          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <Icon
                name="chart-bar"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              Full Year History
            </h3>
            <p class="text-body-sm text-neutral-300">
              Access 365 days of rate data. See volatility patterns and identify the best times to transfer money.
            </p>
          </div>

          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <Icon
                name="arrow-down-tray"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              Export Your Data
            </h3>
            <p class="text-body-sm text-neutral-300">
              Download your transfer history and market data in CSV or PDF format. Perfect for tax records and accounting.
            </p>
          </div>

          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <Icon
                name="bookmark"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              16 Corridor Watchlist
            </h3>
            <p class="text-body-sm text-neutral-300">
              Track up to 16 corridors in one place. Get weekly digest emails summarizing what changed across your watchlist.
            </p>
          </div>

          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <Icon
                name="sparkles"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              Ad-Free Experience
            </h3>
            <p class="text-body-sm text-neutral-300">
              No sponsor banners, no display ads, no promotional clutter. Focus on finding the best rate for your transfer.
            </p>
          </div>

          <div class="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6">
            <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mb-4">
              <Icon
                name="shield-check"
                :size="24"
                class="text-white"
              />
            </div>
            <h3 class="text-body-lg font-bold text-white mb-2">
              Still 100% Independent
            </h3>
            <p class="text-body-sm text-neutral-300">
              Plus never changes rankings. All comparisons remain purely data-driven. Rankings stay identical for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-neutral-50">
      <div class="mx-auto max-w-3xl px-page-x">
        <h2 class="text-h2 font-bold text-rs-fg text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div class="space-y-4">
          <details class="bg-surface rounded-lg border border-rs-border p-6 group">
            <summary class="font-semibold text-rs-fg cursor-pointer list-none flex items-center justify-between">
              <span>How do I cancel my subscription?</span>
              <Icon
                name="chevron-down"
                :size="20"
                class="text-neutral-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <p class="mt-4 text-neutral-600 text-body-sm">
              You can cancel anytime from your account settings. Your Plus features will remain active until the end of your billing period.
            </p>
          </details>

          <details class="bg-surface rounded-lg border border-rs-border p-6 group">
            <summary class="font-semibold text-rs-fg cursor-pointer list-none flex items-center justify-between">
              <span>Does Plus change how rates are ranked?</span>
              <Icon
                name="chevron-down"
                :size="20"
                class="text-neutral-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <p class="mt-4 text-neutral-600 text-body-sm">
              No. Plus is purely a subscription for enhanced features. All rankings and comparisons remain 100% data-driven and identical for free and Plus users.
            </p>
          </details>

          <details class="bg-surface rounded-lg border border-rs-border p-6 group">
            <summary class="font-semibold text-rs-fg cursor-pointer list-none flex items-center justify-between">
              <span>What payment methods do you accept?</span>
              <Icon
                name="chevron-down"
                :size="20"
                class="text-neutral-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <p class="mt-4 text-neutral-600 text-body-sm">
              We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.
            </p>
          </details>

          <details class="bg-surface rounded-lg border border-rs-border p-6 group">
            <summary class="font-semibold text-rs-fg cursor-pointer list-none flex items-center justify-between">
              <span>Can I switch between plans?</span>
              <Icon
                name="chevron-down"
                :size="20"
                class="text-neutral-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <p class="mt-4 text-neutral-600 text-body-sm">
              Yes! You can upgrade to Plus anytime. If you downgrade to Free, you'll keep Plus features until the end of your billing period.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Get Started CTA -->
    <section
      v-if="!isAuthenticated"
      class="py-16 bg-neutral-900"
    >
      <div class="mx-auto max-w-4xl px-page-x">
        <div class="bg-surface rounded-2xl border-2 border-neutral-700 p-8 sm:p-12 text-center">
          <h2 class="text-h2 font-bold text-rs-fg mb-4">
            Get Started with Remit-Scout
          </h2>
          <p class="text-body-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Create a free account to start tracking rates and setting alerts. Upgrade to Plus anytime for Pulse, exports, and higher limits.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/sign-up"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
            >
              <span>Create Free Account</span>
              <Icon
                name="arrow-right"
                :size="20"
                class="text-current"
              />
            </NuxtLink>
            <NuxtLink
              to="/sign-in"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-body-lg font-semibold transition-all"
            >
              <span>Sign In</span>
            </NuxtLink>
          </div>
          <p class="mt-6 text-body-sm text-rs-muted">
            No credit card required for free account
          </p>
        </div>
        <p class="mt-6 text-body-sm text-neutral-400">
          No credit card required for free account
        </p>
      </div>
    </section>

    <!-- Got Questions CTA -->
    <section class="py-16 bg-brand-600">
      <div class="mx-auto max-w-4xl px-page-x text-center">
        <h2 class="text-h1 font-bold text-white mb-4">
          Got Any Questions?
        </h2>
        <p class="text-h4 text-white/90 mb-8">
          Our team is here to help you get the most out of Remit-Scout
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <NuxtLink
            to="/send-money"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface hover:bg-primary-50 text-brand-600 rounded-xl text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            Compare Now
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface hover:bg-primary-50 text-brand-600 rounded-xl text-body-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            Contact Us
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import FaqSection from '~/components/shared/FaqSection.vue'
import { CenteredPage, Icon } from '~/ui'
import { formatMoney as formatMoneyUtil } from '~/shared/lib/format'

const { isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()
const { enterpriseEnabled } = useFeatureFlags()
const billingActions = useBilling()
const checkoutLoading = computed(() => billingActions.checkoutLoading.value)
const portalLoading = computed(() => billingActions.portalLoading.value)

const billingInterval = useState<'month' | 'year'>('billingInterval', () => 'year')

type BillingPricingResponse = {
  success: true
  configured: boolean
  trialDays: number
  plus: {
    month: { amount: number | null, currency: string | null, priceId: string | null }
    year: { amount: number | null, currency: string | null, priceId: string | null }
  }
}

const { request } = useApi()
const { data: pricing, pending: pricingLoading } = await useAsyncData(
  'billing:pricing',
  () => request<BillingPricingResponse>('/billing/pricing', { retries: 0 }),
  { server: true },
)

const trialDays = computed(() => pricing.value?.trialDays ?? 0)
const pricingConfigured = computed(() => pricing.value?.configured === true)
const selectedPrice = computed(() => (
  billingInterval.value === 'year' ? pricing.value?.plus.year : pricing.value?.plus.month
))

const formatMoney = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return null
  return formatMoneyUtil(amount, { currency })
}

const plusPriceDisplay = computed(() => formatMoney(selectedPrice.value?.amount, selectedPrice.value?.currency))

const billedAnnuallyMonthlyPrice = computed(() => {
  if (billingInterval.value !== 'year') return null
  const annualAmount = pricing.value?.plus.year.amount
  const currency = pricing.value?.plus.year.currency
  if (typeof annualAmount !== 'number' || !Number.isFinite(annualAmount) || annualAmount <= 0) return null
  if (!currency) return null
  return formatMoney(annualAmount / 12, currency)
})

const annualSavingsPct = computed(() => {
  const month = pricing.value?.plus.month.amount
  const year = pricing.value?.plus.year.amount
  if (typeof month !== 'number' || typeof year !== 'number') return null
  if (!Number.isFinite(month) || !Number.isFinite(year) || month <= 0 || year <= 0) return null
  const pct = (1 - year / (month * 12)) * 100
  if (!Number.isFinite(pct)) return null
  return Math.max(0, Math.round(pct))
})

async function handleUpgrade() {
  if (!isAuthenticated.value) {
    await navigateTo({ path: '/sign-in', query: { redirect: '/plus' } })
    return
  }

  if (isPlus.value) {
    const portalResult = await billingActions.openBillingPortal()
    if (!portalResult.ok) {
      alert(portalResult.error || 'Unable to open billing portal.')
    }
    return
  }

  const checkoutResult = await billingActions.createCheckoutSession('plus', billingInterval.value)
  if (checkoutResult.ok) {
    if (checkoutResult.url && import.meta.client) {
      window.location.href = checkoutResult.url
      return
    }
  }

  alert(checkoutResult.error || 'Unable to start checkout.')
}

const plusFaqs = [
  { question: 'How do I cancel my subscription?', answer: 'You can cancel anytime from your account settings. Your Plus features will remain active until the end of your billing period.' },
  { question: 'Does Plus change how rates are ranked?', answer: 'No. Plus is purely a subscription for enhanced features. All rankings and comparisons remain 100% data-driven and identical for free and Plus users.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.' },
  { question: 'Can I switch between plans?', answer: 'Yes. You can upgrade to Plus anytime. If you downgrade to Free, you\'ll keep Plus features until the end of your billing period.' },
]

useHead({
  title: 'Plus - Never Miss the Perfect Rate | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Upgrade to Remit-Scout Plus for Pulse access, 16 smart alerts, 16 watchlist corridors, 365-day history, exports, and an ad-free experience.',
    },
  ],
})
</script>
