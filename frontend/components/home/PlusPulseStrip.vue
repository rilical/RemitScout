<script setup lang="ts">
import { computed } from 'vue'
import { BoltIcon } from '@heroicons/vue/24/outline'
import { useEntitlements } from '~/composables/useEntitlements'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'

const { isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()
const { pulseEnabled } = useFeatureFlags()

const pulseCtaLabel = computed(() => (isPlus.value ? 'Open Pulse' : 'Preview Pulse'))
const plusCtaLabel = computed(() => {
  if (!isAuthenticated.value) return 'Get Plus'
  return isPlus.value ? 'You are Plus' : 'Upgrade to Plus'
})

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
const { data: pricing } = await useAsyncData(
  'home:billing:pricing',
  () => request<BillingPricingResponse>('/billing/pricing', { retries: 0 }),
  { server: true },
)

const formatMoney = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return null
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  }
  catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`
  }
}

const plusMonthly = computed(() => pricing.value?.plus.month ?? null)
const plusAnnual = computed(() => pricing.value?.plus.year ?? null)
const plusMonthlyDisplay = computed(() => formatMoney(plusMonthly.value?.amount ?? null, plusMonthly.value?.currency ?? null))
const plusAnnualMonthlyEquivalentDisplay = computed(() => {
  const annualAmount = plusAnnual.value?.amount
  const currency = plusAnnual.value?.currency
  if (typeof annualAmount !== 'number' || !Number.isFinite(annualAmount) || annualAmount <= 0) return null
  if (!currency) return null
  const monthly = annualAmount / 12
  const formatted = formatMoney(monthly, currency)
  return formatted ? `${formatted} / mo billed annually` : null
})
</script>

<template>
  <section class="py-10 sm:py-12 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Pulse -->
        <div
          v-if="pulseEnabled"
          class="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 sm:p-8 shadow-sm"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
                <BoltIcon class="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-600">
                  Remit-Scout Pulse
                </div>
                <div class="text-2xl font-extrabold text-slate-900 leading-tight">
                  Market moves, in plain English
                </div>
              </div>
            </div>
            <NuxtLink
              to="/pulse"
              class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              {{ pulseCtaLabel }}
            </NuxtLink>
          </div>

          <p class="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">
            Pulse shows volatility, spreads, and provider shifts across corridors so users can time transfers and analysts can spot anomalies.
          </p>

          <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Volatility
              </div>
              <div class="mt-1 text-sm font-semibold text-slate-900">
                RVI (bps)
              </div>
              <div class="mt-1 text-xs text-slate-600">
                Comparable across corridors.
              </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cost
              </div>
              <div class="mt-1 text-sm font-semibold text-slate-900">
                RCI
              </div>
              <div class="mt-1 text-xs text-slate-600">
                Hidden fee pressure, quantified.
              </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rate
              </div>
              <div class="mt-1 text-sm font-semibold text-slate-900">
                TEER
              </div>
              <div class="mt-1 text-xs text-slate-600">
                Effective delivery vs mid-market.
              </div>
            </div>
          </div>
        </div>

        <!-- Plus -->
        <div class="rounded-2xl border border-blue-200 bg-blue-600 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <img
                src="/png/SVG/LOGO_PLUS.svg"
                alt="Remit-Scout Plus"
                class="h-10 w-10 object-contain"
              >
              <div>
                <div class="text-sm font-semibold text-white/80">
                  Remit-Scout Plus
                </div>
                <div class="text-2xl font-extrabold text-white leading-tight">
                  Alerts and history that actually save money
                </div>
                <div class="mt-2 text-xs font-semibold text-white/90">
                  <span v-if="plusMonthlyDisplay">{{ plusMonthlyDisplay }}/mo</span>
                  <span v-else>Pricing at checkout</span>
                  <span v-if="plusAnnualMonthlyEquivalentDisplay"> • {{ plusAnnualMonthlyEquivalentDisplay }}</span>
                </div>
              </div>
            </div>
            <NuxtLink
              to="/plus"
              class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              :class="isPlus ? 'opacity-80' : ''"
            >
              {{ plusCtaLabel }}
            </NuxtLink>
          </div>

          <p class="mt-4 text-sm sm:text-base text-white/90 leading-relaxed">
            Plus monitors corridors 24/7, sends instant rate alerts, unlocks Pulse, enables exports, and removes ads.
          </p>

          <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl bg-white/10 border border-white/20 p-4">
              <div class="text-xs font-semibold text-white/80 uppercase tracking-wide">
                16 smart alerts
              </div>
              <div class="mt-1 text-sm font-semibold text-white">
                Eligible corridors only
              </div>
            </div>
            <div class="rounded-xl bg-white/10 border border-white/20 p-4">
              <div class="text-xs font-semibold text-white/80 uppercase tracking-wide">
                Exports
              </div>
              <div class="mt-1 text-sm font-semibold text-white">
                CSV and PDF, investor-grade
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
