<template>
  <div class="min-h-screen bg-white">
      <!-- Ad Banner for Free Users -->
      <div
v-if="!isPlus"
class="bg-blue-600 text-white"
>
        <CenteredPage
          as="div"
          padding-y="none"
          section-gap-class="space-y-0"
        >
          <div class="py-2">
            <div class="flex items-center justify-center gap-3 text-sm">
              <span><strong>Upgrade to Plus</strong> — Pulse access, 16 alerts, 16 watchlist corridors, exports, and an ad-free experience</span>
              <NuxtLink
to="/plus"
class="inline-flex items-center gap-1 font-semibold text-white hover:text-blue-100 underline underline-offset-2"
>
                <span>Learn more</span>
                <Icon
                  name="chevron-right"
                  :size="16"
                  class="text-current"
                />
              </NuxtLink>
            </div>
          </div>
	        </CenteredPage>
	      </div>

	      <div
	v-if="!isPlus"
	class="bg-slate-50 border-b border-slate-200"
	>
        <CenteredPage
          as="div"
          padding-y="none"
          section-gap-class="space-y-0"
        >
          <div class="py-4">
          <AdPlacement
placement="dashboard_inline"
wrapper-class="rounded-xl"
min-height="120px"
/>
          </div>
        </CenteredPage>
      </div>

      <!-- Header -->
      <header class="border-b border-slate-200 bg-white sticky top-16 z-40">
        <CenteredPage
          as="div"
          padding-y="none"
          section-gap-class="space-y-0"
        >
          <!-- Main Header Row -->
          <div class="flex items-center justify-between py-6">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">
                Welcome back, <span class="text-blue-600">{{ user?.name || 'User' }}</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">Manage your watchlist, alerts, and transfer history</p>
            </div>
            <div class="flex items-center gap-4">
              <!-- Plan Badge -->
                <div
                  v-if="isPlus"
                  class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  <Icon
                    name="sparkles"
                    :size="20"
                    variant="solid"
                    class="text-current"
                  />
                  <span class="font-semibold">{{ isEnterprise ? 'Enterprise' : 'Plus Member' }}</span>
                </div>
              <NuxtLink
                v-else
                  to="/plus"
                  class="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon
                    name="sparkles"
                    :size="16"
                    variant="solid"
                    class="text-current"
                  />
                  Upgrade to Plus
                </NuxtLink>
            </div>
          </div>

          <!-- Usage Stats for Free Users -->
          <div
v-if="!isPlus"
class="pb-4 flex items-center gap-6 text-sm"
>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Watchlist:</span>
              <span
class="font-medium"
:class="watchlistLimitPercent >= 100 ? 'text-brand-600' : 'text-slate-900'"
>{{ watchlistCount }}/{{ limits.watchlistItems }}</span>
              <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="watchlistLimitPercent >= 100 ? 'bg-brand-600' : 'bg-blue-500'"
                  :style="{ width: `${Math.min(watchlistLimitPercent, 100)}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Alerts:</span>
              <span
class="font-medium"
:class="alertsLimitPercent >= 100 ? 'text-brand-600' : 'text-slate-900'"
>{{ alertsCount }}/{{ limits.alerts }}</span>
              <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="alertsLimitPercent >= 100 ? 'bg-brand-600' : 'bg-blue-500'"
                  :style="{ width: `${Math.min(alertsLimitPercent, 100)}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-500">History:</span>
              <span class="font-medium text-slate-900">{{ limits.historyDays }} days</span>
            </div>
          </div>

          <!-- Tabs -->
          <nav class="flex gap-8 -mb-px">
            <button
              v-for="tab in visibleTabs"
              :key="tab.id"
              type="button"
              class="py-4 text-sm font-medium border-b-2 transition-colors"
              :class="activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
              @click="setTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </CenteredPage>
      </header>

      <!-- Main Content -->
      <CenteredPage
        as="main"
        padding-y="sm"
        section-gap-class="space-y-0"
      >
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <!-- Stats Row with Limits -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Watchlist Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">Watchlist</span>
                <span class="text-xs text-white/70">
                  {{ watchlistCount }}/{{ limits.watchlistItems === 'unlimited' ? '∞' : limits.watchlistItems }}
                </span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ watchlistCount }}</div>
              <div
v-if="limits.watchlistItems !== 'unlimited'"
class="mt-2"
>
                <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all bg-white"
                    :style="{ width: `${Math.min(watchlistLimitPercent, 100)}%` }"
                  />
                </div>
                <NuxtLink
                  v-if="!isPlus && watchlistLimitPercent >= 100"
                  to="/plus"
                  class="text-xs text-white hover:text-white/80 font-medium mt-1 inline-block"
                >
                  Upgrade for Plus →
                </NuxtLink>
              </div>
            </div>

            <!-- Alerts Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">Active Alerts</span>
                <span class="text-xs text-white/70">
                  {{ alertsCount }}/{{ limits.alerts === 'unlimited' ? '∞' : limits.alerts }}
                </span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ alertsCount }}</div>
              <div
v-if="limits.alerts !== 'unlimited'"
class="mt-2"
>
                <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all bg-white"
                    :style="{ width: `${Math.min(alertsLimitPercent, 100)}%` }"
                  />
                </div>
                <NuxtLink
                  v-if="!isPlus && alertsLimitPercent >= 100"
                  to="/plus"
                  class="text-xs text-white hover:text-white/80 font-medium mt-1 inline-block"
                >
                  Upgrade for Plus →
                </NuxtLink>
              </div>
            </div>

            <!-- History Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white/90">History</span>
                <span
v-if="!isPlus"
class="text-xs text-white/70"
>{{ limits.historyDays }} days</span>
                <span
v-else
class="text-xs text-white"
>365 days</span>
              </div>
              <div class="text-2xl font-semibold text-white">{{ compareCount }}</div>
                <div
v-if="!isPlus"
class="mt-2"
>
                  <div class="flex items-center gap-1 text-xs text-white/70">
                    <Icon
                      name="info"
                      :size="16"
                      class="text-current"
                    />
                    Limited to last 30 days
                  </div>
                </div>
            </div>

            <!-- Best Rate Stat -->
            <div class="bg-brand-600 rounded-xl border border-brand-700 p-5">
              <div class="text-sm text-white/90 mb-1">Best Rate Today</div>
              <div class="text-2xl font-semibold text-white">
                {{ currentRate.rate }}
                <span class="text-sm text-white/80">{{ getCurrencyCode(selectedCorridor.to) }}</span>
              </div>
                <div class="mt-2">
                  <span
v-if="currentRate.change !== null"
class="inline-flex items-center gap-1 text-xs font-medium text-white"
>
                    <Icon
                      name="arrow-up"
                      :size="16"
                      class="text-current"
                      :class="currentRate.change >= 0 ? '' : 'rotate-180'"
                    />
                    {{ formatPercentValue(currentRate.change) }} vs previous
                  </span>
                  <span
v-else
class="text-xs text-white/70"
>No rate history yet</span>
                </div>
            </div>
          </div>

          <!-- Upgrade Banner for Free Users -->
          <div
            v-if="!isPlus && (watchlistLimitPercent >= 66 || alertsLimitPercent >= 66)"
            class="mb-8 bg-gradient-to-r from-gray-900 to-slate-900 rounded-xl p-6 text-white"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="font-semibold text-lg">You're approaching your limits</h3>
              <p class="text-white/90 text-sm mt-1">Upgrade to Plus for Pulse, 16 watchlist corridors, 16 alerts, 365-day history, and exports.</p>
            </div>
              <NuxtLink
                to="/plus"
                class="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                Upgrade to Plus
              </NuxtLink>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid lg:grid-cols-3 gap-8">
            <!-- Left Column (2/3) -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Enhanced Rate Checker -->
              <div class="bg-white rounded-xl border border-slate-200">
                <!-- Header with Corridor Selector -->
                <div class="p-6 border-b border-slate-100">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <h2 class="text-lg font-semibold text-slate-900">Rate Checker</h2>
                      <div class="relative">
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                          @click="showCorridorSelector = !showCorridorSelector"
                          >
                            <span>{{ getFlag(selectedCorridor.from) }}</span>
                            <Icon
                              name="chevron-right"
                              :size="16"
                              class="text-slate-400"
                            />
                            <span>{{ getFlag(selectedCorridor.to) }}</span>
                            <span class="text-slate-500">{{ selectedCorridor.from }}/{{ selectedCorridor.to }}</span>
                            <Icon
                              name="chevron-down"
                              :size="16"
                              class="text-slate-400"
                            />
                          </button>

                        <!-- Corridor Dropdown -->
                        <div
                          v-if="showCorridorSelector"
                          class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4"
                        >
                          <div class="space-y-3">
                            <div>
                              <label class="block text-xs font-medium text-slate-700 mb-1.5">From</label>
                              <UniversalDropdown
                                v-model="customCorridor.from"
                                :options="inlineFromOptions"
                                placeholder="Select country"
                                button-class="h-10 text-sm"
                              />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-slate-700 mb-1.5">To</label>
                              <UniversalDropdown
                                v-model="customCorridor.to"
                                :options="inlineToOptions"
                                placeholder="Select country"
                                button-class="h-10 text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              class="w-full px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                              @click="selectCorridor(customCorridor.from, customCorridor.to)"
                            >
                              Select Corridor
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Timeframe Selector -->
                    <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                      <button
                        v-for="period in timeframePeriods"
                        :key="period.value"
                        type="button"
                        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                        :class="[
                          graphTimeframe === period.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900',
                          isTimeframeLocked(period.value) ? 'opacity-50 cursor-not-allowed' : '',
                        ]"
                        :disabled="isTimeframeLocked(period.value)"
                        :title="isTimeframeLocked(period.value) ? 'Plus required' : undefined"
                        @click="graphTimeframe = period.value"
                      >
                        {{ period.label }}
                        <span
