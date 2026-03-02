<template>
  <div class="min-h-screen bg-surface">
<!-- Hero -->
    <section class="relative overflow-hidden bg-neutral-900 py-16 lg:py-24">
      <div class="mx-auto max-w-page px-page-x">
        <div class="flex justify-center mb-6">
          <NuxtImg
            src="/png/SVG/FULL_LOGO_PLUS.svg"
            alt="Remit-Scout Plus"
            width="304"
            height="64"
            loading="eager"
            preload
            class="h-14 sm:h-16 object-contain brightness-0 invert"
          />
        </div>
        <div class="mx-auto max-w-3xl text-center">
          <h1 class="text-hero font-bold tracking-tight text-white mb-4">
            Never miss a great rate.
          </h1>
          <p class="text-h4 text-neutral-300 leading-relaxed mb-3">
            Set alerts for your corridors. Track changes automatically. Export your history when you need records.
          </p>
          <p class="text-body text-neutral-500">
            Plus is a feature upgrade — it never changes provider rankings.
          </p>

          <div
            v-if="isAuthenticated"
            class="mt-6 inline-flex items-center gap-2 text-body-sm text-neutral-400"
          >
            <span
              :class="['font-semibold', isPlus ? 'text-brand-400' : 'text-neutral-400']"
            >{{ isPlus ? 'Plus member' : 'Free plan' }}</span>
            <span v-if="!isPlus">
              · <button
class="text-brand-400 hover:text-brand-300 font-semibold motion-safe:transition-colors"
@click="handleUpgrade"
>Upgrade now</button>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section
      v-reveal
      class="py-16 sm:py-20 bg-surface"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-10">
          <h2 class="text-h1 font-bold text-rs-fg mb-3">
            Choose your plan
          </h2>
          <p class="text-body-lg text-neutral-600">
            All plans include access to compare 30+ providers across 49,000+ corridors.
          </p>
        </div>

        <!-- Billing toggle -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <span :class="['text-body-sm font-medium', billingInterval === 'month' ? 'text-rs-fg' : 'text-neutral-400']">Monthly</span>
          <button
            :class="['relative inline-flex h-7 w-14 items-center rounded-full motion-safe:transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2', billingInterval === 'year' ? 'bg-brand-600' : 'bg-neutral-300']"
            role="switch"
            :aria-checked="billingInterval === 'year'"
            @click="billingInterval = billingInterval === 'month' ? 'year' : 'month'"
          >
            <span
              :class="['inline-block h-5 w-5 transform rounded-full bg-white shadow motion-safe:transition-transform', billingInterval === 'year' ? 'translate-x-8' : 'translate-x-1']"
            />
          </button>
          <span :class="['text-body-sm font-medium', billingInterval === 'year' ? 'text-rs-fg' : 'text-neutral-400']">Annual</span>
          <span
            v-if="billingInterval === 'year' && annualSavingsPct !== null && annualSavingsPct > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-body-sm font-semibold bg-brand-100 text-brand-700"
          >
            Save {{ annualSavingsPct }}%
          </span>
        </div>

        <div :class="['grid grid-cols-1 gap-6 max-w-5xl mx-auto', enterpriseEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2']">
