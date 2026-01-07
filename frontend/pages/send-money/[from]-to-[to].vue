<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Corridor Decision Header -->
    <section class="bg-gray-900 text-white relative overflow-hidden">
      
      <div class="mx-auto max-w-6xl px-4 py-8 relative">
        <!-- Breadcrumb -->
        <nav class="mb-6 text-sm">
          <ol class="flex flex-wrap items-center gap-2">
            <li>
              <NuxtLink to="/" class="text-slate-400 hover:text-white transition-colors">Home</NuxtLink>
            </li>
            <li class="text-slate-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <NuxtLink to="/send-money" class="text-slate-400 hover:text-white transition-colors">Send Money</NuxtLink>
            </li>
            <li class="text-slate-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li class="text-white font-medium">{{ content.from }} to {{ content.to }}</li>
          </ol>
        </nav>

        <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
          <!-- Left: Corridor Info -->
          <div>
            <!-- Corridor Header -->
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

            <!-- Recipient Gets -->
            <div class="mb-6 p-5 bg-brand-600 rounded-2xl border border-brand-600/20">
              <p class="text-xs text-white/80 font-semibold uppercase tracking-wider mb-2">
                Recipient gets (on {{ formatMoney(displayAmount, fromCurrencyCode) }})
              </p>
              <p class="text-4xl font-black tracking-tight mb-2 text-white">
                <template v-if="isExactRecipientAmount">
                  {{ recipientRange.min }} <span class="text-2xl text-white/90 font-bold">{{ content.toCode.toUpperCase() }}</span>
                </template>
                <template v-else>
                  {{ recipientRange.min }} – {{ recipientRange.max }} <span class="text-2xl text-white/90 font-bold">{{ content.toCode.toUpperCase() }}</span>
                </template>
              </p>
              <p v-if="!isExactRecipientAmount" class="text-sm text-white/80 leading-relaxed">
                The spread shows how provider rates differ. Find the best deal below.
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                @click="handleSave"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Add to watchlist
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                @click="handleAlert"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Set rate alert
              </button>
            </div>
          </div>

          <!-- Right: Rate Widget & Chart -->
          <div class="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <!-- Rate Header -->
            <div class="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid-Market Rate</p>
                  <p class="text-3xl font-black text-slate-900 tracking-tight">{{ content.rateWidget.midMarket }}</p>
                  <p class="text-xs text-slate-500 mt-1">The real exchange rate — anything worse costs you</p>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    v-for="change in content.rateWidget.changes"
                    :key="change.label"
                    :class="[
                      'inline-flex items-center justify-end gap-1 rounded-lg px-2.5 py-1 text-xs font-bold',
                      change.value === '+0.00%' || change.value === '0.00%' || change.value === '+0.0%' || change.value === '0.0%'
                        ? 'bg-slate-100 text-slate-600'
                        : change.value.startsWith('-')
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700',
                    ]"
                  >
                    <svg v-if="!change.value.startsWith('-') && change.value !== '+0.00%' && change.value !== '0.00%' && change.value !== '+0.0%' && change.value !== '0.0%'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <svg v-else-if="change.value.startsWith('-')" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {{ change.value }} <span class="text-[10px] font-semibold opacity-70">{{ change.label }}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Chart -->
            <div class="p-5">
              <div class="h-48 relative bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-100 overflow-hidden">
                <!-- Chart SVG -->
                <svg class="absolute inset-0 w-full h-full" :viewBox="`0 0 ${chartWidth} ${chartHeight + 20}`" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2" />
                      <stop offset="100%" stop-color="#2563eb" stop-opacity="0.02" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <!-- Horizontal grid lines -->
                  <g opacity="0.5">
                    <line x1="50" y1="25" x2="395" y2="25" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="50" y1="55" x2="395" y2="55" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="50" y1="85" x2="395" y2="85" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
                  </g>
                  
                  <!-- Y-axis labels -->
                  <g v-if="chartStats" font-family="Inter, system-ui, sans-serif">
                    <text x="45" y="28" text-anchor="end" fill="#64748b" font-size="9" font-weight="600">
                      {{ chartStats.maxRate.toFixed(2) }}
                    </text>
                    <text x="45" y="58" text-anchor="end" fill="#64748b" font-size="9" font-weight="600">
                      {{ chartStats.avgRate.toFixed(2) }}
                    </text>
                    <text x="45" y="88" text-anchor="end" fill="#64748b" font-size="9" font-weight="600">
                      {{ chartStats.minRate.toFixed(2) }}
                    </text>
                  </g>
                  
                  <!-- Area fill -->
                  <path
                    v-if="chartAreaPath"
                    :d="chartAreaPath"
                    fill="url(#heroChartGradient)"
                  />
                  
                  <!-- Main line -->
                  <path
                    v-if="chartLinePath"
                    :d="chartLinePath"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    filter="url(#glow)"
                  />
                  
                  <!-- Data points -->
                  <g v-if="chartPoints.length > 1">
                    <circle
                      v-for="(point, idx) in chartPoints.filter((_, i) => i === 0 || i === chartPoints.length - 1 || i % Math.ceil(chartPoints.length / 5) === 0)"
                      :key="`point-${idx}`"
                      :cx="point.x"
                      :cy="point.y"
                      r="3"
                      fill="white"
                      stroke="#2563eb"
                      stroke-width="2"
                    />
                  </g>
                  
                  <!-- End point (highlighted) -->
                  <g v-if="chartEndPoint">
                    <circle :cx="chartEndPoint.x" :cy="chartEndPoint.y" r="8" fill="#2563eb" opacity="0.15" />
                    <circle :cx="chartEndPoint.x" :cy="chartEndPoint.y" r="5" fill="#2563eb" stroke="white" stroke-width="2" />
                  </g>
                </svg>
                
                <!-- Loading/Error State -->
                <div
                  v-if="chartStatusLabel && !isSameCurrency"
                  class="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm"
                >
                  <div class="flex flex-col items-center gap-2">
                    <svg v-if="rateHistoryPending" class="w-6 h-6 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span class="text-sm text-slate-500 font-medium">{{ chartStatusLabel }}</span>
                  </div>
                </div>
                
                <!-- X-axis labels -->
                <div class="absolute bottom-2 left-14 right-2 flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{{ chartLabels[0] }}</span>
                  <span class="text-slate-600">{{ chartLabels[1] }}</span>
                </div>
              </div>
              
              <!-- Chart Stats Row -->
              <div v-if="chartStats" class="mt-4 grid grid-cols-3 gap-3">
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">30D Low</p>
                  <p class="text-sm font-bold text-slate-900">{{ chartStats.minRate.toFixed(4) }}</p>
                </div>
                <div class="text-center p-3 bg-brand-50 rounded-lg border border-brand-100">
                  <p class="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-0.5">Current</p>
                  <p class="text-sm font-bold text-brand-700">{{ (isSameCurrency ? 1.0 : latestHistoryRate)?.toFixed(4) || '—' }}</p>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">30D High</p>
                  <p class="text-sm font-bold text-slate-900">{{ chartStats.maxRate.toFixed(4) }}</p>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span class="text-slate-600 font-medium">{{ content.rateWidget.asOf }}</span>
                </div>
                <span class="text-slate-400">
                  Source: <span class="font-semibold text-slate-600">{{ content.rateWidget.source }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Anchor Mini Nav -->
    <CorridorMiniNav :last-updated="mostRecentUpdateLabel" />

    <!-- ZONE A: Compare -->
    <section id="compare" class="bg-white">
      <div class="mx-auto max-w-6xl px-4 py-8">
        <!-- Query Builder Card -->
        <div class="mb-8">
          <CorridorStickyBar
            :amount="displayAmount"
            :payout-method="payoutMethod"
            :sort-by="sortBy"
            :currency="displayCurrency"
            :from-currency="fromCurrencyCode"
            :from-country="fromCountryCode"
            :to-country="toCountryCode"
            :available-to-currencies="availableToCurrencies"
            :available-from-currencies="availableFromCurrencies"
            :available-methods="availableMethods"
            :methods-loading="quotesPending || methodsDiscoveryPending"
            @update="handleBarUpdate"
            @sort="handleSort"
            @save="handleSave"
            @alert="handleAlert"
            @share="handleShare"
            @new-query="handleNewQuery"
          />
        </div>

        <!-- Refresh Status -->
        <div
          v-if="isRefreshQueued"
          class="mb-6 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-blue-50 p-5 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-base font-semibold text-brand-900">Getting fresh quotes</p>
              <p v-if="refreshStatus?.providers?.length" class="text-sm text-brand-700 mt-1">
                Comparing {{ refreshStatus.providers.length }} providers to find you the best rate right now.
              </p>
            </div>
          </div>
        </div>

        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Compare <span class="text-brand-600">{{ providerCount }}</span> {{ providerCount === 1 ? 'Provider' : 'Providers' }}
            </h2>
            <p class="text-sm text-slate-600 max-w-xl break-words">
              Independent rankings based on total cost vs. mid-market rates, not just fees.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sorted by {{ sortLabels[sortBy] }}
            </span>
            <NuxtLink to="/how-we-make-money" class="text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors underline underline-offset-2">
              How we rank
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
          v-else-if="corridorUnsupported"
          class="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          Unsupported corridor. Please try another combination.
        </div>

        <div
          v-else-if="corridorUnavailable"
          class="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          This corridor is unavailable right now. Please try another combination.
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
              class="rounded-xl border-2 p-5 transition-all hover:shadow-lg"
              :class="index === 0 
                ? 'bg-brand-600 border-brand-600/20 text-white' 
                : 'bg-gray-900 border-gray-800 text-white'"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div class="flex items-center gap-4">
                  <!-- Square logo container with border similar to TrueCostCard -->
                  <div class="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center flex-shrink-0 rounded-xl border border-white/20 bg-white p-3">
                    <ProviderLogo
                      :slug="getProviderSlug(row) || ''"
                      :alt="row.provider"
                      size="small"
                      class="object-contain"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1 flex-wrap">
                      <p class="text-lg font-bold">{{ row.provider }}</p>
                      <ScoreBadge
                        :score="Number.parseFloat(row.score)"
                        :clickable="true"
                        size="large"
                        @click="openScoreModal(row)"
                      />
                      <!-- Best Deal Badge (only for top option) -->
                      <span 
                        v-if="index === 0"
                        class="rounded px-2 py-0.5 text-xs font-bold bg-white text-brand-600"
                      >
                        Best Deal
                      </span>
                      <span v-if="row.warning" class="rounded bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                        {{ row.warning }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <p class="text-sm text-white/70">{{ row.speed }} · {{ row.speedNote }}</p>
                      <NuxtLink
                        v-if="getProviderSlug(row)"
                        :to="`/learn/providers/${getProviderSlug(row)}`"
                        class="text-xs font-semibold text-white hover:text-white/80 transition-colors"
                      >
                        Read Review →
                      </NuxtLink>
                    </div>
                    <!-- Promotional Info -->
                    <div
                      v-if="row.hasPromo && row.promoInfo"
                      class="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 w-full"
                    >
                      <svg class="h-4 w-4 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                      </svg>
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs font-semibold text-emerald-200">
                          Promotional Offer
                        </span>
                        <span class="text-xs text-emerald-300">
                          {{ row.promoInfo.newCustomersOnly ? 'New customers only' : 'Special rate' }} · 
                          Fee: {{ formatMoney(row.promoInfo.fee, fromCurrencyCode) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <p class="text-xs font-medium text-white/70 mb-1">Recipient gets</p>
                  <p class="text-2xl font-bold">{{ row.recipientGets }}</p>
                  <div v-if="row.fxRate && midMarketRate && Number.isFinite(row.fxRate)" class="mt-3 space-y-1.5">
                    <div class="text-xs">
                      <span class="text-white/70">Exchange rate: </span>
                      <span class="font-semibold text-white">{{ formatRate(row.fxRate, fromCurrencyCode, toCurrencyCode) }}</span>
                    </div>
                    <div class="text-xs">
                      <span 
                        :class="[
                          'font-semibold',
                          getRateComparison(row.fxRate).isBetter 
                            ? index === 0 ? 'text-emerald-200' : 'text-emerald-300'
                            : getRateComparison(row.fxRate).isWorse
                              ? index === 0 ? 'text-rose-200' : 'text-rose-300'
                              : 'text-white/80'
                        ]"
                      >
                        {{ getRateComparison(row.fxRate).text }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="index !== 0"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white/10 border border-white/20 text-white"
                  >
                    <span>+{{ formatMoney(getProviderTrueCost(row, index).deltaFromBest, fromCurrencyCode) }} more than best option</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t" :class="index === 0 ? 'border-white/20' : 'border-white/10'">
                <div class="lg:col-span-3">
                  <TrueCostCard
                    :upfront-fee="getProviderTrueCost(row, index).upfrontFee"
                    :hidden-markup="getProviderTrueCost(row, index).hiddenMarkup"
                    :total-cost="getProviderTrueCost(row, index).totalCost"
                    :total-cost-percent="getProviderTrueCost(row, index).totalCostPercent"
                    :spread-bps="getProviderTrueCost(row, index).spreadBps"
                    :hidden-markup-percent="getProviderTrueCost(row, index).hiddenMarkupPercent"
                    :amount="displayAmount"
                    :provider-rate="row.fxRate"
                    :mid-market-rate="midMarketRate"
                    :is-best="index === 0"
                    :average-cost="averageCost"
                    :worst-cost="worstCost"
                    :best-cost="bestTotalCost"
                    :currency-code="fromCurrencyCode"
                    :has-promo="row.hasPromo"
                    :promo-info="row.promoInfo"
                    :dark-background="true"
                    compact
                  />
                </div>
                <div class="flex flex-col justify-between">
                  <div class="mb-3">
                    <div class="flex flex-wrap gap-1.5 mb-2">
                      <!-- Only show delivery method (payOut), not payment method (payIn) -->
                      <span v-if="row.payOut?.includes('Cash')" class="inline-flex items-center gap-1 rounded bg-white/20 border border-white/30 px-2 py-0.5 text-xs text-white">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Cash pickup
                      </span>
                      <span v-else-if="row.payOut?.includes('Bank')" class="inline-flex items-center gap-1 rounded bg-white/20 border border-white/30 px-2 py-0.5 text-xs text-white">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        Bank deposit
                      </span>
                      <span v-else-if="row.payOut?.includes('Wallet') || row.payOut?.includes('wallet')" class="inline-flex items-center gap-1 rounded bg-white/20 border border-white/30 px-2 py-0.5 text-xs text-white">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Mobile wallet
                      </span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <button
                      type="button"
                      @click="handleProviderOutbound(row)"
                      class="w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-all bg-white text-gray-900 hover:bg-gray-100"
                    >
                      Go to {{ row.provider.split(' ')[0] }} →
                    </button>
                    <p v-if="row.isAffiliate !== false" class="text-center text-[10px] text-white/50 flex items-center justify-center gap-1">
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
          <p class="text-lg font-semibold text-neutral-700 mb-2">No live quotes yet</p>
          <p class="text-sm text-neutral-500 mb-4">
            We're pulling fresh quotes from providers for this corridor. Please try again shortly.
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            :disabled="quotesPending || quoteRefreshPending"
            @click="handleRefreshQuotes"
          >
            Refresh quotes
          </button>
        </div>

        <p class="mt-4 text-xs text-neutral-500">
          Last updated {{ content.lastUpdated }}. We source data from providers and cannot guarantee accuracy.
          <span v-if="quotesData?.approximate && quotesData?.bucketUsed">
            Using the nearest available amount bucket: ${{ Number(quotesData.bucketUsed).toLocaleString() }}.
          </span>
        </p>
      </div>
    </section>

    <!-- ZONE B: Insights -->
    <section id="insights" class="bg-white border-b border-slate-200">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="mb-4">
              <h2 class="text-2xl font-bold text-neutral-900 mb-2">Rate Volatility & Market Insights</h2>
              <p class="text-sm text-neutral-600">
                See how rates have moved and what that means for your recipient's final amount.
              </p>
            </div>
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

          <div v-if="FEATURE_FLAGS.PULSE_ENABLED && !isPlus" class="lg:col-span-2 rounded-xl border-2 border-blue-600/30 bg-slate-900 p-6 relative overflow-hidden">
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

          <div v-if="FEATURE_FLAGS.PULSE_ENABLED && isPlus" class="lg:col-span-2 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
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
                Stop Losing Money on the Mid-Market Rate
              </h2>
              <div class="prose prose-neutral prose-sm max-w-none">
                <p class="text-neutral-600 leading-relaxed mb-4">
                  {{ content.hero.subhead }}
                </p>
                <p class="text-neutral-600 leading-relaxed mb-4">
                  Exchange rates fluctuate constantly. What your recipient receives depends on the rate you lock in—not just the transfer fee. Most providers hide their markup in the exchange rate, making "zero fees" look cheaper than it actually is.
                </p>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p class="text-sm font-semibold text-amber-900 mb-2">Why receivers care about volatility</p>
                  <p class="text-sm text-amber-800 leading-relaxed">
                    A 2% worse rate on $500 means your recipient gets $10 less—even with "zero fees." Rate volatility compounds over time. Track rate changes with <span v-if="FEATURE_FLAGS.PULSE_ENABLED" class="font-semibold">Remit-Scout Pulse</span><span v-else class="font-semibold">our Plus features</span> to avoid losing money to hidden markups.
                  </p>
                </div>
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

    <!-- Provider Score Modal -->
    <ProviderScoreModal
      v-if="selectedProvider"
      v-model:is-open="scoreModalOpen"
      :provider-id="selectedProvider.providerId"
      :provider-name="selectedProvider.providerName"
      :score="selectedProvider.score"
    />

    <!-- Auth Prompt Modal -->
    <AuthPromptModal
      :is-open="authModalOpen"
      :feature="authModalFeature"
      :title="authModalFeature === 'watchlist' ? 'Sign in to save corridors' : 'Sign in to set alerts'"
      :message="authModalFeature === 'watchlist' 
        ? 'Create a free account to save this corridor to your watchlist and track rate changes.' 
        : 'Create a free account to set rate alerts and get notified when rates improve.'"
      @close="authModalOpen = false"
    />

    <!-- Limit Reached Modal -->
    <LimitReachedModal
      :is-open="limitModalOpen"
      :feature="limitModalFeature"
      :limit="limitModalLimit"
      :current-count="limitModalCount"
      :title="limitModalFeature === 'watchlist' ? 'Watchlist limit reached' : 'Alert limit reached'"
      :message="limitModalFeature === 'watchlist'
        ? `You've saved ${limitModalCount} corridors, the maximum for free accounts.`
        : `You've created ${limitModalCount} alerts, the maximum for free accounts.`"
      @close="limitModalOpen = false"
    />

    <!-- Share Modal -->
    <ShareModal
      :is-open="shareModalOpen"
      :from-country="content.from"
      :to-country="content.to"
      :amount="displayAmount"
      :currency="fromCurrencyCode"
      @close="shareModalOpen = false"
    />

    <!-- Success Toast -->
    <SuccessToast
      ref="successToastRef"
      :title="toastTitle"
      :message="toastMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FEATURE_FLAGS } from '~/utils/constants'
import { jsonLdBreadcrumb, jsonLdFaq, setSeo } from '~/composables/useSeo'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useApi } from '~/composables/useApi'
import TrueCostCard from '~/components/shared/TrueCostCard.vue'
import ProviderDeltaBadge from '~/components/shared/ProviderDeltaBadge.vue'
import ScoreBadge from '~/components/shared/ScoreBadge.vue'
import ProviderScoreModal from '~/components/shared/ProviderScoreModal.vue'
import AuthPromptModal from '~/components/shared/AuthPromptModal.vue'
import LimitReachedModal from '~/components/shared/LimitReachedModal.vue'
import ShareModal from '~/components/shared/ShareModal.vue'
import SuccessToast from '~/components/shared/SuccessToast.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { normalizeProviderSlug } from '~/composables/useProviderLogo'
import CorridorMiniNav from '~/components/corridor/CorridorMiniNav.vue'
import CorridorStickyBar from '~/components/corridor/CorridorStickyBar.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import { buildTrueCostBreakdown } from '~/lib/trueCostCalculator'
import type { ProviderQuote, TrueCostBreakdown, Method } from '~/types/remit'
import { useEntitlements } from '~/composables/useEntitlements'
import { useTelemetry } from '~/composables/useTelemetry'
import { useProviderVisits } from '~/composables/useProviderVisits'
import { useSession } from '~/composables/useSession'
import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'
import { getCorridorUrl } from '~/utils/country-slugs'
import { useWatchlist } from '~/composables/useWatchlist'
import { useAlerts } from '~/composables/useAlerts'
import { useAuth } from '~/composables/useAuth'

const { isPlus } = useEntitlements()
const { isAuthenticated } = useAuth()
const watchlist = useWatchlist()
const alerts = useAlerts()
const { request } = useApi()
const { attachRatings, formatMoney, formatRate, getRelativeTime, useProviders } = useRemittanceApi()
const { trackClick } = useTelemetry()
const { fetchPendingFeedback } = useProviderVisits()
const { ensureSession } = useSession()
const currentRoute = useRoute()

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
  providerId?: string
  outboundUrl?: string | null
  affiliateUrl?: string | null
  fxRate?: number
  feeAmount?: number
  hasPromo?: boolean
  promoInfo?: {
    fee: number
    rate: number
    headline: string
    details: string[]
    newCustomersOnly: boolean
  } | null
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

type RateHistoryPoint = {
  date: string
  rate: number
  bid?: number | null
  ask?: number | null
  source?: string | null
}

type RateHistoryResponse = {
  base: string
  quote: string
  history: RateHistoryPoint[]
  lastUpdated?: string | null
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
const normalizeCurrencyParam = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return ''
  const upper = String(raw).trim().toUpperCase()
  return /^[A-Z]{3}$/.test(upper) ? upper : ''
}

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

const fromSlug = computed(() => normalizeSlug(currentRoute.params.from))
const toSlug = computed(() => normalizeSlug(currentRoute.params.to))
const canonicalFrom = computed(() => getCanonicalSlug(fromSlug.value))
const canonicalTo = computed(() => getCanonicalSlug(toSlug.value))
const amountParam = Array.isArray(currentRoute.query.amount) ? currentRoute.query.amount[0] : currentRoute.query.amount
const methodParam = Array.isArray(currentRoute.query.method) ? currentRoute.query.method[0] : currentRoute.query.method
const fromCurrencyParam = computed(() => (
  Array.isArray(currentRoute.query.fromCurrency)
    ? currentRoute.query.fromCurrency[0]
    : currentRoute.query.fromCurrency
))
const toCurrencyParam = computed(() => (
  Array.isArray(currentRoute.query.toCurrency)
    ? currentRoute.query.toCurrency[0]
    : currentRoute.query.toCurrency
))
const fromCurrencyOverride = computed(() => normalizeCurrencyParam(fromCurrencyParam.value))
const toCurrencyOverride = computed(() => normalizeCurrencyParam(toCurrencyParam.value))
const fromCurrencyCode = computed(() => {
  if (fromCurrencyOverride.value) return fromCurrencyOverride.value
  const fallback = resolveCurrency(canonicalFrom.value) || 'USD'
  return fallback.toUpperCase()
})
const toCurrencyCode = computed(() => {
  if (toCurrencyOverride.value) return toCurrencyOverride.value
  const fallback = resolveCurrency(canonicalTo.value) || 'XXX'
  return fallback.toUpperCase()
})
const initialAmount = Number(amountParam) || 1000
const supportedMethods: Method[] = ['bank', 'cash', 'wallet']
const initialMethod = supportedMethods.includes(methodParam as Method) ? (methodParam as Method) : 'bank'
const displayAmount = ref(initialAmount)
const payoutMethod = ref<Method>(initialMethod)
const quoteRefreshPending = ref(false)
const lastRefreshKey = ref<string | null>(null)
const refreshStatus = ref<{
  enqueued: boolean
  requestId: string | null
  providers: string[]
  requestedAt: string
} | null>(null)
const fromCountryCode = computed(() => getCodeFromSlug(canonicalFrom.value) || canonicalFrom.value.toUpperCase())
const toCountryCode = computed(() => getCodeFromSlug(canonicalTo.value) || canonicalTo.value.toUpperCase())
const corridorKey = computed(() => `${canonicalFrom.value}-${canonicalTo.value}`)
const canonicalPath = computed(() => `/send-money/${canonicalFrom.value}-to-${canonicalTo.value}`)
const flagFrom = computed(() => resolveFlag(canonicalFrom.value))
const flagTo = computed(() => resolveFlag(canonicalTo.value))

if (import.meta.client && needsCanonicalRedirect(fromSlug.value, toSlug.value)) {
  navigateTo(getCanonicalCorridorUrl(fromSlug.value, toSlug.value), { redirectCode: 301 })
}

const { data: quotesData, pending: quotesPending, error: quotesError, refresh: refreshQuotes } = await useProviders(
  fromCountryCode,
  toCountryCode,
  displayAmount,
  payoutMethod,
  {
    key: `${currentRoute.fullPath}-${payoutMethod.value}`, // Include method in key for caching per method
    watch: [fromCountryCode, toCountryCode, displayAmount, payoutMethod],
    server: true,
    lazy: false,
    fromCurrency: fromCurrencyCode,
    toCurrency: toCurrencyCode,
  },
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
      chips: [],
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
      source: 'OANDA',
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
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup versus mid-market rate. We benchmark every quote against the OANDA mid-market rate.' },
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
      chips: [],
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
      source: 'OANDA',
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
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup vs mid-market. We benchmark against OANDA.' },
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
    subhead: 'Compare exchange rates vs. mid-market to see how much your recipient actually receives—not just the visible fees.',
      chips: [],
  },
  statsBar: [],
  providerHighlights: [],
  rateWidget: { midMarket: '', asOf: '', source: '', changes: [] },
  table: { title: 'Live provider comparisons', amountExample: '', rows: [] },
  insights: [],
  recommendations: [],
  steps: [],
  faqs: [],
  disclosures: { advert: 'Affiliate disclosures will appear with live data.', data: 'Live rates will populate here.' },
}

const baseContent = computed(() => corridorContent[corridorKey.value] || fallbackContent)
// Collect all available methods from quotes - returns empty array while loading
// Query all methods to discover what's available for this corridor
const discoverMethods = async () => {
  const [bankRes, cashRes, walletRes] = await Promise.all([
    request<{ data: ProviderQuote[] }>('/providers', {
      query: {
        from: fromCountryCode.value,
        to: toCountryCode.value,
        amount: displayAmount.value,
        method: 'bank',
        fromCurrency: fromCurrencyCode.value,
        toCurrency: toCurrencyCode.value,
      },
    }).catch(() => ({ data: [] })),
    request<{ data: ProviderQuote[] }>('/providers', {
      query: {
        from: fromCountryCode.value,
        to: toCountryCode.value,
        amount: displayAmount.value,
        method: 'cash',
        fromCurrency: fromCurrencyCode.value,
        toCurrency: toCurrencyCode.value,
      },
    }).catch(() => ({ data: [] })),
    request<{ data: ProviderQuote[] }>('/providers', {
      query: {
        from: fromCountryCode.value,
        to: toCountryCode.value,
        amount: displayAmount.value,
        method: 'wallet',
        fromCurrency: fromCurrencyCode.value,
        toCurrency: toCurrencyCode.value,
      },
    }).catch(() => ({ data: [] })),
  ])
  
  const methods = new Set<string>()
  if (bankRes.data && bankRes.data.length > 0) methods.add('bank')
  if (cashRes.data && cashRes.data.length > 0) methods.add('cash')
  if (walletRes.data && walletRes.data.length > 0) methods.add('wallet')
  
  discoveredMethods.value = methods.size > 0 ? Array.from(methods) : ['bank']
}

const discoveredMethods = ref<string[]>(['bank'])
const methodsDiscoveryPending = ref(false)

// Discover methods when corridor changes
watch([fromCountryCode, toCountryCode, displayAmount], () => {
  if (fromCountryCode.value && toCountryCode.value) {
    methodsDiscoveryPending.value = true
    discoverMethods().finally(() => {
      methodsDiscoveryPending.value = false
    })
  }
}, { immediate: true })

const availableMethods = computed(() => {
  // While discovering, return empty array (CorridorStickyBar will show loading)
  if (methodsDiscoveryPending.value || quotesPending.value) {
    return []
  }
  
  // Use discovered methods, but also check current quotes
  const methodSet = new Set<string>(discoveredMethods.value)
  
  const allQuotes = (quotesData.value?.data || []) as ProviderQuote[]
  allQuotes.forEach(quote => {
    if (quote.methods && Array.isArray(quote.methods)) {
      quote.methods.forEach(method => {
        if (method) methodSet.add(method)
      })
    }
  })
  
  // If no methods found, default to bank
  if (methodSet.size === 0) {
    return ['bank']
  }
  
  return Array.from(methodSet).sort() // Sort for consistent ordering
})

const providerQuotes = computed(() => {
  const allQuotes = (quotesData.value?.data || []) as ProviderQuote[]
  // Filter by selected payout method - only show providers that support this method
  return allQuotes.filter(quote => quote.methods?.includes(payoutMethod.value))
})
const ratedQuotes = computed(() => attachRatings(providerQuotes.value) as Array<ProviderQuote & { score?: number }>)
const apiUpdatedAt = computed(() => quotesData.value?.updatedAt)
const apiUpdatedLabel = computed(() => (apiUpdatedAt.value ? getRelativeTime(apiUpdatedAt.value) : ''))
const providerError = computed(() => (quotesData.value as { error?: { code: string; message: string } } | null)?.error ?? null)
const corridorUnsupported = computed(() => providerError.value?.code === 'corridor_unsupported')
const corridorUnavailable = computed(() => {
  const code = providerError.value?.code
  return code === 'corridor_unavailable' || code === 'rate_unavailable' || code === 'fx_unavailable'
})
const hasApiError = computed(() => (quotesError.value || providerError.value) && !corridorUnavailable.value && !corridorUnsupported.value)
const corridorId = computed(() => `${fromCountryCode.value}-${toCountryCode.value}-${fromCurrencyCode.value}-${toCurrencyCode.value}`)
const quoteRefreshKey = computed(() => `${corridorId.value}:${displayAmount.value}:${payoutMethod.value}`)
const historyRangeDays = 30
const shouldFetchHistory = computed(() => {
  if (fromCurrencyCode.value === toCurrencyCode.value) {
    return false
  }
  return (
    fromCurrencyCode.value.length === 3 &&
    toCurrencyCode.value.length === 3 &&
    fromCurrencyCode.value !== 'XXX' &&
    toCurrencyCode.value !== 'XXX'
  )
})

const { data: rateHistoryData, pending: rateHistoryPending, error: rateHistoryError } = await useAsyncData(
  () => `rate-history-${fromCurrencyCode.value}-${toCurrencyCode.value}-${historyRangeDays}`,
  async () => {
    if (!shouldFetchHistory.value) {
      return { base: fromCurrencyCode.value, quote: toCurrencyCode.value, history: [], lastUpdated: null }
    }

    try {
      return await request<RateHistoryResponse>('/rates/history', {
        query: { base: fromCurrencyCode.value, quote: toCurrencyCode.value, days: historyRangeDays },
      })
    } catch (error: any) {
      if (import.meta.dev) {
        console.error('[remittance] rate history unavailable', {
          error,
          statusCode: error?.statusCode,
          data: error?.data,
          base: fromCurrencyCode.value,
          quote: toCurrencyCode.value,
        })
      }
      return { base: fromCurrencyCode.value, quote: toCurrencyCode.value, history: [], lastUpdated: null }
    }
  },
  { watch: [fromCurrencyCode, toCurrencyCode] },
)

const rateHistory = computed(() => {
  const history = rateHistoryData.value?.history || []
  return history
    .map(point => ({ ...point, rate: Number(point.rate) }))
    .filter(point => Number.isFinite(point.rate))
})
const rateHistoryLastUpdated = computed(() => rateHistoryData.value?.lastUpdated || null)
const rateHistorySource = computed(() => rateHistory.value[rateHistory.value.length - 1]?.source || null)
const latestHistoryRate = computed(() => {
  const last = rateHistory.value[rateHistory.value.length - 1]
  return typeof last?.rate === 'number' && Number.isFinite(last.rate) ? last.rate : null
})

const isSameCurrency = computed(() => fromCurrencyCode.value === toCurrencyCode.value)

const midMarketRate = computed(() => {
  if (isSameCurrency.value) {
    return 1.0
  }
  const rate = quotesData.value?.midMarketRate
  return typeof rate === 'number' && Number.isFinite(rate) ? rate : latestHistoryRate.value
})
const midMarketSource = computed(() => {
  if (isSameCurrency.value) {
    return 'Same currency'
  }
  return quotesData.value?.midMarketSource || rateHistorySource.value || 'OANDA'
})
const midMarketUpdatedAt = computed(() => (
  quotesData.value?.midMarketUpdatedAt
  || rateHistoryLastUpdated.value
  || quotesData.value?.updatedAt
  || null
))
const midMarketLabel = computed(() => {
  if (isSameCurrency.value) {
    return `1 ${fromCurrencyCode.value} = 1.00 ${toCurrencyCode.value}`
  }
  if (!midMarketRate.value) {
    return `1 ${fromCurrencyCode.value} = -- ${toCurrencyCode.value}`
  }
  return `1 ${fromCurrencyCode.value} = ${midMarketRate.value.toFixed(2)} ${toCurrencyCode.value}`
})
const midMarketAsOf = computed(() => {
  if (!midMarketUpdatedAt.value) return ''
  return `Updated ${getRelativeTime(midMarketUpdatedAt.value)}`
})

const mostRecentUpdate = computed(() => {
  const timestamps = [
    quotesData.value?.updatedAt,
    quotesData.value?.midMarketUpdatedAt,
    rateHistoryLastUpdated.value,
  ].filter(Boolean) as string[]
  
  if (timestamps.length === 0) return null
  
  return timestamps.reduce((latest, current) => {
    const latestTime = new Date(latest).getTime()
    const currentTime = new Date(current).getTime()
    return currentTime > latestTime ? current : latest
  })
})

const mostRecentUpdateLabel = computed(() => {
  if (!mostRecentUpdate.value) return 'just now'
  return getRelativeTime(mostRecentUpdate.value)
})

const chartWidth = 400
const chartHeight = 120
const chartPadding = 10
const chartLeftPadding = 60
const chartTopPadding = 15
const chartBottomPadding = 25

const chartPoints = computed(() => {
  if (isSameCurrency.value) {
    const points = Array.from({ length: 30 }, (_, idx) => {
      const x = chartLeftPadding + (idx / 29) * (chartWidth - chartLeftPadding - chartPadding)
      const y = chartTopPadding + 0.5 * (chartHeight - chartTopPadding - chartBottomPadding)
      return {
        x,
        y,
        rate: 1.0,
        date: new Date(Date.now() - (29 - idx) * 24 * 60 * 60 * 1000).toISOString(),
      }
    })
    return points
  }

  const history = rateHistory.value
  if (!history.length) return []
  const rates = history.map(point => point.rate)
  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const range = maxRate - minRate
  const span = history.length > 1 ? history.length - 1 : 1

  return history.map((point, idx) => {
    const normalized = range > 0 ? (point.rate - minRate) / range : 0.5
    const x = chartLeftPadding + (idx / span) * (chartWidth - chartLeftPadding - chartPadding)
    const y = chartTopPadding + (1 - normalized) * (chartHeight - chartTopPadding - chartBottomPadding)
    return {
      x,
      y,
      rate: point.rate,
      date: point.date,
    }
  })
})

// Create smooth bezier curve path
const chartLinePath = computed(() => {
  if (!chartPoints.value.length) return ''
  if (chartPoints.value.length === 1) {
    return `M ${chartPoints.value[0].x},${chartPoints.value[0].y}`
  }
  
  const points = chartPoints.value
  let path = `M ${points[0].x},${points[0].y}`
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const controlPoint1X = current.x + (next.x - current.x) / 3
    const controlPoint1Y = current.y
    const controlPoint2X = current.x + (next.x - current.x) * 2 / 3
    const controlPoint2Y = next.y
    
    path += ` C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`
  }
  
  return path
})

const chartAreaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  const bottomY = chartTopPadding + (chartHeight - chartTopPadding - chartBottomPadding)
  
  if (chartPoints.value.length === 1) {
    const point = chartPoints.value[0]
    return `M ${point.x},${point.y} L ${point.x},${bottomY} L ${point.x},${bottomY} Z`
  }
  
  const points = chartPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  
  // Use the same smooth curve path for the area
  let path = `M ${first.x},${first.y}`
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const controlPoint1X = current.x + (next.x - current.x) / 3
    const controlPoint1Y = current.y
    const controlPoint2X = current.x + (next.x - current.x) * 2 / 3
    const controlPoint2Y = next.y
    
    path += ` C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`
  }
  
  // Close the area
  path += ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`
  return path
})

const chartEndPoint = computed(() => {
  if (!chartPoints.value.length) return null
  return chartPoints.value[chartPoints.value.length - 1]
})

const chartStats = computed(() => {
  if (isSameCurrency.value) {
    return {
      minRate: 1.0,
      maxRate: 1.0,
      avgRate: 1.0,
      volatilityPct: 0,
    }
  }
  if (!rateHistory.value.length) return null
  const rates = rateHistory.value.map(point => point.rate)
  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / rates.length
  const stdev = Math.sqrt(variance)
  const volatilityPct = avgRate > 0 ? (stdev / avgRate) * 100 : null
  return {
    minRate,
    maxRate,
    avgRate,
    volatilityPct,
  }
})

const formatChartDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const chartLabels = computed(() => {
  if (isSameCurrency.value) {
    return [`${historyRangeDays}D`, 'Now']
  }
  if (!rateHistory.value.length) {
    return [`${historyRangeDays}D`, 'Now']
  }
  const start = formatChartDate(rateHistory.value[0].date)
  const end = formatChartDate(rateHistory.value[rateHistory.value.length - 1].date)
  return [start || `${historyRangeDays}D`, end || 'Now']
})

const chartStatusLabel = computed(() => {
  if (isSameCurrency.value) {
    return 'Same currency — rate is always 1:1'
  }
  if (corridorUnsupported.value) {
    return 'Unsupported corridor'
  }
  if (corridorUnavailable.value) {
    return 'Unavailable corridor'
  }
  if (rateHistoryPending.value && !chartPoints.value.length) {
    return `Loading ${historyRangeDays}D history...`
  }
  if (!rateHistoryPending.value && !chartPoints.value.length) {
    const error = rateHistoryError.value as any
    if (error?.statusCode === 404 || error?.data?.error === 'rate_unavailable') {
      return 'Rate history not available (OANDA sync may be pending)'
    }
    if (error?.statusCode === 500 || error?.data?.error === 'internal_error') {
      return 'Rate history service error'
    }
    return 'No rate history yet'
  }
  return ''
})

const getRateForDaysAgo = (daysAgo: number) => {
  if (!rateHistory.value.length) return null
  const latestDate = new Date(rateHistory.value[rateHistory.value.length - 1].date)
  if (Number.isNaN(latestDate.getTime())) return null
  const targetDate = new Date(latestDate)
  targetDate.setDate(targetDate.getDate() - daysAgo)

  for (let i = rateHistory.value.length - 1; i >= 0; i -= 1) {
    const pointDate = new Date(rateHistory.value[i].date)
    if (!Number.isNaN(pointDate.getTime()) && pointDate <= targetDate) {
      return rateHistory.value[i].rate
    }
  }
  return null
}

const formatPercentChange = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const rateChanges = computed(() => {
  const latest = latestHistoryRate.value
  if (!Number.isFinite(latest ?? NaN)) return []

  const changes: Array<{ label: string, value: string }> = []
  const weekRate = getRateForDaysAgo(7)
  if (Number.isFinite(weekRate ?? NaN)) {
    const pct = ((latest - Number(weekRate)) / Number(weekRate)) * 100
    if (Number.isFinite(pct)) {
      changes.push({ label: '7D', value: formatPercentChange(pct) })
    }
  }
  const monthRate = getRateForDaysAgo(historyRangeDays)
  if (Number.isFinite(monthRate ?? NaN)) {
    const pct = ((latest - Number(monthRate)) / Number(monthRate)) * 100
    if (Number.isFinite(pct)) {
      changes.push({ label: '30D', value: formatPercentChange(pct) })
    }
  }

  return changes
})

const methodLabelMap: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash pickup',
  wallet: 'Mobile wallet',
  card: 'Card',
}

const formatMethodLabels = (methods: string[]) => methods.map(method => methodLabelMap[method] || method).join(', ')

const getRateComparison = (providerRate: number) => {
  if (!midMarketRate.value || !Number.isFinite(providerRate)) {
    return { text: '', isBetter: false, isWorse: false }
  }
  
  const midMarket = midMarketRate.value
  const difference = ((providerRate - midMarket) / midMarket) * 100
  
  if (Math.abs(difference) < 0.01) {
    return { text: 'At mid-market rate', isBetter: false, isWorse: false }
  }
  
  if (difference > 0) {
    return { 
      text: `${difference.toFixed(2)}% better than mid-market`, 
      isBetter: true, 
      isWorse: false 
    }
  } else {
    return { 
      text: `${Math.abs(difference).toFixed(2)}% worse than mid-market`, 
      isBetter: false, 
      isWorse: true 
    }
  }
}

const getProviderSlug = (row: TableRow): string | null => {
  if (!row.providerId && !row.provider) return null
  return normalizeProviderSlug(row.providerId || row.provider)
}

const formatDeliveryTime = (delivery: string): string => {
  if (!delivery) return 'Standard delivery'
  
  const lower = delivery.toLowerCase()
  
  if (lower.includes('minute') || lower.includes('min')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:min|minute)/i)
    if (match) {
      const min = parseInt(match[1])
      const max = parseInt(match[2])
      if (max < 60) return `${min}–${max} min`
      if (max < 120) return `${min} min–${Math.floor(max / 60)} hr`
      return `${Math.floor(min / 60)}–${Math.floor(max / 60)} hr`
    }
    const singleMatch = delivery.match(/(\d+)\s*(?:min|minute)/i)
    if (singleMatch) {
      const val = parseInt(singleMatch[1])
      if (val < 60) return `${val} min`
      return `${Math.floor(val / 60)} hr`
    }
    return 'Minutes'
  }
  
  if (lower.includes('hour') || lower.includes('hr')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:hour|hr)/i)
    if (match) {
      const min = parseInt(match[1])
      const max = parseInt(match[2])
      if (max < 24) return `${min}–${max} hr`
      if (max < 48) return `${min} hr–1 day`
      return `${Math.floor(min / 24)}–${Math.floor(max / 24)} days`
    }
    const singleMatch = delivery.match(/(\d+)\s*(?:hour|hr)/i)
    if (singleMatch) {
      const val = parseInt(singleMatch[1])
      if (val < 24) return `${val} hr`
      if (val < 48) return '1 day'
      return `${Math.floor(val / 24)} days`
    }
    return 'Hours'
  }
  
  if (lower.includes('day')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*day/i)
    if (match) {
      return `${match[1]}–${match[2]} days`
    }
    const singleMatch = delivery.match(/(\d+)\s*day/i)
    if (singleMatch) {
      const val = parseInt(singleMatch[1])
      return val === 1 ? '1 day' : `${val} days`
    }
    if (lower.includes('same day') || lower.includes('same-day')) return 'Same day'
    return delivery
  }
  
  if (lower.includes('instant') || lower.includes('immediate')) return 'Instant'
  if (lower.includes('same day') || lower.includes('same-day')) return 'Same day'
  
  return delivery
}

const apiRows = computed<TableRow[]>(() => {
  if (!ratedQuotes.value.length) return []

  return ratedQuotes.value.map((quote, index) => {
    const score = Number.isFinite(quote.score) ? Number(quote.score).toFixed(1) : '0.0'
    const methodsLabel = formatMethodLabels(quote.methods as string[])

    return {
      provider: quote.name,
      providerId: quote.id,
      score,
      recipientGets: `${quote.recipientGets.toLocaleString()} ${toCurrencyCode.value}`,
      delta: `${quote.marginPct.toFixed(2)}% off mid-market`,
      fee: formatMoney(quote.fee, fromCurrencyCode.value),
      rate: formatRate(quote.fxRate, fromCurrencyCode.value, toCurrencyCode.value),
      speed: formatDeliveryTime(quote.delivery),
      speedNote: quote.bestFor || 'Standard delivery',
      payIn: methodsLabel,
      payOut: methodsLabel,
      notes: quote.whyThisRanking || quote.bestFor || '',
      badge: index === 0 ? 'Best Deal' : undefined,
      isAffiliate: quote.isAffiliate ?? Boolean(quote.affiliateUrl),
      affiliateUrl: quote.affiliateUrl ?? null,
      outboundUrl: quote.outboundUrl ?? quote.affiliateUrl ?? null,
      fxRate: quote.fxRate,
      feeAmount: quote.fee,
      hasPromo: quote.hasPromo ?? false,
      promoInfo: quote.promoInfo ?? null,
    }
  })
})

const hasApiQuotes = computed(() => apiRows.value.length > 0 && !quotesError.value)

const content = computed(() => {
  const base = baseContent.value
  const merged = {
    ...base,
    fromCode: fromCurrencyCode.value || base.fromCode,
    toCode: toCurrencyCode.value || base.toCode,
  }
  const rateWidget = {
    ...merged.rateWidget,
    midMarket: midMarketLabel.value || merged.rateWidget.midMarket,
    asOf: mostRecentUpdate.value ? `Updated ${mostRecentUpdateLabel.value}` : (midMarketAsOf.value || apiUpdatedLabel.value || merged.rateWidget.asOf),
    source: midMarketSource.value || merged.rateWidget.source || 'OANDA',
    changes: rateChanges.value.length ? rateChanges.value : merged.rateWidget.changes,
  }
  const tableRows = hasApiQuotes.value ? apiRows.value : []
  return {
    ...merged,
    lastUpdated: mostRecentUpdateLabel.value || apiUpdatedLabel.value || merged.lastUpdated,
    table: {
      ...merged.table,
      rows: tableRows,
    },
    stats: {
      ...merged.stats,
      providerCount: String(tableRows.length),
    },
    rateWidget,
  }
})

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Money Transfer Comparison', path: '/send-money' },
  { name: `From ${content.value.from} to ${content.value.to}`, path: canonicalPath.value },
])

const providerCount = computed(() => content.value.table.rows.length || 0)
const bestQuote = computed(() => {
  if (!providerQuotes.value.length) return null
  return [...providerQuotes.value].sort((a, b) => b.recipientGets - a.recipientGets)[0]
})
const topProviders = computed(() => {
  if (providerQuotes.value.length) {
    return providerQuotes.value.slice(0, 2).map(p => p.name).join(' and ')
  }
  return content.value.table.rows.slice(0, 2).map(p => p.provider).join(' and ')
})
const bestRateLabel = computed(() => {
  if (!bestQuote.value) return ''
  const fxRate = Number(bestQuote.value.fxRate)
  if (!Number.isFinite(fxRate)) return ''
  return `1 ${fromCurrencyCode.value} = ${fxRate.toFixed(4)} ${toCurrencyCode.value}`
})
const seoUpdatedLabel = computed(() => apiUpdatedLabel.value || 'today')
const seoTitle = computed(() => `Today's Best ${fromCurrencyCode.value} to ${toCurrencyCode.value} Rates | Remit-Scout`)
const seoDescription = computed(() => {
  const providerLine = topProviders.value ? ` including ${topProviders.value}` : ''
  const rateLine = bestRateLabel.value ? ` Best rate: ${bestRateLabel.value}.` : ''
  return `Compare ${providerCount.value} providers${providerLine}.${rateLine} Updated ${seoUpdatedLabel.value}.`
})

