<template>
  <section
v-if="pulseEnabled"
class="py-16 sm:py-20 bg-brand-600"
>
    <div class="container">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-surface/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span class="text-body-sm font-semibold text-white">Remit-Scout Pulse</span>
        </div>
        <h2 class="text-h2 font-bold text-white mb-4">
          Real-Time Market Intelligence
        </h2>
        <p class="text-body-lg text-white/90 max-w-3xl mx-auto leading-relaxed break-words">
          Live exchange rates across 49,000+ corridors. Track when rates move up or down. Set alerts to catch the perfect moment to transfer.
        </p>
      </div>

      <!-- What is Pulse - 3 Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-surface rounded-xl border-2 border-neutral-200 p-6 hover:border-brand-300 shadow-md motion-safe:transition-all">
          <div class="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
            Live Exchange Rates
          </h3>
          <p class="text-body-sm text-neutral-700 leading-relaxed">
            Get instant access to real-time exchange rates across 49,000+ corridors. Our system pulls live data from multiple providers and updates every few minutes, so you always see the current market rate before you send money.
          </p>
        </div>

        <div class="bg-surface rounded-xl border-2 border-neutral-200 p-6 hover:border-brand-300 shadow-md motion-safe:transition-all">
          <div class="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
            Trend Analysis
          </h3>
          <p class="text-body-sm text-neutral-700 leading-relaxed">
            Analyze historical rate movements to spot patterns and identify the best times to transfer. See which corridors are gaining or losing value over days, weeks, or months, so you can time your transfers for maximum savings.
          </p>
        </div>

        <div class="bg-surface rounded-xl border-2 border-neutral-200 p-6 hover:border-brand-300 shadow-md motion-safe:transition-all">
          <div class="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
            Smart Alerts
          </h3>
          <p class="text-body-sm text-neutral-700 leading-relaxed">
            Set custom rate targets for any corridor and get instant email notifications the moment your target rate is reached. Never miss an opportunity to send when rates are favorable, even when you're not actively checking.
          </p>
        </div>
      </div>

      <!-- Top Mover Exchange Rate History -->
      <div class="mb-12">
        <div class="bg-surface rounded-2xl border-2 border-neutral-200 p-8 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="text-h1">🇺🇸</span>
                <svg
                  class="w-5 h-5 text-neutral-400"
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
                <span class="text-h1">🇵🇭</span>
                <div class="ml-3">
                  <h3 class="text-h3 font-bold text-neutral-900">
                    US to PH Exchange Rate History
                  </h3>
                  <p class="text-body-sm text-neutral-600 mt-1">
                    Top mover today • +2.3% in the last 24 hours
                  </p>
                </div>
              </div>
              <div class="flex items-baseline gap-3 mt-4">
                <span class="text-h1 font-bold text-neutral-900">56.82</span>
                <span class="text-body-lg text-neutral-600">PHP per USD</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-body-sm font-semibold bg-success-100 text-success-700 border border-success-300">
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  +2.3%
                </span>
              </div>
            </div>
          </div>

          <div class="bg-neutral-50 rounded-xl border border-neutral-200 p-6 mt-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-body-lg font-semibold text-neutral-900">
                Last 30 Days
              </h4>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-2 text-body-sm text-neutral-600">
                  <span class="w-4 h-0.5 bg-success-500 rounded" />
                  <span>USD-PHP</span>
                </span>
              </div>
            </div>

            <svg
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              class="w-full"
              :style="{ height: '320px' }"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="pulseLineGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style="stop-color:rgba(34, 197, 94, 0.3);stop-opacity:1"
                  />
                  <stop
                    offset="100%"
                    style="stop-color:rgba(34, 197, 94, 0);stop-opacity:1"
                  />
                </linearGradient>
              </defs>

              <path
                :d="areaPath"
                fill="url(#pulseLineGradient)"
              />

              <polyline
                :points="linePoints"
                fill="none"
                stroke="rgb(34, 197, 94)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <circle
                v-for="(point, idx) in chartPoints"
                :key="idx"
                :cx="point.x"
                :cy="point.y"
                r="4"
                fill="rgb(34, 197, 94)"
                class="opacity-0 hover:opacity-100 motion-safe:transition-opacity cursor-pointer"
              >
                <title>{{ formatChartTooltip(point.value, point.date) }}</title>
              </circle>
            </svg>

            <div class="flex justify-between text-body-sm text-neutral-600 mt-4">
              <span>{{ chartDateLabels[0] }}</span>
              <span>{{ chartDateLabels[Math.floor(chartDateLabels.length / 2)] }}</span>
              <span>{{ chartDateLabels[chartDateLabels.length - 1] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Movers - Full Width -->
      <div class="mb-12">
        <!-- Today's Movers - Expanded -->
        <div class="bg-surface rounded-2xl border-2 border-neutral-200 p-8 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-h3 font-bold text-neutral-900">
                Today's Movers
              </h3>
              <p class="text-body-sm text-neutral-600">
                Top rate changes in the last 24 hours
              </p>
            </div>
            <div class="text-body-sm text-neutral-500">
              Last updated 5 minutes ago
            </div>
          </div>

          <!-- Table Header -->
          <div class="grid grid-cols-5 gap-4 pb-4 border-b border-neutral-200 text-body-sm font-semibold text-neutral-600 uppercase tracking-wider">
            <div class="col-span-2">
              Corridor
            </div>
            <div class="text-center">
              24h Change
            </div>
            <div class="text-center">
              Current Rate
            </div>
            <div>Best Provider</div>
          </div>

          <!-- Table Rows -->
          <div class="space-y-3 mt-4">
            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300 hover:bg-surface motion-safe:transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-h2">🇺🇸</span>
                <svg
                  class="w-4 h-4 text-neutral-400"
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
                <span class="text-h2">🇵🇭</span>
                <div class="ml-2">
                  <span class="text-body font-semibold text-neutral-900">US to PH</span>
                  <div class="text-body-sm text-neutral-600">
                    Philippines Peso
                  </div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-h4 font-bold text-success-600">+2.3%</span>
              </div>
              <div class="text-center">
                <span class="text-body font-semibold text-neutral-900">56.82</span>
                <div class="text-body-sm text-neutral-600">
                  PHP per USD
                </div>
              </div>
              <div>
                <span class="text-body-sm font-medium text-neutral-900">Remitly</span>
                <div class="text-body-sm text-neutral-600">
                  0.8% fee
                </div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300 hover:bg-surface motion-safe:transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-h2">🇬🇧</span>
                <svg
                  class="w-4 h-4 text-neutral-400"
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
                <span class="text-h2">🇮🇳</span>
                <div class="ml-2">
                  <span class="text-body font-semibold text-neutral-900">GB to IN</span>
                  <div class="text-body-sm text-neutral-600">
                    Indian Rupee
                  </div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-h4 font-bold text-danger-600">-1.8%</span>
              </div>
              <div class="text-center">
                <span class="text-body font-semibold text-neutral-900">103.45</span>
                <div class="text-body-sm text-neutral-600">
                  INR per GBP
                </div>
              </div>
              <div>
                <span class="text-body-sm font-medium text-neutral-900">Wise</span>
                <div class="text-body-sm text-neutral-600">
                  0.6% fee
                </div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300 hover:bg-surface motion-safe:transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-h2">🇨🇦</span>
                <svg
                  class="w-4 h-4 text-neutral-400"
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
                <span class="text-h2">🇲🇽</span>
                <div class="ml-2">
                  <span class="text-body font-semibold text-neutral-900">CA to MX</span>
                  <div class="text-body-sm text-neutral-600">
                    Mexican Peso
                  </div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-h4 font-bold text-success-600">+1.5%</span>
              </div>
              <div class="text-center">
                <span class="text-body font-semibold text-neutral-900">14.32</span>
                <div class="text-body-sm text-neutral-600">
                  MXN per CAD
                </div>
              </div>
              <div>
                <span class="text-body-sm font-medium text-neutral-900">XE</span>
                <div class="text-body-sm text-neutral-600">
                  1.2% fee
                </div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300 hover:bg-surface motion-safe:transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-h2">🇦🇺</span>
                <svg
                  class="w-4 h-4 text-neutral-400"
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
                <span class="text-h2">🇻🇳</span>
                <div class="ml-2">
                  <span class="text-body font-semibold text-neutral-900">AU to VN</span>
                  <div class="text-body-sm text-neutral-600">
                    Vietnamese Dong
                  </div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-h4 font-bold text-success-600">+0.9%</span>
              </div>
              <div class="text-center">
                <span class="text-body font-semibold text-neutral-900">16,234</span>
                <div class="text-body-sm text-neutral-600">
                  VND per AUD
                </div>
              </div>
              <div>
                <span class="text-body-sm font-medium text-neutral-900">Wise</span>
                <div class="text-body-sm text-neutral-600">
                  0.7% fee
                </div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300 hover:bg-surface motion-safe:transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-h2">🇩🇪</span>
                <svg
                  class="w-4 h-4 text-neutral-400"
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
                <span class="text-h2">🇹🇷</span>
                <div class="ml-2">
                  <span class="text-body font-semibold text-neutral-900">DE to TR</span>
                  <div class="text-body-sm text-neutral-600">
                    Turkish Lira
                  </div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-h4 font-bold text-danger-600">-2.1%</span>
              </div>
              <div class="text-center">
                <span class="text-body font-semibold text-neutral-900">36.15</span>
                <div class="text-body-sm text-neutral-600">
                  TRY per EUR
                </div>
              </div>
              <div>
                <span class="text-body-sm font-medium text-neutral-900">Remitly</span>
                <div class="text-body-sm text-neutral-600">
                  1.5% fee
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Statistics Carousel -->
      <div class="relative mb-12">
        <div class="bg-surface rounded-2xl border-2 border-neutral-200 p-8 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-h4 font-bold text-neutral-900">
              Market Insights
            </h3>
            <div class="flex gap-2">
              <button
                type="button"
                class="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center motion-safe:transition-all border border-neutral-300"
                aria-label="Previous market insight"
                @click="previousStat"
              >
                <svg
                  class="w-5 h-5 text-neutral-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center motion-safe:transition-all border border-neutral-300"
                aria-label="Next market insight"
                @click="nextStat"
              >
                <svg
                  class="w-5 h-5 text-neutral-700"
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
              </button>
            </div>
          </div>

          <!-- Statistics Carousel -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Rotating Stat 1 -->
            <Transition
              name="fade"
              mode="out-in"
            >
              <div
                :key="`stat-${currentStatIndex}`"
                class="bg-neutral-50 rounded-xl border border-neutral-200 p-6"
              >
                <h4 class="text-body-lg font-bold text-neutral-900 mb-4">
                  {{ rotatingStats[currentStatIndex].title }}
                </h4>
                <div class="text-hero font-bold text-neutral-900 mb-2">
                  {{ rotatingStats[currentStatIndex].value }}
                </div>
                <p class="text-body-sm text-neutral-600 mb-4">
                  {{ rotatingStats[currentStatIndex].description }}
                </p>
                <div
                  class="flex items-center gap-2 text-body-sm"
                  :class="rotatingStats[currentStatIndex].trendClass"
                >
                  <svg
                    v-if="rotatingStats[currentStatIndex].trendIcon"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span v-if="rotatingStats[currentStatIndex].trendText">{{ rotatingStats[currentStatIndex].trendText }}</span>
                  <template v-else>
                    <span
                      v-if="rotatingStats[currentStatIndex].flag1"
                      class="text-h3"
                    >{{ rotatingStats[currentStatIndex].flag1 }}</span>
                    <span v-if="rotatingStats[currentStatIndex].flag2">
                      <span class="ml-2">to</span>
                      <span class="text-h3 ml-2">{{ rotatingStats[currentStatIndex].flag2 }}</span>
                    </span>
                    <span
                      v-if="rotatingStats[currentStatIndex].flagText"
                      class="ml-2"
                    >{{ rotatingStats[currentStatIndex].flagText }}</span>
                  </template>
                </div>
              </div>
            </Transition>

            <!-- Static stats (always visible) -->
            <div class="bg-neutral-50 rounded-xl border border-neutral-200 p-6">
              <h4 class="text-body-lg font-bold text-neutral-900 mb-4">
                Rate Updates
              </h4>
              <div class="text-hero font-bold text-neutral-900 mb-2">
                4,287
              </div>
              <p class="text-body-sm text-neutral-600 mb-4">
                Searches processed today
              </p>
              <div class="text-body-sm text-neutral-500">
                Updates every 5 minutes
              </div>
            </div>

            <div class="bg-neutral-50 rounded-xl border border-neutral-200 p-6">
              <h4 class="text-body-lg font-bold text-neutral-900 mb-4">
                Providers Tracked
              </h4>
              <div class="text-hero font-bold text-neutral-900 mb-2">
                30+
              </div>
              <p class="text-body-sm text-neutral-600 mb-4">
                Money transfer services monitored
              </p>
              <div class="text-body-sm text-neutral-500">
                Wise, Remitly, XE, and more
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA to Pulse -->
      <div class="text-center">
        <NuxtLink
          to="/pulse"
          class="inline-flex items-center gap-2 px-6 py-3 bg-surface hover:bg-surface/90 text-brand-600 rounded-lg font-semibold motion-safe:transition-all group shadow-lg"
        >
          <span>Explore Pulse</span>
          <svg
            class="w-5 h-5 group-hover:translate-x-1 motion-safe:transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()

const currentStatIndex = ref(0)
let autoRotateInterval: ReturnType<typeof setInterval> | null = null

const rotatingStats = [
  {
    title: 'Market Average',
    value: '3.2%',
    description: 'Average markup across all providers',
    trendClass: 'text-success-600',
    trendIcon: true,
    trendText: '0.4% better than last week',
  },
  {
    title: 'Best Value',
    value: '0.3%',
    description: 'Lowest fee corridor today',
    trendClass: 'text-neutral-700',
    trendIcon: false,
    flag1: '🇩🇪',
    flag2: '🇵🇱',
    flagText: 'Germany to Poland',
  },
  {
    title: 'Active Corridors',
    value: '152',
    description: 'Live rate tracking right now',
    trendClass: 'text-success-600',
    trendIcon: true,
    trendText: '8 new corridors this month',
  },
]

function nextStat() {
  currentStatIndex.value = (currentStatIndex.value + 1) % rotatingStats.length
}

function previousStat() {
  currentStatIndex.value = (currentStatIndex.value - 1 + rotatingStats.length) % rotatingStats.length
}

onMounted(() => {
  autoRotateInterval = setInterval(() => {
    nextStat()
  }, 5000)
})

onBeforeUnmount(() => {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval)
  }
})