<!-- Free Plan -->
          <div class="rounded-2xl border-2 border-neutral-200 bg-surface p-8 flex flex-col">
            <div class="mb-6">
              <h3 class="text-h3 font-bold text-rs-fg mb-1">
                Free
              </h3>
              <p class="text-body-sm text-neutral-500 mb-4">
                For occasional senders
              </p>
              <div class="text-hero font-bold text-rs-fg mb-0.5">
                $0
              </div>
              <div class="text-body-sm text-rs-muted">
                forever
              </div>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Provider comparisons</span>
                <span class="text-body-sm font-semibold text-neutral-900">30+</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Watchlist corridors</span>
                <span class="text-body-sm font-semibold text-neutral-900">3</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Active rate alerts</span>
                <span class="text-body-sm font-semibold text-neutral-900">1</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Rate history</span>
                <span class="text-body-sm font-semibold text-neutral-900">30 days</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Data exports</span>
                <span class="text-body-sm font-semibold text-neutral-400">—</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-neutral-700">Ad-free</span>
                <span class="text-body-sm font-semibold text-neutral-400">—</span>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              class="w-full py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold text-body-sm mt-auto motion-safe:transition-colors"
              @click="navigateTo('/sign-up')"
            >
              Get started free
            </button>
            <div
              v-else-if="!isPlus"
              class="w-full py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold text-body-sm text-center mt-auto"
            >
              Current plan
            </div>
            <div
              v-else
              class="w-full py-3 rounded-xl border-2 border-neutral-200 text-neutral-400 font-semibold text-body-sm text-center mt-auto"
            >
              Downgrade
            </div>
          </div>

          <!-- Plus Plan -->
          <div class="rounded-2xl bg-brand-600 border-2 border-brand-600 p-8 relative flex flex-col shadow-xl">
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span class="inline-flex items-center px-4 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-widest">
                Most popular
              </span>
            </div>

            <div class="mb-6">
              <h3 class="text-h3 font-bold text-white mb-1">
                Plus
              </h3>
              <p class="text-body-sm text-white/70 mb-4">
                For regular senders
              </p>
              <div class="text-hero font-bold text-white mb-0.5">
                <span v-if="pricingLoading">—</span>
                <span v-else-if="billingInterval === 'year'">{{ billedAnnuallyMonthlyPrice }}</span>
                <span v-else>{{ plusPriceDisplay }}</span>
              </div>
              <div class="text-body-sm text-white/70">
                {{ plusPriceSuffix }}
              </div>
              <p
v-if="billedAnnuallyMonthlyDisplay"
class="mt-1 text-body-sm text-white/60"
>
                ${{ resolvedYear.amount }} billed annually
              </p>
              <p class="mt-2 text-body-sm text-white/60">
                Cancel anytime
              </p>
            </div>

            <ul class="space-y-4 mb-8 flex-grow">
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Provider comparisons</span>
                <span class="text-body-sm font-semibold text-white">30+</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Watchlist corridors</span>
                <span class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-white">
                  <span class="text-white/40 line-through font-normal">3</span>
                  16
                </span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Active rate alerts</span>
                <span class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-white">
                  <span class="text-white/40 line-through font-normal">1</span>
                  16
                </span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Rate history</span>
                <span class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-white">
                  <span class="text-white/40 line-through font-normal">30d</span>
                  90 days
                </span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Data exports</span>
                <span class="text-body-sm font-semibold text-white">CSV & PDF</span>
              </li>
              <li class="flex items-center justify-between gap-3">
                <span class="text-body-sm text-white/80">Ad-free</span>
                <span class="text-body-sm font-semibold text-white">✓</span>
              </li>
            </ul>

            <button
              v-if="!isAuthenticated"
              class="w-full py-3 rounded-xl bg-white text-brand-600 hover:bg-neutral-50 font-bold text-body-sm mt-auto motion-safe:transition-colors"
              @click="navigateTo('/sign-up')"
            >
              Get started
            </button>
            <button
              v-else-if="!isPlus"
              class="w-full py-3 rounded-xl bg-white text-brand-600 hover:bg-neutral-50 font-bold text-body-sm mt-auto motion-safe:transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="checkoutLoading || portalLoading"
              @click="handleUpgrade"
            >
              {{ checkoutLoading ? 'Starting…' : 'Upgrade to Plus' }}
            </button>
            <div
              v-else
              class="w-full py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-body-sm text-center mt-auto"
            >
              Current plan
            </div>
          </div>

          <!-- Enterprise Plan -->
          <div
            v-if="enterpriseEnabled"
            class="rounded-2xl bg-neutral-900 border-2 border-neutral-700 p-8 flex flex-col"
          >
            <div class="mb-6">
              <h3 class="text-h3 font-bold text-white mb-1">
                Enterprise
              </h3>
              <p class="text-body-sm text-neutral-400 mb-4">
                For teams & businesses
              </p>
              <div class="text-h2 font-bold text-white mb-0.5">
                Let's talk
              </div>
              <div class="text-body-sm text-neutral-500">
                Custom pricing
              </div>
            </div>

            <ul class="space-y-3 mb-8 flex-grow">
              <li class="flex items-start gap-2.5">
                <Icon