const handleProviderOutbound = async (row: TableRow) => {
  const targetUrl = row.outboundUrl ?? row.affiliateUrl
  if (!targetUrl || typeof window === 'undefined') return

  if (row.providerId) {
    void trackClick({
      provider_id: row.providerId,
      corridor_id: quotesData.value?.corridor || corridorKey.value,
      target_url: targetUrl,
      quoted_rate: row.fxRate,
      quoted_fee: row.feeAmount,
      is_affiliate: row.isAffiliate ?? false,
    })

    setTimeout(async () => {
      await fetchPendingFeedback(1)
    }, 1000)
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer')
}

setSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  canonical: `${normalizedSiteUrl}${canonicalPath.value}`,
})

jsonLdBreadcrumb(breadcrumbItems.value.map(item => ({ name: item.name, url: `${normalizedSiteUrl}${item.path}` })))

if (content.value.faqs.length) {
  jsonLdFaq(content.value.faqs)
}

const displayCurrency = ref(fromCurrencyCode.value)
const sortBy = ref('recipient')
const insightTimeframe = ref('7d')

const sortLabels: Record<string, string> = {
  recipient: 'recipient gets',
  cost: 'total cost',
  fees: 'lowest fees',
  'remit-score': 'remit-score',
}

const isQuotesLoading = computed(() => quotesPending.value && !hasApiQuotes.value)

