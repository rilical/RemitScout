<script setup lang="ts">
import { useEntitlements } from '~/composables/useEntitlements'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { Icon } from '~/ui'
import { CATEGORY_ACCENT, CHART_STYLE } from '~/lib/pulseChartStyle'
import type { ChartCategory } from '~/types/pulse'

const { isPlus } = useEntitlements()
const { pulseEnabled } = useFeatureFlags()
const ctaLabel = computed(() => (isPlus.value ? 'Open Pulse' : 'Preview Pulse'))

interface TeaserCategory {
  key: ChartCategory
  label: string
  trend: string
  trendLabel: string
  subtitle: string
  chartType: 'area-down' | 'bar' | 'jagged' | 'area-up'
}

const categories: TeaserCategory[] = [
  {
    key: 'cost-markup',
    label: 'Pricing & Margin',
    trend: '↓',
    trendLabel: 'Declining',
    subtitle: 'All-in cost index · FX markup · Fee decomposition',
    chartType: 'area-down',
  },
  {
    key: 'delivered-amount',
    label: 'Competitive Dynamics',
    trend: '↑',
    trendLabel: 'Active',
    subtitle: 'Winner board · Best-rate frequency · Rankings',
    chartType: 'bar',
  },
  {
    key: 'volatility',
    label: 'Volatility & Risk',
    trend: '→',
    trendLabel: 'Stable',
    subtitle: 'Rate volatility · Anomaly detection · Event alerts',
    chartType: 'jagged',
  },
  {
    key: 'availability',
    label: 'Operational Coverage',
    trend: '↑',
    trendLabel: 'Growing',
    subtitle: 'Quote success rate · Currency coverage · Availability',
    chartType: 'area-up',
  },
]

function accentFor(key: ChartCategory): string {
  return CATEGORY_ACCENT[key]
}
</script>

<template>
  <section
v-if="pulseEnabled"
class="py-16 sm:py-20 bg-neutral-900"
>
    <div class="container">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
        <div class="lg:max-w-2xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-body-sm font-semibold text-white/90 mb-4">
            <span
              class="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse-glow"
              aria-hidden="true"
            />
            Remit-Scout Pulse
          </div>
          <h2 class="text-h2 font-bold text-white mb-4 leading-tight">
            Market intelligence for<br class="hidden sm:block">
            remittance pricing
          </h2>
          <p class="text-body-lg text-white/80 leading-relaxed max-w-xl">
            18 live charts across 4 categories track pricing, competition, volatility, and coverage for 49,000+ corridors — all derived from real provider quotes, updated daily.
          </p>
        </div>

        <div class="flex-shrink-0">
          <NuxtLink
            to="/pulse"
            class="group inline-flex items-center gap-3 rounded-xl bg-white px-7 py-3.5 text-body font-semibold text-neutral-900 shadow-lg hover:bg-neutral-100 motion-safe:transition-colors"
          >
            {{ ctaLabel }}
            <Icon
              name="arrow-right"
              :size="16"
              class="text-current motion-safe:transition-transform group-hover:translate-x-1"
            />
          </NuxtLink>
        </div>
      </div>

      <!-- Chart preview cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="cat in categories"
          :key="cat.key"
          :class="CHART_STYLE.card"
          class="overflow-hidden flex flex-col"
        >
          <div class="p-5 flex flex-col flex-1">
            <div class="flex items-center justify-between mb-4">
              <span class="text-body-sm font-bold text-white">{{ cat.label }}</span>
              <span
class="text-xs font-medium"
:style="{ color: accentFor(cat.key) }"
>
                {{ cat.trend }} {{ cat.trendLabel }}
              </span>
            </div>

            <div class="flex-1 mb-4">
              <!-- Area chart (declining) -->
              <svg
                v-if="cat.chartType === 'area-down'"
                :viewBox="CHART_STYLE.sparkline.viewBox"
                class="w-full"
                :class="CHART_STYLE.sparkline.heightClass"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
:id="`tsr-grad-${cat.key}`"
x1="0"
y1="0"
x2="0"
y2="1"
>
                    <stop
offset="0%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.topOpacity"
/>
                    <stop
offset="100%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.bottomOpacity"
/>
                  </linearGradient>
                </defs>
                <path
                  d="M0,42 L20,40 L40,36 L60,38 L80,32 L100,28 L120,25 L140,22 L160,20 L180,17 L200,14 L200,60 L0,60Z"
                  :fill="`url(#tsr-grad-${cat.key})`"
                />
                <polyline
                  points="0,42 20,40 40,36 60,38 80,32 100,28 120,25 140,22 160,20 180,17 200,14"
                  fill="none"
                  :stroke="accentFor(cat.key)"
                  :stroke-width="CHART_STYLE.line.strokeWidth"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <!-- Bar chart -->
              <svg
                v-else-if="cat.chartType === 'bar'"
                :viewBox="CHART_STYLE.sparkline.viewBox"
                class="w-full"
                :class="CHART_STYLE.sparkline.heightClass"
                preserveAspectRatio="none"
              >
                <rect
