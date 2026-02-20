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
              · <button class="text-brand-400 hover:text-brand-300 font-semibold motion-safe:transition-colors" @click="handleUpgrade">Upgrade now</button>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-16 sm:py-20 bg-surface">
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-10">
          <h2 class="text-h1 font-bold text-rs-fg mb-3">
            Choose your plan
          </h2>
          <p class="text-body-lg text-neutral-600">
            All plans include access to compare 30+ providers across 150+ corridors.
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

            <ul class="space-y-3 mb-8 flex-grow">
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-neutral-500 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-700">Compare 30+ providers</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-neutral-500 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-700">3 watchlist corridors</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-neutral-500 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-700">1 active rate alert</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-neutral-500 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-700">30-day rate history</span>
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
                <span v-else-if="billingInterval === 'year' && billedAnnuallyMonthlyPrice">{{ billedAnnuallyMonthlyPrice }}</span>
                <span v-else-if="plusPriceDisplay">{{ plusPriceDisplay }}</span>
                <span v-else>See pricing</span>
              </div>
              <div class="text-body-sm text-white/70">
                {{ plusPriceSuffix }}
              </div>
              <p v-if="billedAnnuallyMonthlyDisplay" class="mt-1 text-body-sm text-white/60">
                {{ plusPriceDisplay }} billed annually
              </p>
              <p class="mt-2 text-body-sm text-white/60">
                Cancel anytime
              </p>
            </div>

            <ul class="space-y-3 mb-8 flex-grow">
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-white font-medium">Everything in Free</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-body-sm text-white font-medium">16 smart alerts</span>
                  <p class="text-[12px] text-white/60 mt-0.5">Target-rate and send-score alerts</p>
                </div>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-body-sm text-white font-medium">16 watchlist corridors</span>
                  <p class="text-[12px] text-white/60 mt-0.5">Up from 3 on free</p>
                </div>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-body-sm text-white font-medium">365-day rate history</span>
                  <p class="text-[12px] text-white/60 mt-0.5">Full year of corridor data</p>
                </div>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-white font-medium">Data exports (CSV & PDF)</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-white flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-white font-medium">Ad-free experience</span>
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
                <Icon name="check" :size="18" class="text-brand-400 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-300 font-medium">Everything in Plus</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-brand-400 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-300">Extended rate history</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-brand-400 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-300">Custom data exports</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-brand-400 flex-shrink-0 mt-0.5" />
                <span class="text-body-sm text-neutral-300">Data integrations & API access</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Icon name="check" :size="18" class="text-brand-400 flex-shrink-0 mt-0.5" />
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
    <section class="py-16 bg-neutral-50">
      <div class="mx-auto max-w-page px-page-x">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-bold text-rs-fg mb-3">
            Everything you get with Plus
          </h2>
          <p class="text-body-lg text-neutral-600">
            Built for people who send money regularly
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="bell-alert" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              Smart rate alerts
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Set target rates and get notified the moment your corridor hits the threshold. Up to 16 active alerts across all your routes.
            </p>
          </div>

          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="chart-bar" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              Full year of history
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Access 365 days of rate data. Spot volatility patterns and identify the best windows for recurring transfers.
            </p>
          </div>

          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="arrow-down-tray" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              Export your data
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Download rate history and transfer records as CSV or PDF. Ready for tax records, accounting, and expense tracking.
            </p>
          </div>

          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="bookmark" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              16-corridor watchlist
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Track up to 16 corridors at once. Weekly digest emails surface what moved so you never miss a shift.
            </p>
          </div>

          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="sparkles" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              Ad-free experience
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              No sponsor banners, no display ads, no promotional clutter. Clean data and tools to find the best rate — nothing else.
            </p>
          </div>

          <div class="rounded-2xl bg-surface border border-rs-border p-6">
            <div class="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon name="shield-check" :size="22" class="text-brand-600" />
            </div>
            <h3 class="text-body-lg font-bold text-rs-fg mb-2">
              Rankings stay identical
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              Plus unlocks tools — not better rankings. All comparisons remain data-driven and identical regardless of subscription status.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-surface">
      <div class="mx-auto max-w-3xl px-page-x">
        <h2 class="text-h2 font-bold text-rs-fg text-center mb-10">
          Frequently asked questions
        </h2>
        <FaqAccordion :faqs="plusFaqs" />
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 bg-brand-600">
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
const { enterpriseEnabled } = useFeatureFlags()
const billingActions = useBilling()
const checkoutLoading = computed(() => billingActions.checkoutLoading.value)
const portalLoading = computed(() => billingActions.portalLoading.value)

const billingInterval = useState<'month' | 'year'>('billingInterval', () => 'year')

type BillingPricingResponse = {
  success: true
  configured: boolean
  plus: {
    month: { amount: number | null; currency: string | null; priceId: string | null }
    year: { amount: number | null; currency: string | null; priceId: string | null }
  }
}

const { request } = useApi()
const { data: pricing, pending: pricingLoading } = await useAsyncData(
  'billing:pricing',
  () => request<BillingPricingResponse>('/billing/pricing', { retries: 0 }),
  { server: true },
)

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

const billedAnnuallyMonthlyDisplay = computed(() => (
  billingInterval.value === 'year'
  && Boolean(billedAnnuallyMonthlyPrice.value)
  && Boolean(plusPriceDisplay.value)
))

const plusPriceSuffix = computed(() => {
  if (billingInterval.value === 'year' && billedAnnuallyMonthlyPrice.value) {
    return 'per month (billed annually)'
  }
  if (plusPriceDisplay.value) {
    return 'per month'
  }
  return ''
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
      content: 'Upgrade to Remit-Scout Plus for 16 smart alerts, 365-day rate history, data exports, 16 watchlist corridors, and an ad-free experience.',
    },
  ],
})
</script>
