<template>
  <div class="min-h-screen bg-white">
    <!-- Corridor Decision Header -->
    <section class="bg-gradient-to-b from-brand-600 to-brand-700 text-white">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <nav class="mb-4 text-sm">
          <ol class="flex flex-wrap items-center gap-2">
            <li>
              <NuxtLink to="/" class="text-white/70 hover:text-white">Home</NuxtLink>
            </li>
            <li class="text-white/50">›</li>
            <li>
              <NuxtLink to="/send-money" class="text-white/70 hover:text-white">Send Money</NuxtLink>
            </li>
            <li class="text-white/50">›</li>
            <li class="text-white">{{ content.from }} to {{ content.to }}</li>
          </ol>
        </nav>

        <div class="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div class="flex items-center gap-6 mb-4">
              <div class="flex items-center gap-3">
                <span class="text-4xl leading-none">{{ flagFrom }}</span>
                <div>
                  <p class="text-xs text-white/70 mb-0.5">Sending from</p>
                  <span class="text-lg font-semibold">{{ content.from }}</span>
                </div>
              </div>
              <svg class="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div class="flex items-center gap-3">
                <span class="text-4xl leading-none">{{ flagTo }}</span>
                <div>
                  <p class="text-xs text-white/70 mb-0.5">Receiving in</p>
                  <span class="text-lg font-semibold">{{ content.to }}</span>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-xs text-white/70 mb-1">Recipient gets (on ${{ displayAmount.toLocaleString() }})</p>
              <p class="text-3xl font-bold">
                {{ recipientRange.min }} – {{ recipientRange.max }} {{ content.toCode.toUpperCase() }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="chip in content.hero.chips"
                :key="chip"
                class="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium text-white"
              >
                <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ chip }}
              </span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
                @click="handleSave"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Save corridor
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-white/90 transition-colors"
                @click="handleAlert"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Set rate alert
              </button>
            </div>
          </div>

          <div class="rounded-2xl bg-white p-4 shadow-xl">
            <div class="flex items-center justify-between mb-2">
              <div>
                <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Mid-Market Rate</p>
                <p class="text-xl font-bold text-brand-600">{{ content.rateWidget.midMarket }}</p>
              </div>
              <div class="flex gap-1">
                <span
                  v-for="change in content.rateWidget.changes"
                  :key="change.label"
                  :class="[
                    'inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold',
                    change.value.startsWith('-') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
                  ]"
                >
                  {{ change.value }} {{ change.label }}
                </span>
              </div>
            </div>
            <div class="h-16 relative mb-2">
              <svg class="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                <path
                  d="M0,35 Q25,30 50,33 T100,25 T150,28 T200,20"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="2"
                />
                <path
                  d="M0,35 Q25,30 50,33 T100,25 T150,28 T200,20 L200,50 L0,50 Z"
                  fill="url(#heroChartGradient)"
                />
                <defs>
                  <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="200" cy="20" r="3" fill="#2563eb" />
              </svg>
              <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-neutral-400">
                <span>30D</span>
                <span>Now</span>
              </div>
            </div>
            <div class="text-xs text-neutral-500 flex items-center justify-between">
              <span>{{ content.rateWidget.asOf }}</span>
              <span>Source: {{ content.rateWidget.source }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Anchor Mini Nav -->
    <CorridorMiniNav :last-updated="content.lastUpdated" />

    <!-- ZONE A: Compare -->
    <section id="compare" class="bg-slate-50 border-b border-slate-200">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <CorridorStickyBar
          :amount="displayAmount"
          :payout-method="payoutMethod"
          :sort-by="sortBy"
          :currency="displayCurrency"
          @update="handleBarUpdate"
          @sort="handleSort"
          @save="handleSave"
          @alert="handleAlert"
          @share="handleShare"
        />

        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-neutral-900">
              Compare {{ providerCount }} providers
            </h2>
            <p class="text-sm text-neutral-500">
              Sorted by {{ sortLabels[sortBy] }}
            </p>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="text-neutral-400">Rankings are independent</span>
            <NuxtLink to="/how-we-make-money" class="text-neutral-500 hover:text-brand-600">
              Disclosure
            </NuxtLink>
          </div>
        </div>

        <div v-if="isQuotesLoading" class="space-y-4">
          <div
            v-for="i in 3"
            :key="`quote-skeleton-${i}`"
            class="rounded-xl border-2 border-slate-200 bg-white p-5 animate-pulse"
          >
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="h-14 w-14 rounded-xl bg-slate-200" />
                <div class="space-y-2">
                  <div class="h-4 w-36 rounded bg-slate-200" />
                  <div class="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div class="space-y-2 text-right">
                <div class="h-3 w-24 rounded bg-slate-200 ml-auto" />
                <div class="h-6 w-28 rounded bg-slate-200 ml-auto" />
                <div class="h-3 w-20 rounded bg-slate-100 ml-auto" />
              </div>
            </div>
            <div class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="lg:col-span-2 h-20 rounded-lg bg-slate-100" />
              <div class="h-20 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>

        <div
          v-else-if="hasApiError"
          class="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Live quotes are unavailable right now. Please try again shortly.
        </div>

        <div v-else-if="content.table.rows.length" class="space-y-4">
          <template v-for="(row, index) in sortedProviders" :key="row.provider">
            <div
              :id="`provider-${row.provider.toLowerCase().replace(/\s+/g, '-')}`"
              :class="[
                'rounded-xl border-2 p-5 transition-all bg-white',
                index === 0 
                  ? 'border-emerald-400 shadow-lg shadow-emerald-100/50' 
                  : 'border-slate-200 hover:border-brand-300 hover:shadow-md',
              ]"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div class="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                      {{ row.provider.charAt(0) }}
                    </div>
                    <div class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-white">
                      {{ row.score }}
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-lg font-bold text-neutral-900">{{ row.provider }}</p>
                      <span v-if="row.badge" :class="[
                        'rounded px-2 py-0.5 text-xs font-bold',
                        index === 0 ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700'
                      ]">
                        {{ row.badge }}
                      </span>
                      <span v-if="row.warning" class="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                        {{ row.warning }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-500">{{ row.speed }} · {{ row.speedNote }}</p>
                  </div>
                </div>

                <div class="text-right">
                  <p class="text-xs font-medium text-neutral-500 mb-1">Recipient gets</p>
                  <p class="text-2xl font-bold text-neutral-900">{{ row.recipientGets }}</p>
                  <ProviderDeltaBadge
                    :delta="getProviderTrueCost(row, index).deltaFromBest"
                    :is-best="index === 0"
                    :amount="displayAmount"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div class="lg:col-span-2">
                  <TrueCostCard
                    :upfront-fee="getProviderTrueCost(row, index).upfrontFee"
                    :hidden-markup="getProviderTrueCost(row, index).hiddenMarkup"
                    :total-cost="getProviderTrueCost(row, index).totalCost"
                    :total-cost-percent="getProviderTrueCost(row, index).totalCostPercent"
                    :spread-bps="getProviderTrueCost(row, index).spreadBps"
                    :amount="displayAmount"
                    compact
                  />
                </div>
                <div class="flex flex-col justify-between">
                  <div class="mb-3">
                    <div class="flex flex-wrap gap-1.5 mb-2">
                      <span v-if="row.payIn?.includes('ACH') || row.payIn?.includes('Bank')" class="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        Bank
                      </span>
                      <span v-if="row.payIn?.includes('card') || row.payIn?.includes('Card')" class="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        Card
                      </span>
                      <span v-if="row.payOut?.includes('Cash')" class="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Cash pickup
                      </span>
                      <span v-if="row.payOut?.includes('Bank')" class="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        Bank deposit
                      </span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <button
                      type="button"
                      :class="[
                        'w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-all',
                        index === 0
                          ? 'bg-brand-600 text-white hover:bg-brand-700'
                          : 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50',
                      ]"
                    >
                      Go to {{ row.provider.split(' ')[0] }} →
                    </button>
                    <p v-if="row.isAffiliate !== false" class="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      We may earn a commission
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!isPlus && (index + 1) % 2 === 0 && index < sortedProviders.length - 1"
              class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <div class="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span class="font-semibold uppercase tracking-wider">Advertisement</span>
              </div>
              <div class="text-center py-4 text-sm text-slate-400">
                <p>Ad placeholder (728×90 or responsive)</p>
              </div>
              <div class="text-center">
                <NuxtLink to="/plus" class="text-xs text-brand-600 hover:underline">
                  Remove ads with Plus →
                </NuxtLink>
              </div>
            </div>
          </template>
        </div>

        <div v-else class="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
          <p class="text-lg font-semibold text-neutral-700 mb-2">Coming Soon</p>
          <p class="text-sm text-neutral-500">We're gathering live data for this corridor.</p>
        </div>

        <p class="mt-4 text-xs text-neutral-500">
          Last updated {{ content.lastUpdated }}. We source data from providers and cannot guarantee accuracy.
        </p>
      </div>
    </section>

    <!-- ZONE B: Insights -->
    <section id="insights" class="bg-white border-b border-slate-200">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-neutral-900">Corridor Market Insights</h2>
            <p class="text-sm text-neutral-500">{{ content.from }} → {{ content.to }}</p>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-model="insightTimeframe"
              class="h-9 px-3 pr-8 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none appearance-none bg-white"
            >
              <option value="7d">7 days</option>
              <option value="30d" :disabled="!isPlus">30 days {{ !isPlus ? '(Plus)' : '' }}</option>
              <option value="90d" :disabled="!isPlus">90 days {{ !isPlus ? '(Plus)' : '' }}</option>
              <option value="365d" :disabled="!isPlus">1 year {{ !isPlus ? '(Plus)' : '' }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div
            v-for="insight in content.insights"
            :key="insight.label"
            class="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <p class="text-xs font-medium text-neutral-500 mb-1">{{ insight.label }}</p>
            <p class="text-lg font-bold text-neutral-900">{{ insight.value }}</p>
            <p class="text-xs text-neutral-500">{{ insight.helper }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-slate-900">True Cost vs Mid-Market</h3>
              <span class="text-xs text-slate-500">On ${{ displayAmount.toLocaleString() }}</span>
            </div>
            <div class="space-y-3">
              <div v-for="(row, index) in content.table.rows.slice(0, 4)" :key="row.provider" class="flex items-center gap-3">
                <span class="w-24 text-sm font-medium text-slate-700 truncate">{{ row.provider }}</span>
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    :class="index === 0 ? 'bg-emerald-500' : 'bg-brand-500'"
                    :style="{ width: `${Math.min(100, getProviderTrueCost(row, index).totalCostPercent * 10)}%` }"
                  />
                </div>
                <span class="w-16 text-right text-sm font-semibold" :class="index === 0 ? 'text-emerald-600' : 'text-slate-700'">
                  {{ getProviderTrueCost(row, index).totalCostPercent.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-slate-900">Provider Availability</h3>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">Bank Transfer</span>
                <span class="font-semibold text-slate-900">{{ content.table.rows.filter(r => r.payOut?.includes('Bank')).length }} providers</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">Cash Pickup</span>
                <span class="font-semibold text-slate-900">{{ content.table.rows.filter(r => r.payOut?.includes('Cash')).length }} providers</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">Mobile Wallet</span>
                <span class="font-semibold text-slate-900">{{ content.table.rows.filter(r => r.payOut?.includes('wallet')).length }} providers</span>
              </div>
            </div>
          </div>

          <div v-if="!isPlus" class="lg:col-span-2 rounded-xl border-2 border-blue-600/30 bg-slate-900 p-6 relative overflow-hidden">
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-white">Advanced Analytics</h3>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded">
                  Plus
                </span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div>
                  <span class="text-sm text-slate-400">Avg Spread</span>
                  <p class="text-lg font-bold text-white blur-sm select-none">45 bps</p>
                </div>
                <div>
                  <span class="text-sm text-slate-400">Volatility Index</span>
                  <p class="text-lg font-bold text-white blur-sm select-none">2.1%</p>
                </div>
                <div>
                  <span class="text-sm text-slate-400">Provider Uptime</span>
                  <p class="text-lg font-bold text-white blur-sm select-none">99.2%</p>
                </div>
                <div>
                  <span class="text-sm text-slate-400">Best Window</span>
                  <p class="text-lg font-bold text-white blur-sm select-none">8-11AM</p>
                </div>
              </div>
              <NuxtLink to="/plus" class="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold transition-all">
                Unlock with Plus
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
          </div>

          <div v-else class="lg:col-span-2 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-white">Advanced Analytics</h3>
              <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Plus Active
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span class="text-sm text-slate-400">Avg Spread</span>
                <p class="text-lg font-bold text-white">45 bps</p>
              </div>
              <div>
                <span class="text-sm text-slate-400">Volatility Index</span>
                <p class="text-lg font-bold text-white">2.1%</p>
              </div>
              <div>
                <span class="text-sm text-slate-400">Provider Uptime</span>
                <p class="text-lg font-bold text-emerald-400">99.2%</p>
              </div>
              <div>
                <span class="text-sm text-slate-400">Best Window</span>
                <p class="text-lg font-bold text-white">8-11AM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ZONE C: Learn (SEO) -->
    <section id="how-to-send" class="bg-slate-50">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div>
              <h2 class="text-2xl font-bold text-neutral-900 mb-4">
                About Transfers from {{ content.from }} to {{ content.to }}
              </h2>
              <div class="prose prose-neutral prose-sm max-w-none">
                <p class="text-neutral-600 leading-relaxed">
                  {{ content.hero.subhead }}
                </p>
                <p class="text-neutral-600 leading-relaxed">
                  Money transfer services are typically the best way to send money abroad—cheaper, faster, and easier than traditional banks.
                </p>
              </div>
            </div>

            <div v-if="content.steps.length">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">
                How to Send Money to {{ content.to }}
              </h3>
              <ol class="space-y-3">
                <li
                  v-for="(step, index) in content.steps"
                  :key="step"
                  class="flex gap-4"
                >
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white flex-shrink-0">
                    {{ index + 1 }}
                  </span>
                  <p class="text-sm text-neutral-700 pt-0.5">{{ step }}</p>
                </li>
              </ol>
            </div>
          </div>

          <div class="space-y-6">
            <div v-if="!isPlus" class="rounded-xl border border-dashed border-slate-300 bg-white p-5">
              <div class="text-center mb-3">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advertisement</span>
              </div>
              <div class="h-48 flex items-center justify-center text-sm text-slate-400">
                Ad placeholder (300×250)
              </div>
              <div class="text-center mt-3">
                <NuxtLink to="/plus" class="text-xs text-brand-600 hover:underline">
                  Remove ads with Plus →
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-xl border border-brand-200 bg-brand-50 p-5">
              <h3 class="font-bold text-brand-900 mb-2 text-sm">Save to Watchlist</h3>
              <p class="text-xs text-brand-700 mb-3">Track this corridor and get notified when rates change.</p>
              <button
                type="button"
                class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors"
                @click="handleSave"
              >
                Add to Watchlist
              </button>
              <p class="text-xs text-center text-brand-600 mt-2">
                Free accounts: 3 corridors · Plus: Unlimited
              </p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <h3 class="font-bold text-neutral-900 mb-3 text-sm">Corridor Stats</h3>
              <div class="space-y-3">
                <div v-for="stat in content.statsBar" :key="stat.label" class="flex items-center justify-between text-sm">
                  <span class="text-neutral-600">{{ stat.label }}</span>
                  <span class="font-semibold text-neutral-900">{{ stat.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQs -->
    <section id="faqs" class="bg-gradient-to-b from-brand-50 to-white border-t border-brand-100">
      <div class="mx-auto max-w-4xl px-4 py-10">
        <h2 class="text-2xl font-bold text-brand-900 text-center mb-6">
          Frequently Asked Questions
        </h2>
        <div class="divide-y divide-brand-100 border border-brand-200 rounded-xl overflow-hidden bg-white">
          <details
            v-for="faq in corridorFaqs"
            :key="faq.q"
            class="group"
          >
            <summary class="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-brand-900 hover:bg-brand-50">
              {{ faq.q }}
              <svg class="h-5 w-5 text-brand-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
              {{ faq.a }}
            </div>
          </details>
        </div>
        <div class="text-center mt-4">
          <NuxtLink to="/faq" class="text-sm font-semibold text-brand-600 hover:underline">
            View all FAQs →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Related Guides -->
    <section v-if="content.miniGuides && content.miniGuides.length" class="bg-white border-t border-slate-200">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <h2 class="text-2xl font-bold text-neutral-900 mb-6 text-center">Related Guides</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="guide in content.miniGuides"
            :key="guide.title"
            :to="guide.link"
            class="group rounded-xl border border-slate-200 bg-slate-50 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <h3 class="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
              {{ guide.title }}
            </h3>
            <p class="text-sm text-neutral-600 leading-relaxed">
              {{ guide.excerpt }}
            </p>
            <span class="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-brand-600">
              Read guide
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Disclosures -->
    <section class="bg-slate-50 border-t border-slate-200">
      <div class="mx-auto max-w-4xl px-4 py-6">
        <div class="text-xs text-neutral-500 space-y-2">
          <p><strong>Affiliate disclosure:</strong> {{ content.disclosures.advert }}</p>
          <p><strong>Data accuracy:</strong> {{ content.disclosures.data }}</p>
        </div>
      </div>
    </section>

    <!-- Our Impact -->
    <TrustMetricsStrip bg-class="bg-brand-600" />

    <!-- Methodology Footer -->
    <section class="bg-slate-900 text-white">
      <div class="mx-auto max-w-6xl px-4 py-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-sm text-slate-300">
              See an issue with this data? <a href="mailto:support@remit-scout.com" class="text-white hover:underline">Let us know</a>
            </p>
          </div>
          <div class="flex items-center gap-6">
            <NuxtLink to="/methodology" class="text-sm font-semibold text-white hover:text-slate-300 transition-colors">
              Read our methodology →
            </NuxtLink>
            <NuxtLink to="/how-we-make-money" class="text-sm text-slate-400 hover:text-white transition-colors">
              How we make money
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { jsonLdBreadcrumb, jsonLdFaq, setSeo } from '~/composables/useSeo'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import TrueCostCard from '~/components/shared/TrueCostCard.vue'
import ProviderDeltaBadge from '~/components/shared/ProviderDeltaBadge.vue'
import CorridorMiniNav from '~/components/corridor/CorridorMiniNav.vue'
import CorridorStickyBar from '~/components/corridor/CorridorStickyBar.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import { buildTrueCostBreakdown } from '~/lib/trueCostCalculator'
import type { ProviderQuote, TrueCostBreakdown, Method } from '~/types/remit'
import { useEntitlements } from '~/composables/useEntitlements'

const { isPlus } = useEntitlements()
const { attachRatings, formatMoney, formatRate, getRelativeTime, useProviders } = useRemittanceApi()

defineRouteRules({ swr: 60 })

type ProviderHighlight = {
  label: string
  provider: string
  score: string
  rate: string
  fee: string
  speed: string
  note: string
  ctaLabel: string
}

type TableRow = {
  provider: string
  score: string
  recipientGets: string
  delta: string
  fee: string
  rate: string
  speed: string
  speedNote: string
  payIn: string
  payOut: string
  notes: string
  badge?: string
  warning?: string
  isAffiliate?: boolean
}

type Insight = {
  label: string
  value: string
  helper: string
}

type Guide = {
  title: string
  excerpt: string
  link: string
}

type CorridorContent = {
  from: string
  to: string
  fromCode: string
  toCode: string
  currencyPair: string
  lastUpdated: string
  hero: {
    kicker: string
    title: string
    subhead: string
    chips: string[]
  }
  statsBar: Array<{ label: string, value: string, helper: string }>
  providerHighlights: ProviderHighlight[]
  rateWidget: {
    midMarket: string
    asOf: string
    source: string
    changes: Array<{ label: string, value: string }>
  }
  table: {
    title: string
    amountExample: string
    rows: TableRow[]
  }
  insights: Insight[]
  recommendations: string[]
  steps: string[]
  faqs: Array<{ q: string, a: string }>
  miniGuides?: Guide[]
  disclosures: {
    advert: string
    data: string
  }
  stats?: { providerCount?: string }
}

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const normalizedSiteUrl = siteUrl && typeof siteUrl === 'string' && siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : (siteUrl || 'https://Remit-Scout.com')

import {
  getCanonicalSlug,
  getCodeFromSlug,
  getCountryFromSlug,
  getCanonicalCorridorUrl,
  needsCanonicalRedirect,
} from '~/utils/country-slugs'

const normalizeSlug = (value: string | string[] | undefined) => String(value || '').toLowerCase()

const resolveCountryName = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const resolveCurrency = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.currency || ''
}

const resolveFlag = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.flag || '🌐'
}

const fromSlug = computed(() => normalizeSlug(route.params.from))
const toSlug = computed(() => normalizeSlug(route.params.to))
const canonicalFrom = computed(() => getCanonicalSlug(fromSlug.value))
const canonicalTo = computed(() => getCanonicalSlug(toSlug.value))
const amountParam = Array.isArray(route.query.amount) ? route.query.amount[0] : route.query.amount
const methodParam = Array.isArray(route.query.method) ? route.query.method[0] : route.query.method
const initialAmount = Number(amountParam) || 1000
const supportedMethods: Method[] = ['bank', 'cash', 'wallet']
const initialMethod = supportedMethods.includes(methodParam as Method) ? (methodParam as Method) : 'bank'
const fromCountryCode = computed(() => getCodeFromSlug(canonicalFrom.value) || canonicalFrom.value.toUpperCase())
const toCountryCode = computed(() => getCodeFromSlug(canonicalTo.value) || canonicalTo.value.toUpperCase())
const corridorKey = computed(() => `${canonicalFrom.value}-${canonicalTo.value}`)
const canonicalPath = computed(() => `/send-money/${canonicalFrom.value}-to-${canonicalTo.value}`)
const flagFrom = computed(() => resolveFlag(canonicalFrom.value))
const flagTo = computed(() => resolveFlag(canonicalTo.value))

if (import.meta.client && needsCanonicalRedirect(fromSlug.value, toSlug.value)) {
  navigateTo(getCanonicalCorridorUrl(fromSlug.value, toSlug.value), { redirectCode: 301 })
}

const { data: quotesData, pending: quotesPending, error: quotesError } = await useProviders(
  fromCountryCode.value,
  toCountryCode.value,
  initialAmount,
  initialMethod,
  { key: route.fullPath, server: true, lazy: false },
)

const corridorContent: Record<string, CorridorContent> = {
  'united-states-jordan': {
    from: 'United States',
    to: 'Jordan',
    fromCode: 'usd',
    toCode: 'jod',
    currencyPair: 'USD/JOD',
    lastUpdated: '2024-11-30',
    hero: {
      kicker: 'Corridor Guide',
      title: 'Send money from the United States to Jordan',
      subhead: 'Today\'s cheapest money transfer service might not be the cheapest tomorrow. Find the one that\'s best-suited to your needs by comparing the best performers on Remit-Scout\'s comparison engine over the past 30 days for transfers from the US to Jordan.',
      chips: ['Fact-checked', 'Neutral rankings', 'Licensed providers only'],
    },
    statsBar: [
      { label: 'Providers', value: '10', helper: 'USD → JOD' },
      { label: 'Most often cheapest', value: 'Remitly', helper: 'Past 30 days' },
      { label: 'Pay-in options', value: 'Card, Bank, ACH', helper: 'Multiple methods' },
      { label: 'Most transferred', value: '$1,000 USD', helper: 'Common amount' },
    ],
    providerHighlights: [
      { label: 'Best rated', provider: 'Wise', score: '9.4', rate: '1 USD = 0.7105 JOD', fee: '$5.49', speed: '1-2 days', note: 'Transparent pricing', ctaLabel: 'Go to Wise' },
      { label: 'Cheapest', provider: 'Remitly', score: '9.0', rate: '1 USD = 0.7090 JOD', fee: '$0 promo', speed: 'Same day', note: 'Best for bank deposits', ctaLabel: 'Go to Remitly' },
      { label: 'Fastest', provider: 'MoneyGram', score: '8.6', rate: '1 USD = 0.7030 JOD', fee: '$4.99', speed: 'Minutes', note: 'Cash pickup', ctaLabel: 'Go to MoneyGram' },
    ],
    rateWidget: {
      midMarket: '1 USD = 0.7100 JOD',
      asOf: 'Updated 3 minutes ago',
      source: 'XE',
      changes: [{ label: '7D', value: '+0.05%' }, { label: '30D', value: '+0.10%' }, { label: '60D', value: '-0.12%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.0', recipientGets: '709 JOD', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 0.7090 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal', isAffiliate: true },
        { provider: 'Wise', score: '9.4', recipientGets: '708 JOD', delta: '0.5% off mid-market', fee: '$5.49', rate: '1 USD = 0.7105 JOD', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated', isAffiliate: true },
        { provider: 'MoneyGram', score: '8.6', recipientGets: '704 JOD', delta: '0.9% off mid-market', fee: '$4.99', rate: '1 USD = 0.7030 JOD', speed: 'Minutes', speedNote: 'Cash pickup', payIn: 'Debit, credit card', payOut: 'Cash pickup', notes: 'Fastest for cash', isAffiliate: true },
        { provider: 'XE', score: '8.7', recipientGets: '703 JOD', delta: '1.1% off mid-market', fee: '$0', rate: '1 USD = 0.7040 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts', isAffiliate: true },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '670 JOD', delta: '5.6% off mid-market', fee: '$30+', rate: '1 USD = 0.6700 JOD', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended', isAffiliate: false },
      ],
    },
    insights: [
      { label: 'Providers checked', value: '10', helper: 'USD → JOD' },
      { label: 'Avg lowest cost', value: '0.5%', helper: 'On $1,000' },
      { label: 'Highest cost', value: '5.6%', helper: 'Banks' },
      { label: 'Fastest route', value: 'Minutes', helper: 'Cash pickup' },
      { label: 'Best for >$10k', value: 'XE/OFX', helper: 'Negotiated rates' },
    ],
    recommendations: [],
    steps: [
      'Compare live quotes for USD → JOD and select the cheapest total cost.',
      'Choose payout method: bank deposit (cheapest) or cash pickup (fastest).',
      'Verify your ID if requested; Jordan requires standard KYC.',
      'Fund via ACH or bank transfer for lowest fees; card if urgent.',
      'Track delivery and confirm JOD arrived.',
    ],
    faqs: [
      { q: 'What is the best way to send USD to Jordan?', a: 'Online money transfer services are typically cheaper than banks. Remitly and Wise lead for bank deposits; MoneyGram is fastest for cash pickup.' },
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup versus mid-market rate. We benchmark every quote against XE mid-market rate.' },
      { q: 'How long does a USD → JOD transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 business day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All providers listed are licensed in their operating regions. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/JOD Exchange Rates', excerpt: 'Learn how the mid-market rate works, what FX markup means, and how to spot hidden fees when sending USD to Jordan.', link: '/learn/how-exchange-rates-work' },
      { title: 'Bank Deposit vs Cash Pickup in Jordan', excerpt: 'Bank deposits are usually cheapest. Cash pickup is fastest but costs more. Compare total costs for both methods.', link: '/learn/cash-pickup-vs-bank-deposit' },
    ],
    disclosures: {
      advert: 'Some links are affiliate links. Our rankings stay neutral: cheapest total cost ranks first, even without an affiliate payout.',
      data: 'Rates shown are illustrative. Live data will show exact fees, FX markup, and timestamps per provider.',
    },
  },
  'united-states-brunei': {
    from: 'United States',
    to: 'Brunei',
    fromCode: 'usd',
    toCode: 'bnd',
    currencyPair: 'USD/BND',
    lastUpdated: '2024-11-30',
    hero: {
      kicker: 'Corridor Guide',
      title: 'Send money from the United States to Brunei',
      subhead: 'Today\'s cheapest money transfer service might not be the cheapest tomorrow. Find the one that\'s best-suited to your needs by comparing the best performers on Remit-Scout\'s comparison engine.',
      chips: ['Fact-checked', 'Neutral rankings', 'Licensed providers only'],
    },
    statsBar: [
      { label: 'Providers', value: '9', helper: 'USD → BND' },
      { label: 'Most often cheapest', value: 'Remitly', helper: 'Past 30 days' },
      { label: 'Popular payout', value: 'Bank deposit', helper: 'Low cost' },
      { label: 'Fastest', value: 'Minutes', helper: 'Cash pickup' },
    ],
    providerHighlights: [
      { label: 'Best rated', provider: 'Wise', score: '9.5', rate: '1 USD = 1.3592 BND', fee: '$4.99', speed: '1-2 days', note: 'Transparent pricing', ctaLabel: 'Go to Wise' },
      { label: 'Cheapest', provider: 'Remitly', score: '9.1', rate: '1 USD = 1.3550 BND', fee: '$0 promo', speed: 'Same day', note: 'Best for bank deposits', ctaLabel: 'Go to Remitly' },
      { label: 'Fastest', provider: 'WorldRemit', score: '8.9', rate: '1 USD = 1.3470 BND', fee: '$3.99', speed: 'Minutes', note: 'Cash pickup', ctaLabel: 'Go to WorldRemit' },
    ],
    rateWidget: {
      midMarket: '1 USD = 1.3600 BND',
      asOf: 'Updated 2 minutes ago',
      source: 'XE',
      changes: [{ label: '7D', value: '+0.12%' }, { label: '30D', value: '+0.35%' }, { label: '60D', value: '-0.28%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.1', recipientGets: '1,355 BND', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 1.3550 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal', isAffiliate: true },
        { provider: 'Wise', score: '9.5', recipientGets: '1,351 BND', delta: '0.7% off mid-market', fee: '$4.99', rate: '1 USD = 1.3592 BND', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated', isAffiliate: true },
        { provider: 'WorldRemit', score: '8.9', recipientGets: '1,342 BND', delta: '1.3% off mid-market', fee: '$3.99', rate: '1 USD = 1.3470 BND', speed: 'Minutes', speedNote: 'Cash pickup', payIn: 'Debit, credit card', payOut: 'Cash pickup', notes: 'Fastest for cash', isAffiliate: true },
        { provider: 'XE', score: '8.7', recipientGets: '1,340 BND', delta: '1.5% off mid-market', fee: '$0', rate: '1 USD = 1.3490 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts', isAffiliate: true },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '1,270 BND', delta: '6.6% off mid-market', fee: '$30+', rate: '1 USD = 1.3100 BND', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended', isAffiliate: false },
      ],
    },
    insights: [
      { label: 'Providers checked', value: '9', helper: 'USD → BND' },
      { label: 'Avg lowest cost', value: '0.4%', helper: 'On $1,000' },
      { label: 'Highest cost', value: '4.5%', helper: 'Banks' },
      { label: 'Fastest route', value: 'Minutes', helper: 'Cash pickup' },
      { label: 'Best for >$10k', value: 'XE/OFX', helper: 'Negotiated rates' },
    ],
    recommendations: [],
    steps: [
      'Compare live quotes for USD → BND and pick the cheapest total cost.',
      'Choose payout: bank deposit (cheapest) or cash pickup (fastest).',
      'Verify ID if requested; Brunei requires standard KYC.',
      'Fund via ACH for lowest fee; card if urgent.',
      'Track delivery; confirm BND arrived.',
    ],
    faqs: [
      { q: 'What is the best way to send USD to Brunei?', a: 'Online transfer services are cheaper than banks. Remitly and Wise lead for bank deposits; WorldRemit is fastest for cash.' },
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup vs mid-market. We benchmark against XE.' },
      { q: 'How long does a USD → BND transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All listed providers are licensed. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/BND Exchange Rates', excerpt: 'Learn how the Brunei Dollar rate works and how to calculate true total cost.', link: '/learn/how-exchange-rates-work' },
      { title: 'Bank Deposit vs Cash Pickup in Brunei', excerpt: 'Compare costs, speed, and convenience for both payout methods.', link: '/learn/cash-pickup-vs-bank-deposit' },
    ],
    disclosures: {
      advert: 'Some links are affiliate links. Rankings stay neutral: cheapest total cost ranks first.',
      data: 'Rates shown are illustrative. Live data will show exact fees and timestamps.',
    },
  },
}

const fallbackContent: CorridorContent = {
  from: resolveCountryName(canonicalFrom.value || 'from'),
  to: resolveCountryName(canonicalTo.value || 'to'),
  fromCode: resolveCurrency(canonicalFrom.value || '') || 'usd',
  toCode: resolveCurrency(canonicalTo.value || '') || 'xxx',
  currencyPair: [resolveCurrency(canonicalFrom.value || ''), resolveCurrency(canonicalTo.value || '')].filter(Boolean).join('/'),
  lastUpdated: new Date().toISOString().slice(0, 10),
  hero: {
    kicker: 'Corridor Guide',
    title: `Send money from ${resolveCountryName(canonicalFrom.value || 'from')} to ${resolveCountryName(canonicalTo.value || 'to')}`,
    subhead: 'We are setting up live comparisons for this corridor. Check back soon for detailed provider rankings and expert guides.',
    chips: ['Coming soon'],
  },
  statsBar: [],
  providerHighlights: [],
  rateWidget: { midMarket: '', asOf: '', source: '', changes: [] },
  table: { title: 'Coming soon', amountExample: '', rows: [] },
  insights: [],
  recommendations: [],
  steps: [],
  faqs: [],
  disclosures: { advert: 'Affiliate disclosures will appear with live data.', data: 'Live rates will populate here.' },
}

const baseContent = computed(() => corridorContent[corridorKey.value] || fallbackContent)
const providerQuotes = computed(() => (quotesData.value?.data || []) as ProviderQuote[])
const ratedQuotes = computed(() => attachRatings(providerQuotes.value) as Array<ProviderQuote & { score?: number }>)
const apiUpdatedAt = computed(() => quotesData.value?.updatedAt)
const apiUpdatedLabel = computed(() => (apiUpdatedAt.value ? getRelativeTime(apiUpdatedAt.value) : ''))
const hasApiPayload = computed(() => Array.isArray(quotesData.value?.data) && !quotesError.value)
const hasApiError = computed(() => !!quotesError.value)
const fromCurrencyCode = computed(() => (baseContent.value.fromCode || resolveCurrency(canonicalFrom.value) || 'USD').toUpperCase())
const toCurrencyCode = computed(() => (baseContent.value.toCode || resolveCurrency(canonicalTo.value) || 'XXX').toUpperCase())

const methodLabelMap: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash pickup',
  wallet: 'Mobile wallet',
  card: 'Card',
}

const formatMethodLabels = (methods: string[]) => methods.map(method => methodLabelMap[method] || method).join(', ')

const apiRows = computed<TableRow[]>(() => {
  if (!ratedQuotes.value.length) return []

  return ratedQuotes.value.map((quote, index) => {
    const score = Number.isFinite(quote.score) ? Number(quote.score).toFixed(1) : '0.0'
    const methodsLabel = formatMethodLabels(quote.methods as string[])

    return {
      provider: quote.name,
      score,
      recipientGets: `${quote.recipientGets.toLocaleString()} ${toCurrencyCode.value}`,
      delta: `${quote.marginPct.toFixed(2)}% off mid-market`,
      fee: formatMoney(quote.fee, fromCurrencyCode.value),
      rate: formatRate(quote.fxRate, fromCurrencyCode.value, toCurrencyCode.value),
      speed: quote.delivery,
      speedNote: quote.bestFor || 'Standard delivery',
      payIn: methodsLabel,
      payOut: methodsLabel,
      notes: quote.whyThisRanking || quote.bestFor || '',
      badge: index === 0 ? 'Best Deal' : undefined,
      isAffiliate: true,
    }
  })
})

const content = computed(() => {
  const base = baseContent.value
  const merged = {
    ...base,
    fromCode: fromCurrencyCode.value || base.fromCode,
    toCode: toCurrencyCode.value || base.toCode,
  }

  if (!hasApiPayload.value) {
    return merged
  }

  return {
    ...merged,
    lastUpdated: apiUpdatedLabel.value || merged.lastUpdated,
    table: {
      ...merged.table,
      rows: apiRows.value,
    },
    stats: {
      ...merged.stats,
      providerCount: String(apiRows.value.length),
    },
    rateWidget: {
      ...merged.rateWidget,
      asOf: apiUpdatedLabel.value || merged.rateWidget.asOf,
      source: merged.rateWidget.source || 'Remit-Scout',
    },
  }
})

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Money Transfer Comparison', path: '/send-money' },
  { name: `to ${content.value.to}`, path: `/send-money/to-${canonicalTo.value}` },
  { name: `from ${content.value.from}`, path: canonicalPath.value },
])

const providerCount = computed(() => (hasApiPayload.value ? apiRows.value.length : baseContent.value.table.rows.length) || 0)
const bestQuote = computed(() => {
  if (!providerQuotes.value.length) return null
  return [...providerQuotes.value].sort((a, b) => b.recipientGets - a.recipientGets)[0]
})
const topProviders = computed(() => {
  if (providerQuotes.value.length) {
    return providerQuotes.value.slice(0, 2).map(p => p.name).join(' and ')
  }
  return baseContent.value.table.rows.slice(0, 2).map(p => p.provider).join(' and ')
})
const bestRateLabel = computed(() => {
  if (!bestQuote.value) return ''
  return `1 ${fromCurrencyCode.value} = ${bestQuote.value.fxRate.toFixed(4)} ${toCurrencyCode.value}`
})
const seoUpdatedLabel = computed(() => apiUpdatedLabel.value || 'today')
const seoTitle = computed(() => `Today's Best ${fromCurrencyCode.value} to ${toCurrencyCode.value} Rates | Remit-Scout`)
const seoDescription = computed(() => {
  const providerLine = topProviders.value ? ` including ${topProviders.value}` : ''
  const rateLine = bestRateLabel.value ? ` Best rate: ${bestRateLabel.value}.` : ''
  return `Compare ${providerCount.value} providers${providerLine}.${rateLine} Updated ${seoUpdatedLabel.value}.`
})

setSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  canonical: `${normalizedSiteUrl}${canonicalPath.value}`,
})

jsonLdBreadcrumb(breadcrumbItems.value.map(item => ({ name: item.name, url: `${normalizedSiteUrl}${item.path}` })))

if (content.value.faqs.length) {
  jsonLdFaq(content.value.faqs)
}

const displayAmount = ref(initialAmount)
const displayCurrency = ref(fromCurrencyCode.value)
const payoutMethod = ref<Method>(initialMethod)
const sortBy = ref('recipient')
const insightTimeframe = ref('7d')

const sortLabels: Record<string, string> = {
  recipient: 'recipient gets',
  cost: 'lowest cost',
  speed: 'fastest',
  score: 'best rated',
  'remit-score': 'remit score',
}

const isQuotesLoading = computed(() => quotesPending.value && !hasApiPayload.value)

const sortedProviders = computed(() => {
  const rows = [...content.value.table.rows]
  if (sortBy.value === 'speed') {
    return rows.sort((a, b) => {
      const speedOrder = ['Minutes', 'Same day', '1-2 days', '2-5 days']
      return speedOrder.indexOf(a.speed) - speedOrder.indexOf(b.speed)
    })
  }
  if (sortBy.value === 'score' || sortBy.value === 'remit-score') {
    return rows.sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
  }
  return rows
})

const recipientRange = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return { min: '0', max: '0' }
  const amounts = rows.map(r => parseFloat(r.recipientGets.replace(/[^0-9.]/g, '')))
  return {
    min: Math.min(...amounts).toLocaleString(),
    max: Math.max(...amounts).toLocaleString(),
  }
})

const corridorWatchTarget = computed(() => ({
  type: 'corridor' as const,
  from: fromCountryCode.value,
  to: toCountryCode.value,
  method: payoutMethod.value,
}))

const corridorWatchLabel = computed(() => `${content.value.from}→${content.value.to} • ${payoutMethod.value}`)

const exchangeRates: Record<string, Record<string, number>> = {
  USD: { JOD: 0.71, BND: 1.36, EUR: 0.92, GBP: 0.79, USD: 1 },
  EUR: { JOD: 0.77, BND: 1.48, USD: 1.09, GBP: 0.86, EUR: 1 },
  GBP: { JOD: 0.90, BND: 1.72, USD: 1.27, EUR: 1.16, GBP: 1 },
}

const midMarketRate = computed(() => {
  const fromCurr = content.value.fromCode.toUpperCase()
  const toCurr = content.value.toCode.toUpperCase()
  return exchangeRates[fromCurr]?.[toCurr] || 1
})

const providerMarkups: Record<string, { feePercent: number; spreadBps: number }> = {
  'Remitly': { feePercent: 0, spreadBps: 40 },
  'Wise': { feePercent: 0.55, spreadBps: 50 },
  'MoneyGram': { feePercent: 0.5, spreadBps: 90 },
  'XE': { feePercent: 0, spreadBps: 110 },
  'WorldRemit': { feePercent: 0.4, spreadBps: 130 },
  'Major US Bank': { feePercent: 3, spreadBps: 560 },
}

function getProviderTrueCost(row: TableRow, index: number): TrueCostBreakdown {
  const markup = providerMarkups[row.provider] || { feePercent: 0.5, spreadBps: 100 }
  const upfrontFee = (displayAmount.value * markup.feePercent) / 100
  const providerRate = midMarketRate.value * (1 - markup.spreadBps / 10000)

  const bestMarkup = providerMarkups['Remitly'] || { feePercent: 0, spreadBps: 40 }
  const bestUpfrontFee = (displayAmount.value * bestMarkup.feePercent) / 100
  const bestProviderRate = midMarketRate.value * (1 - bestMarkup.spreadBps / 10000)
  const bestHiddenMarkup = displayAmount.value * (midMarketRate.value - bestProviderRate) / midMarketRate.value
  const bestTotalCost = bestUpfrontFee + bestHiddenMarkup

  return buildTrueCostBreakdown(
    displayAmount.value,
    upfrontFee,
    midMarketRate.value,
    providerRate,
    index === 0 ? 0 : bestTotalCost
  )
}

function handleBarUpdate(data: { amount: number; payoutMethod: string; currency: string }) {
  displayAmount.value = data.amount
  payoutMethod.value = data.payoutMethod as Method
  displayCurrency.value = data.currency
}

function handleSort(newSort: string) {
  sortBy.value = newSort
}

function handleSave() {
  console.log('Save corridor')
}

function handleAlert() {
  console.log('Set alert')
}

function handleShare() {
  console.log('Share corridor')
}

const corridorFaqs = computed(() => [
  {
    q: `What is the best way to send money from ${content.value.from} to ${content.value.to}?`,
    a: `Online money transfer services like Wise, Remitly, and WorldRemit are typically cheaper than banks for sending money from ${content.value.from} to ${content.value.to}. They offer better exchange rates, lower fees, and faster delivery times. We compare all options above so you can find the best deal for your specific transfer amount.`,
  },
  {
    q: `How long does a transfer from ${content.value.from} to ${content.value.to} take?`,
    a: `Transfer times vary by provider and payout method. Cash pickup is usually fastest (minutes to hours). Bank deposits typically take 1-3 business days. Traditional bank SWIFT transfers can take 3-5 business days. The comparison above shows exact delivery times for each provider.`,
  },
  {
    q: `What fees will I pay to send money to ${content.value.to}?`,
    a: `Fees consist of two parts: the transfer fee (shown upfront) and the exchange rate markup (hidden in the rate). We calculate total cost by comparing each provider's rate against the mid-market rate from XE. This shows you the true cost, not just the advertised fee.`,
  },
  {
    q: `Is it safe to use online money transfer services?`,
    a: `Yes, all providers we list are licensed and regulated by financial authorities (FinCEN in the US, FCA in the UK, ASIC in Australia). We exclude unlicensed services. Look for the licensing badges on each provider card above.`,
  },
  {
    q: `How do you rank the providers?`,
    a: `We rank by total cost (fee + FX markup) so the cheapest option appears first. Providers cannot pay for better placement—our rankings are 100% independent. We also show speed, reliability scores, and user ratings to help you choose.`,
  },
])
</script>
