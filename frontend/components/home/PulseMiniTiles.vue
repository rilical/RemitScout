<template>
  <section class="py-16 sm:py-20 bg-slate-900">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full mb-6">
          <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="text-sm font-semibold text-blue-400">Remit-Scout Pulse</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Real-Time Market Intelligence
        </h2>
        <p class="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Live exchange rates across 150+ corridors and 30+ providers. 
          Track when rates move up or down. Set alerts to catch the perfect moment to transfer.
        </p>
      </div>

      <!-- What is Pulse - 3 Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-500 transition-all">
          <div class="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">
            Live Exchange Rates
          </h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Real-time rates across 150+ corridors and 30+ providers. Updated every few minutes.
          </p>
        </div>

        <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-500 transition-all">
          <div class="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">
            Trend Analysis
          </h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            See which corridors are gaining or losing value. Find the best times to transfer.
          </p>
        </div>

        <div class="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-blue-500 transition-all">
          <div class="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">
            Smart Alerts
          </h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Set rate targets for any corridor. Get instant notifications when your target is hit.
          </p>
        </div>
      </div>

      <!-- Today's Movers - Full Width -->
      <div class="mb-12">
        <!-- Today's Movers - Expanded -->
        <div class="bg-slate-800 rounded-2xl border-2 border-slate-700 p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-2xl font-bold text-white">
                Today's Movers
              </h3>
              <p class="text-sm text-slate-400">
                Top rate changes in the last 24 hours
              </p>
            </div>
            <div class="text-xs text-slate-500">
              Last updated 5 minutes ago
            </div>
          </div>

          <!-- Table Header -->
          <div class="grid grid-cols-5 gap-4 pb-4 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div class="col-span-2">Corridor</div>
            <div class="text-center">24h Change</div>
            <div class="text-center">Current Rate</div>
            <div>Best Provider</div>
          </div>

          <!-- Table Rows -->
          <div class="space-y-3 mt-4">
            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-3xl">🇺🇸</span>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-3xl">🇵🇭</span>
                <div class="ml-2">
                  <span class="text-base font-semibold text-white">US to PH</span>
                  <div class="text-xs text-slate-400">Philippines Peso</div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-xl font-bold text-green-400">+2.3%</span>
              </div>
              <div class="text-center">
                <span class="text-base font-semibold text-white">56.82</span>
                <div class="text-xs text-slate-400">PHP per USD</div>
              </div>
              <div>
                <span class="text-sm font-medium text-white">Remitly</span>
                <div class="text-xs text-slate-400">0.8% fee</div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-3xl">🇬🇧</span>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-3xl">🇮🇳</span>
                <div class="ml-2">
                  <span class="text-base font-semibold text-white">GB to IN</span>
                  <div class="text-xs text-slate-400">Indian Rupee</div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-xl font-bold text-red-400">-1.8%</span>
              </div>
              <div class="text-center">
                <span class="text-base font-semibold text-white">103.45</span>
                <div class="text-xs text-slate-400">INR per GBP</div>
              </div>
              <div>
                <span class="text-sm font-medium text-white">Wise</span>
                <div class="text-xs text-slate-400">0.6% fee</div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-3xl">🇨🇦</span>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-3xl">🇲🇽</span>
                <div class="ml-2">
                  <span class="text-base font-semibold text-white">CA to MX</span>
                  <div class="text-xs text-slate-400">Mexican Peso</div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-xl font-bold text-green-400">+1.5%</span>
              </div>
              <div class="text-center">
                <span class="text-base font-semibold text-white">14.32</span>
                <div class="text-xs text-slate-400">MXN per CAD</div>
              </div>
              <div>
                <span class="text-sm font-medium text-white">XE</span>
                <div class="text-xs text-slate-400">1.2% fee</div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-3xl">🇦🇺</span>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-3xl">🇻🇳</span>
                <div class="ml-2">
                  <span class="text-base font-semibold text-white">AU to VN</span>
                  <div class="text-xs text-slate-400">Vietnamese Dong</div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-xl font-bold text-green-400">+0.9%</span>
              </div>
              <div class="text-center">
                <span class="text-base font-semibold text-white">16,234</span>
                <div class="text-xs text-slate-400">VND per AUD</div>
              </div>
              <div>
                <span class="text-sm font-medium text-white">Wise</span>
                <div class="text-xs text-slate-400">0.7% fee</div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all">
              <div class="col-span-2 flex items-center gap-3">
                <span class="text-3xl">🇩🇪</span>
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-3xl">🇹🇷</span>
                <div class="ml-2">
                  <span class="text-base font-semibold text-white">DE to TR</span>
                  <div class="text-xs text-slate-400">Turkish Lira</div>
                </div>
              </div>
              <div class="text-center">
                <span class="text-xl font-bold text-red-400">-2.1%</span>
              </div>
              <div class="text-center">
                <span class="text-base font-semibold text-white">36.15</span>
                <div class="text-xs text-slate-400">TRY per EUR</div>
              </div>
              <div>
                <span class="text-sm font-medium text-white">Remitly</span>
                <div class="text-xs text-slate-400">1.5% fee</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Statistics Carousel -->
      <div class="relative mb-12">
        <div class="bg-slate-800 rounded-2xl border-2 border-slate-700 p-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white">Market Insights</h3>
            <div class="flex gap-2">
              <button
                class="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all border border-slate-600"
                @click="previousStat"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                class="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all border border-slate-600"
                @click="nextStat"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Statistics Carousel -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Stat 1 (Rotating) -->
            <div v-show="currentStatIndex === 0" class="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
              <h4 class="text-lg font-bold text-white mb-4">Market Average</h4>
              <div class="text-5xl font-bold text-white mb-2">3.2%</div>
              <p class="text-sm text-slate-400 mb-4">Average markup across all providers</p>
              <div class="flex items-center gap-2 text-sm text-green-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>0.4% better than last week</span>
              </div>
            </div>
            <div v-show="currentStatIndex === 1" class="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
              <h4 class="text-lg font-bold text-white mb-4">Best Value</h4>
              <div class="text-5xl font-bold text-white mb-2">0.3%</div>
              <p class="text-sm text-slate-400 mb-4">Lowest fee corridor today</p>
              <div class="flex items-center gap-2 text-sm text-slate-300">
                <span class="text-2xl">🇩🇪</span>
                <span>to</span>
                <span class="text-2xl">🇵🇱</span>
                <span>Germany to Poland</span>
              </div>
            </div>
            <div v-show="currentStatIndex === 2" class="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
              <h4 class="text-lg font-bold text-white mb-4">Active Corridors</h4>
              <div class="text-5xl font-bold text-white mb-2">152</div>
              <p class="text-sm text-slate-400 mb-4">Live rate tracking right now</p>
              <div class="flex items-center gap-2 text-sm text-emerald-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>8 new corridors this month</span>
              </div>
            </div>

            <!-- Static stats (always visible) -->
            <div class="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
              <h4 class="text-lg font-bold text-white mb-4">Rate Updates</h4>
              <div class="text-5xl font-bold text-white mb-2">4,287</div>
              <p class="text-sm text-slate-400 mb-4">Searches processed today</p>
              <div class="text-xs text-slate-500">Updates every 5 minutes</div>
            </div>

            <div class="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
              <h4 class="text-lg font-bold text-white mb-4">Providers Tracked</h4>
              <div class="text-5xl font-bold text-white mb-2">30+</div>
              <p class="text-sm text-slate-400 mb-4">Money transfer services monitored</p>
              <div class="text-xs text-slate-500">Wise, Remitly, XE, and more</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA to Pulse -->
      <div class="text-center">
        <NuxtLink
          to="/pulse"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all group shadow-lg"
        >
          <span>Explore Pulse</span>
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentStatIndex = ref(0)

function nextStat() {
  currentStatIndex.value = (currentStatIndex.value + 1) % 3
}

function previousStat() {
  currentStatIndex.value = (currentStatIndex.value - 1 + 3) % 3
}
</script>

