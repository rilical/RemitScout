<template>
  <section class="py-16 sm:py-20 bg-neutral-900">
    <div class="container">
<!-- Header -->
      <div class="text-center mb-12">
        <NuxtImg
          src="/png/SVG/FULL_LOGO_PLUS.svg"
          alt="Remit-Scout Plus"
          width="304"
          height="64"
          loading="lazy"
          class="h-14 sm:h-16 object-contain mb-8 brightness-0 invert mx-auto"
        />
        <h2 class="text-h1 font-bold text-white mb-5 leading-tight">
          Built for people who<br>
          <span class="text-brand-600">send money every month.</span>
        </h2>
        <p class="text-body-lg text-white/70 max-w-2xl mx-auto mb-2 leading-relaxed">
          {{ headerDescription }}
        </p>
        <p class="text-body text-white/40">
          <template v-if="monthlyPrice">
            <span class="text-white font-semibold">{{ monthlyPrice }}/month.</span> Cancel anytime.
          </template>
          <template v-else>
            Less than a coffee a month. Cancel anytime.
          </template>
        </p>
      </div>

      <!-- Feature grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
<!-- Pulse — flagship, full row -->
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

        <!-- Smart Alerts -->
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
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Free: 1 alert
          </p>
        </div>

        <!-- Watchlist -->
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
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Free: 3 corridors
          </p>
        </div>

        <!-- Rate History -->
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
              A full year of corridor data. Spot patterns, time recurring transfers, and see how rates trended.
            </p>
          </div>
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Free: 30-day history only
          </p>
        </div>

        <!-- Exports -->
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
              Download transfer history and rate data as CSV or PDF. Ready for tax records and expense tracking.
            </p>
          </div>
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Free: no exports
          </p>
        </div>

        <!-- Ad-free -->
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
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Free: ads shown
          </p>
        </div>

        <!-- More coming -->
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
          <p class="text-body-sm text-white/30 pt-3 border-t border-white/10 mt-auto">
            Stay tuned
          </p>
        </div>
</div>

      <!-- CTA block -->
      <div class="text-center pt-10 border-t border-white/10">
        <p class="text-body-sm text-white/50 mb-6 tracking-widest uppercase font-semibold">
          Cancel anytime &nbsp;·&nbsp; No contracts &nbsp;·&nbsp; Start free
        </p>
        <NuxtLink
          to="/plus"
          class="group inline-flex items-center gap-3 px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-body-lg rounded-xl motion-safe:transition-colors shadow-xl mb-6"
        >
          Upgrade to Plus
          <Icon
            name="arrow-right"
            :size="20"
            class="motion-safe:transition-transform group-hover:translate-x-1"
          />
        </NuxtLink>
        <p class="text-body-sm text-white/30 mx-auto flex items-center justify-center gap-2 whitespace-nowrap">
          <Icon
name="shield-check"
:size="16"
class="text-white/30 flex-shrink-0"
/>
          Rankings are identical for free and Plus users — no pay-to-rank, ever.
        </p>
      </div>
</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '~/ui'
import { useApi } from '~/composables/useApi'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()

const headerDescription = computed(() =>
  pulseEnabled.value
    ? 'Pulse access, 16 smart alerts, 90-day history, CSV/PDF exports, and an ad-free dashboard.'
    : '16 smart alerts, 90-day history, CSV/PDF exports, and an ad-free dashboard.',
)

const { request } = useApi()

const { data: pricing } = await useAsyncData(
  'plus-teaser:pricing',
  () => request<{ configured: boolean, plus: { month: { amount: number | null, currency: string | null } } }>('/billing/pricing', { retries: 0 }).catch(() => null),
)

const monthlyPrice = computed(() => {
  const amount = pricing.value?.plus?.month?.amount
  const currency = pricing.value?.plus?.month?.currency
  if (!amount || !currency) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
})
</script>