x="8"
y="24"
width="16"
height="36"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.8"
/>
                <rect
x="32"
y="14"
width="16"
height="46"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.9"
/>
                <rect
x="56"
y="30"
width="16"
height="30"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.6"
/>
                <rect
x="80"
y="10"
width="16"
height="50"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
/>
                <rect
x="104"
y="20"
width="16"
height="40"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.7"
/>
                <rect
x="128"
y="6"
width="16"
height="54"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
/>
                <rect
x="152"
y="16"
width="16"
height="44"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.85"
/>
                <rect
x="176"
y="12"
width="16"
height="48"
:rx="CHART_STYLE.bar.rx"
:fill="accentFor(cat.key)"
opacity="0.95"
/>
              </svg>

              <!-- Jagged line chart -->
              <svg
                v-else-if="cat.chartType === 'jagged'"
                :viewBox="CHART_STYLE.sparkline.viewBox"
                class="w-full"
                :class="CHART_STYLE.sparkline.heightClass"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
:id="`tsr-grad-${cat.key}`"
x1="0"
y1="0"
x2="0"
y2="1"
>
                    <stop
offset="0%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.topOpacity"
/>
                    <stop
offset="100%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.bottomOpacity"
/>
                  </linearGradient>
                </defs>
                <path
                  d="M0,30 L12,26 L24,34 L36,22 L48,38 L60,18 L72,36 L84,24 L96,32 L108,20 L120,35 L132,27 L144,33 L156,25 L168,30 L180,28 L192,32 L200,29 L200,60 L0,60Z"
                  :fill="`url(#tsr-grad-${cat.key})`"
                />
                <polyline
                  points="0,30 12,26 24,34 36,22 48,38 60,18 72,36 84,24 96,32 108,20 120,35 132,27 144,33 156,25 168,30 180,28 192,32 200,29"
                  fill="none"
                  :stroke="accentFor(cat.key)"
                  :stroke-width="CHART_STYLE.line.strokeWidth"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <!-- Area chart (growing) with threshold -->
              <svg
                v-else-if="cat.chartType === 'area-up'"
                :viewBox="CHART_STYLE.sparkline.viewBox"
                class="w-full"
                :class="CHART_STYLE.sparkline.heightClass"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
:id="`tsr-grad-${cat.key}`"
x1="0"
y1="0"
x2="0"
y2="1"
>
                    <stop
offset="0%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.topOpacity"
/>
                    <stop
offset="100%"
:stop-color="accentFor(cat.key)"
:stop-opacity="CHART_STYLE.gradient.bottomOpacity"
/>
                  </linearGradient>
                </defs>
                <path
                  d="M0,46 L20,42 L40,38 L60,36 L80,32 L100,28 L120,26 L140,22 L160,18 L180,15 L200,12 L200,60 L0,60Z"
                  :fill="`url(#tsr-grad-${cat.key})`"
                />
                <polyline
                  points="0,46 20,42 40,38 60,36 80,32 100,28 120,26 140,22 160,18 180,15 200,12"
                  fill="none"
                  :stroke="accentFor(cat.key)"
                  :stroke-width="CHART_STYLE.line.strokeWidth"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="0"
y1="28"
x2="200"
y2="28"
                  stroke="white"
                  :stroke-opacity="CHART_STYLE.grid.opacity"
                  stroke-width="1"
                  :stroke-dasharray="`${CHART_STYLE.grid.dashArray} ${CHART_STYLE.grid.dashArray}`"
                />
              </svg>
            </div>

            <p class="text-xs text-neutral-500">
              {{ cat.subtitle }}
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom stats row -->
      <div class="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-body-sm text-neutral-500">
        <span class="flex items-center gap-2">
          <span class="font-bold text-white tabular-nums">18</span> live charts
        </span>
        <span class="text-neutral-700">·</span>
        <span class="flex items-center gap-2">
          <span class="font-bold text-white tabular-nums">4</span> categories
        </span>
        <span class="text-neutral-700">·</span>
        <span class="flex items-center gap-2">
          <span class="font-bold text-white tabular-nums">49,000+</span> corridors
        </span>
        <span class="text-neutral-700">·</span>
        <span>Updated daily from real provider quotes</span>
      </div>
    </div>
  </section>
</template>
