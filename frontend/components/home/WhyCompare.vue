<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/40 to-white py-24 sm:py-32">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.03),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.03),transparent_50%)]" />

    <div class="relative container">
      <div class="text-center">
        <div class="mb-6 inline-flex items-center gap-3 rounded-full border border-primary-200/60 bg-gradient-to-r from-primary-50 via-white to-accent-600 px-6 py-2.5 shadow-sm">
          <ShieldCheckIcon class="h-4 w-4 text-primary-600" />
          <span class="text-body-sm font-semibold tracking-wide text-neutral-700">Trusted by Global Professionals</span>
        </div>

        <h2 class="mx-auto max-w-4xl text-hero font-bold tracking-tight text-rs-fg">
          {{ title }}
        </h2>

        <p class="mx-auto mt-6 max-w-3xl text-body-lg leading-relaxed text-neutral-600">
          {{ content }}
        </p>

        <div class="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-8 text-center">
          <div class="flex items-center gap-2">
            <div class="flex -space-x-2">
              <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 ring-2 ring-white" />
              <div class="h-8 w-8 rounded-full bg-gradient-to-br from-accent-600 to-accent-600 ring-2 ring-white" />
              <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-brand-600 ring-2 ring-white" />
            </div>
            <p class="text-body-sm font-medium text-neutral-700" />
          </div>
          <div class="h-8 w-px bg-neutral-200" />
          <div class="flex items-center gap-2">
            <CheckBadgeIcon class="h-6 w-6 text-primary-600" />
            <p class="text-body-sm font-medium text-neutral-700">
              <span class="font-bold text-rs-fg">$2.9M</span> saved this year
            </p>
          </div>
        </div>
      </div>

      <div class="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="group relative overflow-hidden rounded-2xl border border-rs-border/60 bg-surface p-8 shadow-lg motion-safe:transition-all hover:border-primary-200 hover:shadow-xl">
          <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary-500/10 to-accent-600/10 blur-2xl motion-safe:transition-all group-hover:scale-150" />
          <div class="relative">
            <div class="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
              <ChartBarIcon class="h-7 w-7 text-white" />
            </div>
            <h3 class="mt-6 text-h4 font-bold text-rs-fg">
              Enterprise-Grade Analysis
            </h3>
            <p class="mt-3 text-body leading-relaxed text-neutral-600">
              Institutional-level benchmarking across 222 countries. We track every basis point in fees and FX spreads to deliver complete transparency.
            </p>
            <div class="mt-6 flex items-center gap-2 text-body-sm font-medium text-primary-600">
              <DocumentCheckIcon class="h-5 w-5" />
              <span>Verified by independent auditors</span>
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-rs-border/60 bg-surface p-8 shadow-lg motion-safe:transition-all hover:border-accent-600 hover:shadow-xl">
          <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-accent-600/10 to-danger-500/10 blur-2xl motion-safe:transition-all group-hover:scale-150" />
          <div class="relative">
            <div class="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent-600 to-accent-600 shadow-lg shadow-accent-600/30">
              <BanknotesIcon class="h-7 w-7 text-white" />
            </div>
            <h3 class="mt-6 text-h4 font-bold text-rs-fg">
              Quantified ROI
            </h3>
            <p class="mt-3 text-body leading-relaxed text-neutral-600">
              Our USD→INR recommendations retained {{ currencyFormatter.format(35.7) }} per $1,000 last month versus traditional banking channels.
            </p>
            <div class="mt-6 flex items-center gap-2 text-body-sm font-medium text-accent-600">
              <CalculatorIcon class="h-5 w-5" />
              <span>Calculate your personal savings</span>
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-rs-border/60 bg-surface p-8 shadow-lg motion-safe:transition-all hover:border-warning-600 hover:shadow-xl">
          <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-warning-600/10 to-warning-500/10 blur-2xl motion-safe:transition-all group-hover:scale-150" />
          <div class="relative">
            <div class="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-warning-600 to-warning-600 shadow-lg shadow-warning-600/30">
              <ClockIcon class="h-7 w-7 text-white" />
            </div>
            <h3 class="mt-6 text-h4 font-bold text-rs-fg">
              Real-Time Intelligence
            </h3>
            <p class="mt-3 text-body leading-relaxed text-neutral-600">
              Automated updates every 10 minutes. Never miss optimal transfer windows when exchange rates or fees shift in your favor.
            </p>
            <div class="mt-6 flex items-center gap-2 text-body-sm font-medium text-warning-600">
              <BoltIcon class="h-5 w-5" />
              <span>API-grade refresh rate</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-20 overflow-hidden rounded-3xl border border-rs-border/60 bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900 shadow-2xl">
        <div class="border-b border-white/10 bg-gradient-to-r from-primary-900/50 to-accent-600/50 px-8 py-8 sm:px-12">
          <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-1.5 ring-1 ring-primary-400/30">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                  <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500" />
                </span>
                <span class="text-body-sm font-semibold uppercase tracking-wider text-primary-300">Live Market Data</span>
              </div>
              <h3 class="text-h2 font-bold text-white">
                Verified Savings Analysis
              </h3>
              <p class="mt-2 text-body-sm text-neutral-400">
                Real transfers, real savings • Updated {{ lastUpdated }}
              </p>
            </div>
            <div class="flex items-center gap-3 rounded-xl bg-surface/5 px-6 py-4 ring-1 ring-white/10">
              <ArrowTrendingDownIcon class="h-8 w-8 text-success-600" />
              <div>
                <p class="text-body-sm font-medium uppercase tracking-wider text-neutral-400">
                  Avg. Cost Reduction
                </p>
                <p class="text-h3 font-bold text-white">
                  {{ ((averageSavingsPerThousand / 1000) * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 p-8 sm:p-12 lg:grid-cols-3">
          <article
            v-for="entry in corridorSavings"
            :key="entry.corridor"
            class="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 p-6 backdrop-blur-sm motion-safe:transition-all hover:border-primary-400/30 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary-500/10 to-accent-600/10 blur-2xl motion-safe:transition-all group-hover:scale-125" />

            <div class="relative">
              <div class="flex items-start justify-between">
                <div>
                  <div class="inline-flex items-center gap-2 rounded-lg bg-surface/5 px-3 py-1.5 ring-1 ring-white/10">
                    <GlobeAltIcon class="h-3.5 w-3.5 text-neutral-400" />
                    <span class="text-body-sm font-bold text-neutral-200">{{ entry.corridor }}</span>
                  </div>
                  <p class="mt-3 flex items-center gap-1.5 text-body-sm text-neutral-400">
                    <DocumentMagnifyingGlassIcon class="h-3.5 w-3.5" />
                    {{ entry.sampleSize }}
                  </p>
                </div>
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success-600/10 ring-1 ring-success-600/20">
                  <CheckCircleIcon class="h-5 w-5 text-success-600" />
                </div>
              </div>

              <div class="mt-6 rounded-xl border border-success-600/20 bg-gradient-to-br from-success-600/5 to-success-600/5 p-5 backdrop-blur-sm">
                <p class="text-body-sm font-bold uppercase tracking-[0.15em] text-success-600">
                  Optimal Provider
                </p>
                <p class="mt-2 text-h3 font-bold text-white">
                  {{ entry.bestProvider }}
                </p>
                <div class="mt-3 flex items-baseline gap-2">
                  <span class="text-h2 font-bold text-success-600">{{ currencyFormatter.format(entry.retained) }}</span>
                  <span class="text-body-sm font-medium text-success-600">additional value delivered</span>
                </div>
              </div>

              <div class="mt-5 space-y-1.5 rounded-lg bg-surface/5 p-3 text-body-sm">
                <div class="flex items-center gap-2 text-neutral-400">
                  <ClockIcon class="h-3.5 w-3.5" />
                  <span>{{ entry.payoutSpeed }}</span>
                </div>
                <div class="flex items-center gap-2 text-rs-muted">
                  <CurrencyDollarIcon class="h-3.5 w-3.5" />
                  <span>{{ entry.midMarketRate }}</span>
                </div>
              </div>

              <div class="mt-6 space-y-4 rounded-lg bg-neutral-900/50 p-4">
                <div>
                  <div class="flex items-center justify-between text-body-sm">
                    <span class="flex items-center gap-1.5 font-medium text-neutral-400">
                      <BuildingLibraryIcon class="h-3.5 w-3.5" />
                      Traditional Bank
                    </span>
                    <span class="font-bold text-danger-600">{{ currencyFormatter.format(entry.bankCost) }}</span>
                  </div>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-neutral-900/50 ring-1 ring-white/5">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-danger-600 via-danger-600 to-danger-600 shadow-lg shadow-danger-600/50 motion-safe:transition-all motion-safe:duration-700"
                      :style="{ width: `${barWidth(entry.bankCost)}%` }"
                    />
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-body-sm">
                    <span class="flex items-center gap-1.5 font-medium text-neutral-400">
                      <SparklesIcon class="h-3.5 w-3.5" />
                      Remit-Scout Pick
                    </span>
                    <span class="font-bold text-success-600">{{ currencyFormatter.format(entry.bestCost) }}</span>
                  </div>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-neutral-900/50 ring-1 ring-white/5">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-success-600 via-success-600 to-success-600 shadow-lg shadow-success-600/50 motion-safe:transition-all motion-safe:duration-700"
                      :style="{ width: `${barWidth(entry.bestCost)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="border-t border-white/10 bg-neutral-900/50 px-8 py-6 sm:px-12">
          <p class="text-center text-body-sm leading-relaxed text-neutral-400">
            {{ chartCaption }}
          </p>
        </div>
      </div>

      <div class="mt-20 overflow-hidden rounded-3xl border border-rs-border/60 bg-gradient-to-br from-white via-primary-50/30 to-white p-8 shadow-xl sm:p-12">
        <div class="mb-12 text-center">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5">
            <ChartPieIcon class="h-4 w-4 text-primary-600" />
            <span class="text-body-sm font-bold uppercase tracking-wider text-primary-900">Performance Metrics</span>
          </div>
          <h3 class="text-h2 font-bold text-rs-fg">
            Institutional-Grade Results
          </h3>
          <p class="mt-3 text-body text-neutral-600">
            Transparent, verified, and continuously audited
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="group relative overflow-hidden rounded-2xl border border-rs-border/60 bg-surface p-7 text-center shadow-lg motion-safe:transition-all hover:scale-105 hover:border-primary-200 hover:shadow-xl"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-accent-600/0 to-danger-500/0 opacity-0 motion-safe:transition-opacity group-hover:opacity-5" />
            <div class="relative">
              <div
                class="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent-600 ring-1 ring-primary-100"
              >
                <component
                  :is="stat.icon"
                  class="h-8 w-8 text-primary-600"
                />
              </div>
              <div class="text-h1 font-bold text-rs-fg">
                {{ stat.value }}
              </div>
              <div class="mt-2 text-body-sm font-medium text-neutral-600">
                {{ stat.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  BanknotesIcon,
  CalculatorIcon,
  ClockIcon,
  BoltIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  SparklesIcon,
  ChartPieIcon,
  CurrencyPoundIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  SignalIcon,
} from '@heroicons/vue/24/outline'

interface Stat {
  label: string
  value: string
  icon?: Component
}

interface Props {
  title?: string
  content?: string
  chartCaption?: string
  stats?: Stat[]
}

interface CorridorSavings {
  corridor: string
  bestProvider: string
  retained: number
  bankCost: number
  bestCost: number
  midMarketRate: string
  sampleSize: string
  payoutSpeed: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Maximize Every International Transfer',
  content: 'Our institutional-grade analysis monitors 33 premier money transfer providers across 49,000+ global corridors. For professionals sending $1,000 USD to INR, traditional banks extract $42.60 in hidden FX margins. Our optimized recommendations deliver $35.70 more to your beneficiaries, capital that belongs in your family\'s hands, not corporate coffers.',
  chartCaption: 'Source: Remit-Scout Enterprise Analytics Platform (May 15 – Jun 13, 2024). Total cost methodology encompasses all transfer fees, foreign exchange spreads above interbank mid-market rates, and recipient-side charges. Data independently verified and continuously audited.',
})

const DEFAULT_STATS: readonly Stat[] = [
  { label: 'Average capital retained per $1k transfer', value: '$29.70', icon: CurrencyPoundIcon },
  { label: 'Total verified savings this year', value: '$2.9M', icon: BuildingOffice2Icon },
  { label: 'Monitored providers with real-time API', value: '33', icon: SignalIcon },
  { label: 'Cross-border corridors analyzed', value: '162', icon: MapPinIcon },
] as const

const stats = computed(() => props.stats ?? DEFAULT_STATS)

const corridorSavings: readonly CorridorSavings[] = [
  {
    corridor: 'USD → INR',
    bestProvider: 'Revolut',
    retained: 35.7,
    bankCost: 42.6,
    bestCost: 6.9,
    midMarketRate: '1 USD = 83.52 INR',
    sampleSize: '9,642 transfers tracked',
    payoutSpeed: 'Bank deposit • under 15 minutes',
  },
  {
    corridor: 'USD → MXN',
    bestProvider: 'Remitly (Express)',
    retained: 32.7,
    bankCost: 38.4,
    bestCost: 5.7,
    midMarketRate: '1 USD = 17.02 MXN',
    sampleSize: '7,318 transfers tracked',
    payoutSpeed: 'Cash pickup • 30 minutes average',
  },
  {
    corridor: 'GBP → NGN',
    bestProvider: 'LemFi',
    retained: 50.8,
    bankCost: 62.1,
    bestCost: 11.3,
    midMarketRate: '1 GBP = 1,916 NGN',
    sampleSize: '3,204 transfers tracked',
    payoutSpeed: 'Wallet transfer • under 30 minutes',
  },
] as const

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const averageSavingsPerThousand = computed(() => {
  const totalSavings = corridorSavings.reduce((acc, entry) => acc + entry.retained, 0)
  return Number((totalSavings / corridorSavings.length).toFixed(2))
})

const maxBankCost = Math.max(...corridorSavings.map(entry => entry.bankCost))

const barWidth = (cost: number) => {
  const rawWidth = Math.round((cost / maxBankCost) * 100)
  return Math.min(Math.max(rawWidth, 15), 100)
}

const LAST_UPDATED_ISO = '2024-06-13T20:00:00Z'
const lastUpdated = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
}).format(new Date(LAST_UPDATED_ISO))
</script>