name="check"
:size="20"
class="text-brand-400 flex-shrink-0 mt-0.5"
/>
                <span class="text-body-sm text-neutral-300 font-medium">Everything in Plus</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon
name="check"
:size="20"
class="text-brand-400 flex-shrink-0 mt-0.5"
/>
                <span class="text-body-sm text-neutral-300">Extended rate history</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon
name="check"
:size="20"
class="text-brand-400 flex-shrink-0 mt-0.5"
/>
                <span class="text-body-sm text-neutral-300">Custom data exports</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon
name="check"
:size="20"
class="text-brand-400 flex-shrink-0 mt-0.5"
/>
                <span class="text-body-sm text-neutral-300">Data integrations & API access</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon
name="check"
:size="20"
class="text-brand-400 flex-shrink-0 mt-0.5"
/>
                <span class="text-body-sm text-neutral-300">Dedicated account manager</span>
              </li>
            </ul>

            <NuxtLink
              to="/contact?type=enterprise"
              class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-body-sm text-center block mt-auto motion-safe:transition-colors"
            >
              Contact sales
            </NuxtLink>
          </div>
        </div>

        <p class="text-center text-body-sm text-neutral-400 mt-8">
          Rankings are identical for free and Plus users — no pay-to-rank, ever.
        </p>
      </div>
    </section>

    <!-- Trust metrics -->
    <TrustMetricsStrip bg-class="bg-brand-600" />

    <!-- Features -->
    <section
      v-reveal.slide-left
      class="py-16 sm:py-20 bg-neutral-900"
    >
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-white mb-3">
            Everything you get with Plus
          </h2>
          <p class="text-body-lg text-neutral-400 [text-wrap:balance]">
            Built for people who send money regularly
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<!-- Pulse access — full-width flagship card -->
          <div
            v-if="pulseEnabled"
            class="lg:col-span-3 flex flex-col lg:flex-row lg:items-center gap-6 bg-brand-600 rounded-2xl p-8 shadow-lg"
          >
            <div class="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3 lg:flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Icon
name="signal"
:size="24"
class="text-white"
/>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-h3 font-bold text-white mb-2">Pulse access</h3>
              <p class="text-body text-white/80 leading-relaxed">
                See send-timing signals and live provider quotes for your corridor. Pulse tells you if now is a good time to send — based on real market data, not guesswork.
              </p>
            </div>
            <p class="text-body-sm text-white/50 lg:max-w-xs lg:text-right lg:flex-shrink-0 lg:border-l lg:border-white/20 lg:pl-6">
              Free users have no Pulse access — Plus unlocks it entirely.
            </p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="bell-alert"
:size="20"
class="text-brand-400"
/>
              </div>
              <div class="flex items-center gap-2 text-body-sm">
                <span class="text-white/30 line-through">1</span>
                <span class="font-semibold text-white bg-brand-600/50 px-2 py-0.5 rounded-lg border border-brand-600/60">16</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">Smart alerts</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                Target-rate and send-score alerts. Get notified the moment your corridor hits the threshold you set.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Free: 1 alert</p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="bookmark"
:size="20"
class="text-brand-400"
/>
              </div>
              <div class="flex items-center gap-2 text-body-sm">
                <span class="text-white/30 line-through">3</span>
                <span class="font-semibold text-white bg-brand-600/50 px-2 py-0.5 rounded-lg border border-brand-600/60">16</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">Watchlist corridors</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                Track up to 16 corridors at once. Weekly digests show what moved so you never miss a shift.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Free: 3 corridors</p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="chart-bar"