const chartWidth = 1200
const chartHeight = 300
const chartPadding = 20

const generateHistoricalData = (days = 30) => {
  const data = []
  const baseRate = 55.50
  const today = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const variation = (Math.sin(i / 5) * 0.8) + (Math.sin(i / 3) * 0.4) + (i / days) * 1.3
    const rate = Math.max(54.0, baseRate + variation)

    data.push({
      date: date.toISOString().split('T')[0],
      rate: rate,
    })
  }

  return data
}

const historicalData = ref(generateHistoricalData(30))

const minRate = computed(() => Math.min(...historicalData.value.map(d => d.rate)))
const maxRate = computed(() => Math.max(...historicalData.value.map(d => d.rate)))

const chartPoints = computed(() => {
  return historicalData.value.map((d, idx) => {
    const x = chartPadding + (idx / (historicalData.value.length - 1)) * (chartWidth - 2 * chartPadding)
    const normalizedY = (d.rate - minRate.value) / (maxRate.value - minRate.value)
    const y = chartHeight - chartPadding - (normalizedY * (chartHeight - 2 * chartPadding))

    return {
      x,
      y,
      value: d.rate,
      date: d.date,
    }
  })
})

const linePoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''

  const points = chartPoints.value
  let path = `M ${points[0].x},${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`
  }

  path += ` L ${points[points.length - 1].x},${chartHeight}`
  path += ` L ${points[0].x},${chartHeight}`
  path += ' Z'

  return path
})

const chartDateLabels = computed(() => {
  const data = historicalData.value
  if (data.length === 0) return []

  return [
    formatDateLabel(data[0].date),
    formatDateLabel(data[Math.floor(data.length / 2)].date),
    formatDateLabel(data[data.length - 1].date),
  ]
})

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatChartTooltip = (rate: number, date: string) => {
  return `${formatDateLabel(date)}: ${rate.toFixed(2)} PHP`
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