v-if="period.plusOnly && !isPlus"
class="ml-1 text-[10px] text-slate-400"
>Plus</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Rate Display -->
                <div class="p-6">
                  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-2xl">{{ getFlag(selectedCorridor.from) }}</span>
                          <Icon
                            name="arrow-right"
                            :size="16"
                            class="text-slate-400"
                          />
                          <span class="text-2xl">{{ getFlag(selectedCorridor.to) }}</span>
                          <span class="text-sm text-slate-500 ml-1">{{ selectedCorridor.from }} to {{ selectedCorridor.to }}</span>
                        </div>
                      <div class="flex items-baseline gap-3">
                        <span class="text-4xl font-semibold text-slate-900">{{ currentRate.rate }}</span>
                        <span class="text-lg text-slate-500">{{ getCurrencyCode(selectedCorridor.to) }}</span>
                        <span
                            v-if="currentRate.change !== null"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"
                            :class="currentRate.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                          >
                            <Icon
                              name="arrow-up"
                              :size="16"
                              class="text-current"
                              :class="currentRate.change >= 0 ? '' : 'rotate-180'"
                            />
                            {{ formatPercentValue(currentRate.change) }}
                          </span>
                        </div>
	                      <div class="text-xs text-slate-400 mt-1">
	                        <span v-if="selectedHistoryLoading">Loading rate history...</span>
	                        <span v-else-if="!currentRate.isAvailable">No rate history yet</span>
	                        <span v-else>{{ currentRate.updatedLabel }}</span>
	                      </div>
                    </div>

                    <!-- Rate Stats -->
                    <div class="flex gap-6">
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">High</div>
                        <div class="text-sm font-semibold text-emerald-600">{{ rateStats.high }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Low</div>
                        <div class="text-sm font-semibold text-red-600">{{ rateStats.low }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Average</div>
                        <div class="text-sm font-semibold text-slate-700">{{ rateStats.average }}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-slate-400 mb-0.5">Volatility</div>
                        <div class="text-sm font-semibold text-slate-700">{{ rateStats.volatility }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Chart -->
                  <div class="h-56 relative">
                    <div
v-if="selectedHistoryLoading"
class="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
>
                      Loading rate history...
                    </div>
                    <div
v-else-if="graphData.length === 0"
class="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
>
                      No rate history yet
                    </div>
                    <svg
v-else
class="w-full h-full"
viewBox="0 0 400 180"
preserveAspectRatio="none"
>
                      <defs>
                        <linearGradient
id="chartGradient"
x1="0%"
y1="0%"
x2="0%"
y2="100%"
>
                          <stop
offset="0%"
style="stop-color:#2563eb;stop-opacity:0.15"
/>
                          <stop
offset="100%"
style="stop-color:#2563eb;stop-opacity:0"
/>
                        </linearGradient>
                      </defs>
                      <!-- Grid lines -->
                      <line
x1="0"
y1="45"
x2="400"
y2="45"
stroke="#e2e8f0"
stroke-width="1"
stroke-dasharray="4"
/>
                      <line
x1="0"
y1="90"
x2="400"
y2="90"
stroke="#e2e8f0"
stroke-width="1"
stroke-dasharray="4"
/>
                      <line
x1="0"
y1="135"
x2="400"
y2="135"
stroke="#e2e8f0"
stroke-width="1"
stroke-dasharray="4"
/>
                      <!-- Area fill -->
                      <polygon
:points="`0,180 ${graphPoints} 400,180`"
fill="url(#chartGradient)"
/>
                      <!-- Line -->
                      <polyline
                        :points="graphPoints"
                        fill="none"
                        stroke="#2563eb"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Current point indicator -->
                      <circle
:cx="graphData[graphData.length - 1]?.x || 400"
:cy="graphData[graphData.length - 1]?.y || 90"
r="5"
fill="#2563eb"
/>
                      <circle
:cx="graphData[graphData.length - 1]?.x || 400"
:cy="graphData[graphData.length - 1]?.y || 90"
r="8"
fill="#2563eb"
fill-opacity="0.2"
/>
                    </svg>
                    <!-- Y-axis labels -->
                    <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
                      <span>{{ rateStats.high }}</span>
                      <span>{{ rateStats.average }}</span>
                      <span>{{ rateStats.low }}</span>
                    </div>
                  </div>

                  <!-- X-axis labels -->
                  <div class="flex justify-between text-xs text-slate-400 mt-2 px-6">
                    <span>{{ getTimeframeStartLabel() }}</span>
                    <span>Today</span>
                  </div>
                </div>

                <!-- Action Bar -->
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      :class="watchlistLimitReached ? 'opacity-50 cursor-not-allowed hover:bg-slate-100 hover:text-slate-700' : ''"
                      :disabled="watchlistLimitReached"
                      @click="handleAddToWatchlist"
	                    >
	                      <Icon
	                        name="plus"
	                        :size="16"
	                        class="text-current"
	                      />
	                      Add to Watchlist
	                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
	                      :class="alertsLimitReached ? 'opacity-50 cursor-not-allowed hover:bg-slate-100 hover:text-slate-700' : ''"
	                      :disabled="alertsLimitReached"
	                      @click="handleSetAlert"
	                    >
	                      <Icon
	                        name="bell-alert"
	                        :size="16"
	                        class="text-current"
	                      />
	                      Set Alert
	                    </button>
                    <button
                      v-if="isPlus"
                      type="button"
	                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
	                      @click="showExportModal = true"
	                    >
	                      <Icon
	                        name="arrow-down-tray"
	                        :size="16"
	                        class="text-current"
	                      />
	                      Export
	                    </button>
                  </div>
                  <button
                    type="button"
                    :disabled="comparingSelectedCorridor"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                    @click="handleCompareSelectedCorridor"
	                  >
	                    <div
	                      v-if="comparingSelectedCorridor"
	                      class="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
	                    />
	                    <Icon
	                      v-else
	                      name="chevron-right"
	                      :size="16"
	                      class="text-current"
	                    />
	                    {{ comparingSelectedCorridor ? 'Loading...' : 'Compare Corridor' }}
	                  </button>
	                </div>
              </div>

              <!-- Quick Actions -->
              <div class="grid sm:grid-cols-3 gap-4">
                <NuxtLink
                  to="/send-money"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all group"
	                >
	                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
	                    <Icon
	                      name="magnifying-glass"
	                      :size="20"
	                      class="text-blue-600 group-hover:text-white transition-colors"
	                    />
	                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Compare</div>
                    <div class="text-xs text-slate-500">Find best rates</div>
                  </div>
                </NuxtLink>
                <button
                  type="button"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                  :class="alertsLimitReached ? 'opacity-50 cursor-not-allowed hover:border-slate-200 hover:shadow-none' : ''"
                  :disabled="alertsLimitReached"
	                  @click="openCreateAlert"
	                >
	                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
	                    <Icon
	                      name="bell-alert"
	                      :size="20"
	                      class="text-blue-600 group-hover:text-white transition-colors"
	                    />
	                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">New Alert</div>
                    <div class="text-xs text-slate-500">Set rate target</div>
                  </div>
                </button>
                <NuxtLink
                  to="/learn"
                  class="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all group"
	                >
	                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
	                    <Icon
	                      name="book-open"
	                      :size="20"
	                      class="text-blue-600 group-hover:text-white transition-colors"
	                    />
	                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Guides</div>
                    <div class="text-xs text-slate-500">Learn more</div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Watchlist Preview -->
              <div class="bg-white rounded-xl border border-slate-200">
                <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 class="font-semibold text-slate-900">Your Watchlist</h2>
                  <button
                    type="button"
                    class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    @click="setTab('watchlist')"
                  >
                    View all
                  </button>
                </div>
                <div
v-if="corridorWatchlistItems.length === 0"
class="px-6 py-12 text-center"
>
	                  <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
	                    <Icon
	                      name="document-text"
	                      :size="24"
	                      class="text-slate-400"
	                    />
	                  </div>
                  <p class="text-sm text-slate-500 mb-4">No corridors saved yet</p>
                  <NuxtLink
                    to="/send-money"
                    class="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Compare rates to add one →
                  </NuxtLink>
                </div>
                <div
v-else
class="divide-y divide-slate-100"
>
                  <div
                    v-for="item in corridorWatchlistItems.slice(0, 3)"
                    :key="item.id"
                    class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div class="flex items-center gap-3">
	                      <div class="flex items-center gap-1">
	                        <span class="text-lg">{{ getFlag(item.target.from) }}</span>
	                        <Icon
	                          name="chevron-right"
	                          :size="16"
	                          class="text-slate-400"
	                        />
	                        <span class="text-lg">{{ getFlag(item.target.to) }}</span>
	                      </div>
                      <span class="text-sm font-medium text-slate-900">{{ item.label }}</span>
                    </div>
                    <button
                      type="button"
                      class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      @click="openAlert(item)"
                    >
                      Set alert
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (1/3) -->
            <div class="space-y-6">
              <!-- Recent Searches -->
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-900 mb-4">Recent Searches</h3>
                <div
                  v-if="recentSearchesPending"
                  class="text-sm text-slate-500"
                >
                  Loading...
                </div>
                <div
	                  v-else-if="recentSearches.length === 0"
	                  class="text-center py-4"
	                >
	                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
	                    <Icon
	                      name="magnifying-glass"
	                      :size="20"
	                      class="text-slate-400"
	                    />
	                  </div>
                  <p class="text-sm text-slate-500 mb-2">No searches yet</p>
                  <NuxtLink
to="/send-money"
class="text-sm font-medium text-blue-600 hover:text-blue-700"
>
                    Compare rates →
                  </NuxtLink>
                </div>
                <div
v-else
class="space-y-3"
>
                  <NuxtLink
                    v-for="(search, idx) in recentSearches.slice(0, 5)"
                    :key="idx"
                    :to="getCorridorUrl(search.from, search.to)"
                    class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
	                    <div class="flex items-center gap-1.5">
	                      <span class="text-lg">{{ getFlag(search.from) }}</span>
	                      <Icon
	                        name="chevron-right"
	                        :size="16"
	                        class="text-slate-400"
	                      />
	                      <span class="text-lg">{{ getFlag(search.to) }}</span>
	                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900">
                        {{ getCountryName(search.from) }} → {{ getCountryName(search.to) }}
	                      </p>
		                      <p class="text-sm text-slate-500 font-medium">
		                        ${{ formatOpsNumber(search.amount || 500, 0) }} • {{ formatMethod(search.method) }}
		                      </p>
                    </div>
                  </NuxtLink>
                </div>
              </div>

              <!-- Top Movers from Watchlist -->
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-900 mb-4">Top Movers Today</h3>
                <div
                  v-if="!watchlistHydrated"
                  class="text-sm text-slate-500"
                >
                  Loading...
                </div>
                <div
	                  v-else-if="corridorWatchlistItems.length === 0"
	                  class="text-center py-4"
	                >
	                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
	                    <Icon
	                      name="arrow-trending-up"
	                      :size="20"
	                      class="text-slate-400"
	                    />
	                  </div>
                  <p class="text-sm text-slate-500 mb-2">No corridors tracked</p>
                  <p class="text-xs text-slate-400">Add corridors to your watchlist to see their daily movements</p>
                </div>
                <div
v-else-if="topMoversLoading"
class="text-sm text-slate-500"
>
                  Loading rate history...
                </div>
                <div
	v-else-if="topMoversFromWatchlist.length === 0"
	class="text-center py-4"
	>
	                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
	                    <Icon
	                      name="arrow-trending-up"
	                      :size="20"
	                      class="text-slate-400"
	                    />
	                  </div>
                  <p class="text-sm text-slate-500 mb-2">No rate history yet</p>
                  <p class="text-xs text-slate-400">Once history is available, movers will appear here.</p>
                </div>
                <div
v-else
class="space-y-3"
>
                  <NuxtLink
                    v-for="item in topMoversFromWatchlist"
                    :key="item.id"
                    :to="getCorridorUrl(item.target.from, item.target.to)"
                    class="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
	                    <div class="flex items-center gap-2">
	                      <span class="text-lg">{{ getFlag(item.target.from) }}</span>
	                      <Icon
	                        name="chevron-right"
	                        :size="16"
	                        class="text-slate-400"
	                      />
	                      <span class="text-lg">{{ getFlag(item.target.to) }}</span>
	                      <span class="text-sm text-slate-700">{{ item.target.from }}/{{ item.target.to }}</span>
	                    </div>
                    <span
                      class="text-sm font-medium"
                      :class="(item.change ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'"
                    >
                      {{ formatPercentValue(item.change) }}
                    </span>
                  </NuxtLink>
                  <div
v-if="corridorWatchlistItems.length > topMoversLimit"
class="pt-2 border-t border-slate-100"
>
                    <button
                      type="button"
                      class="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                      @click="setTab('watchlist')"
                    >
                      View all {{ corridorWatchlistItems.length }} corridors →
                  </button>
                </div>
                </div>
              </div>

              <!-- Contact Support -->
              <div class="bg-brand-600 rounded-xl border border-brand-700 p-6">
                <div class="flex items-start gap-4">
	                  <div class="flex-shrink-0">
	                    <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
	                      <Icon
	                        name="chat-bubble"
	                        :size="20"
	                        class="text-white"
	                      />
	                    </div>
	                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-white mb-2">Need Help?</h3>
                    <p class="text-sm text-white/90 mb-4">
                      Have questions or found an issue? Our support team is here to help.
                    </p>
	                    <NuxtLink
	                      to="/contact"
	                      class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-white/90 transition-colors"
	                    >
	                      Contact Support
	                      <Icon
	                        name="chevron-right"
	                        :size="16"
	                        class="text-current"
	                      />
	                    </NuxtLink>
	                  </div>
	                </div>
	              </div>

              <!-- Ad: Upgrade to Plus (Free users only) -->
              <div
v-if="!isPlus"
class="bg-blue-600 rounded-xl p-5 text-white"
>
	                <div class="flex items-start gap-3">
	                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
	                    <Icon
	                      name="sparkles"
	                      :size="20"
	                      variant="solid"
	                      class="text-current"
	                    />
	                  </div>
	                  <div class="flex-1">
	                    <h4 class="font-semibold text-sm mb-1">Remove Ads with Plus</h4>
	                    <p class="text-xs text-white/90 mb-3">Get Pulse access, 16 alerts, 365-day history, exports, and an ad-free experience.</p>
	                    <NuxtLink
	to="/plus"
	class="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-blue-100"
	>
	                      <span>Learn more</span>
	                      <Icon
	                        name="chevron-right"
	                        :size="16"
	                        class="text-current"
	                      />
	                    </NuxtLink>
	                  </div>
	                </div>
	              </div>
            </div>
          </div>
        </div>

        <!-- Watchlist Tab -->
        <div v-else-if="activeTab === 'watchlist'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-slate-900">Watchlist</h2>
                <span
                  v-if="limits.watchlistItems !== 'unlimited'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="watchlistLimitPercent >= 100 ? 'bg-brand-100 text-brand-700' : watchlistLimitPercent >= 66 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ watchlistCount }}/{{ limits.watchlistItems }} used
                </span>
                <span
                  v-else
	                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
	                >
	                  <Icon
	                    name="check"
	                    :size="16"
	                    class="text-current"
	                  />
	                  Unlimited
	                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{{ watchlistCount }} saved corridor{{ watchlistCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <NuxtLink
                v-if="!isPlus && watchlistLimitPercent >= 66"
                to="/plus"
                class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Upgrade
              </NuxtLink>
              <button
                v-if="watchlistCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="watchlistReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Limit Warning Banner -->
          <div
            v-if="!isPlus && watchlistLimitPercent >= 100"
	            class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
	          >
	            <Icon
	              name="exclamation-triangle"
	              :size="20"
	              variant="solid"
	              class="text-brand-600 flex-shrink-0 mt-0.5"
	            />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-brand-600">Watchlist limit reached</h4>
              <p class="text-sm text-brand-700 mt-0.5">You've reached your limit of {{ limits.watchlistItems }} watchlist corridors. Upgrade to Plus for up to 16 corridors.</p>
            </div>
            <NuxtLink
              to="/plus"
              class="flex-shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Upgrade
            </NuxtLink>
          </div>

          <div
            v-else-if="isPlus && watchlistLimitReached"
	            class="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
	          >
	            <Icon
	              name="exclamation-triangle"
	              :size="20"
	              variant="solid"
	              class="text-amber-600 flex-shrink-0 mt-0.5"
	            />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-amber-800">Watchlist limit reached</h4>
              <p class="text-sm text-amber-800/90 mt-0.5">
                You've reached your limit of {{ limits.watchlistItems }} watchlist corridors. Remove a corridor to add another.
              </p>
            </div>
          </div>

          <!-- Quick Add Corridor Form -->
          <div
            v-if="!watchlistLimitReached"
            class="bg-white rounded-xl border border-slate-200 p-4 mb-6"
          >
            <form
class="flex flex-col sm:flex-row gap-3"
@submit.prevent="handleAddWatchlist"
>
              <div class="flex-1 flex gap-2">
                <div class="flex-1">
                  <label class="sr-only">From</label>
                  <UniversalDropdown
                    v-model="newWatchlist.from"
                    :options="inlineFromOptions"
                    placeholder="Select country"
                  />
                </div>
	                <div class="flex items-center text-slate-400">
	                  <Icon
	                    name="arrow-right"
	                    :size="20"
	                    class="text-current"
	                  />
	                </div>
                <div class="flex-1">
                  <label class="sr-only">To</label>
                  <UniversalDropdown
                    v-model="newWatchlist.to"
                    :options="inlineToOptions"
                    placeholder="Select country"
                  />
                </div>
              </div>
              <button
	                type="submit"
	                class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
	              >
	                <Icon
	                  name="plus"
	                  :size="16"
	                  class="text-current"
	                />
	                Add Corridor
	              </button>
            </form>
          </div>

          <div
v-if="!watchlistHydrated"
class="text-center py-12 text-slate-500"
>
            Loading...
          </div>
          <div
v-else-if="corridorWatchlistItems.length === 0"
	class="text-center py-16 bg-white rounded-xl border border-slate-200"
	>
	            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
	              <Icon
	                name="document-text"
	                :size="24"
	                class="text-blue-600"
	              />
	            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No corridors saved yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Add your first corridor above to start tracking exchange rates.</p>
          </div>

          <!-- Enhanced Watchlist Cards -->
          <div
v-else
class="grid gap-6 sm:grid-cols-2"
>
            <div
              v-for="item in corridorWatchlistItems"
              :key="item.id"
              class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <!-- Card Header -->
              <div class="p-5 border-b border-slate-100">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
	                    <div class="flex items-center gap-2">
	                      <span class="text-2xl">{{ getFlag(item.target.from) }}</span>
	                      <Icon
	                        name="arrow-right"
	                        :size="20"
	                        class="text-slate-300"
	                      />
	                      <span class="text-2xl">{{ getFlag(item.target.to) }}</span>
	                    </div>
                    <div>
                      <h3 class="font-semibold text-slate-900 text-base">{{ item.target.from }}→{{ item.target.to }}</h3>
                      <p class="text-sm text-slate-500 font-medium">{{ formatMethod(item.target.method) }}</p>
                    </div>
                  </div>
	                  <button
	                    type="button"
	                    class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
	                    @click="openDeleteWatchlistModal(item)"
	                  >
	                    <Icon
	                      name="trash"
	                      :size="16"
	                      class="text-current"
	                    />
	                  </button>
                </div>

                <!-- Current Rate -->
                <div class="flex items-baseline justify-between">
                  <div>
                    <div class="text-3xl font-bold text-slate-900">{{ getWatchlistSnapshot(item.id).rateLabel }}</div>
                    <div class="text-sm text-slate-500 mt-0.5">
                      {{ getCurrencyCode(item.target.to) }} per {{ getCurrencyCode(item.target.from) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold"
                      :class="!getWatchlistSnapshot(item.id).hasChange
                        ? 'bg-slate-100 text-slate-500'
                        : (getWatchlistSnapshot(item.id).changeValue >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')"
	                    >
	                      <Icon
	                        name="arrow-up"
	                        :size="16"
	                        class="text-current"
	                        :class="getWatchlistSnapshot(item.id).hasChange && getWatchlistSnapshot(item.id).changeValue < 0 ? 'rotate-180' : ''"
	                      />
	                      {{ formatPercentValue(getWatchlistSnapshot(item.id).change) }}
	                    </div>
                    <div class="text-xs text-slate-500 mt-1">1d change</div>
                  </div>
                </div>
              </div>

              <!-- Chart Section -->
              <div class="px-5 py-4 bg-gradient-to-b from-slate-50 to-white">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-slate-600">Last 7 days</span>
	                  <span
	                    v-if="getWatchlistAlertCount(item.id) > 0"
	                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
	                  >
	                    <Icon
	                      name="bell-alert"
	                      :size="16"
	                      variant="solid"
	                      class="text-current"
	                    />
	                    {{ getWatchlistAlertCount(item.id) }} alert{{ getWatchlistAlertCount(item.id) !== 1 ? 's' : '' }}
	                  </span>
                  </div>

                  <!-- Enhanced Chart -->
                  <div class="relative h-32 mb-3">
                  <div
                    v-if="isWatchlistHistoryLoading(item.id)"
                    class="absolute inset-0 flex items-center justify-center text-xs text-slate-400"
                  >
                    Loading rate history...
                  </div>
                  <div
                    v-else-if="getWatchlistSnapshot(item.id).history.length < 2"
                    class="absolute inset-0 flex items-center justify-center text-xs text-slate-400"
                  >
                    No rate history yet
                  </div>
                  <svg
v-else
class="w-full h-full"
viewBox="0 0 400 120"
preserveAspectRatio="none"
>
                    <defs>
                      <linearGradient
:id="`chartGradient-${item.id}`"
x1="0%"
y1="0%"
x2="0%"
y2="100%"
>
                        <stop
offset="0%"
style="stop-color:rgb(59, 130, 246);stop-opacity:0.2"
/>
                        <stop
offset="100%"
style="stop-color:rgb(59, 130, 246);stop-opacity:0"
/>
                      </linearGradient>
                      </defs>

                      <!-- Grid lines -->
                      <line
x1="0"
y1="30"
x2="400"
y2="30"
stroke="#e2e8f0"
stroke-width="1"
/>
                      <line
x1="0"
y1="60"
x2="400"
y2="60"
stroke="#e2e8f0"
stroke-width="1"
/>
                      <line
x1="0"
y1="90"
x2="400"
y2="90"
stroke="#e2e8f0"
stroke-width="1"
/>

                      <!-- Area fill -->
                      <path
                        :d="getWatchlistChartPath(item.id)"
                        :fill="`url(#chartGradient-${item.id})`"
                      />

                      <!-- Line -->
                      <polyline
                        :points="getWatchlistChartPoints(item.id)"
                      fill="none"
                      stroke="#3b82f6"
                      stroke-width="2.5"
                      stroke-linecap="round"
                        stroke-linejoin="round"
                      />

                      <!-- Current point indicator -->
                      <circle
                        :cx="380"
                      :cy="getWatchlistChartCurrentY(item.id)"
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      stroke-width="2"
                    />
                  </svg>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">High (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).high }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">Low (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).low }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500 mb-0.5">Avg (7d)</div>
                    <div class="text-sm font-semibold text-slate-900">{{ getWatchlistStats(item.id).avg }}</div>
                  </div>
                </div>
              </div>

              <!-- Best Provider Section -->
              <div class="px-5 py-4 border-t border-slate-200 bg-white">
                <div class="flex items-center justify-between mb-3">
	                  <div class="flex items-center gap-2">
	                    <Icon
	                      name="sparkles"
	                      :size="16"
	                      class="text-emerald-600"
	                    />
	                    <span class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Best Provider (Latest)</span>
	                  </div>
                </div>
                <div
v-if="getBestProviderForItem(item.id)"
class="flex items-center gap-3"
>
                  <div class="flex h-10 w-24 items-center justify-center flex-shrink-0">
                    <ProviderLogo
                      :slug="getBestProviderForItem(item.id)?.slug || ''"
                      :alt="getBestProviderForItem(item.id)?.name"
                      size="small"
                      class="object-contain"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-slate-900 text-sm">{{ getBestProviderForItem(item.id)?.name }}</h4>
                  </div>
                  <NuxtLink
                    :to="`/learn/providers/${getBestProviderForItem(item.id)?.slug}`"
	                    class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
	                  >
	                    Learn more
	                    <Icon
	                      name="chevron-right"
	                      :size="16"
	                      class="text-current"
	                    />
	                  </NuxtLink>
	                </div>
                <div
v-else-if="isProviderRatesLoadingForItem(item.id)"
class="text-sm text-slate-500"
>
                  Loading provider quotes...
                </div>
                <div
v-else
class="text-sm text-slate-500"
>
                  No provider quotes yet.
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <button
                  type="button"
                  :disabled="comparingCorridor === item.id"
	                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
	                  @click="handleCompareClick(item)"
	                >
	                  <div
	                    v-if="comparingCorridor === item.id"
	                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
	                  />
	                  <Icon
	                    v-else
	                    name="magnifying-glass"
	                    :size="16"
	                    class="text-current"
	                  />
	                  {{ comparingCorridor === item.id ? 'Loading...' : 'Compare' }}
	                </button>
                <button
                  type="button"
	                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
	                  @click="openAlert(item)"
	                >
	                  <Icon
	                    name="bell-alert"
	                    :size="16"
	                    class="text-current"
	                  />
	                  Set Alert
	                </button>
              </div>
            </div>
          </div>

          <!-- Ad: Sponsored Provider (Free users only) -->
          <div
v-if="!isPlus"
class="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4"
>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-slate-400 uppercase tracking-wide">Sponsored</span>
              <NuxtLink
to="/plus"
class="text-xs text-blue-600 hover:text-blue-700"
>Remove ads</NuxtLink>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">W</div>
              <div class="flex-1">
                <h4 class="font-semibold text-slate-900 text-sm">Wise - Send Money Abroad</h4>
                <p class="text-xs text-slate-500">Low fees, real exchange rate. Trusted by 16M+ people.</p>
              </div>
              <NuxtLink
                to="/learn/providers/wise"
                class="flex-shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Compare
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-else-if="activeTab === 'alerts'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-slate-900">Rate Alerts</h2>
                <span
                  v-if="limits.alerts !== 'unlimited'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="alertsLimitPercent >= 100 ? 'bg-brand-100 text-brand-700' : alertsLimitPercent >= 66 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ alertsCount }}/{{ limits.alerts }} used
                </span>
                <span
	                  v-else
	                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
	                >
	                  <Icon
	                    name="check"
	                    :size="16"
	                    class="text-current"
	                  />
	                  Unlimited
	                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{{ alertsCount }} alert{{ alertsCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="alertsLimitReached"
                @click="openCreateAlert"
              >
                New Alert
              </button>
              <NuxtLink
                v-if="!isPlus && alertsLimitPercent >= 66"
                to="/plus"
	                class="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
	              >
	                <Icon
	                  name="sparkles"
	                  :size="16"
	                  variant="solid"
	                  class="text-current"
	                />
	                Upgrade
	              </NuxtLink>
              <button
                v-if="alertsCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="alertsReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Limit Warning Banner -->
          <div
	            v-if="!isPlus && alertsLimitPercent >= 100"
	            class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
	          >
	            <Icon
	              name="exclamation-triangle"
	              :size="20"
	              variant="solid"
	              class="text-brand-600 flex-shrink-0 mt-0.5"
	            />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-brand-600">Alert limit reached</h4>
              <p class="text-sm text-brand-700 mt-0.5">You've reached your limit of {{ limits.alerts }} alerts. Upgrade to Plus for up to 16 alerts.</p>
            </div>
            <NuxtLink
              to="/plus"
              class="flex-shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Upgrade
            </NuxtLink>
          </div>

          <div
	            v-else-if="isPlus && alertsLimitReached"
	            class="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
	          >
	            <Icon
	              name="exclamation-triangle"
	              :size="20"
	              variant="solid"
	              class="text-amber-600 flex-shrink-0 mt-0.5"
	            />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-amber-800">Alert limit reached</h4>
              <p class="text-sm text-amber-800/90 mt-0.5">
                You've reached your limit of {{ limits.alerts }} alerts. Disable or delete an alert to add another.
              </p>
            </div>
          </div>

          <div
v-if="!alertsHydrated"
class="text-center py-12 text-slate-500"
>
            Loading...
          </div>
          <div
	v-else-if="alertItems.length === 0"
	class="text-center py-16 bg-white rounded-xl border border-slate-200"
	>
	            <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
	              <Icon
	                name="bell-alert"
	                :size="24"
	                class="text-emerald-600"
	              />
	            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No alerts set yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Get notified when exchange rates hit your target. Create your first alert to get started.</p>
            <button
              type="button"
	              class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
	              :disabled="alertsLimitReached"
	              @click="openCreateAlert"
	            >
	              <Icon
	                name="plus"
	                :size="16"
	                class="text-current"
	              />
	              Create Alert
	            </button>
          </div>

          <!-- Enhanced Alerts Cards -->
          <div
v-else
class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
>
            <div
              v-for="alert in alertItems"
              :key="alert.id"
              class="bg-white rounded-xl border overflow-hidden transition-all"
              :class="alert.enabled ? 'border-emerald-200 hover:border-emerald-300 hover:shadow-md' : 'border-slate-200 opacity-75'"
            >
              <!-- Card Header with Status -->
              <div
class="p-4 border-b"
:class="alert.enabled ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'"
>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center"
	                      :class="alert.enabled ? 'bg-emerald-100' : 'bg-slate-200'"
	                    >
	                      <Icon
	                        name="bell-alert"
	                        :size="16"
	                        variant="solid"
	                        :class="alert.enabled ? 'text-emerald-600' : 'text-slate-400'"
	                      />
	                    </div>
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="alert.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
                    >
                      {{ alert.enabled ? 'Active' : 'Paused' }}
                    </span>
                  </div>
                  <!-- Toggle Switch -->
                  <button
                    type="button"
                    class="relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    :class="alert.enabled ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-slate-300 focus:ring-slate-500'"
                    @click="alertsToggleEnabled(alert.id)"
                  >
                    <span
                      class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      :class="alert.enabled ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </div>
              </div>

              <!-- Alert Details -->
              <div class="p-4">
                <!-- Corridor with Flags -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex items-center">
	                    <span class="text-2xl">{{ getFlag(getAlertCorridor(alert).from) }}</span>
	                    <div class="mx-2 flex flex-col items-center">
	                      <Icon
	                        name="arrow-right"
	                        :size="16"
	                        class="text-slate-400"
	                      />
	                    </div>
	                    <span class="text-2xl">{{ getFlag(getAlertCorridor(alert).to) }}</span>
	                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-slate-900">{{ getAlertCorridor(alert).from }}/{{ getAlertCorridor(alert).to }}</div>
                    <div class="text-xs text-slate-500">{{ watchlistFindById(alert.watchlistItemId)?.label || 'Alert' }}</div>
                  </div>
                </div>

                <!-- Currency Pair Badge -->
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    {{ getAlertCorridor(alert).from }} → {{ getAlertCorridor(alert).to }}
                  </span>
                  <span
v-if="alert.rule.currency"
class="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
>
                    {{ alert.rule.currency }}
                  </span>
                </div>

                <!-- Alert Condition -->
                <div class="bg-slate-50 rounded-lg p-3 mb-3">
                  <div class="text-xs text-slate-500 mb-1">Notify me when</div>
                  <div class="flex items-center flex-wrap gap-2">
                    <span class="text-sm font-semibold text-slate-900">{{ formatMetricLabel(alert.rule.metric) }}</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                      {{ formatComparator(alert.rule.comparator) }}
                    </span>
                    <span class="text-sm font-semibold text-slate-900">
                      {{ alert.rule.value }}
                      <span class="text-slate-500 font-normal">{{ alert.rule.currency || getAlertCorridor(alert).to }}</span>
                    </span>
                  </div>
                </div>

                <!-- Current Rate vs Target -->
                <div class="flex items-center justify-between text-sm mb-3 p-2 bg-slate-50 rounded-lg">
                  <div class="text-center flex-1">
                    <div class="text-xs text-slate-400 mb-0.5">Current</div>
                    <div class="font-semibold text-slate-900">{{ getAlertSnapshot(alert).rateLabel }}</div>
                    <div class="text-xs text-slate-500">{{ getCurrencyCode(getAlertCorridor(alert).to) }}</div>
	                  </div>
	                  <div class="px-3">
	                    <Icon
	                      name="chevron-right"
	                      :size="16"
	                      class="text-slate-300"
	                    />
	                  </div>
                  <div class="text-center flex-1">
                    <div class="text-xs text-slate-400 mb-0.5">Target</div>
                    <div
class="font-semibold"
:class="getAlertProgress(alert) >= 100 ? 'text-emerald-600' : 'text-blue-600'"
>
{{ alert.rule.value }}
</div>
                    <div class="text-xs text-slate-500">{{ alert.rule.currency || getCurrencyCode(getAlertCorridor(alert).to) }}</div>
                  </div>
                </div>

                <!-- Progress to Target -->
                <div class="mb-3">
                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getAlertProgress(alert) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'"
                      :style="{ width: `${Math.min(getAlertProgress(alert), 100)}%` }"
                    />
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    {{ getAlertProgress(alert) >= 100 ? 'Target reached!' : `${getAlertProgress(alert).toFixed(0)}% to target` }}
                  </div>
                </div>

                <!-- Frequency Badge -->
	                <div class="flex items-center gap-2">
	                  <Icon
	                    name="clock"
	                    :size="16"
	                    class="text-slate-400"
	                  />
	                  <span class="text-xs text-slate-500">{{ formatFrequency(alert.frequency) }}</span>
	                </div>
              </div>

              <!-- Quick Actions -->
              <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <NuxtLink
	                  :to="getCorridorUrl(getAlertCorridor(alert).from, getAlertCorridor(alert).to)"
	                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
	                >
	                  <Icon
	                    name="magnifying-glass"
	                    :size="16"
	                    class="text-current"
	                  />
	                  Compare
	                </NuxtLink>
                <button
                  type="button"
	                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
	                  @click="editAlert(alert)"
	                >
	                  <Icon
	                    name="pencil-square"
	                    :size="16"
	                    class="text-current"
	                  />
	                  Edit
	                </button>
                <button
	                  type="button"
	                  class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2 py-2 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
	                  @click="alertsRemove(alert.id)"
	                >
	                  <Icon
	                    name="trash"
	                    :size="16"
	                    class="text-current"
	                  />
	                </button>
              </div>
            </div>
          </div>

          <!-- Ad: Plus Features (Free users only) -->
          <div
v-if="!isPlus"
class="mt-6 bg-slate-900 rounded-xl p-6 text-white"
>
	            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
	              <div class="flex items-start gap-4">
	                <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
	                  <Icon
	                    name="bell-alert"
	                    :size="24"
	                    class="text-white"
	                  />
	                </div>
                <div>
                  <h4 class="font-semibold mb-1">Need More Alerts?</h4>
                  <p class="text-sm text-slate-300">Free accounts are limited to 1 alert. Upgrade to Plus for Pulse access, daily alerts, and up to 16 smart alerts.</p>
                </div>
              </div>
              <NuxtLink
to="/plus"
class="flex-shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
>
                Upgrade to Plus
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Comparison History</h2>
              <p class="text-sm text-slate-500">{{ compareCount }} comparison{{ compareCount !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                @click="showExportModal = true"
              >
                <Icon
                  name="arrow-down-tray"
                  :size="16"
                  class="text-current"
                />
                Export Data
              </button>
              <button
                v-if="compareCount > 0"
                type="button"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
                @click="compareReset"
              >
                Clear all
              </button>
            </div>
          </div>

          <!-- Export Modal -->
          <div
            v-if="showExportModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
class="absolute inset-0 bg-black/50"
@click="showExportModal = false"
/>
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-slate-900">Export Data</h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600"
                  @click="showExportModal = false"
                >
                  <Icon
                    name="x"
                    :size="20"
                    class="text-current"
                  />
                </button>
              </div>

              <!-- Plus-only gate -->
              <div
v-if="!isPlus"
class="text-center py-6"
>
                <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Icon
                    name="sparkles"
                    :size="24"
                    variant="solid"
                    class="text-blue-600"
                  />
                </div>
                <h4 class="text-base font-semibold text-slate-900 mb-2">Plus Feature</h4>
                <p class="text-sm text-slate-500 mb-6">
                  Export your comparison history and watchlist data to CSV or PDF with Plus.
                </p>
                <NuxtLink
                  to="/plus"
                  class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Plus
                </NuxtLink>
              </div>

              <!-- Export form for Plus users -->
              <div
v-else
class="space-y-6"
>
                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Data to Export</label>
                  <div class="space-y-2.5">
                    <label
class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
:class="exportSettings.dataType === 'history' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
>
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="history"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      >
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Comparison History</div>
                        <div class="text-xs text-slate-500 mt-0.5">All your rate comparisons</div>
                      </div>
                    </label>
                    <label
class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
:class="exportSettings.dataType === 'watchlist' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
>
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="watchlist"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      >
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Watchlist</div>
                        <div class="text-xs text-slate-500 mt-0.5">Saved corridors and rates</div>
                      </div>
                    </label>
                    <label
class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
:class="exportSettings.dataType === 'alerts' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
>
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="alerts"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      >
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">Alerts</div>
                        <div class="text-xs text-slate-500 mt-0.5">Alert rules and history</div>
                      </div>
                    </label>
                    <label
class="flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
:class="exportSettings.dataType === 'all' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
>
                      <input
                        v-model="exportSettings.dataType"
                        type="radio"
                        value="all"
                        class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      >
                      <div class="flex-1">
                        <div class="text-sm font-semibold text-slate-900">All Data</div>
                        <div class="text-xs text-slate-500 mt-0.5">Complete export of all your data</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Time Period</label>
                  <select
                    v-model="exportSettings.dateRange"
                    class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all hover:border-slate-400"
                    @change="setExportDateRange(exportSettings.dateRange)"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>

                <div
v-if="exportSettings.dataType === 'history'"
class="rounded-xl border border-slate-200 bg-slate-50 p-4"
>
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      v-model="exportSettings.includeCorridorHistory"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                      :disabled="exportCorridorIds.length === 0"
                    >
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-slate-900">
                        Include corridor history (Pulse indices)
                      </div>
                      <div
v-if="exportCorridorIds.length > 0"
class="text-xs text-slate-500 mt-0.5"
>
                        Adds Pulse indices history for {{ exportCorridorIds.length }} watchlist corridor{{ exportCorridorIds.length !== 1 ? 's' : '' }} (max 16).
                      </div>
                      <div
v-else
class="text-xs text-slate-500 mt-0.5"
>
                        Add corridors to your watchlist to include indices history in this export.
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-900 mb-3">Export Format</label>
                  <div class="grid grid-cols-2 gap-3">
                    <label
                      class="flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
                      :class="exportSettings.format === 'csv' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'"
                    >
                      <input
                        v-model="exportSettings.format"
                        type="radio"
                        value="csv"
                        class="sr-only"
                      >
                      <Icon
                        name="document-text"
                        :size="20"
                        class="text-current"
                      />
                      <span class="text-sm font-semibold">CSV</span>
                    </label>
                    <label
                      class="flex items-center justify-center gap-2 p-3.5 border-2 rounded-xl cursor-pointer transition-all"
                      :class="exportSettings.format === 'pdf' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'"
                    >
                      <input
                        v-model="exportSettings.format"
                        type="radio"
                        value="pdf"
                        class="sr-only"
                      >
                      <Icon
                        name="document-text"
                        :size="20"
                        class="text-current"
                      />
                      <span class="text-sm font-semibold">PDF</span>
                    </label>
                  </div>
                </div>

                <div
v-if="exportStatusMessage || exportErrorMessage"
class="text-sm"
>
                  <p
v-if="exportErrorMessage"
class="text-red-600"
>
                    {{ exportErrorMessage }}
                  </p>
                  <p
v-else
class="text-slate-600"
>
                    {{ exportStatusMessage }}
                  </p>
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    @click="showExportModal = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    :disabled="isExporting"
                    @click="handleExport"
                  >
                    <div
                      v-if="isExporting"
                      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    {{ isExporting ? 'Exporting...' : 'Export' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Delete Account Modal -->
          <div
            v-if="showDeleteAccountModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
class="absolute inset-0 bg-black/50"
@click="closeDeleteAccountModal"
/>
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900">Delete Account</h3>
	                <button
	                  type="button"
	                  class="text-slate-400 hover:text-slate-600"
	                  :disabled="accountDeleting"
	                  @click="closeDeleteAccountModal"
	                >
	                  <Icon
	                    name="x"
	                    :size="20"
	                    class="text-current"
	                  />
	                </button>
	              </div>

              <div class="space-y-4 text-sm text-slate-600">
                <p>
                  This will permanently delete your account and remove your personal data.
                  Export your data before continuing if you need a copy.
                </p>
                <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  This action is irreversible.
                </div>
              </div>

              <div class="mt-4 space-y-3">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    v-model="deleteAccountConfirmed"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  >
                  I understand this action cannot be undone.
                </label>
                <input
                  v-model="deleteAccountConfirmText"
                  type="text"
                  placeholder="Type DELETE to confirm"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                <p
v-if="deleteAccountError"
class="text-xs text-red-600"
>
                  {{ deleteAccountError }}
                </p>
                <p
v-else-if="deleteAccountWarning"
class="text-xs text-amber-700"
>
                  {{ deleteAccountWarning }}
                </p>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  :disabled="accountDeleting"
                  @click="closeDeleteAccountModal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  :disabled="!deleteAccountReady || accountDeleting"
                  @click="handleDeleteAccount"
                >
                  <div
                    v-if="accountDeleting"
                    class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  {{ accountDeleting ? 'Deleting...' : 'Delete Account' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Delete Watchlist Item Modal -->
          <div
            v-if="showDeleteWatchlistModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
class="absolute inset-0 bg-black/50"
@click="closeDeleteWatchlistModal"
/>
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900">Remove from Watchlist</h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600"
                  @click="closeDeleteWatchlistModal"
                >
                  <Icon
                    name="x"
                    :size="20"
                    class="text-current"
                  />
                </button>
              </div>

              <div class="space-y-4 text-sm text-slate-600">
                <p v-if="watchlistItemToDelete?.target.type === 'corridor'">
                  Are you sure you want to remove <strong class="font-semibold text-slate-900">{{ watchlistItemToDelete.target.from }} → {{ watchlistItemToDelete.target.to }}</strong> from your watchlist?
                </p>
                <p v-else-if="watchlistItemToDelete?.target.type === 'fxPair'">
                  Are you sure you want to remove <strong class="font-semibold text-slate-900">{{ watchlistItemToDelete.target.base }}/{{ watchlistItemToDelete.target.quote }}</strong> from your watchlist?
                </p>
                <p v-else>
                  Are you sure you want to remove this item from your watchlist?
                </p>
                <p class="text-xs text-slate-500">
                  You can add it back anytime.
                </p>
              </div>

              <div class="flex gap-3 pt-6">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  @click="closeDeleteWatchlistModal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  @click="confirmDeleteWatchlistItem"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div
v-if="!compareHydrated"
class="text-center py-12 text-slate-500"
>
            Loading...
          </div>
          <div
v-else-if="compareRuns.length === 0"
class="text-center py-16"
>
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Icon
                name="clock"
                :size="24"
                class="text-slate-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No comparisons yet</h3>
            <p class="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Your comparison history will appear here.</p>
            <NuxtLink
              to="/send-money"
              class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Compare Rates
            </NuxtLink>
          </div>
          <div
v-else
class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100"
>
            <div
              v-for="run in compareRuns"
              :key="run.id"
              class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-4 flex-1">
                <input
                  v-model="selectedExportItems"
                  type="checkbox"
                  :value="run.id"
                  class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                >
                <div class="flex items-center gap-3 flex-1 min-w-0">
	                  <div class="flex items-center gap-2 flex-shrink-0">
	                    <span class="text-xl">{{ getFlag(run.from) }}</span>
	                    <Icon
	                      name="arrow-right"
	                      :size="16"
	                      class="text-slate-400"
	                    />
	                    <span class="text-xl">{{ getFlag(run.to) }}</span>
	                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-900">{{ run.from }}/{{ run.to }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-sm text-emerald-600 font-medium">Sent {{ formatCurrency(run.amount, run.from) }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-sm text-blue-600 capitalize font-medium">{{ run.method }}</span>
                    </div>
	                    <div class="text-xs text-slate-500 mt-0.5">{{ formatDate(run.createdAt) }}</div>
	                  </div>
	                </div>
	              </div>
              <div class="flex items-center gap-3 flex-shrink-0 ml-4">
                <NuxtLink
                  v-if="run.path"
                  :to="run.path"
                  class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  View
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Ad: Extended History (Free users only) -->
          <div
v-if="!isPlus"
class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5"
>
	            <div class="flex items-start gap-4">
	              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
	                <Icon
	                  name="clock"
	                  :size="20"
	                  class="text-brand-600"
	                />
	              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-brand-600 text-sm mb-1">Limited to 30-Day History</h4>
                <p class="text-sm text-brand-700 mb-2">Free accounts can only view the last 30 days. Upgrade to Plus for 365-day history and export.</p>
                <NuxtLink
to="/plus"
class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
>
                  Upgrade to Plus
                  <Icon
                    name="chevron-right"
                    :size="16"
                    class="text-current"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Export selected items bar -->
          <div
            v-if="selectedExportItems.length > 0 && isPlus"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 shadow-lg flex items-center gap-4"
          >
            <span class="text-sm">{{ selectedExportItems.length }} item{{ selectedExportItems.length !== 1 ? 's' : '' }} selected</span>
            <button
              type="button"
              class="text-sm font-medium text-blue-400 hover:text-blue-300"
              @click="handleExportSelected"
            >
              Export Selected
            </button>
            <button
              type="button"
              class="text-slate-400 hover:text-white"
              @click="selectedExportItems = []"
            >
              <Icon
                name="x"
                :size="16"
                class="text-current"
              />
            </button>
          </div>
        </div>

        <!-- Enterprise Tab -->
        <div v-else-if="activeTab === 'enterprise'">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Enterprise API & Embeds</h2>
              <p class="text-sm text-slate-500">Manage API access, refresh tokens, and generate TEER/RCI/RVI embeds.</p>
            </div>
            <div class="text-xs text-slate-500">
              Tier 2: {{ tier2CadenceLabel }}h cadence · Tier 3: {{ tier3CadenceLabel }}h cadence
            </div>
          </div>

          <div
v-if="!apiAccess"
class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
>
            API access is not enabled for this account. Contact support to enable enterprise API access.
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-semibold text-slate-900">API Keys</h3>
                  <p class="text-xs text-slate-500">Default tier: {{ apiTier || 2 }}. Tier 1 is disabled.</p>
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  :disabled="apiKeysLoading || !apiAccess"
                  @click="fetchApiKeys"
                >
                  Refresh
                </button>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <input
                  v-model="apiKeyName"
                  type="text"
                  placeholder="Key name"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                <select
                  v-model="apiKeyTier"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="2">Tier 2 ({{ tier2CadenceLabel }}h cadence)</option>
                  <option value="3">Tier 3 ({{ tier3CadenceLabel }}h cadence)</option>
                </select>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                  :disabled="apiKeysLoading || !apiAccess"
                  @click="createEnterpriseApiKey"
                >
                  Create Key
                </button>
              </div>

              <p
v-if="apiKeysError"
class="text-xs text-red-600"
>
                {{ apiKeysError }}
              </p>

	              <div
	v-if="apiKeyToken"
	class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-900"
	>
                <div class="flex items-center justify-between gap-3">
                  <div class="font-semibold">New token (save now)</div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    @click="copyApiKeyToken"
                  >
                    Copy
                  </button>
                </div>
                <div class="mt-2 break-all font-mono text-[11px] text-emerald-800">
                  {{ apiKeyToken }}
                </div>
                <div
v-if="apiKeyTokenLabel"
class="mt-1 text-[11px] text-emerald-700"
>
                  Prefix: {{ apiKeyTokenLabel }}
                </div>
                <div
v-if="apiKeyCopyStatus"
class="mt-1 text-[11px] text-emerald-700"
>
	                  {{ apiKeyCopyStatus }}
	                </div>
	              </div>

	              <DataTable
	                variant="consumer"
	                caption="API keys"
	                :columns="apiKeyTableColumns"
	                :rows="apiKeys"
	                :row-key="apiKeyTableRowKey"
	                :loading="apiKeysLoading"
	                :empty="{ title: 'No API keys yet', message: 'Create a key to get started.' }"
	              >
	                <template #cell-name="{ row }">
	                  <span class="text-slate-900">{{ apiKeyFromRow(row).name || 'Untitled' }}</span>
	                </template>

	                <template #cell-key_prefix="{ row }">
	                  <span class="font-mono text-xs text-slate-600">{{ apiKeyFromRow(row).key_prefix }}••••</span>
	                </template>

	                <template #cell-scopes="{ row }">
	                  <span class="text-xs text-slate-500">{{ apiKeyFromRow(row).scopes.join(', ') || '—' }}</span>
	                </template>

	                <template #cell-last_used_at="{ row }">
	                  <span class="text-xs text-slate-500">{{ apiKeyFromRow(row).last_used_at ? formatDate(apiKeyFromRow(row).last_used_at!) : '—' }}</span>
	                </template>

	                <template #cell-revoked_at="{ row }">
	                  <span
	                    v-if="apiKeyFromRow(row).revoked_at"
	                    class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
	                  >Revoked</span>
	                  <span
	                    v-else
	                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
	                  >Active</span>
	                </template>

	                <template #row-actions="{ row }">
	                  <div class="flex items-center justify-end gap-2">
	                    <button
	                      type="button"
	                      class="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
	                      :disabled="apiKeysLoading || !apiAccess || Boolean(apiKeyFromRow(row).revoked_at)"
	                      @click="rotateEnterpriseApiKey(apiKeyFromRow(row))"
	                    >
	                      Rotate
	                    </button>
	                    <button
	                      v-if="!apiKeyFromRow(row).revoked_at"
	                      type="button"
	                      class="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
	                      :disabled="apiKeysLoading || !apiAccess"
	                      @click="revokeEnterpriseApiKey(apiKeyFromRow(row))"
	                    >
	                      Revoke
	                    </button>
	                  </div>
	                </template>
	              </DataTable>
	            </div>

            <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Embed Generator</h3>
                <p class="text-xs text-slate-500">Create shareable index charts for your site with proper citation.</p>
              </div>

              <div class="grid gap-3">
                <div>
                  <label class="text-xs font-semibold text-slate-600">Corridor ID</label>
                  <input
                    v-model="embedCorridorId"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="US-PH-USD-PHP"
                  >
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold text-slate-600">Amount Bucket</label>
                    <input
                      v-model.number="embedAmountBucket"
                      type="number"
                      min="1"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-600">Method Profile</label>
                    <select
                      v-model="embedMethodProfile"
                      class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="standard_bank">Bank to Bank</option>
                      <option value="standard_card">Card to Bank</option>
                      <option value="cash_pickup">Cash Pickup</option>
                    </select>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold text-slate-600">Days</label>
                    <input
                      v-model.number="embedDays"
                      type="number"
                      min="1"
                      max="365"
                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-600">Theme</label>
                    <select
                      v-model="embedTheme"
                      class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600">API Key</label>
                  <input
                    v-model="embedApiKey"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Paste API key token"
                  >
                  <p
v-if="!embedApiKey"
class="mt-1 text-[11px] text-amber-600"
>
                    Paste a dedicated API key before sharing embeds publicly.
                  </p>
                </div>
              </div>

              <div
v-if="embedCopyStatus"
class="text-xs text-emerald-600"
>
                {{ embedCopyStatus }}
              </div>

              <div class="space-y-4">
                <div
v-for="item in embedIndices"
:key="item.key"
class="rounded-lg border border-slate-200 p-4"
>
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-sm font-semibold text-slate-900">{{ item.label }} Embed</div>
                    <button
                      type="button"
                      class="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      @click="copyEmbedCode(item.key)"
                    >
                      Copy
                    </button>
                  </div>
                  <textarea
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
                    rows="5"
                    readonly
                    :value="embedCodes[item.key]"
                  />
                  <div class="mt-3">
                    <div class="text-xs text-slate-500 mb-2">Preview</div>
                    <div
class="w-full overflow-hidden rounded-lg border border-slate-200"
style="height: 240px;"
>
                      <iframe
                        v-if="embedUrls[item.key]"
                        :src="embedUrls[item.key]"
                        class="h-full w-full"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ops Tab -->
        <div v-else-if="activeTab === 'ops'">
          <div class="flex flex-col gap-4 mb-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Ops Health</h2>
                <p class="text-sm text-slate-500">Admin-only health probes for provider pipelines.</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                :disabled="opsRefreshing"
                @click="refreshAllOps"
              >
                {{ opsRefreshing ? 'Refreshing...' : 'Refresh All' }}
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div
v-for="provider in opsProviders"
:key="provider.id"
class="bg-white rounded-xl border border-slate-200 overflow-hidden"
>
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-semibold text-slate-900">{{ provider.label }}</div>
                    <span
                      v-if="opsState[provider.id]?.affiliate === true"
                      class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    >
                      Affiliate
                    </span>
                    <span
                      v-else-if="opsState[provider.id]?.affiliate === false"
                      class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                    >
                      No affiliate
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                    >
                      Unknown
                    </span>
                  </div>
                  <div class="text-xs text-slate-500">Last update: {{ formatOpsTimestamp(opsState[provider.id]?.timestamp) }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-xs text-slate-500">
                    Stale {{ opsState[provider.id]?.summary?.stale_count ?? 0 }} / {{ opsState[provider.id]?.summary?.corridor_count ?? 0 }}
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                    :disabled="opsLoading[provider.id]"
                    @click="loadOpsHealth(provider.id)"
                  >
                    {{ opsLoading[provider.id] ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
              </div>

              <div
v-if="opsLoading[provider.id]"
class="px-6 py-6 text-sm text-slate-500"
>
                Loading health data...
              </div>
              <div
v-else-if="opsErrors[provider.id]"
class="px-6 py-6 text-sm text-amber-800 bg-amber-50"
>
                {{ opsErrors[provider.id] }}
              </div>
              <div
v-else-if="!opsState[provider.id]"
class="px-6 py-6 text-sm text-slate-500"
>
                No health data loaded yet.
              </div>
              <div v-else>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-slate-100 text-sm">
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Corridors</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.corridor_count ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Stale</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.stale_count ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Fresh window (min)</div>
                    <div class="font-semibold text-slate-900">{{ opsState[provider.id]?.summary?.fresh_window_minutes ?? 0 }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Snapshot</div>
                    <div class="font-semibold text-slate-900">{{ formatOpsTimestamp(opsState[provider.id]?.timestamp) }}</div>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                      <tr>
                        <th class="px-4 py-3 text-left font-semibold">Corridor</th>
                        <th class="px-4 py-3 text-left font-semibold">Attempt</th>
                        <th class="px-4 py-3 text-left font-semibold">Quote age (min)</th>
                        <th class="px-4 py-3 text-left font-semibold">Payin</th>
                        <th class="px-4 py-3 text-left font-semibold">Payout</th>
                        <th class="px-4 py-3 text-left font-semibold">Send</th>
                        <th class="px-4 py-3 text-left font-semibold">Fee</th>
                        <th class="px-4 py-3 text-left font-semibold">Promo fee</th>
                        <th class="px-4 py-3 text-left font-semibold">Rate</th>
                        <th class="px-4 py-3 text-left font-semibold">Delivery (min)</th>
                        <th class="px-4 py-3 text-left font-semibold">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
v-for="corridor in opsState[provider.id]?.corridors"
:key="corridor.corridor_id"
class="border-t border-slate-100"
>
                        <td class="px-4 py-3 font-medium text-slate-900">{{ corridor.corridor_id }}</td>
                        <td class="px-4 py-3">
                          <div
class="font-medium"
:class="attemptStatusClass(corridor.last_attempt_success)"
>
                            {{ formatAttemptStatus(corridor.last_attempt_success) }}
                          </div>
                          <div class="text-xs text-slate-400">
                            age {{ corridor.last_attempt_age_minutes ?? 'n/a' }} | http {{ corridor.last_attempt_http_status ?? 'n/a' }}
                          </div>
                        </td>
                        <td class="px-4 py-3">{{ corridor.last_quote_age_minutes ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ corridor.payin ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ corridor.payout ?? 'n/a' }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.send_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.fee_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.promotional_fee_amount) }}</td>
                        <td class="px-4 py-3">{{ formatOpsNumber(corridor.implied_fx_rate, 6) }}</td>
                        <td class="px-4 py-3">
                          {{ corridor.delivery_time_min_minutes ?? 'n/a' }} - {{ corridor.delivery_time_max_minutes ?? 'n/a' }}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500">
                          {{ formatOpsFlags(corridor.quality_flags) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-10 space-y-6">
            <div class="grid gap-6 lg:grid-cols-3">
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Admin Tools</h3>
                    <p class="text-xs text-slate-500">Quick links to backend admin consoles.</p>
                  </div>
                </div>
                <div class="mt-4 space-y-3">
	                  <NuxtLink
	                    v-for="link in opsAdminLinks"
	                    :key="link.label"
	                    :to="link.to"
	                    class="group flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 transition-colors"
	                  >
	                    <div>
	                      <div class="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{{ link.label }}</div>
	                      <div class="text-xs text-slate-500">{{ link.description }}</div>
	                    </div>
	                    <Icon
	                      name="chevron-right"
	                      :size="16"
	                      class="text-slate-400 group-hover:text-blue-600"
	                    />
	                  </NuxtLink>
	                </div>
                <div class="mt-4 text-xs text-slate-400">
                  Admin endpoints: /analytics/*, /audit/*, /telemetry/analytics, /ops/*
                </div>
                <div class="mt-5 border-t border-slate-100 pt-4">
                  <h4 class="text-sm font-semibold text-slate-900">Role management</h4>
                  <p class="text-xs text-slate-500">Grant admin access by email.</p>
                  <div class="mt-3 grid gap-2">
                    <input
                      v-model="adminRoleEmail"
                      type="email"
                      placeholder="user@example.com"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                    <select
                      v-model="adminRoleSelection"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:bg-slate-400"
                      :disabled="adminRoleLoading || !adminRoleEmail"
                      @click="handleAdminRoleUpdate"
                    >
                      {{ adminRoleLoading ? 'Updating...' : 'Set role' }}
                    </button>
                    <p
v-if="adminRoleSuccess"
class="text-xs text-emerald-700"
>
                      {{ adminRoleSuccess }}
                    </p>
                    <p
v-else-if="adminRoleError"
class="text-xs text-amber-700"
>
                      {{ adminRoleError }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Telemetry Analytics</h3>
                    <p class="text-xs text-slate-500">Aggregated telemetry metrics from silver.telemetry_analytics_aggregate.</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="telemetryLoading"
                    @click="loadTelemetryAnalytics"
                  >
                    {{ telemetryLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <div class="mt-4 flex flex-wrap items-end gap-3">
                  <label class="text-xs text-slate-500">
                    Metric
                    <select
v-model="telemetryMetric"
class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
>
                      <option
v-for="metric in telemetryMetricOptions"
:key="metric.id"
:value="metric.id"
>{{ metric.label }}</option>
                    </select>
                  </label>
                  <label class="text-xs text-slate-500">
                    Window (hours)
                    <select
v-model.number="telemetryHours"
class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
>
                      <option
v-for="option in telemetryHourOptions"
:key="option"
:value="option"
>{{ option }}</option>
                    </select>
                  </label>
                </div>
                <p
v-if="telemetryError"
class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
>
                  {{ telemetryError }}
                </p>
                <div
v-else
class="mt-4"
>
                  <div
v-if="telemetryLoading"
class="text-sm text-slate-500"
>
Loading telemetry analytics…
</div>
                  <div
v-else-if="!telemetryLatest"
class="text-sm text-slate-500"
>
No telemetry aggregates yet.
</div>
                  <div
v-else
class="space-y-3"
>
                    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Bucket: {{ formatOpsTimestamp(telemetryLatest.time_bucket) }}</span>
                      <span v-if="telemetryWindowHours">Window: {{ telemetryWindowHours }}h</span>
                      <span>Computed: {{ formatOpsTimestamp(telemetryLatest.computed_at) }}</span>
                    </div>
                    <div
v-if="telemetryMetric === 'engagement'"
class="grid gap-3 sm:grid-cols-2 text-sm text-slate-700"
>
                      <div class="rounded-lg border border-slate-100 p-3">
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Avg engagement</div>
                        <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(telemetryEngagement?.avg_engagement, 2) }}</div>
                      </div>
                      <div class="rounded-lg border border-slate-100 p-3">
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Sessions</div>
                        <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(telemetryEngagement?.session_count, 0) }}</div>
                      </div>
                    </div>
                    <div
v-else
class="overflow-auto"
>
                      <table class="min-w-full text-sm">
                        <thead class="text-xs uppercase text-slate-400">
                          <tr>
                            <th
v-if="telemetryMetric === 'heatmap'"
class="py-2 text-left"
>
From
</th>
                            <th
v-if="telemetryMetric === 'heatmap'"
class="py-2 text-left"
>
To
</th>
                            <th
v-if="telemetryMetric === 'popular_corridors'"
class="py-2 text-left"
>
Corridor
</th>
                            <th
v-if="telemetryMetric === 'provider_favorites'"
class="py-2 text-left"
>
Provider
</th>
                            <th
v-if="telemetryMetric === 'provider_favorites'"
class="py-2 text-left"
>
Corridor
</th>
                            <th class="py-2 text-right">{{ telemetryMetric === 'provider_favorites' ? 'Clicks' : 'Searches' }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
v-for="row in telemetryListRows"
:key="row.key"
class="border-t border-slate-100"
>
                            <td
v-if="telemetryMetric === 'heatmap'"
class="py-2 text-slate-700"
>
{{ row.from || '—' }}
</td>
                            <td
v-if="telemetryMetric === 'heatmap'"
class="py-2 text-slate-700"
>
{{ row.to || '—' }}
</td>
                            <td
v-if="telemetryMetric === 'popular_corridors'"
class="py-2 text-slate-700"
>
{{ row.corridor || '—' }}
</td>
                            <td
v-if="telemetryMetric === 'provider_favorites'"
class="py-2 text-slate-700"
>
{{ row.provider || '—' }}
</td>
                            <td
v-if="telemetryMetric === 'provider_favorites'"
class="py-2 text-slate-700"
>
{{ row.corridor || '—' }}
</td>
                            <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.count, 0) }}</td>
                          </tr>
                          <tr v-if="telemetryListRows.length === 0">
                            <td
class="py-3 text-center text-xs text-slate-400"
:colspan="telemetryMetric === 'heatmap' ? 3 : telemetryMetric === 'provider_favorites' ? 3 : 2"
>
                              No telemetry rows yet.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Analytics Snapshot</h3>
                    <p class="text-xs text-slate-500">Top corridors and providers (last 7 days).</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="opsAnalyticsLoading"
                    @click="loadOpsAnalytics"
                  >
                    {{ opsAnalyticsLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <p
v-if="opsAnalyticsError"
class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
>
                  {{ opsAnalyticsError }}
                </p>
                <div
v-else
class="mt-4 grid gap-6 md:grid-cols-2 text-sm"
>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Popular corridors</div>
                    <ul class="mt-3 space-y-2">
                      <li
v-for="row in opsPopularCorridors"
:key="row.corridor_id"
class="flex items-center justify-between gap-4"
>
                        <span class="text-slate-700">{{ row.from_country }} → {{ row.to_country }}</span>
                        <span class="text-xs text-slate-500">
                          {{ row.search_count }} searches
                          <span v-if="row.trend_percentage !== undefined"> • {{ formatTrendPercentage(row.trend_percentage) }}</span>
                        </span>
                      </li>
                      <li
v-if="!opsAnalyticsLoading && opsPopularCorridors.length === 0"
class="text-xs text-slate-400"
>
No corridor data yet.
</li>
                    </ul>
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">Top providers</div>
                    <ul class="mt-3 space-y-2">
                      <li
v-for="row in opsFavoriteProviders"
:key="row.provider_id"
class="flex items-center justify-between gap-4"
>
                        <span class="text-slate-700">{{ row.provider_name || row.provider_id }}</span>
                        <span class="text-xs text-slate-500">{{ row.click_through_rate }}% CTR</span>
                      </li>
                      <li
v-if="!opsAnalyticsLoading && opsFavoriteProviders.length === 0"
class="text-xs text-slate-400"
>
No provider data yet.
</li>
                    </ul>
                  </div>
                </div>
                <div class="mt-4 text-xs text-slate-500">
                  <NuxtLink
to="/admin/analytics"
class="font-semibold text-blue-600 hover:text-blue-700"
>Open analytics console →</NuxtLink>
                </div>
              </div>

              <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">Audit Log Snapshot</h3>
                    <p class="text-xs text-slate-500">Recent admin/security events (last 7 days).</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    :disabled="opsAuditLoading"
                    @click="loadOpsAudit"
                  >
                    {{ opsAuditLoading ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
                <p
v-if="opsAuditError"
class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
>
                  {{ opsAuditError }}
                </p>
                <div
v-else
class="mt-4 overflow-auto"
>
                  <table class="min-w-full text-sm">
                    <thead class="text-xs uppercase text-slate-400">
                      <tr>
                        <th class="py-2 text-left">Time</th>
                        <th class="py-2 text-left">Action</th>
                        <th class="py-2 text-left">Actor</th>
                        <th class="py-2 text-left">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
v-for="log in opsAuditLogs"
:key="log.event_id"
class="border-t border-slate-100"
>
                        <td class="py-2 text-slate-600">{{ formatOpsTimestamp(log.created_at) }}</td>
                        <td class="py-2 text-slate-700">{{ log.action }}</td>
                        <td class="py-2 text-slate-600">{{ log.actor_id }}</td>
                        <td class="py-2 text-slate-600">{{ log.severity || 'info' }}</td>
                      </tr>
                      <tr v-if="!opsAuditLoading && opsAuditLogs.length === 0">
                        <td
colspan="4"
class="py-3 text-center text-xs text-slate-400"
>
No audit events found.
</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="mt-4 text-xs text-slate-500">
                  <NuxtLink
to="/admin/audit"
class="font-semibold text-blue-600 hover:text-blue-700"
>Open audit console →</NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Affiliate + Conversion Snapshot</h3>
                <p class="text-xs text-slate-500">Admin-only telemetry. Conversion values are reported volume, not commissions.</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                :disabled="opsAnalyticsLoading"
                @click="loadOpsAnalytics"
              >
                {{ opsAnalyticsLoading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
            <p
v-if="opsAnalyticsError"
class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
>
              {{ opsAnalyticsError }}
            </p>
            <div
v-else
class="mt-4 space-y-6"
>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-700">
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Total clicks</div>
                  <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(opsRevenueSummary.totalClicks, 0) }}</div>
                </div>
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Affiliate clicks</div>
                  <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(opsRevenueSummary.affiliateClicks, 0) }}</div>
                </div>
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Affiliate rate</div>
                  <div class="text-lg font-semibold text-slate-900">{{ formatOpsPercent(opsRevenueSummary.affiliateRate, 2) }}</div>
                </div>
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Conversions</div>
                  <div class="text-lg font-semibold text-slate-900">{{ formatOpsNumber(opsConversionSummary.conversions, 0) }}</div>
                </div>
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Conversion rate</div>
                  <div class="text-lg font-semibold text-slate-900">{{ formatOpsPercent(opsConversionSummary.conversionRate, 2) }}</div>
                </div>
                <div class="rounded-lg border border-slate-100 p-3">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Reported volume</div>
                  <div class="text-sm font-semibold text-slate-900">{{ formatCurrencyTotals(opsConversionSummary.conversionValues) }}</div>
                </div>
              </div>

              <div class="grid gap-6 lg:grid-cols-2">
                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Top affiliate links</div>
                  <div class="mt-3 overflow-auto">
                    <table class="min-w-full text-sm">
                      <thead class="text-xs uppercase text-slate-400">
                        <tr>
                          <th class="py-2 text-left">Provider</th>
                          <th class="py-2 text-left">Corridor</th>
                          <th class="py-2 text-right">Affiliate clicks</th>
                          <th class="py-2 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
v-for="row in opsRevenueRows.slice(0, 8)"
:key="`${row.provider_id}-${row.corridor_id || 'none'}`"
class="border-t border-slate-100"
>
                          <td class="py-2 text-slate-700">{{ row.provider_name || row.provider_id }}</td>
                          <td class="py-2 text-slate-600">{{ row.corridor_id || '—' }}</td>
                          <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.affiliate_clicks, 0) }}</td>
                          <td class="py-2 text-right text-slate-600">{{ formatOpsPercent(row.affiliate_rate, 2) }}</td>
                        </tr>
                        <tr v-if="opsRevenueRows.length === 0">
                          <td
colspan="4"
class="py-3 text-center text-xs text-slate-400"
>
No affiliate click data yet.
</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="text-xs text-slate-400 uppercase tracking-wide">Conversions by provider</div>
                  <div class="mt-3 overflow-auto">
                    <table class="min-w-full text-sm">
                      <thead class="text-xs uppercase text-slate-400">
                        <tr>
                          <th class="py-2 text-left">Provider</th>
                          <th class="py-2 text-right">Conversions</th>
                          <th class="py-2 text-right">Rate</th>
                          <th class="py-2 text-right">Reported volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
v-for="row in opsProviderImpact.slice(0, 8)"
:key="row.provider_id"
class="border-t border-slate-100"
>
                          <td class="py-2 text-slate-700">{{ row.provider_name || row.provider_id }}</td>
                          <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.conversions, 0) }}</td>
                          <td class="py-2 text-right text-slate-600">{{ formatOpsPercent(row.conversion_rate, 2) }}</td>
                          <td class="py-2 text-right text-slate-600">{{ formatCurrencyTotals(row.conversion_values) }}</td>
                        </tr>
                        <tr v-if="opsProviderImpact.length === 0">
                          <td
colspan="4"
class="py-3 text-center text-xs text-slate-400"
>
No conversion data yet.
</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-slate-100 p-4">
                <div class="text-xs text-slate-400 uppercase tracking-wide">Top provider corridors</div>
                <div class="mt-3 overflow-auto">
                  <table class="min-w-full text-sm">
                    <thead class="text-xs uppercase text-slate-400">
                      <tr>
                        <th class="py-2 text-left">Provider</th>
                        <th class="py-2 text-left">Corridor</th>
                        <th class="py-2 text-right">Clicks</th>
                        <th class="py-2 text-right">Conversions</th>
                        <th class="py-2 text-right">Rate</th>
                        <th class="py-2 text-right">Reported volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
v-for="row in opsProviderCorridors.slice(0, 8)"
:key="`${row.provider_id}-${row.corridor_id || 'none'}`"
class="border-t border-slate-100"
>
                        <td class="py-2 text-slate-700">{{ row.provider_name || row.provider_id }}</td>
                        <td class="py-2 text-slate-600">{{ row.corridor_id || '—' }}</td>
                        <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.total_clicks, 0) }}</td>
                        <td class="py-2 text-right text-slate-600">{{ formatOpsNumber(row.conversions, 0) }}</td>
                        <td class="py-2 text-right text-slate-600">{{ formatOpsPercent(row.conversion_rate, 2) }}</td>
                        <td class="py-2 text-right text-slate-600">{{ formatCurrencyTotals(row.conversion_values) }}</td>
                      </tr>
                      <tr v-if="opsProviderCorridors.length === 0">
                        <td
colspan="6"
class="py-3 text-center text-xs text-slate-400"
>
No corridor conversion data yet.
</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Tab -->
        <div v-else-if="activeTab === 'account'">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Account Sub-Navigation -->
            <aside class="lg:w-56 flex-shrink-0">
              <nav class="bg-white rounded-xl border border-slate-200 p-2 lg:sticky lg:top-36">
                <button
                  v-for="section in accountSections"
                  :key="section.id"
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                  :class="activeAccountSection === section.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                  @click="activeAccountSection = section.id"
                  >
                    <Icon
                      :name="section.icon"
                      :size="16"
                      class="text-current"
                    />
                    {{ section.label }}
                  </button>
              </nav>
            </aside>

            <!-- Account Content -->
            <div class="flex-1 max-w-2xl">
              <!-- Profile Section -->
              <div
v-if="activeAccountSection === 'profile'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Profile</h2>
                  <p class="text-sm text-slate-500">Manage your personal information</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="mb-6">
                    <h3 class="font-medium text-slate-900">{{ user?.name || 'User' }}</h3>
                    <p class="text-sm text-slate-500">{{ user?.email }}</p>
                    <span
                      class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="isPlus ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ isPlus ? 'Plus Member' : 'Free Plan' }}
                    </span>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                      <input
                        v-model="profileName"
                        type="text"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Your name"
                      >
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        :value="user?.email"
                        disabled
                        class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                      >
                      <p class="text-xs text-slate-400 mt-1">Contact support to change your email</p>
                    </div>
                  </div>

                  <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
	                    <div
	v-if="profileSaved"
	class="flex items-center gap-2 text-sm text-emerald-600"
	>
	                      <Icon
	                        name="check-circle"
	                        :size="16"
	                        variant="solid"
	                        class="text-current"
	                      />
	                      Changes saved!
	                    </div>
                    <div v-else />
                    <button
                      type="button"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      @click="saveProfile"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              <!-- Billing Section -->
              <div
v-else-if="activeAccountSection === 'billing'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Billing</h2>
                  <p class="text-sm text-slate-500">Manage your subscription and payment methods</p>
                </div>
                <div
                  v-if="checkoutNotice === 'success'"
                  class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  Subscription updated successfully. Your entitlements have been refreshed.
                </div>
                <div
                  v-else-if="checkoutNotice === 'cancel'"
                  class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                >
                  Checkout canceled. No changes were made to your subscription.
                </div>
                <div
                  v-if="billingActionMessage"
                  class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {{ billingActionMessage }}
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <h3 class="font-medium text-slate-900">Current Plan</h3>
                      <p class="text-sm text-slate-500">{{ isPlus ? 'Billed monthly' : 'Free forever' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <div
                        class="px-3 py-1.5 rounded-full text-sm font-semibold"
                        :class="isPlus ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ isPlus ? 'Plus' : 'Free' }}
                      </div>
                      <div
                        v-if="isPlus"
                        class="px-3 py-1.5 rounded-full text-xs font-semibold"
                        :class="billingStatusBadge.classes"
                      >
                        {{ billingStatusBadge.label }}
                      </div>
                    </div>
                  </div>

                  <div class="bg-slate-50 rounded-lg p-4 mb-6">
                    <div class="flex items-baseline justify-between mb-2">
                      <span class="text-sm text-slate-600">{{ isPlus ? 'Next billing date' : 'Plan type' }}</span>
                      <span class="text-sm font-medium text-slate-900">{{ isPlus ? formatBillingDate(billingSummary?.next_billing_date) : 'No billing' }}</span>
                    </div>
                    <div
v-if="isPlus"
class="flex items-baseline justify-between"
>
                      <span class="text-sm text-slate-600">Amount</span>
                      <span class="text-sm font-medium text-slate-900">
                        {{ formatBillingAmount(billingSummary?.amount, billingSummary?.currency) }}
                      </span>
                    </div>
                  </div>

                  <div
v-if="!isPlus"
class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100"
>
	                    <div class="flex items-start gap-3">
	                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
	                        <Icon
	                          name="sparkles"
	                          :size="16"
	                          variant="solid"
	                          class="text-blue-600"
	                        />
	                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-semibold text-slate-900">Upgrade to Plus</h4>
                        <p class="text-xs text-slate-600 mt-0.5">Pulse access, 16 alerts, 365-day history, exports, and ad-free</p>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                        :disabled="billingCheckoutLoading"
                        @click="startCheckout"
                      >
                        {{ billingCheckoutLoading ? 'Starting…' : 'Upgrade' }}
                      </button>
                    </div>
                  </div>

                  <div
v-if="isPlus"
class="flex gap-3"
>
                    <button
                      type="button"
                      class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                      :disabled="billingPortalLoading"
                      @click="openBillingPortal"
                    >
                      {{ billingPortalLoading ? 'Opening…' : 'Manage Subscription' }}
                    </button>
                  </div>
                </div>

                <div
v-if="isPlus"
class="bg-white rounded-xl border border-slate-200 p-6"
>
                  <h3 class="font-medium text-slate-900 mb-4">Payment Method</h3>
                  <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                        <span class="text-white text-[10px] font-bold uppercase">
                          {{ billingSummary?.payment_method?.brand || 'Card' }}
                        </span>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-slate-900">
                          <span v-if="billingSummary?.payment_method?.last4">•••• •••• •••• {{ billingSummary?.payment_method?.last4 }}</span>
                          <span v-else>No payment method on file</span>
                        </div>
                        <div
v-if="billingSummary?.payment_method?.exp_month && billingSummary?.payment_method?.exp_year"
class="text-xs text-slate-500"
>
                          Expires {{ billingSummary?.payment_method?.exp_month }}/{{ billingSummary?.payment_method?.exp_year }}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="text-sm font-medium text-blue-600 hover:text-blue-700"
                      :disabled="billingPortalLoading"
                      @click="openBillingPortal"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div
v-if="isPlus"
class="bg-white rounded-xl border border-slate-200 p-6"
>
                  <h3 class="font-medium text-slate-900 mb-4">Billing History</h3>
                  <div
v-if="billingHistoryLoading"
class="text-sm text-slate-500"
>
                    Loading billing history…
                  </div>
                  <div
v-else-if="billingHistoryError"
class="text-sm text-red-600"
>
                    {{ billingHistoryError }}
                  </div>
                  <div
v-else-if="billingHistory.length === 0"
class="text-sm text-slate-500"
>
                    No invoices yet.
                  </div>
                  <div
v-else
class="space-y-3"
>
                    <div
                      v-for="(invoice, index) in billingHistory"
                      :key="invoice.id"
                      class="flex items-center justify-between py-2"
                      :class="index > 0 ? 'border-t border-slate-100' : ''"
                    >
                      <div>
                        <div class="text-sm font-medium text-slate-900">
	                          {{ invoice.date ? formatMonthYear(invoice.date) : 'Invoice' }}
                        </div>
                        <div class="text-xs text-slate-500">{{ invoice.status || 'paid' }}</div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-slate-900">
                          {{ formatBillingAmount(invoice.amount, invoice.currency) }}
                        </span>
                        <a
                          v-if="invoice.invoice_url"
                          :href="invoice.invoice_url"
                          target="_blank"
                          rel="noreferrer"
                          class="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notifications Section -->
              <div
v-else-if="activeAccountSection === 'notifications'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Notifications</h2>
                  <p class="text-sm text-slate-500">Choose how you want to be notified</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Email Notifications</h3>
                  <div class="space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Rate Alerts</div>
                        <div class="text-xs text-slate-500">Get notified when rates hit your target</div>
                      </div>
                      <input
                        v-model="notificationSettings.rateAlerts"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Weekly Summary</div>
                        <div class="text-xs text-slate-500">Weekly digest of rate movements</div>
                      </div>
                      <input
                        v-model="notificationSettings.weeklySummary"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Market Updates</div>
                        <div class="text-xs text-slate-500">Important market news and changes</div>
                      </div>
                      <input
                        v-model="notificationSettings.marketUpdates"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Product Updates</div>
                        <div class="text-xs text-slate-500">New features and improvements</div>
                      </div>
                      <input
                        v-model="notificationSettings.productUpdates"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Promotional Emails</div>
                        <div class="text-xs text-slate-500">Special offers and discounts from providers</div>
                      </div>
                      <input
                        v-model="notificationSettings.promotional"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Push Notifications</h3>
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <div class="text-sm font-medium text-slate-900">Browser Notifications</div>
                      <div class="text-xs text-slate-500">
                        Receive alert notifications in your browser
                      </div>
                      <div class="mt-1 text-xs text-slate-500">
                        Status: {{ notificationSettings.pushEnabled ? 'Enabled' : 'Disabled' }}
                      </div>
                    </div>
                    <button
                      type="button"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="pushLoading || !pushSupported"
                      @click="handlePushToggle"
                    >
                      {{ pushLoading ? 'Working…' : notificationSettings.pushEnabled ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                  <p
v-if="!pushSupported"
class="mt-3 text-xs text-slate-500"
>
                    Push notifications are not supported in this browser.
                  </p>
                  <p
v-else-if="pushPermission === 'denied'"
class="mt-3 text-xs text-amber-700"
>
                    Browser notifications are blocked. Enable them in your browser settings.
                  </p>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-300"
                    :disabled="notificationLoading"
                    @click="handleSaveNotificationSettings"
                  >
                    {{ notificationLoading ? 'Saving…' : 'Save Preferences' }}
                  </button>
                </div>
                <p
v-if="notificationSaveSuccess"
class="text-xs text-emerald-700"
>
                  Notification settings saved.
                </p>
                <p
v-else-if="notificationSaveError"
class="text-xs text-red-600"
>
                  {{ notificationSaveError }}
                </p>
                <p
v-else-if="notificationLoadError"
class="text-xs text-red-600"
>
                  {{ notificationLoadError }}
                </p>
                <p
v-else-if="privacyLoadError"
class="text-xs text-red-600"
>
                  {{ privacyLoadError }}
                </p>
              </div>

              <!-- Security Section -->
              <div
v-else-if="activeAccountSection === 'security'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Security</h2>
                  <p class="text-sm text-slate-500">Manage your account security settings</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Password</h3>
                  <p class="text-sm text-slate-500 mb-4">Last changed 30 days ago</p>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                      <input
                        v-model="securitySettings.currentPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      >
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                      <input
                        v-model="securitySettings.newPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      >
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                      <input
                        v-model="securitySettings.confirmPassword"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                      >
                    </div>
                  </div>
                  <div
v-if="passwordUpdateError"
class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
>
                    {{ passwordUpdateError }}
                  </div>
                  <div
v-else-if="passwordUpdateSuccess"
class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
>
                    Password updated successfully.
                  </div>
                  <div class="mt-4">
                    <button
                      type="button"
                      :disabled="passwordUpdateLoading"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      @click="handlePasswordUpdate"
                    >
                      {{ passwordUpdateLoading ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h3 class="font-medium text-slate-900">Two-Factor Authentication</h3>
                      <p class="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Not enabled
                    </span>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Enable 2FA
                  </button>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Active Sessions</h3>
                  <div
v-if="sessionsLoading"
class="text-sm text-slate-500"
>
Loading sessions...
</div>
                  <div
v-else-if="sessionsError"
class="text-sm text-rose-600"
>
{{ sessionsError }}
</div>
                  <div
v-else-if="sessions.length === 0"
class="text-sm text-slate-500"
>
                    No active sessions found.
                  </div>
                  <div
v-else
class="space-y-3"
>
                    <div
                      v-for="session in sessions"
                      :key="session.id"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
	                        <div
	                          class="w-8 h-8 rounded-full flex items-center justify-center"
	                          :class="session.is_current ? 'bg-emerald-100' : 'bg-slate-100'"
	                        >
	                          <Icon
	                            name="computer-desktop"
	                            :size="16"
	                            :class="session.is_current ? 'text-emerald-600' : 'text-slate-600'"
	                          />
	                        </div>
                        <div>
                          <div class="text-sm font-medium text-slate-900">
                            {{ session.is_current ? 'Current Session' : 'Session' }}
                          </div>
                          <div class="text-xs text-slate-500">
                            {{ sessionMeta(session) }} • {{ session.ip_address || 'IP hidden' }}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span
                          class="text-xs font-medium"
                          :class="session.is_current ? 'text-emerald-600' : 'text-slate-500'"
                        >
                          {{ formatSessionActivity(session.last_activity) }}
                        </span>
                        <button
                          v-if="!session.is_current"
                          type="button"
                          class="text-xs font-medium text-slate-500 hover:text-rose-600"
                          @click="handleRevokeSession(session.session_id)"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                    @click="handleRevokeAllSessions"
                  >
                    Sign out all other sessions
                  </button>
                </div>
              </div>

              <!-- Privacy Section -->
              <div
v-else-if="activeAccountSection === 'privacy'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Privacy</h2>
                  <p class="text-sm text-slate-500">Control your data and privacy settings</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Data Collection</h3>
                  <div class="space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Usage Analytics</div>
                        <div class="text-xs text-slate-500">Help us improve by sharing anonymous usage data</div>
                      </div>
                      <input
                        v-model="privacySettings.analytics"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                    <label class="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Personalized Recommendations</div>
                        <div class="text-xs text-slate-500">Get corridor suggestions based on your activity</div>
                      </div>
                      <input
                        v-model="privacySettings.personalization"
                        type="checkbox"
                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      >
                    </label>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Your Data</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Download Your Data</div>
                        <div class="text-xs text-slate-500">Get a copy of all your data</div>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                        @click="requestGdprExport"
                      >
                        Request Download
                      </button>
                    </div>
                    <p
v-if="gdprExportStatus"
class="text-xs text-emerald-700"
>
                      {{ gdprExportStatus }}
                    </p>
                    <p
v-else-if="gdprExportError"
class="text-xs text-red-600"
>
                      {{ gdprExportError }}
                    </p>
                    <div class="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <div class="text-sm font-medium text-slate-900">Delete Account</div>
                        <div class="text-xs text-slate-500">Permanently delete your account and data</div>
                      </div>
                      <button
                        type="button"
                        class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                        @click="openDeleteAccountModal"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              <!-- Compliance Section -->
              <div
v-else-if="activeAccountSection === 'compliance'"
class="space-y-6"
>
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Compliance</h2>
                  <p class="text-sm text-slate-500">Regulatory information and data rights</p>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Data Protection Rights (GDPR)</h3>
                  <p class="text-sm text-slate-600 mb-4">
                    Under GDPR, you have several rights regarding your personal data. We are committed to respecting and fulfilling these rights.
                  </p>
	                  <div class="space-y-3">
	                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
	                      <Icon
	                        name="check-circle"
	                        :size="20"
	                        class="text-blue-600 flex-shrink-0 mt-0.5"
	                      />
	                      <div>
	                        <div class="text-sm font-medium text-slate-900">Right to Access</div>
	                        <div class="text-xs text-slate-500">Request a copy of your personal data</div>
	                      </div>
	                    </div>
	                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
	                      <Icon
	                        name="check-circle"
	                        :size="20"
	                        class="text-blue-600 flex-shrink-0 mt-0.5"
	                      />
	                      <div>
	                        <div class="text-sm font-medium text-slate-900">Right to Rectification</div>
	                        <div class="text-xs text-slate-500">Request correction of inaccurate data</div>
	                      </div>
	                    </div>
	                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
	                      <Icon
	                        name="check-circle"
	                        :size="20"
	                        class="text-blue-600 flex-shrink-0 mt-0.5"
	                      />
	                      <div>
	                        <div class="text-sm font-medium text-slate-900">Right to Erasure</div>
	                        <div class="text-xs text-slate-500">Request deletion of your personal data</div>
	                      </div>
	                    </div>
	                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
	                      <Icon
	                        name="check-circle"
	                        :size="20"
	                        class="text-blue-600 flex-shrink-0 mt-0.5"
	                      />
	                      <div>
	                        <div class="text-sm font-medium text-slate-900">Right to Data Portability</div>
	                        <div class="text-xs text-slate-500">Receive your data in a machine-readable format</div>
	                      </div>
	                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-4">Legal Documents</h3>
                  <div class="space-y-3">
	                    <NuxtLink
	                      to="/privacy"
	                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
	                    >
	                      <div class="flex items-center gap-3">
	                        <Icon
	                          name="document-text"
	                          :size="20"
	                          class="text-slate-400"
	                        />
	                        <span class="text-sm font-medium text-slate-900">Privacy Policy</span>
	                      </div>
	                      <Icon
	                        name="chevron-right"
	                        :size="16"
	                        class="text-slate-400"
	                      />
	                    </NuxtLink>
                    <NuxtLink
                      to="/terms"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <Icon
                          name="document-text"
                          :size="20"
                          class="text-slate-400"
                        />
                        <span class="text-sm font-medium text-slate-900">Terms of Service</span>
                      </div>
                      <Icon
                        name="chevron-right"
                        :size="16"
                        class="text-slate-400"
                      />
                    </NuxtLink>
                    <NuxtLink
                      to="/cookies"
                      class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <Icon
                          name="document-text"
                          :size="20"
                          class="text-slate-400"
                        />
                        <span class="text-sm font-medium text-slate-900">Cookie Policy</span>
                      </div>
                      <Icon
                        name="chevron-right"
                        :size="16"
                        class="text-slate-400"
                      />
                    </NuxtLink>
                  </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 class="font-medium text-slate-900 mb-2">Submit a Data Request</h3>
                  <p class="text-sm text-slate-500 mb-4">
                    For any data-related requests or questions about your privacy rights, please contact our Data Protection Officer.
                  </p>
                  <NuxtLink
                    to="/contact?subject=data-request"
                    class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Contact DPO
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredPage>
    </div>
</template>

<script setup lang="ts">
import type { LocationQueryRaw } from 'vue-router'

import AdPlacement from '~/components/ads/AdPlacement.vue'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { CenteredPage, DataTable, type DataTableColumn, Icon, type IconName } from '~/ui'
import {
  formatDate,
  formatDateTime,
  formatMonthDay,
  formatMonthYear,
  formatMoney,
  formatNumber,
  formatPercent,
  formatUpdatedLabel,
} from '~/shared/lib/format'
import { getCorridorUrl } from '~/utils/country-slugs'
import { COUNTRIES } from '~/utils/countries-currencies'
import type { AlertRule, WatchTarget, WatchlistItem } from '~/types/tracking'

type DashboardTab = 'overview' | 'watchlist' | 'alerts' | 'history' | 'enterprise' | 'ops' | 'account'
type AccountSection = 'profile' | 'billing' | 'notifications' | 'security' | 'privacy' | 'compliance'

const tabs: { id: DashboardTab, label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'history', label: 'History' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'ops', label: 'Ops' },
  { id: 'account', label: 'Account' },
]

const accountSections: { id: AccountSection, label: string, icon: IconName }[] = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'billing', label: 'Billing', icon: 'credit-card' },
  { id: 'notifications', label: 'Notifications', icon: 'bell-alert' },
  { id: 'security', label: 'Security', icon: 'shield-check' },
  { id: 'privacy', label: 'Privacy', icon: 'eye' },
  { id: 'compliance', label: 'Compliance', icon: 'document-text' },
]

const route = useRoute()
const { user, isAuthenticated, updatePasswordWithCurrent } = useAuth()
const {
  sessions,
  loading: sessionsLoading,
  error: sessionsError,
  fetchSessions,
  revokeSession,
  revokeAllSessions,
} = useSessions()
const { updateProfile } = useMe()
const { isPlus, isEnterprise, apiAccess, apiTier, apiCadenceHours, limits, billing, refreshPlan } = useEntitlements()
const billingActions = useBilling()
const billingCheckoutLoading = computed(() => billingActions.checkoutLoading.value)
const billingPortalLoading = computed(() => billingActions.portalLoading.value)
const exportsApi = useExports()
const dataExportApi = useDataExport()
const accountApi = useAccount()
const accountDeleting = computed(() => accountApi.deleting.value)
const modal = useSaveAlertModal()
const { request } = useApi()
const { data: recentSearchesData, pending: recentSearchesPending } = useRecentSearches(10, { watch: [] })

const {
  items: watchlistItems,
  hydrated: watchlistHydrated,
  count: watchlistCount,
  remove: watchlistRemove,
  reset: watchlistReset,
  save: watchlistSave,
} = useWatchlist()

const corridorWatchlistItems = computed(() =>
  watchlistItems.value.filter(
    (item): item is WatchlistItem & { target: Extract<WatchTarget, { type: 'corridor' }> } =>
      item.target.type === 'corridor',
  ),
)

const {
  alerts: alertItems,
  hydrated: alertsHydrated,
  count: alertsCount,
  toggleEnabled: alertsToggleEnabled,
  remove: alertsRemove,
  reset: alertsReset,
  findById: alertsFindById,
  update: alertsUpdate,
} = useAlerts()

const {
  runs: compareRuns,
  hydrated: compareHydrated,
  count: compareCount,
  remove: compareRemove,
  reset: compareReset,
} = useCompareHistory()

const recentSearches = computed(() => recentSearchesData.value?.data ?? [])

type RateHistoryEntry = {
  date: string
  rate: number
  bid?: number | null
  ask?: number | null
  source?: string | null
}

type RateHistoryResponse = {
  base: string
  quote: string
  history: RateHistoryEntry[]
  lastUpdated: string | null
}

type ProviderRateEntry = {
  name: string
  rate: number
  markupBps?: number
  speed?: string
  lastUpdated?: string | null
}

type ProviderRatesResponse = {
  base: string
  quote: string
  midMarketRate: number | null
  data: ProviderRateEntry[]
}

type RateSnapshot = {
  rateLabel: string
  rateValue: number | null
  change: number | null
  changeValue: number
  hasChange: boolean
  lastUpdated: string | null
  history: RateHistoryEntry[]
}

type BestProviderSnapshot = ProviderRateEntry & {
  slug: string
}

type ApiKeyRecord = {
  key_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

type ApiKeyListResponse = {
  success: boolean
  keys: ApiKeyRecord[]
}

type ApiKeyCreateResponse = {
  success: boolean
  api_key: ApiKeyRecord
  token: string
}

const historyDaysByTimeframe: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
}

const watchlistHistoryDays = 7

const rateHistoryCache = ref<Record<string, RateHistoryResponse>>({})
const rateHistoryLoading = ref<Record<string, boolean>>({})
const rateHistoryErrors = ref<Record<string, string | null>>({})
const providerRatesCache = ref<Record<string, ProviderRatesResponse>>({})
const providerRatesLoading = ref<Record<string, boolean>>({})
const providerRatesErrors = ref<Record<string, string | null>>({})

const formatRateValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

const formatPercentValue = (value: number | null | undefined, includeSign = true) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return formatPercent(value, { digits: 2, sign: includeSign })
}

const countryOverrides: Record<string, { name: string, code: string, flag: string, currency: string }> = {
  EU: { name: 'Eurozone', code: 'EU', flag: '🇪🇺', currency: 'EUR' },
  UK: { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', currency: 'GBP' },
}

const countryMap = [...COUNTRIES, ...Object.values(countryOverrides)].reduce((acc, c) => {
  acc[c.code] = c
  return acc
}, {} as Record<string, typeof COUNTRIES[0]>)

const getFlag = (code: string) => countryMap[code.toUpperCase()]?.flag || '🏳️'
const getCountryName = (code: string) => countryMap[code.toUpperCase()]?.name || code
const getCurrencyForCountry = (code: string) => countryMap[code.toUpperCase()]?.currency || null
const getCurrencyCode = (code: string) => getCurrencyForCountry(code) || code.toUpperCase()

const buildHistoryKey = (base: string, quote: string, days: number) => `${base}-${quote}-${days}`
const buildProviderKey = (base: string, quote: string) => `${base}-${quote}`

const getPairForCorridor = (from: string, to: string) => {
  const base = getCurrencyForCountry(from.toUpperCase())
  const quote = getCurrencyForCountry(to.toUpperCase())
  if (!base || !quote) return null
  return { base, quote }
}

const getPairForTarget = (target: WatchTarget) => {
  if (target.type === 'corridor') {
    return getPairForCorridor(target.from, target.to)
  }
  if (target.type === 'fxPair') {
    return { base: target.base.toUpperCase(), quote: target.quote.toUpperCase() }
  }
  return null
}

const getRateHistory = (base: string, quote: string, days: number) => {
  return rateHistoryCache.value[buildHistoryKey(base, quote, days)]?.history ?? []
}

const getRateHistoryMeta = (base: string, quote: string, days: number) => {
  return rateHistoryCache.value[buildHistoryKey(base, quote, days)] ?? null
}

const loadRateHistory = async (base: string, quote: string, days: number) => {
  const key = buildHistoryKey(base, quote, days)
  if (rateHistoryLoading.value[key] || rateHistoryCache.value[key]) return
  rateHistoryLoading.value[key] = true
  rateHistoryErrors.value[key] = null
  try {
    const response = await request<RateHistoryResponse>('/rates/history', {
      query: { base, quote, days },
    })
    rateHistoryCache.value = { ...rateHistoryCache.value, [key]: response }
  }
 catch (error: any) {
    rateHistoryErrors.value[key] = error?.message || 'Unable to load rate history.'
    rateHistoryCache.value = {
      ...rateHistoryCache.value,
      [key]: { base, quote, history: [], lastUpdated: null },
    }
  }
 finally {
    rateHistoryLoading.value[key] = false
  }
}

const loadProviderRates = async (base: string, quote: string) => {
  const key = buildProviderKey(base, quote)
  if (providerRatesLoading.value[key] || providerRatesCache.value[key]) return
  providerRatesLoading.value[key] = true
  providerRatesErrors.value[key] = null
  try {
    const response = await request<ProviderRatesResponse>('/rates/providers', {
      query: { base, quote },
    })
    providerRatesCache.value = { ...providerRatesCache.value, [key]: response }
  }
 catch (error: any) {
    providerRatesErrors.value[key] = error?.message || 'Unable to load provider rates.'
    providerRatesCache.value = {
      ...providerRatesCache.value,
      [key]: { base, quote, midMarketRate: null, data: [] },
    }
  }
 finally {
    providerRatesLoading.value[key] = false
  }
}

const watchlistFindById = (id: string) => watchlistItems.value.find(i => i.id === id) ?? null

const watchlistLimitPercent = computed(() => {
  if (limits.value.watchlistItems === 'unlimited') return 0
  return (watchlistCount.value / (limits.value.watchlistItems as number)) * 100
})

const alertsLimitPercent = computed(() => {
  if (limits.value.alerts === 'unlimited') return 0
  return (alertsCount.value / (limits.value.alerts as number)) * 100
})

const watchlistLimitReached = computed(() => {
  if (limits.value.watchlistItems === 'unlimited') return false
  return watchlistCount.value >= (limits.value.watchlistItems as number)
})

const alertsLimitReached = computed(() => {
  if (limits.value.alerts === 'unlimited') return false
  return alertsCount.value >= (limits.value.alerts as number)
})

const runtimeConfig = useRuntimeConfig()

const apiKeys = ref<ApiKeyRecord[]>([])
const apiKeysLoading = ref(false)
const apiKeysError = ref<string | null>(null)
const apiKeysLoaded = ref(false)
const apiKeyName = ref('')
const apiKeyTier = ref<'2' | '3'>('2')
const apiKeyToken = ref<string | null>(null)
const apiKeyTokenLabel = ref<string | null>(null)
const apiKeyCopyStatus = ref<string | null>(null)

const apiKeyFromRow = (row: unknown): ApiKeyRecord => row as ApiKeyRecord

const apiKeyTableColumns: DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'key_prefix', label: 'Prefix', widthClass: 'w-32' },
  { key: 'scopes', label: 'Scopes' },
  { key: 'last_used_at', label: 'Last Used' },
  { key: 'revoked_at', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right', widthClass: 'w-40' },
]

const apiKeyTableRowKey = (row: unknown, rowIndex: number) => {
  return apiKeyFromRow(row).key_id || String(rowIndex)
}

const embedCorridorId = ref('US-PH-USD-PHP')
const embedAmountBucket = ref(500)
const embedMethodProfile = ref<'standard_bank' | 'standard_card' | 'cash_pickup'>('standard_bank')
const embedDays = ref(30)
const embedTheme = ref<'dark' | 'light'>('dark')
const embedApiKey = ref('')
const embedCopyStatus = ref<string | null>(null)

const embedIndices = [
  { key: 'teer', label: 'TEER' },
  { key: 'rci', label: 'RCI' },
  { key: 'rvi_bps', label: 'RVI (bps)' },
] as const

type EmbedIndexKey = typeof embedIndices[number]['key']

const tier2CadenceLabel = computed(() => apiCadenceHours.value ?? 6)
const tier3CadenceLabel = computed(() => 24)

const embedSiteOrigin = computed(() => {
  if (runtimeConfig.public?.siteUrl) return runtimeConfig.public.siteUrl
  if (import.meta.client) return window.location.origin
  return ''
})

const embedApiKeyValue = computed(() => embedApiKey.value.trim())

const buildEmbedUrl = (indexKey: EmbedIndexKey) => {
  const baseUrl = embedSiteOrigin.value
  if (!baseUrl) return ''
  const apiKey = embedApiKeyValue.value
  if (!apiKey) return ''
  const params = new URLSearchParams({
    corridor_id: embedCorridorId.value.toUpperCase(),
    amount_bucket: String(embedAmountBucket.value || 500),
    method_profile: embedMethodProfile.value,
    days: String(embedDays.value || 30),
    theme: embedTheme.value,
    api_key: apiKey,
  })
  return `${baseUrl}/embed/indices/${indexKey}?${params.toString()}`
}

const embedUrls = computed(() => ({
  teer: buildEmbedUrl('teer'),
  rci: buildEmbedUrl('rci'),
  rvi_bps: buildEmbedUrl('rvi_bps'),
}))

const embedCodes = computed(() => {
  const retrieved = formatDate(new Date())
  const buildCode = (indexKey: EmbedIndexKey, label: string) => {
    const url = buildEmbedUrl(indexKey)
    if (!url) return ''
    const citation = `Source: Remit-Scout (${label}) · Synthetic volume weighted · Retrieved ${retrieved}`
    return [
      '<figure class="remit-scout-embed">',
      `  <iframe src="${url}" width="100%" height="320" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
      `  <figcaption style="font-size:12px;color:#64748b;">${citation}</figcaption>`,
      '</figure>',
    ].join('\n')
  }
  return {
    teer: buildCode('teer', 'TEER'),
    rci: buildCode('rci', 'RCI'),
    rvi_bps: buildCode('rvi_bps', 'RVI (bps)'),
  }
})

const toApiKeyErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return fallback
}

const copyApiKeyToken = async () => {
  if (!apiKeyToken.value || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(apiKeyToken.value)
    apiKeyCopyStatus.value = 'Token copied.'
  }
 catch {
    apiKeyCopyStatus.value = 'Copy failed.'
  }
 finally {
    setTimeout(() => {
      apiKeyCopyStatus.value = null
    }, 2000)
  }
}

const copyEmbedCode = async (key: EmbedIndexKey) => {
  const code = embedCodes.value[key]
  if (!code || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(code)
    embedCopyStatus.value = `${key.toUpperCase()} embed copied.`
  }
 catch {
    embedCopyStatus.value = 'Copy failed.'
  }
 finally {
    setTimeout(() => {
      embedCopyStatus.value = null
    }, 2000)
  }
}

const fetchApiKeys = async () => {
  if (apiKeysLoading.value) return
  apiKeysLoading.value = true
  apiKeysError.value = null
  try {
    const response = await request<ApiKeyListResponse>('/me/api-keys')
    apiKeys.value = response.keys ?? []
    apiKeysLoaded.value = true
  }
 catch (error) {
    apiKeysError.value = toApiKeyErrorMessage(error, 'Unable to load API keys.')
  }
 finally {
    apiKeysLoading.value = false
  }
}

const createEnterpriseApiKey = async () => {
  if (apiKeysLoading.value) return
  apiKeysLoading.value = true
  apiKeysError.value = null
  apiKeyToken.value = null
  apiKeyTokenLabel.value = null
  try {
    const tierScope = apiKeyTier.value === '3' ? 'tier:3' : 'tier:2'
    const response = await request<ApiKeyCreateResponse>('/me/api-keys', {
      method: 'POST',
      body: {
        name: apiKeyName.value.trim() || undefined,
        scopes: [tierScope, 'indices:read'],
      },
    })
    apiKeys.value = [response.api_key, ...apiKeys.value.filter(key => key.key_id !== response.api_key.key_id)]
    apiKeyToken.value = response.token
    apiKeyTokenLabel.value = response.api_key.key_prefix
    embedApiKey.value = response.token
    apiKeyName.value = ''
    apiKeyTier.value = '2'
  }
 catch (error) {
    apiKeysError.value = toApiKeyErrorMessage(error, 'Unable to create API key.')
  }
 finally {
    apiKeysLoading.value = false
  }
}

const rotateEnterpriseApiKey = async (key: ApiKeyRecord) => {
  if (apiKeysLoading.value) return
  apiKeysLoading.value = true
  apiKeysError.value = null
  apiKeyToken.value = null
  apiKeyTokenLabel.value = null
  try {
    const response = await request<ApiKeyCreateResponse>(`/me/api-keys/${key.key_id}/rotate`, {
      method: 'POST',
    })
    apiKeys.value = apiKeys.value.map(item => (
      item.key_id === key.key_id ? response.api_key : item
    ))
    apiKeyToken.value = response.token
    apiKeyTokenLabel.value = response.api_key.key_prefix
    embedApiKey.value = response.token
  }
 catch (error) {
    apiKeysError.value = toApiKeyErrorMessage(error, 'Unable to rotate API key.')
  }
 finally {
    apiKeysLoading.value = false
  }
}

const revokeEnterpriseApiKey = async (key: ApiKeyRecord) => {
  if (apiKeysLoading.value) return
  apiKeysLoading.value = true
  apiKeysError.value = null
  try {
    await request(`/me/api-keys/${key.key_id}`, { method: 'DELETE' })
    apiKeys.value = apiKeys.value.map(item => (
      item.key_id === key.key_id ? { ...item, revoked_at: new Date().toISOString() } : item
    ))
  }
 catch (error) {
    apiKeysError.value = toApiKeyErrorMessage(error, 'Unable to revoke API key.')
  }
 finally {
    apiKeysLoading.value = false
  }
}

const hasAdminAccess = ref(false)
const adminAccessChecked = ref(false)

const checkAdminAccess = async () => {
  if (!import.meta.client) return
  if (!isAuthenticated.value) {
    hasAdminAccess.value = false
    adminAccessChecked.value = true
    return
  }
  if (adminAccessChecked.value) return
  try {
    await request('/admin/users', { query: { limit: 1 } })
    hasAdminAccess.value = true
  }
 catch {
    hasAdminAccess.value = false
  }
 finally {
    adminAccessChecked.value = true
  }
}

const visibleTabs = computed(() => {
  const baseTabs = hasAdminAccess.value ? tabs : tabs.filter(tab => tab.id !== 'ops')
  return isEnterprise.value ? baseTabs : baseTabs.filter(tab => tab.id !== 'enterprise')
})

const activeTab = computed<DashboardTab>(() => {
  const raw = route.query.tab
  const tab = Array.isArray(raw) ? raw[0] : raw
  if (tab === 'ops' && !hasAdminAccess.value) return 'overview'
  if (tab === 'enterprise' && !isEnterprise.value) return 'overview'
  if (tab === 'watchlist' || tab === 'alerts' || tab === 'history' || tab === 'enterprise' || tab === 'ops' || tab === 'account') return tab
  return 'overview'
})

function setTab(tab: DashboardTab) {
  if (tab === 'ops' && !hasAdminAccess.value) return
  if (tab === 'enterprise' && !isEnterprise.value) return
  const nextQuery: LocationQueryRaw = { ...route.query }
  if (tab === 'overview') {
    delete nextQuery.tab
  }
 else {
    nextQuery.tab = tab
  }
  void navigateTo({ path: route.path, query: nextQuery })
}

async function openBillingPortal() {
  billingActionMessage.value = null
  const result = await billingActions.openBillingPortal()
  if (!result.ok) {
    billingActionMessage.value = result.error || 'Unable to open billing portal.'
  }
}

async function startCheckout() {
  billingActionMessage.value = null
  const result = await billingActions.createCheckoutSession('plus')
  if (!result.ok) {
    billingActionMessage.value = result.error || 'Unable to start checkout.'
    return
  }

  if (!result.url) {
    billingActionMessage.value = result.error || 'Unable to start checkout.'
    return
  }

  if (import.meta.client) {
    window.location.href = result.url
  }
}

type OpsHealthCorridor = {
  corridor_id: string
  last_attempt_at: string | null
  last_attempt_age_minutes: number | null
  last_attempt_success: boolean | null
  last_attempt_http_status: number | null
  last_attempt_error_type: string | null
  last_attempt_error_message: string | null
  last_attempt_request: string | null
  last_quote_at: string | null
  last_quote_age_minutes: number | null
  payin: string | null
  payout: string | null
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  total_debit_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  quality_flags: unknown
  updated_at: string | null
}

type OpsHealthResponse = {
  success: boolean
  provider_id: string
  affiliate: boolean
  affiliate_url: string | null
  outbound_url: string | null
  timestamp: string
  corridors: OpsHealthCorridor[]
  summary: {
    corridor_count: number
    stale_count: number
    fresh_window_minutes: number
  }
}

type TelemetryAggregateRow = {
  metric: string
  value: unknown
  time_bucket: string
  dimensions: Record<string, unknown> | null
  computed_at: string
}

type TelemetryListRow = {
  key: string
  from?: string
  to?: string
  provider?: string
  corridor?: string
  count: number
}

type OpsAnalyticsCorridor = {
  corridor_id: string
  from_country: string
  to_country: string
  search_count: number
  click_count?: number
  trend?: string
  trend_percentage?: number
}

type OpsAnalyticsProvider = {
  provider_id: string
  provider_name?: string | null
  click_count?: number
  click_through_rate: number
}

type OpsRevenueMetric = {
  provider_id: string
  provider_name?: string | null
  corridor_id?: string | null
  total_clicks: number
  affiliate_clicks: number
  affiliate_rate: number
  unique_users: number
}

type OpsProviderImpactSummary = {
  provider_id: string
  provider_name?: string | null
  total_clicks: number
  unique_clicks: number
  affiliate_clicks: number
  conversions: number
  unique_conversions: number
  conversion_rate: number
  conversion_values: Record<string, number> | null
}

type OpsProviderCorridorImpact = {
  provider_id: string
  provider_name?: string | null
  corridor_id?: string | null
  total_clicks: number
  unique_clicks: number
  conversions: number
  conversion_rate: number
  conversion_values: Record<string, number> | null
}

type OpsAuditLog = {
  event_id: string
  created_at: string
  action: string
  actor_id: string
  severity?: string | null
}

type BillingInvoice = {
  id: string
  date: string | null
  amount: number | null
  currency: string | null
  status: string | null
  invoice_url: string | null
}

const opsProviders = [
  { id: 'remitly', label: 'Remitly', endpoint: '/ops/remitly/health' },
  { id: 'westernunion', label: 'Western Union', endpoint: '/ops/westernunion/health' },
  { id: 'worldremit', label: 'WorldRemit', endpoint: '/ops/worldremit/health' },
  { id: 'xe', label: 'XE', endpoint: '/ops/xe/health' },
  { id: 'wise', label: 'Wise', endpoint: '/ops/wise/health' },
  { id: 'xoom', label: 'Xoom', endpoint: '/ops/xoom/health' },
  { id: 'ria', label: 'Ria', endpoint: '/ops/ria/health' },
  { id: 'dahabshiil', label: 'Dahabshiil', endpoint: '/ops/dahabshiil/health' },
  { id: 'instarem', label: 'Instarem', endpoint: '/ops/instarem/health' },
  { id: 'wirebarley', label: 'WireBarley', endpoint: '/ops/wirebarley/health' },
  { id: 'alansari', label: 'Al Ansari Exchange', endpoint: '/ops/alansari/health' },
  { id: 'intermex', label: 'Intermex', endpoint: '/ops/intermex/health' },
  { id: 'koronapay', label: 'KoronaPay', endpoint: '/ops/koronapay/health' },
  { id: 'remitbee', label: 'RemitBee', endpoint: '/ops/remitbee/health' },
  { id: 'singx', label: 'SingX', endpoint: '/ops/singx/health' },
  { id: 'placid', label: 'Placid', endpoint: '/ops/placid/health' },
  { id: 'transfergo', label: 'TransferGo', endpoint: '/ops/transfergo/health' },
  { id: 'paysend', label: 'Paysend', endpoint: '/ops/paysend/health' },
  { id: 'pangea', label: 'Pangea', endpoint: '/ops/pangea/health' },
  { id: 'orbitremit', label: 'OrbitRemit', endpoint: '/ops/orbitremit/health' },
  { id: 'bossmoney', label: 'BOSS Money', endpoint: '/ops/bossmoney/health' },
  { id: 'sendwave', label: 'Sendwave', endpoint: '/ops/sendwave/health' },
  { id: 'mukuru', label: 'Mukuru', endpoint: '/ops/mukuru/health' },
] as const

type OpsProviderId = typeof opsProviders[number]['id']

const opsAdminLinks = [
  {
    label: 'Analytics Console',
    description: 'Traffic, corridor demand, provider CTR, and savings metrics.',
    to: '/admin/analytics',
  },
  {
    label: 'Audit Log Console',
    description: 'Security, compliance, and admin event trails.',
    to: '/admin/audit',
  },
  {
    label: 'Ad Inventory',
    description: 'Manage placements, creatives, and ad performance.',
    to: '/admin/ads',
  },
] as const

const adminRoleEmail = ref('')
const adminRoleSelection = ref<'user' | 'admin' | 'super_admin'>('user')
const adminRoleLoading = ref(false)
const adminRoleError = ref<string | null>(null)
const adminRoleSuccess = ref<string | null>(null)

function buildOpsRecord<T>(factory: () => T): Record<OpsProviderId, T> {
  return opsProviders.reduce((acc, provider) => {
    acc[provider.id] = factory()
    return acc
  }, {} as Record<OpsProviderId, T>)
}

const opsState = ref<Record<OpsProviderId, OpsHealthResponse | null>>(
  buildOpsRecord(() => null),
)
const opsLoading = ref<Record<OpsProviderId, boolean>>(
  buildOpsRecord(() => false),
)
const opsErrors = ref<Record<OpsProviderId, string | null>>(
  buildOpsRecord(() => null),
)
const opsHasLoaded = ref(false)

const telemetryMetricOptions = [
  { id: 'popular_corridors', label: 'Popular Corridors' },
  { id: 'provider_favorites', label: 'Provider Favorites' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'engagement', label: 'Engagement' },
] as const

const telemetryHourOptions = [6, 24, 72, 168, 720] as const

const telemetryMetric = ref<(typeof telemetryMetricOptions)[number]['id']>('popular_corridors')
const telemetryHours = ref<number>(24)
const telemetryRows = ref<TelemetryAggregateRow[]>([])
const telemetryLoading = ref(false)
const telemetryError = ref<string | null>(null)
const telemetryHasLoaded = ref(false)

const opsAnalyticsLoading = ref(false)
const opsAnalyticsError = ref<string | null>(null)
const opsPopularCorridors = ref<OpsAnalyticsCorridor[]>([])
const opsFavoriteProviders = ref<OpsAnalyticsProvider[]>([])
const opsRevenueRows = ref<OpsRevenueMetric[]>([])
const opsProviderImpact = ref<OpsProviderImpactSummary[]>([])
const opsProviderCorridors = ref<OpsProviderCorridorImpact[]>([])
const opsAnalyticsHasLoaded = ref(false)

const opsAuditLoading = ref(false)
const opsAuditError = ref<string | null>(null)
const opsAuditLogs = ref<OpsAuditLog[]>([])
const opsAuditHasLoaded = ref(false)

const opsRefreshing = computed(() => opsProviders.some(provider => opsLoading.value[provider.id]))

const opsAutoRefreshMs = 60_000
const opsInsightsRefreshMs = 300_000
let opsAutoRefreshTimer: ReturnType<typeof setInterval> | null = null
let opsInsightsRefreshTimer: ReturnType<typeof setInterval> | null = null

const startOpsAutoRefresh = () => {
  if (opsAutoRefreshTimer || opsInsightsRefreshTimer) return
  opsAutoRefreshTimer = setInterval(() => {
    if (activeTab.value !== 'ops') return
    void refreshAllOps()
  }, opsAutoRefreshMs)
  opsInsightsRefreshTimer = setInterval(() => {
    if (activeTab.value !== 'ops') return
    void loadTelemetryAnalytics()
    void loadOpsAnalytics()
    void loadOpsAudit()
  }, opsInsightsRefreshMs)
}

const stopOpsAutoRefresh = () => {
  if (opsAutoRefreshTimer) {
    clearInterval(opsAutoRefreshTimer)
    opsAutoRefreshTimer = null
  }
  if (opsInsightsRefreshTimer) {
    clearInterval(opsInsightsRefreshTimer)
    opsInsightsRefreshTimer = null
  }
}

const formatOpsTimestamp = (value: string | null | undefined) => {
  if (!value) return 'n/a'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'n/a'
  return formatDateTime(parsed)
}

const formatOpsNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined) return 'n/a'
  const number = Number(value)
  if (!Number.isFinite(number)) return 'n/a'
  return formatNumber(number, { maximumFractionDigits: digits })
}

const formatOpsPercent = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined) return 'n/a'
  const number = Number(value)
  if (!Number.isFinite(number)) return 'n/a'
  return formatPercent(number, { digits, sign: false })
}

const formatTrendPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return formatPercent(number, { digits: 1, sign: true })
}

const formatCurrencyValue = (value: number, currency: string) => {
  if (!Number.isFinite(value)) return `${currency} 0`
  return formatMoney(value, { currency })
}

const mergeCurrencyTotals = (
  totals: Record<string, number>,
  values?: Record<string, number> | null,
) => {
  if (!values || typeof values !== 'object') return
  for (const [currency, rawValue] of Object.entries(values)) {
    const number = Number(rawValue)
    if (!Number.isFinite(number)) continue
    totals[currency] = (totals[currency] || 0) + number
  }
}

const formatCurrencyTotals = (values?: Record<string, number> | null) => {
  if (!values || typeof values !== 'object') return '—'
  const entries = Object.entries(values)
    .filter(([, amount]) => Number.isFinite(Number(amount)))
    .sort(([a], [b]) => a.localeCompare(b))
  if (!entries.length) return '—'
  return entries
    .map(([currency, amount]) => formatCurrencyValue(Number(amount), currency))
    .join(', ')
}

const formatOpsFlags = (value: unknown) => {
  if (!value) return 'none'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'none'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  }
 catch {
    return 'unknown'
  }
}

const formatAttemptStatus = (success: boolean | null) => {
  if (success === true) return 'ok'
  if (success === false) return 'fail'
  return 'n/a'
}

const attemptStatusClass = (success: boolean | null) => {
  if (success === true) return 'text-emerald-600'
  if (success === false) return 'text-red-600'
  return 'text-slate-400'
}

const toOpsErrorMessage = (error: unknown) => {
  const candidate = error as { statusCode?: number, status?: number, message?: string, data?: { message?: string } }
  const status = candidate?.statusCode ?? candidate?.status
  if (status === 401 || status === 403) {
    return 'Admin access required to view ops data.'
  }
  return candidate?.data?.message ?? candidate?.message ?? 'Unable to load ops data.'
}

const telemetryLatest = computed(() => {
  if (!telemetryRows.value.length) return null
  return [...telemetryRows.value].sort((a, b) => new Date(b.time_bucket).getTime() - new Date(a.time_bucket).getTime())[0]
})

const telemetryWindowHours = computed(() => {
  const dimensions = telemetryLatest.value?.dimensions
  if (!dimensions || typeof dimensions !== 'object') return null
  const value = (dimensions as Record<string, unknown>).window_hours
  return typeof value === 'number' ? value : null
})

const telemetryEngagement = computed(() => {
  if (telemetryMetric.value !== 'engagement') return null
  const payload = telemetryLatest.value?.value
  if (!payload || typeof payload !== 'object') return null
  return payload as { avg_engagement?: number, session_count?: number }
})

const telemetryListRows = computed<TelemetryListRow[]>(() => {
  if (!telemetryLatest.value) return []
  const payload = telemetryLatest.value.value
  if (!Array.isArray(payload)) return []
  if (telemetryMetric.value === 'popular_corridors') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.corridor_id ?? 'corridor'}-${index}`,
      corridor: row.corridor_id,
      count: Number(row.search_count) || 0,
    }))
  }
  if (telemetryMetric.value === 'provider_favorites') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.provider_id ?? 'provider'}-${index}`,
      provider: row.provider_id,
      corridor: row.corridor_id,
      count: Number(row.click_count) || 0,
    }))
  }
  if (telemetryMetric.value === 'heatmap') {
    return payload.slice(0, 12).map((row: any, index: number) => ({
      key: `${row.from_country ?? 'from'}-${row.to_country ?? 'to'}-${index}`,
      from: row.from_country,
      to: row.to_country,
      count: Number(row.search_count) || 0,
    }))
  }
  return []
})

const opsRevenueSummary = computed(() => {
  const totals = {
    totalClicks: 0,
    affiliateClicks: 0,
    uniqueUsers: 0,
  }
  for (const row of opsRevenueRows.value) {
    totals.totalClicks += Number(row.total_clicks) || 0
    totals.affiliateClicks += Number(row.affiliate_clicks) || 0
    totals.uniqueUsers += Number(row.unique_users) || 0
  }
  const affiliateRate = totals.totalClicks > 0
    ? (totals.affiliateClicks / totals.totalClicks) * 100
    : 0
  return { ...totals, affiliateRate }
})

const opsConversionSummary = computed(() => {
  const totals = {
    totalClicks: 0,
    conversions: 0,
    uniqueConversions: 0,
    conversionRate: 0,
    conversionValues: {} as Record<string, number>,
  }
  for (const row of opsProviderImpact.value) {
    totals.totalClicks += Number(row.total_clicks) || 0
    totals.conversions += Number(row.conversions) || 0
    totals.uniqueConversions += Number(row.unique_conversions) || 0
    mergeCurrencyTotals(totals.conversionValues, row.conversion_values)
  }
  totals.conversionRate = totals.totalClicks > 0
    ? (totals.conversions / totals.totalClicks) * 100
    : 0
  return totals
})

const loadOpsHealth = async (providerId: OpsProviderId) => {
  const provider = opsProviders.find(item => item.id === providerId)
  if (!provider) return
  if (opsLoading.value[providerId]) return
  opsLoading.value[providerId] = true
  opsErrors.value[providerId] = null
  try {
    const response = await request<OpsHealthResponse>(provider.endpoint)
    opsState.value[providerId] = response
  }
 catch (error) {
    opsErrors.value[providerId] = toOpsErrorMessage(error)
  }
 finally {
    opsLoading.value[providerId] = false
  }
}

const refreshAllOps = async () => {
  opsHasLoaded.value = true
  await Promise.all(opsProviders.map(provider => loadOpsHealth(provider.id)))
}

const handleAdminRoleUpdate = async () => {
  const email = adminRoleEmail.value.trim()
  if (!email) {
    adminRoleError.value = 'Enter a user email to update.'
    return
  }
  adminRoleLoading.value = true
  adminRoleError.value = null
  adminRoleSuccess.value = null
  try {
    await request('/admin/users/role', {
      method: 'PATCH',
      body: {
        email,
        role: adminRoleSelection.value,
      },
    })
    adminRoleSuccess.value = `Role updated for ${email}.`
  }
 catch (error) {
    adminRoleError.value = toOpsErrorMessage(error)
  }
 finally {
    adminRoleLoading.value = false
  }
}

const buildOpsDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { start_date: start.toISOString(), end_date: end.toISOString() }
}

const loadTelemetryAnalytics = async () => {
  if (telemetryLoading.value) return
  telemetryHasLoaded.value = true
  telemetryLoading.value = true
  telemetryError.value = null
  try {
    const response = await request<{ data: TelemetryAggregateRow[] }>('/telemetry/analytics', {
      query: {
        metric: telemetryMetric.value,
        hours: telemetryHours.value,
      },
    })
    telemetryRows.value = response?.data ?? []
  }
 catch (error) {
    telemetryError.value = toOpsErrorMessage(error)
    telemetryRows.value = []
  }
 finally {
    telemetryLoading.value = false
  }
}

const loadOpsAnalytics = async () => {
  if (opsAnalyticsLoading.value) return
  opsAnalyticsHasLoaded.value = true
  opsAnalyticsLoading.value = true
  opsAnalyticsError.value = null
  const range = buildOpsDateRange(7)
  try {
    const [corridors, providers, impact, revenue] = await Promise.all([
      request<{ corridors: OpsAnalyticsCorridor[] }>('/analytics/corridors', {
        query: { ...range, limit: 6 },
      }),
      request<{ providers: OpsAnalyticsProvider[] }>('/analytics/providers', {
        query: { ...range, limit: 6 },
      }),
      request<{ providers: OpsProviderImpactSummary[], corridors: OpsProviderCorridorImpact[] }>('/analytics/providers/impact', {
        query: { ...range, limit: 8, corridor_limit: 8 },
      }),
      request<{ revenue: OpsRevenueMetric[] }>('/analytics/revenue', {
        query: { ...range, limit: 10 },
      }),
    ])
    opsPopularCorridors.value = corridors?.corridors ?? []
    opsFavoriteProviders.value = providers?.providers ?? []
    opsProviderImpact.value = impact?.providers ?? []
    opsProviderCorridors.value = impact?.corridors ?? []
    opsRevenueRows.value = revenue?.revenue ?? []
  }
 catch (error) {
    opsAnalyticsError.value = toOpsErrorMessage(error)
    opsPopularCorridors.value = []
    opsFavoriteProviders.value = []
    opsProviderImpact.value = []
    opsProviderCorridors.value = []
    opsRevenueRows.value = []
  }
 finally {
    opsAnalyticsLoading.value = false
  }
}

const loadOpsAudit = async () => {
  if (opsAuditLoading.value) return
  opsAuditHasLoaded.value = true
  opsAuditLoading.value = true
  opsAuditError.value = null
  const range = buildOpsDateRange(7)
  try {
    const response = await request<{ logs: OpsAuditLog[] }>('/audit/logs', {
      query: { ...range, limit: 8, offset: 0 },
    })
    opsAuditLogs.value = response?.logs ?? []
  }
 catch (error) {
    opsAuditError.value = toOpsErrorMessage(error)
    opsAuditLogs.value = []
  }
 finally {
    opsAuditLoading.value = false
  }
}

watch(() => activeTab.value, (tab) => {
  if (tab === 'ops') {
    startOpsAutoRefresh()
  }
 else {
    stopOpsAutoRefresh()
  }
  if (tab === 'ops' && !hasAdminAccess.value) {
    return
  }
  if (tab === 'ops' && !opsHasLoaded.value) {
    void refreshAllOps()
  }
  if (tab === 'ops' && !telemetryHasLoaded.value) {
    void loadTelemetryAnalytics()
  }
  if (tab === 'ops' && !opsAnalyticsHasLoaded.value) {
    void loadOpsAnalytics()
  }
  if (tab === 'ops' && !opsAuditHasLoaded.value) {
    void loadOpsAudit()
  }
  if (tab === 'enterprise' && isEnterprise.value && !apiKeysLoaded.value) {
    void fetchApiKeys()
  }
})

watch([() => telemetryMetric.value, () => telemetryHours.value], () => {
  if (activeTab.value !== 'ops') return
  void loadTelemetryAnalytics()
})

watch(isAuthenticated, (loggedIn) => {
  adminAccessChecked.value = false
  if (loggedIn) {
    void checkAdminAccess()
    return
  }
  hasAdminAccess.value = false
  adminAccessChecked.value = true
}, { immediate: true })

// Form state
const newWatchlist = ref({ from: 'US', to: 'PH' })
const graphTimeframe = ref('7d')

// Rate Checker state
const showCorridorSelector = ref(false)
const selectedCorridor = ref({ from: 'US', to: 'PH' })
const customCorridor = ref({ from: 'US', to: 'PH' })

const timeframePeriods = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d', plusOnly: true },
  { label: '6M', value: '180d', plusOnly: true },
  { label: '1Y', value: '365d', plusOnly: true },
]

const isTimeframeLocked = (value: string) => {
  if (isPlus.value) return false
  return value === '90d' || value === '180d' || value === '365d'
}

const countryOptions = computed(() => {
  return Object.values(countryMap)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => ({
      label: `${getFlag(c.code)} ${c.code} - ${c.name}`,
      value: c.code,
      code: c.code,
      flag: getFlag(c.code),
      name: c.name,
    }))
})

const inlineFromOptions = computed(() => countryOptions.value)
const inlineToOptions = computed(() => countryOptions.value)

const selectedHistoryDays = computed(() => historyDaysByTimeframe[graphTimeframe.value] ?? 30)

const selectedPair = computed(() => {
  return getPairForCorridor(selectedCorridor.value.from, selectedCorridor.value.to)
})

const selectedSnapshot = computed<RateSnapshot>(() => {
  const pair = selectedPair.value
  if (!pair) {
    return {
      rateLabel: '—',
      rateValue: null,
      change: null,
      changeValue: 0,
      hasChange: false,
      lastUpdated: null,
      history: [],
    }
  }
  const history = getRateHistory(pair.base, pair.quote, selectedHistoryDays.value)
  if (!history.length) {
    return {
      rateLabel: '—',
      rateValue: null,
      change: null,
      changeValue: 0,
      hasChange: false,
      lastUpdated: null,
      history,
    }
  }
  const latest = history[history.length - 1]
  const previous = history.length > 1 ? history[history.length - 2] : null
  const change = previous && previous.rate > 0
    ? ((latest.rate - previous.rate) / previous.rate) * 100
    : null
  const hasChange = change !== null && change !== undefined && Number.isFinite(change)
  const meta = getRateHistoryMeta(pair.base, pair.quote, selectedHistoryDays.value)
  return {
    rateLabel: formatRateValue(latest.rate),
    rateValue: latest.rate,
    change,
    changeValue: hasChange ? change : 0,
    hasChange,
    lastUpdated: meta?.lastUpdated ?? latest.date,
    history,
  }
})

const selectedHistoryLoading = computed(() => {
  const pair = selectedPair.value
  if (!pair) return false
  const key = buildHistoryKey(pair.base, pair.quote, selectedHistoryDays.value)
  return Boolean(rateHistoryLoading.value[key])
})

const currentRate = computed(() => {
  return {
    rate: selectedSnapshot.value.rateLabel,
    change: selectedSnapshot.value.change,
    updatedLabel: formatUpdatedLabel(selectedSnapshot.value.lastUpdated),
    isAvailable: selectedSnapshot.value.rateValue !== null,
  }
})

const rateStats = computed(() => {
  const history = selectedSnapshot.value.history
  if (!history.length) {
    return { high: '—', low: '—', average: '—', volatility: '—', hasData: false }
  }
  const values = history.map(point => point.rate).filter(Number.isFinite)
  if (!values.length) {
    return { high: '—', low: '—', average: '—', volatility: '—', hasData: false }
  }
  const high = Math.max(...values)
  const low = Math.min(...values)
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length
  const volatility = average > 0 ? (Math.sqrt(variance) / average) * 100 : 0
  return {
    high: formatRateValue(high),
    low: formatRateValue(low),
    average: formatRateValue(average),
    volatility: formatPercentValue(volatility, false),
    hasData: true,
  }
})

watch([selectedPair, selectedHistoryDays], ([pair, days]) => {
  if (!pair) return
  void loadRateHistory(pair.base, pair.quote, days)
}, { immediate: true })

watch(() => isPlus.value, (value) => {
  if (!value && isTimeframeLocked(graphTimeframe.value)) {
    graphTimeframe.value = '30d'
  }
})

function selectCorridor(from: string, to: string) {
  selectedCorridor.value = { from, to }
  showCorridorSelector.value = false
}

function getTimeframeStartLabel() {
  if (selectedSnapshot.value.history.length > 0) {
    return formatMonthDay(selectedSnapshot.value.history[0].date)
  }
  const days = selectedHistoryDays.value
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatMonthDay(date)
}

const watchlistPairs = computed(() => {
  const pairs = new Map<string, { base: string, quote: string }>()
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    pairs.set(buildProviderKey(pair.base, pair.quote), pair)
  })
  return Array.from(pairs.values())
})

watch(watchlistPairs, (pairs) => {
  pairs.forEach((pair) => {
    void loadRateHistory(pair.base, pair.quote, watchlistHistoryDays)
    void loadProviderRates(pair.base, pair.quote)
  })
}, { immediate: true })

const watchlistSnapshots = computed<Record<string, RateSnapshot>>(() => {
  const map: Record<string, RateSnapshot> = {}
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    const history = getRateHistory(pair.base, pair.quote, watchlistHistoryDays)
    if (!history.length) {
      map[item.id] = {
        rateLabel: '—',
        rateValue: null,
        change: null,
        changeValue: 0,
        hasChange: false,
        lastUpdated: null,
        history,
      }
      return
    }
    const latest = history[history.length - 1]
    const previous = history.length > 1 ? history[history.length - 2] : null
    const change = previous && previous.rate > 0
      ? ((latest.rate - previous.rate) / previous.rate) * 100
      : null
    const meta = getRateHistoryMeta(pair.base, pair.quote, watchlistHistoryDays)
    map[item.id] = {
      rateLabel: formatRateValue(latest.rate),
      rateValue: latest.rate,
      change,
      changeValue: change ?? 0,
      hasChange: change !== null,
      lastUpdated: meta?.lastUpdated ?? latest.date,
      history,
    }
  })
  return map
})

const getWatchlistSnapshot = (itemId: string) => {
  return watchlistSnapshots.value[itemId] ?? {
    rateLabel: '—',
    rateValue: null,
    change: null,
    changeValue: 0,
    hasChange: false,
    lastUpdated: null,
    history: [],
  }
}

const isWatchlistHistoryLoading = (itemId: string) => {
  const item = watchlistItems.value.find(candidate => candidate.id === itemId)
  if (!item) return false
  const pair = getPairForTarget(item.target)
  if (!pair) return false
  const key = buildHistoryKey(pair.base, pair.quote, watchlistHistoryDays)
  return Boolean(rateHistoryLoading.value[key])
}

const providerSlugOverrides: Record<string, string> = {
  'western union': 'western-union',
  'worldremit': 'worldremit',
  'remitly': 'remitly',
  'wise': 'wise',
  'xe': 'xe-money',
  'xe money': 'xe-money',
  'xoom': 'xoom',
  'ria': 'ria',
  'dahabshiil': 'dahabshiil',
}

const slugifyProvider = (name: string) => {
  const normalized = name.trim().toLowerCase()
  if (providerSlugOverrides[normalized]) return providerSlugOverrides[normalized]
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const bestProviderByItemId = computed<Record<string, BestProviderSnapshot>>(() => {
  const map: Record<string, BestProviderSnapshot> = {}
  watchlistItems.value.forEach((item) => {
    const pair = getPairForTarget(item.target)
    if (!pair) return
    const key = buildProviderKey(pair.base, pair.quote)
    const data = providerRatesCache.value[key]?.data ?? []
    if (!data.length) return
    const best = data.reduce((top, next) => (next.rate > top.rate ? next : top))
    map[item.id] = { ...best, slug: slugifyProvider(best.name) }
  })
  return map
})

const getBestProviderForItem = (itemId: string) => {
  return bestProviderByItemId.value[itemId] ?? null
}

const isProviderRatesLoadingForItem = (itemId: string) => {
  const item = watchlistItems.value.find(candidate => candidate.id === itemId)
  if (!item) return false
  const pair = getPairForTarget(item.target)
  if (!pair) return false
  const key = buildProviderKey(pair.base, pair.quote)
  return Boolean(providerRatesLoading.value[key])
}

async function handleAddToWatchlist() {
  if (watchlistLimitReached.value) {
    if (!isPlus.value) {
      alert('Watchlist limit reached. Upgrade to Plus for up to 16 corridors.')
    }
 else {
      alert(`Watchlist limit reached (${limits.value.watchlistItems}). Remove a corridor to add another.`)
    }
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: selectedCorridor.value.from,
    to: selectedCorridor.value.to,
    method: 'bank',
  }
  const label = `${selectedCorridor.value.from} → ${selectedCorridor.value.to}`
  const result = await watchlistSave(target, { label })

  if (result.status === 'limit_reached' || result.status === 'error') {
    alert(result.message)
  }
}

function handleSetAlert() {
  if (alertsLimitReached.value) {
    if (!isPlus.value) {
      alert('Alert limit reached. Upgrade to Plus for up to 16 alerts.')
    }
 else {
      alert(`Alert limit reached (${limits.value.alerts}). Disable or delete an alert to add another.`)
    }
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: selectedCorridor.value.from,
    to: selectedCorridor.value.to,
    method: 'bank',
  }
  const label = `${selectedCorridor.value.from} → ${selectedCorridor.value.to}`
  modal.open({ target, label, source: 'dashboard' })
}

// Account section state
const activeAccountSection = ref<AccountSection>('profile')
const checkoutNotice = ref<'success' | 'cancel' | null>(null)

const requestedAccountSection = computed<AccountSection | null>(() => {
  const raw = route.query.section
  const section = Array.isArray(raw) ? raw[0] : raw
  if (section === 'profile' || section === 'billing' || section === 'notifications' || section === 'security' || section === 'privacy' || section === 'compliance') {
    return section
  }
  return null
})

watch(
  () => [activeTab.value, requestedAccountSection.value] as const,
  ([tab, section]) => {
    if (tab !== 'account' || !section) return
    activeAccountSection.value = section
  },
  { immediate: true },
)

const billingHistory = ref<BillingInvoice[]>([])
const billingHistoryLoading = ref(false)
const billingHistoryError = ref<string | null>(null)
const billingActionMessage = ref<string | null>(null)

const billingSummary = computed(() => billing.value)
const billingStatus = computed(() => billingSummary.value?.status ?? (isPlus.value ? 'active' : 'free'))

const formatBillingDate = (value: string | null | undefined) => {
  if (!value) return 'Unavailable'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unavailable'
  return formatDate(parsed, { style: 'long' })
}

const formatBillingAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return '—'
  return formatMoney(amount, { currency: currency.toUpperCase() })
}

const billingStatusBadge = computed(() => {
  const status = billingStatus.value
  if (status === 'active' || status === 'trialing') {
    return { label: 'Active', classes: 'bg-emerald-100 text-emerald-700' }
  }
  if (status === 'past_due') {
    return { label: 'Past due', classes: 'bg-amber-100 text-amber-700' }
  }
  if (status === 'canceled' || status === 'incomplete_expired') {
    return { label: 'Canceled', classes: 'bg-slate-100 text-slate-600' }
  }
  return { label: status ? status.replace(/_/g, ' ') : 'Free', classes: 'bg-slate-100 text-slate-600' }
})

const {
  settings: notificationSettings,
  loading: notificationLoading,
  error: notificationLoadError,
  fetchSettings: fetchNotificationSettings,
  saveSettings: saveNotificationSettings,
} = useNotificationSettings()
const notificationSaveSuccess = ref(false)
const notificationSaveError = ref<string | null>(null)

const {
  supported: pushSupported,
  permission: pushPermission,
  loading: pushLoading,
  error: pushError,
  subscribeWebPush,
  unsubscribeWebPush,
} = usePushNotifications()

const securitySettings = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordUpdateLoading = ref(false)
const passwordUpdateError = ref<string | null>(null)
const passwordUpdateSuccess = ref(false)

const {
  settings: privacySettings,
  loading: privacyLoading,
  error: privacyLoadError,
  fetchSettings: fetchPrivacySettings,
  saveSettings: savePrivacySettings,
} = usePrivacySettings()
const privacySaveSuccess = ref(false)
const privacySaveError = ref<string | null>(null)

// Profile editing
const profileName = ref('')
const profileSaved = ref(false)

watch(() => user.value?.name, (name) => {
  if (name) profileName.value = name
}, { immediate: true })

watch(
  () => route.query.checkout,
  (value) => {
    void handleCheckoutNotice(value)
  },
  { immediate: true },
)

watch(
  () => activeAccountSection.value,
  (section) => {
    if (section === 'billing' && isPlus.value) {
      void fetchBillingHistory()
    }
    if (section === 'security' && isAuthenticated.value) {
      void fetchSessions()
    }
    if (section === 'privacy' && isAuthenticated.value) {
      void fetchPrivacySettings()
    }
    if (section === 'notifications' && isAuthenticated.value) {
      void fetchNotificationSettings()
    }
  },
)

watch(
  () => isPlus.value,
  (value) => {
    if (value && activeAccountSection.value === 'billing') {
      void fetchBillingHistory(true)
    }
  },
)

async function saveProfile() {
  const trimmed = profileName.value.trim()
  if (!trimmed) return

  try {
    await updateProfile({ name: trimmed })
    profileSaved.value = true
    setTimeout(() => {
      profileSaved.value = false
    }, 3000)
  }
 catch (error) {
    console.warn('Profile update failed', error)
  }
}

async function handleSavePrivacySettings() {
  privacySaveError.value = null
  privacySaveSuccess.value = false
  await savePrivacySettings()
  if (privacyLoadError.value) {
    privacySaveError.value = privacyLoadError.value
    return
  }
  privacySaveSuccess.value = true
  setTimeout(() => {
    privacySaveSuccess.value = false
  }, 3000)
}

async function handleSaveNotificationSettings() {
  notificationSaveError.value = null
  notificationSaveSuccess.value = false
  await saveNotificationSettings()
  if (notificationLoadError.value) {
    notificationSaveError.value = notificationLoadError.value
    return
  }
  notificationSaveSuccess.value = true
  setTimeout(() => {
    notificationSaveSuccess.value = false
  }, 3000)
}

async function handlePushToggle() {
  notificationSaveError.value = null
  if (!pushSupported.value) {
    notificationSaveError.value = 'Push notifications are not supported in this browser.'
    return
  }
  const result = notificationSettings.value.pushEnabled
    ? await unsubscribeWebPush()
    : await subscribeWebPush()

  if (result.success) {
    await fetchNotificationSettings()
  }
 else if (pushError.value) {
    notificationSaveError.value = pushError.value
  }
}

async function handlePasswordUpdate() {
  passwordUpdateError.value = null
  passwordUpdateSuccess.value = false

  const currentPassword = securitySettings.value.currentPassword.trim()
  const newPassword = securitySettings.value.newPassword.trim()
  const confirmPassword = securitySettings.value.confirmPassword.trim()

  if (!currentPassword) {
    passwordUpdateError.value = 'Enter your current password.'
    return
  }

  if (newPassword.length < 8) {
    passwordUpdateError.value = 'New password must be at least 8 characters.'
    return
  }

  if (newPassword !== confirmPassword) {
    passwordUpdateError.value = 'Passwords do not match.'
    return
  }

  passwordUpdateLoading.value = true
  try {
    const result = await updatePasswordWithCurrent(currentPassword, newPassword)
    if (!result.ok) {
      passwordUpdateError.value = result.error || 'Unable to update password.'
      return
    }
    securitySettings.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    passwordUpdateSuccess.value = true
    setTimeout(() => {
      passwordUpdateSuccess.value = false
    }, 3000)
  }
 catch (error) {
    passwordUpdateError.value
      = error instanceof Error ? error.message : 'Unable to update password.'
  }
 finally {
    passwordUpdateLoading.value = false
  }
}

const formatSessionActivity = (timestamp: string) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return 'Recently active'
  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 5) return 'Active now'
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  return formatDate(parsed)
}

const sessionMeta = (session: { device_type: string | null, location: string | null }) => {
  const device = session.device_type
    ? session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1)
    : 'Unknown device'
  const location = session.location || 'Unknown location'
  return `${device} • ${location}`
}

const handleRevokeSession = async (sessionId: string) => {
  try {
    await revokeSession(sessionId)
  }
 catch (error) {
    console.warn('Failed to revoke session', error)
  }
}

const handleRevokeAllSessions = async () => {
  const current = sessions.value.find(session => session.is_current)
  try {
    await revokeAllSessions(current?.session_id)
  }
 catch (error) {
    console.warn('Failed to revoke sessions', error)
  }
}

const fetchBillingHistory = async (force = false) => {
  if (!isPlus.value) return
  if (billingHistoryLoading.value) return
  if (billingHistory.value.length > 0 && !force) return

  billingHistoryLoading.value = true
  billingHistoryError.value = null

  try {
    const response = await request<{ invoices: BillingInvoice[] }>('/billing/history')
    billingHistory.value = Array.isArray(response.invoices) ? response.invoices : []
  }
 catch (error: any) {
    billingHistoryError.value = error?.message || 'Unable to load billing history.'
  }
 finally {
    billingHistoryLoading.value = false
  }
}

async function handleCheckoutNotice(value: unknown) {
  if (value === 'success') {
    checkoutNotice.value = 'success'
    await refreshPlan()
    await fetchBillingHistory(true)
  }
 else if (value === 'cancel') {
    checkoutNotice.value = 'cancel'
  }
 else {
    checkoutNotice.value = null
    return
  }

  const nextQuery: LocationQueryRaw = { ...route.query }
  delete nextQuery.checkout
  void navigateTo({ path: route.path, query: nextQuery, replace: true })
}

// Export functionality
const showExportModal = ref(false)
const isExporting = ref(false)
const selectedExportItems = ref<string[]>([])

const getDefaultDateFrom = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

const exportSettings = ref({
  dataType: 'history' as 'history' | 'watchlist' | 'alerts' | 'all',
  dateRange: '30d' as '7d' | '30d' | '90d',
  dateFrom: getDefaultDateFrom(),
  dateTo: new Date().toISOString().split('T')[0],
  format: 'csv' as 'csv' | 'pdf',
  includeCorridorHistory: false,
})

const exportCorridorIds = computed<string[]>(() => {
  const ids: string[] = []
  for (const item of watchlistItems.value) {
    if (item.target.type !== 'corridor') continue
    const pair = getPairForTarget(item.target)
    if (!pair) continue
    const from = item.target.from.toUpperCase()
    const to = item.target.to.toUpperCase()
    const base = pair.base.toUpperCase()
    const quote = pair.quote.toUpperCase()
    ids.push(`${from}-${to}-${base}-${quote}`)
  }

  const unique = Array.from(new Set(ids))
  return unique.slice(0, 16)
})

const exportStatusMessage = ref<string | null>(null)
const exportErrorMessage = ref<string | null>(null)
const exportJobId = ref<string | null>(null)
let exportPollTimer: ReturnType<typeof setInterval> | null = null

const clearExportPolling = () => {
  if (exportPollTimer) {
    clearInterval(exportPollTimer)
    exportPollTimer = null
  }
}

onBeforeUnmount(() => {
  clearExportPolling()
  stopOpsAutoRefresh()
})

const triggerDownload = (url: string) => {
  if (import.meta.client) {
    window.open(url, '_blank', 'noopener')
  }
}

const pollExportStatus = async (jobId: string) => {
  clearExportPolling()
  exportPollTimer = setInterval(async () => {
    try {
      const response = await exportsApi.getExportStatus(jobId)
      const status = response.job.status
      if (status === 'failed') {
        exportErrorMessage.value = response.job.error || 'Export failed. Please try again.'
        isExporting.value = false
        clearExportPolling()
        return
      }
      if (status === 'done') {
        const download = await exportsApi.getExportDownloadUrl(jobId)
        exportStatusMessage.value = 'Export ready. Downloading...'
        triggerDownload(download.url)
        isExporting.value = false
        clearExportPolling()
      }
 else {
        exportStatusMessage.value = 'Export in progress...'
      }
    }
 catch (error: any) {
      exportErrorMessage.value = error?.message || 'Failed to check export status.'
      isExporting.value = false
      clearExportPolling()
    }
  }, 2000)
}

function setExportDateRange(range: '7d' | '30d' | '90d') {
  const today = new Date()
  exportSettings.value.dateTo = today.toISOString().split('T')[0]

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  exportSettings.value.dateFrom = fromDate.toISOString().split('T')[0]
  exportSettings.value.dateRange = range
}

// Initialize date range when modal opens
watch(() => showExportModal.value, (isOpen) => {
  if (isOpen) {
    setExportDateRange(exportSettings.value.dateRange || '30d')
  }
})

watch(
  () => exportSettings.value.dataType,
  (dataType) => {
    if (dataType !== 'history') {
      exportSettings.value.includeCorridorHistory = false
    }
  },
)

watch(
  () => exportCorridorIds.value.length,
  (count) => {
    if (count === 0) {
      exportSettings.value.includeCorridorHistory = false
    }
  },
)

async function handleExport() {
  exportErrorMessage.value = null
  exportStatusMessage.value = null
  isExporting.value = true

  try {
    const itemIds = exportSettings.value.dataType === 'history' && selectedExportItems.value.length > 0
      ? selectedExportItems.value
      : undefined

    const corridorIds = exportSettings.value.dataType === 'history'
      && exportSettings.value.includeCorridorHistory
      && exportCorridorIds.value.length > 0
      ? exportCorridorIds.value
      : undefined

    const response = await exportsApi.createExport({
      dataType: exportSettings.value.dataType,
      format: exportSettings.value.format,
      dateFrom: exportSettings.value.dateFrom,
      dateTo: exportSettings.value.dateTo,
      itemIds,
      corridorIds,
    })

    exportJobId.value = response.job.id
    exportStatusMessage.value = 'Export queued. We will start processing shortly.'
    await pollExportStatus(response.job.id)
  }
 catch (error: any) {
    exportErrorMessage.value = error?.message || 'Failed to start export.'
    isExporting.value = false
  }
}

function handleExportSelected() {
  showExportModal.value = true
}

const gdprExportStatus = ref<string | null>(null)
const gdprExportError = ref<string | null>(null)
const showDeleteAccountModal = ref(false)
const deleteAccountConfirmText = ref('')
const deleteAccountConfirmed = ref(false)
const deleteAccountError = ref<string | null>(null)
const deleteAccountWarning = ref<string | null>(null)

const showDeleteWatchlistModal = ref(false)
const watchlistItemToDelete = ref<WatchlistItem | null>(null)

const deleteAccountReady = computed(() => {
  return deleteAccountConfirmed.value && deleteAccountConfirmText.value.trim().toUpperCase() === 'DELETE'
})

const requestGdprExport = async () => {
  gdprExportStatus.value = null
  gdprExportError.value = null
  try {
    const response = await dataExportApi.requestExport()
    gdprExportStatus.value = `Export requested (job ${response.job.id}). We'll notify you when it's ready.`
  }
 catch (error: any) {
    gdprExportError.value = error?.message || 'Failed to request GDPR export.'
  }
}

const openDeleteAccountModal = () => {
  showDeleteAccountModal.value = true
  deleteAccountConfirmText.value = ''
  deleteAccountConfirmed.value = false
  deleteAccountError.value = null
  deleteAccountWarning.value = null
}

const closeDeleteAccountModal = () => {
  if (accountDeleting.value) return
  showDeleteAccountModal.value = false
  deleteAccountConfirmText.value = ''
  deleteAccountConfirmed.value = false
  deleteAccountError.value = null
  deleteAccountWarning.value = null
}

const handleDeleteAccount = async () => {
  deleteAccountError.value = null
  deleteAccountWarning.value = null

  if (!deleteAccountReady.value) {
    deleteAccountError.value = 'Please confirm account deletion.'
    return
  }

  const result = await accountApi.deleteAccount()
  if (!result.ok) {
    deleteAccountError.value = result.error || 'Account deletion failed.'
    return
  }

  if (result.result?.warnings?.length) {
    deleteAccountWarning.value = result.result.warnings.join(', ')
  }
}

const openDeleteWatchlistModal = (item: WatchlistItem) => {
  watchlistItemToDelete.value = item
  showDeleteWatchlistModal.value = true
}

const closeDeleteWatchlistModal = () => {
  showDeleteWatchlistModal.value = false
  watchlistItemToDelete.value = null
}

const confirmDeleteWatchlistItem = () => {
  if (watchlistItemToDelete.value) {
    watchlistRemove(watchlistItemToDelete.value.id)
    closeDeleteWatchlistModal()
  }
}

// Graph data
const graphData = computed(() => {
  const history = selectedSnapshot.value.history
  if (!history.length) return []
  const series = history.slice(-120)
  const values = series.map(point => point.rate).filter(Number.isFinite)
  if (!values.length) return []
  const minRate = Math.min(...values)
  const maxRate = Math.max(...values)
  const range = maxRate - minRate || 1
  return series.map((point, index) => {
    const x = series.length === 1 ? 400 : (index / (series.length - 1)) * 400
    const normalized = (point.rate - minRate) / range
    const y = 170 - (normalized * 160)
    return { x, y: Math.max(10, Math.min(170, y)) }
  })
})

const graphPoints = computed(() => graphData.value.map(d => `${d.x},${d.y}`).join(' '))

// Top Movers from Watchlist
const topMoversLimit = computed(() => isPlus.value ? 5 : 3)
const topMoversFromWatchlist = computed(() => {
  if (!corridorWatchlistItems.value.length) return []

  // Deduplicate by corridor (from-to pair) to prevent showing the same corridor multiple times
  const seen = new Set<string>()
  const uniqueItems = corridorWatchlistItems.value.filter((item) => {
    const key = `${item.target.from}-${item.target.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return uniqueItems
    .map((item) => {
      const snapshot = getWatchlistSnapshot(item.id)
      if (snapshot.change === null || snapshot.change === undefined) return null
      return { ...item, change: snapshot.change }
    })
    .filter((item): item is WatchlistItem & {
      target: Extract<WatchTarget, { type: 'corridor' }>
      change: number
    } => (
      item !== null && item !== undefined && Number.isFinite(item.change)
    ))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, topMoversLimit.value)
})

const topMoversLoading = computed(() => {
  return corridorWatchlistItems.value.some(item => isWatchlistHistoryLoading(item.id))
})

async function handleAddWatchlist() {
  if (watchlistLimitReached.value) {
    if (!isPlus.value) {
      alert('Watchlist limit reached. Upgrade to Plus for up to 16 corridors.')
    }
 else {
      alert(`Watchlist limit reached (${limits.value.watchlistItems}). Remove a corridor to add another.`)
    }
    return
  }
  const target: WatchTarget = {
    type: 'corridor',
    from: newWatchlist.value.from,
    to: newWatchlist.value.to,
    method: 'bank',
  }
  const label = `${newWatchlist.value.from} → ${newWatchlist.value.to}`
  const result = await watchlistSave(target, { label })

  if (result.status === 'saved') {
    newWatchlist.value = { from: 'US', to: 'PH' }
  }
 else if (result.status === 'already_saved') {
    // Already in watchlist, just reset the form
    newWatchlist.value = { from: 'US', to: 'PH' }
  }
 else if (result.status === 'limit_reached' || result.status === 'error') {
    alert(result.message)
  }
}

const comparingCorridor = ref<string | null>(null)
const comparingSelectedCorridor = ref(false)

async function handleCompareClick(item: WatchlistItem) {
  if (comparingCorridor.value === item.id) return

  comparingCorridor.value = item.id

  if (item.target.type !== 'corridor') {
    comparingCorridor.value = null
    return
  }

  const url = getCorridorUrl(item.target.from, item.target.to)

  try {
    await navigateTo(url)
  }
 finally {
    comparingCorridor.value = null
  }
}

async function handleCompareSelectedCorridor() {
  if (comparingSelectedCorridor.value) return

  comparingSelectedCorridor.value = true

  const url = getCorridorUrl(selectedCorridor.value.from, selectedCorridor.value.to)

  try {
    await navigateTo(url)
  }
 finally {
    comparingSelectedCorridor.value = false
  }
}

function openAlert(item: WatchlistItem) {
  modal.open({ target: item.target, label: item.label, source: 'dashboard' })
}

function openCreateAlert() {
  if (alertsLimitReached.value) {
    if (!isPlus.value) {
      alert('Alert limit reached. Upgrade to Plus for up to 16 alerts.')
    }
 else {
      alert(`Alert limit reached (${limits.value.alerts}). Disable or delete an alert to add another.`)
    }
    return
  }
  const first = corridorWatchlistItems.value[0]
  const fallbackTarget: WatchTarget = { type: 'corridor', from: 'US', to: 'PH', method: 'bank' }
  modal.open({
    target: first?.target ?? fallbackTarget,
    label: first?.label ?? 'US → PH',
    source: 'dashboard',
  })
}

function formatMethod(method: string | null | undefined): string {
  if (!method) return 'Bank'
  const methodMap: Record<string, string> = {
    bank: 'Bank',
    cash: 'Cash Pickup',
    wallet: 'Mobile Wallet',
    airtime: 'Airtime',
    card: 'Card',
    bank_deposit: 'Bank',
    cash_pickup: 'Cash Pickup',
    mobile_wallet: 'Mobile Wallet',
  }
  return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ')
}

function formatTarget(target: WatchTarget) {
  if (target.type === 'corridor') return `${target.from} → ${target.to} • ${formatMethod(target.method)}`
  if (target.type === 'fxPair') return `${target.base}/${target.quote}`
  return ''
}

function formatRule(rule: AlertRule) {
  const op = rule.comparator === 'gte' ? '≥' : rule.comparator === 'lte' ? '≤' : rule.comparator === 'gt' ? '>' : '<'
  const currency = rule.metric === 'sendScore' ? '' : (rule.currency ? ` ${rule.currency}` : '')
  return `${rule.metric} ${op} ${rule.value}${currency}`
}

function formatComparator(comparator: string) {
  switch (comparator) {
    case 'gte': return '≥'
    case 'lte': return '≤'
    case 'gt': return '>'
    case 'lt': return '<'
    default: return comparator
  }
}

function formatFrequency(frequency: string) {
  switch (frequency) {
    case 'once': return 'Notify once'
    case 'weekly': return 'Weekly alerts'
    case 'daily': return 'Daily alerts'
    default: return frequency
  }
}

function formatCurrency(amount: number, countryCode: string): string {
  const currency = getCurrencyForCountry(countryCode.toUpperCase()) || 'USD'
  return formatMoney(amount, { currency, maximumFractionDigits: 0 })
}

function formatMetricLabel(metric: string) {
  switch (metric) {
    case 'recipientGets': return 'Recipient gets'
    case 'totalCost': return 'Total cost'
    case 'fee': return 'Fee'
    case 'rate': return 'Exchange rate'
    case 'midMarketRate': return 'Mid-market rate'
    case 'sendScore': return 'Intelligent Alert'
    case 'index': return 'Index'
    default: return metric
  }
}

function getWatchlistAlertCount(watchlistItemId: string) {
  return alertItems.value.filter(a => a.watchlistItemId === watchlistItemId).length
}

function getAlertSnapshot(alert: { watchlistItemId: string }) {
  return getWatchlistSnapshot(alert.watchlistItemId)
}

function getWatchlistChartData(itemId: string) {
  return getWatchlistSnapshot(itemId).history.map(point => point.rate)
}

function getWatchlistChartPoints(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const width = 400
  const height = 120
  const padding = 15

  const points = data.map((rate, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const normalized = (rate - min) / range
    const y = height - padding - (normalized * (height - 2 * padding))
    return `${x},${y}`
  })

  return points.join(' ')
}

function getWatchlistChartPath(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const width = 400
  const height = 120
  const padding = 15

  let path = ''
  data.forEach((rate, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const normalized = (rate - min) / range
    const y = height - padding - (normalized * (height - 2 * padding))
    if (i === 0) {
      path = `M ${x},${y}`
    }
 else {
      path += ` L ${x},${y}`
    }
  })

  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding)
  const firstX = padding
  path += ` L ${lastX},${height} L ${firstX},${height} Z`

  return path
}

function getWatchlistChartCurrentY(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (data.length < 1) return 60
  const lastRate = data[data.length - 1]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const height = 120
  const padding = 15
  const normalized = (lastRate - min) / range
  return height - padding - (normalized * (height - 2 * padding))
}

function getWatchlistStats(itemId: string) {
  const data = getWatchlistChartData(itemId)
  if (!data.length) {
    return {
      high: '—',
      low: '—',
      avg: '—',
    }
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const avg = data.reduce((a, b) => a + b, 0) / data.length

  return {
    high: formatRateValue(max),
    low: formatRateValue(min),
    avg: formatRateValue(avg),
  }
}

function getAlertCorridor(alert: { watchlistItemId: string }) {
  const item = watchlistFindById(alert.watchlistItemId)
  if (item?.target?.type === 'corridor') {
    return { from: item.target.from, to: item.target.to }
  }
  return { from: 'US', to: 'PH' }
}

function getAlertProgress(alert: { rule: AlertRule, watchlistItemId: string }) {
  const snapshot = getAlertSnapshot(alert)
  const current = snapshot.rateValue
  const target = alert.rule.value
  if (!current || !Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0
  }
  if (alert.rule.comparator === 'gte' || alert.rule.comparator === 'gt') {
    return (current / target) * 100
  }
  return (target / current) * 100
}

function editAlert(alert: { id: string, watchlistItemId: string }) {
  const existingAlert = alertsFindById(alert.id)
  const item = watchlistFindById(alert.watchlistItemId)
  if (item && existingAlert) {
    modal.open({
      target: item.target,
      label: item.label,
      source: 'dashboard',
      alertId: alert.id,
    })
  }
}

useHead({
  title: 'Dashboard | Remit-Scout',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