:size="20"
class="text-brand-400"
/>
              </div>
              <div class="flex items-center gap-2 text-body-sm">
                <span class="text-white/30 line-through">30d</span>
                <span class="font-semibold text-white bg-brand-600/50 px-2 py-0.5 rounded-lg border border-brand-600/60">90d</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">Rate history</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                Up to 90 days of corridor data. Spot patterns, time recurring transfers, and see how rates trended.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Free: 30-day history only</p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="arrow-down-tray"
:size="20"
class="text-brand-400"
/>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide bg-brand-600/50 text-white px-2 py-0.5 rounded-full border border-brand-600/60">Plus only</span>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">Data exports</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                Download rate history and transfer records as CSV or PDF. Ready for tax records and expense tracking.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Free: no exports</p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="shield-check"
:size="20"
class="text-brand-400"
/>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wide bg-brand-600/50 text-white px-2 py-0.5 rounded-full border border-brand-600/60">Plus only</span>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">Ad-free dashboard</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                No banners, no sponsored placements. Just clean data and the tools you need to make better decisions.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Free: ads shown</p>
          </div>

          <div class="flex flex-col gap-3 bg-white/5 border border-dashed border-white/20 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Icon
name="sparkles"
:size="20"
class="text-brand-400"
/>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-body-lg font-bold text-white mb-1">More coming</h3>
              <p class="text-body-sm text-white/60 leading-relaxed">
                New features are in the pipeline. Plus subscribers get early access.
              </p>
            </div>
            <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">Stay tuned</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section
      v-reveal
      class="py-16 bg-surface"
    >
      <div class="mx-auto max-w-3xl px-page-x">
        <h2 class="text-h2 font-bold text-rs-fg text-center mb-10">
          Frequently asked questions
        </h2>
        <FaqAccordion :faqs="plusFaqs" />
      </div>
    </section>

    <!-- Final CTA -->
    <section
      v-reveal.scale-in
      class="py-16 sm:py-20 bg-brand-600"
    >
      <div class="mx-auto max-w-3xl px-page-x text-center">
        <h2 class="text-h1 font-bold text-white mb-4">
          Ready to get started?
        </h2>
        <p class="text-h4 text-white/80 mb-8 leading-relaxed">
          <template v-if="!isAuthenticated">
            Create a free account and upgrade to Plus anytime.
          </template>
          <template v-else-if="!isPlus">
            Unlock alerts, history, exports, and an ad-free dashboard.
          </template>
          <template v-else>
            You already have Plus. Manage your subscription below.
          </template>
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <template v-if="!isAuthenticated">
            <NuxtLink
              to="/sign-up"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-neutral-50 text-brand-600 rounded-xl font-bold text-body-lg motion-safe:transition-colors shadow-lg"
            >
              Create free account
            </NuxtLink>
            <NuxtLink
              to="/sign-in"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-body-lg motion-safe:transition-colors"
            >
              Sign in
            </NuxtLink>
          </template>
          <template v-else-if="!isPlus">
            <button
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-neutral-50 text-brand-600 rounded-xl font-bold text-body-lg motion-safe:transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="checkoutLoading || portalLoading"
              @click="handleUpgrade"
            >
              {{ checkoutLoading ? 'Starting…' : 'Upgrade to Plus' }}
            </button>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-body-lg motion-safe:transition-colors"
            >
              Questions? Contact us
            </NuxtLink>
          </template>
          <template v-else>
            <button
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-neutral-50 text-brand-600 rounded-xl font-bold text-body-lg motion-safe:transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="portalLoading"
              @click="handleManageSubscription"
            >
              {{ portalLoading ? 'Opening…' : 'Manage subscription' }}
            </button>
          </template>
        </div>
        <p class="mt-6 text-body-sm text-white/50">
          No credit card required for free account · Cancel anytime
        </p>
      </div>
    </section>