const sortedProviders = computed(() => {
  const rows = [...content.value.table.rows]
  if (sortBy.value === 'cost') {
    return rows.sort((a, b) => getProviderTrueCost(a, 0).totalCost - getProviderTrueCost(b, 0).totalCost)
  }
  if (sortBy.value === 'fees') {
    return rows.sort((a, b) => {
      const feeA = getProviderTrueCost(a, 0).upfrontFee
      const feeB = getProviderTrueCost(b, 0).upfrontFee
      return feeA - feeB
    })
  }
  if (sortBy.value === 'remit-score') {
    return rows.sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
  }
  return rows
})

const recipientRange = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return { min: '0', max: '0', minNum: 0, maxNum: 0 }
  const amounts = rows.map(r => parseFloat(r.recipientGets.replace(/[^0-9.]/g, '')))
  const minNum = Math.min(...amounts)
  const maxNum = Math.max(...amounts)
  return {
    min: minNum.toLocaleString(),
    max: maxNum.toLocaleString(),
    minNum,
    maxNum,
  }
})

const isExactRecipientAmount = computed(() => {
  return recipientRange.value.minNum === recipientRange.value.maxNum
})

const corridorWatchTarget = computed(() => ({
  type: 'corridor' as const,
  from: fromCountryCode.value,
  to: toCountryCode.value,
  method: payoutMethod.value,
}))

const corridorWatchLabel = computed(() => `${content.value.from}→${content.value.to} • ${payoutMethod.value}`)

const bestTotalCost = computed(() => {
  if (!midMarketRate.value) return 0
  const costs = content.value.table.rows
    .map((row) => {
      const providerRate = row.fxRate
      if (!Number.isFinite(providerRate ?? NaN)) return null
      const upfrontFee = Number.isFinite(row.feeAmount ?? NaN) ? Number(row.feeAmount) : 0
      return buildTrueCostBreakdown(
        displayAmount.value,
        upfrontFee,
        midMarketRate.value,
        Number(providerRate),
        0,
      ).totalCost
    })
    .filter((value): value is number => value !== null)

  return costs.length ? Math.min(...costs) : 0
})

// Calculate average and worst costs for relative comparison
const providerCosts = computed(() => {
  return sortedProviders.value.map((row) => getProviderTrueCost(row, 0).totalCost)
})

const averageCost = computed(() => {
  const costs = providerCosts.value
  if (costs.length === 0) return 0
  const sum = costs.reduce((a, b) => a + b, 0)
  return sum / costs.length
})

const worstCost = computed(() => {
  const costs = providerCosts.value
  if (costs.length === 0) return 0
  return Math.max(...costs)
})

function getProviderTrueCost(row: TableRow, _index: number): TrueCostBreakdown {
  // Use promo fee/rate if available, otherwise use regular fee/rate
  const hasPromo = row.hasPromo && row.promoInfo
  const providerRate = hasPromo && Number.isFinite(row.promoInfo?.rate)
    ? Number(row.promoInfo.rate)
    : Number.isFinite(row.fxRate ?? NaN) ? Number(row.fxRate) : 0
  const upfrontFee = hasPromo && Number.isFinite(row.promoInfo?.fee)
    ? Number(row.promoInfo.fee)
    : Number.isFinite(row.feeAmount ?? NaN) ? Number(row.feeAmount) : 0
  
  return buildTrueCostBreakdown(
    displayAmount.value,
    upfrontFee,
    midMarketRate.value || 0,
    providerRate,
    bestTotalCost.value || 0,
  )
}