</div>
</template>

<script setup lang="ts">
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import FaqAccordion from '~/components/shared/FaqAccordion.vue'
import { Icon } from '~/ui'
import { formatMoney as formatMoneyUtil } from '~/shared/lib/format'

const { isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()
const { enterpriseEnabled, pulseEnabled } = useFeatureFlags()
const billingActions = useBilling()
const checkoutLoading = computed(() => billingActions.checkoutLoading.value)
const portalLoading = computed(() => billingActions.portalLoading.value)

const billingInterval = useState<'month' | 'year'>('billingInterval', () => 'year')

type BillingPricingResponse = {
  success: true
  configured: boolean
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

const PRICE_FALLBACK = { monthlyUsd: 6, annualUsd: 46, currency: 'USD' }

const resolvedMonth = computed(() => {
  const a = pricing.value?.plus.month.amount
  const c = pricing.value?.plus.month.currency
  return { amount: (typeof a === 'number' && a > 0) ? a : PRICE_FALLBACK.monthlyUsd, currency: c || PRICE_FALLBACK.currency }
})

const resolvedYear = computed(() => {
  const a = pricing.value?.plus.year.amount
  const c = pricing.value?.plus.year.currency
  return { amount: (typeof a === 'number' && a > 0) ? a : PRICE_FALLBACK.annualUsd, currency: c || PRICE_FALLBACK.currency }
})

const formatMoney = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return null
  return formatMoneyUtil(amount, { currency })
}

const plusPriceDisplay = computed(() => {
  const p = billingInterval.value === 'year' ? resolvedYear.value : resolvedMonth.value
  return formatMoney(p.amount, p.currency)
})

const billedAnnuallyMonthlyPrice = computed(() => {
  if (billingInterval.value !== 'year') return null
  return formatMoney(resolvedYear.value.amount / 12, resolvedYear.value.currency)
})

const billedAnnuallyMonthlyDisplay = computed(() => (
  billingInterval.value === 'year' && Boolean(billedAnnuallyMonthlyPrice.value)
))

const plusPriceSuffix = computed(() => {
  if (billingInterval.value === 'year') return 'per month (billed annually)'
  return 'per month'
})

const annualSavingsPct = computed(() => {
  const month = resolvedMonth.value.amount
  const year = resolvedYear.value.amount
  if (!month || !year) return null
  const pct = (1 - year / (month * 12)) * 100
  if (!Number.isFinite(pct)) return null
  return Math.max(0, Math.round(pct))
})

async function handleUpgrade() {
  if (!isAuthenticated.value) {
    await navigateTo({ path: '/sign-in', query: { redirect: '/plus' } })
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

async function handleManageSubscription() {
  const portalResult = await billingActions.openBillingPortal()
  if (!portalResult.ok) {
    alert(portalResult.error || 'Unable to open billing portal.')
  }
}

const plusFaqs = [
  {
    question: 'Does Plus change how rates are ranked?',
    answer: 'No. Plus is a feature upgrade only. All rankings and comparisons remain 100% data-driven and identical for free and Plus users. Providers cannot pay to rank higher regardless of plan.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel anytime from your account settings or by managing your subscription via the billing portal. Your Plus features remain active until the end of your current billing period.',
  },
  {
    question: 'Can I switch between monthly and annual billing?',
    answer: 'Yes. You can switch billing intervals at any time through the billing portal. Changes take effect at the start of your next billing period.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit and debit cards. All payments are processed securely through Stripe.',
  },
]

useHead({
  title: 'Plus — Alerts, History & Exports | Remit-Scout',
  meta: [
    {
      name: 'description',
      content: 'Upgrade to Remit-Scout Plus for 16 smart alerts, 90-day rate history, data exports, 16 watchlist corridors, and an ad-free experience.',
    },
  ],
})
</script>