const getQuoteRefreshMethods = (method: Method) => {
  if (method === 'cash') {
    return { payin: 'bank_transfer', payout: 'cash_pickup' }
  }
  if (method === 'wallet') {
    return { payin: 'bank_transfer', payout: 'mobile_wallet' }
  }
  return { payin: 'bank_transfer', payout: 'bank_deposit' }
}

type QuoteRefreshResponse = {
  refresh?: {
    attempted?: boolean
    enqueued?: boolean
    request_id?: string | null
    providers?: string[]
  }
}

const requestQuoteRefresh = async (source: 'auto' | 'manual') => {
  if (!import.meta.client || displayAmount.value <= 0) return
  if (corridorUnavailable.value || corridorUnsupported.value) return
  const refreshKey = quoteRefreshKey.value
  if (source === 'auto' && lastRefreshKey.value === refreshKey) {
    return
  }
  lastRefreshKey.value = refreshKey
  quoteRefreshPending.value = true

  try {
    const { payin, payout } = getQuoteRefreshMethods(payoutMethod.value)
    const response = await request<QuoteRefreshResponse>('/quotes/current', {
      query: {
        corridor_id: corridorId.value,
        amount: displayAmount.value,
        payin,
        payout,
        live: true,
      },
      retries: 0,
    })
    if (response?.refresh?.enqueued) {
      refreshStatus.value = {
        enqueued: true,
        requestId: response.refresh.request_id ?? null,
        providers: response.refresh.providers ?? [],
        requestedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    if (import.meta.dev) {
      console.warn('[remittance] quote refresh unavailable', error)
    }
  } finally {
    quoteRefreshPending.value = false
  }
}

const handleRefreshQuotes = async () => {
  await requestQuoteRefresh('manual')
  await refreshQuotes()
}

const isRefreshQueued = computed(() => {
  if (corridorUnavailable.value || corridorUnsupported.value) return false
  if (hasApiQuotes.value) return false
  return quoteRefreshPending.value || Boolean(refreshStatus.value?.enqueued)
})

watch(
  [quoteRefreshKey, quotesPending, hasApiQuotes, hasApiError, corridorUnavailable, corridorUnsupported],
  ([, pending, hasQuotes, hasError, unavailable, unsupported]) => {
    if (!import.meta.client || pending || hasQuotes || hasError || unavailable || unsupported) {
      return
    }
    void requestQuoteRefresh('auto')
  },
  { immediate: true },
)

watch(
  [hasApiQuotes, corridorUnavailable, corridorUnsupported],
  ([hasQuotes, unavailable, unsupported]) => {
    if (hasQuotes || unavailable || unsupported) {
      refreshStatus.value = null
    }
  },
)

const { availableToCurrencies } = useCorridorCurrencies(
  fromCountryCode,
  toCountryCode,
  computed(() => fromCurrencyCode.value),
  computed(() => toCurrencyCode.value),
)

function handleBarUpdate(data: { amount: number; payoutMethod: string; currency: string; fromCurrency: string; fromCountry?: string; toCountry?: string }) {
  if (data.amount && data.amount > 0) {
  displayAmount.value = data.amount
  }
  payoutMethod.value = data.payoutMethod as Method
  displayCurrency.value = data.currency
  if (data.fromCurrency && data.fromCurrency !== fromCurrencyCode.value) {
    fromCurrencyCode.value = data.fromCurrency
  }
}

function handleNewQuery(data: { fromCountry: string; toCountry: string; amount: number; currency: string; fromCurrency: string; payoutMethod: string }) {
  const newUrl = getCorridorUrl(data.fromCountry, data.toCountry)
  const params = new URLSearchParams()
  if (data.amount !== 1000) params.set('amount', String(data.amount))
  if (data.payoutMethod !== 'bank') params.set('method', data.payoutMethod)
  if (data.fromCurrency) params.set('fromCurrency', data.fromCurrency)
  if (data.currency && data.currency !== toCurrencyCode.value) params.set('toCurrency', data.currency)
  const queryString = params.toString()
  navigateTo(`${newUrl}${queryString ? `?${queryString}` : ''}`)
}

function handleSort(newSort: string) {
  sortBy.value = newSort
}

async function handleSave() {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'watchlist'
    authModalOpen.value = true
    return
  }
  const result = await watchlist.save({
    type: 'corridor',
    from: fromCountryCode.value,
    to: toCountryCode.value,
    method: payoutMethod.value,
  })
  if (result.status === 'saved') {
    toastTitle.value = 'Added to watchlist!'
    toastMessage.value = `${content.value.from} → ${content.value.to} saved`
    successToastRef.value?.show()
  } else if (result.status === 'already_saved') {
    toastTitle.value = 'Already saved'
    toastMessage.value = 'This corridor is already in your watchlist'
    successToastRef.value?.show()
  } else if (result.status === 'limit_reached') {
    limitModalFeature.value = 'watchlist'
    limitModalLimit.value = result.limit
    limitModalCount.value = result.limit
    limitModalOpen.value = true
  }
}

async function handleAlert() {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'alert'
    authModalOpen.value = true
    return
  }
  const result = await alerts.createForTarget({
    type: 'corridor',
    from: fromCountryCode.value,
    to: toCountryCode.value,
    method: payoutMethod.value,
  })
  if (result.status === 'created') {
    toastTitle.value = 'Rate alert created!'
    toastMessage.value = `We'll notify you when rates change for ${content.value.from} → ${content.value.to}`
    successToastRef.value?.show()
  } else if (result.status === 'already_exists') {
    toastTitle.value = 'Alert exists'
    toastMessage.value = 'You already have an alert for this corridor'
    successToastRef.value?.show()
  } else if (result.status === 'watchlist_limit_reached') {
    limitModalFeature.value = 'watchlist'
    limitModalLimit.value = result.limit
    limitModalCount.value = result.limit
    limitModalOpen.value = true
  } else if (result.status === 'alert_limit_reached') {
    limitModalFeature.value = 'alert'
    limitModalLimit.value = result.limit
    limitModalCount.value = result.limit
    limitModalOpen.value = true
  }
}

function handleShare() {
  shareModalOpen.value = true
}

const scoreModalOpen = ref(false)
const selectedProvider = ref<{ providerId?: string; providerName: string; score: number } | null>(null)

const authModalOpen = ref(false)
const authModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalOpen = ref(false)
const limitModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalLimit = ref(3)
const limitModalCount = ref(3)
const shareModalOpen = ref(false)
const successToastRef = ref<{ show: () => void; hide: () => void } | null>(null)
const toastTitle = ref('')
const toastMessage = ref('')

function openScoreModal(row: TableRow) {
  selectedProvider.value = {
    providerId: row.providerId || getProviderSlug(row) || undefined,
    providerName: row.provider,
    score: Number.parseFloat(row.score),
  }
  scoreModalOpen.value = true
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
    a: `Fees consist of two parts: the transfer fee (shown upfront) and the exchange rate markup (hidden in the rate). We calculate total cost by comparing each provider's rate against the OANDA mid-market rate. This shows you the true cost, not just the advertised fee.`,
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
