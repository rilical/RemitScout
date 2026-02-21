<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Public preview (no Plus required) -->
    <div
      v-if="!isPlus"
      class="min-h-screen"
    >
      <!-- Hero -->
      <div class="py-16 px-page-x">
        <div class="mx-auto max-w-page">
          <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl space-y-4">
              <h1 class="text-hero font-bold leading-tight">
                <span class="text-white">Remit</span><span class="text-brand-600">-</span><span class="text-brand-600">Pulse</span>
              </h1>
              <p class="text-body-lg text-neutral-300 leading-relaxed">
                Market intelligence for remittance pricing across 150+ corridors.
              </p>
              <div class="flex flex-wrap items-center gap-3">
                <span class="rounded-full border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-body-sm font-semibold text-neutral-200">
                  18 Charts
                </span>
                <span class="rounded-full border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-body-sm font-semibold text-neutral-200">
                  4 Categories
                </span>
                <span class="rounded-full border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-body-sm font-semibold text-neutral-200">
                  150+ Corridors
                </span>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <NuxtLink
                to="/plus"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-bold text-white hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Icon
                  name="sparkles"
                  :size="20"
                  class="text-current"
                />
                Unlock Plus
              </NuxtLink>
              <NuxtLink
                to="/sign-in"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-6 py-3 text-body font-semibold text-white hover:bg-neutral-700 transition-colors"
              >
                Sign in
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Movers + Screener -->
      <div class="px-page-x pb-12">
        <div class="mx-auto max-w-page">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div class="lg:col-span-6">
              <PulseMoversList
                variant="public"
                :limit="10"
              />
            </div>

            <div class="lg:col-span-6">
              <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6 shadow-lg">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <h2 class="text-body-lg font-bold text-white">
                    Your Watchlist Screener
                  </h2>
                  <span class="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-neutral-300">
                    Locked
                  </span>
                </div>
                <p class="text-body-sm text-neutral-400 mb-4">
                  Enterprise unlocks the watchlist screener with best-provider ranking, spread risk, and freshness across corridors.
                </p>
                <div class="space-y-3 opacity-70 blur-[1.5px] select-none pointer-events-none">
                  <div
                    v-for="row in previewScreenerRows"
                    :key="row.corridor"
                    class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-4"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="text-body-sm font-semibold text-white">
                        {{ row.flag }} {{ row.corridor }}
                      </div>
                      <div class="rounded-lg bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-200 border border-neutral-700">
                        {{ row.badge }}
                      </div>
                    </div>
                    <div class="mt-2 text-body-sm text-neutral-400">
                      {{ row.detail }}
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                      <div>Spread (bps)</div>
                      <div class="text-right">
                        Updated
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Preview Grid -->
      <div class="border-t border-neutral-800 px-page-x py-16">
        <div class="mx-auto max-w-page">
          <div class="mb-8">
            <h2 class="text-h2 font-bold text-white">
              What's Inside Pulse
            </h2>
            <p class="mt-2 text-body text-neutral-400">
              18 market charts across pricing, competition, volatility, and operational coverage.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="chart in previewCharts"
              :key="chart.id"
              class="group relative rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden transition-all duration-200 hover:border-brand-600"
            >
              <div class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-1 text-body-sm font-semibold text-brand-600">
                <svg
                  class="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                {{ chart.gate }}
              </div>

              <div class="p-5">
                <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {{ chart.categoryLabel }}
                </div>
                <h3 class="mb-2 text-body-lg font-bold text-white group-hover:text-brand-600 transition-colors">
                  {{ chart.title }}
                </h3>
                <p class="mb-4 text-body-sm text-neutral-400">
                  {{ chart.description }}
                </p>

                <div class="relative h-16 w-full overflow-hidden rounded-lg">
                  <svg
                    viewBox="0 0 200 60"
                    class="h-full w-full opacity-40 blur-[1px]"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        :id="`preview-grad-${chart.id}`"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          style="stop-color: #2563EB; stop-opacity: 0.3"
                        />
                        <stop
                          offset="100%"
                          style="stop-color: #2563EB; stop-opacity: 0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      :d="chart.areaPath"
                      :fill="`url(#preview-grad-${chart.id})`"
                    />
                    <polyline
                      :points="chart.sparkline"
                      fill="none"
                      stroke="#2563EB"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div class="flex items-center justify-between border-t border-neutral-700 px-5 py-3">
                <NuxtLink
                  :to="chart.ctaTo"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors inline-flex items-center gap-1.5"
                >
                  {{ chart.ctaLabel }}
                  <svg
                    class="h-3.5 w-3.5"
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
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Showcase: Plus vs Enterprise -->
      <div class="border-t border-neutral-800 px-page-x py-16">
        <div class="mx-auto max-w-page">
          <div class="mb-8 text-center">
            <h2 class="text-h2 font-bold text-white">
              Choose Your Plan
            </h2>
            <p class="mt-2 text-body text-neutral-400">
              From market snapshots to institutional analytics.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Plus -->
            <div class="rounded-2xl border border-brand-600/30 bg-neutral-800 p-8">
              <div class="mb-6">
                <h3 class="text-h4 font-bold text-white">
                  Plus
                </h3>
                <p class="mt-1 text-body-sm text-neutral-400">
                  Market snapshots, trends, and basic deep dives.
                </p>
              </div>
              <ul class="space-y-3">
                <li
                  v-for="f in plusFeatures"
                  :key="f"
                  class="flex items-start gap-3"
                >
                  <svg
                    class="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-body-sm text-neutral-200">{{ f }}</span>
                </li>
              </ul>
              <NuxtLink
                to="/plus"
                class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-bold text-white hover:bg-brand-700 transition-colors"
              >
                Get Plus
              </NuxtLink>
            </div>

            <!-- Enterprise -->
            <div class="relative rounded-2xl border border-brand-600 bg-neutral-800 p-8">
              <span class="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Recommended
              </span>
              <div class="mb-6">
                <h3 class="text-h4 font-bold text-white">
                  Enterprise
                </h3>
                <p class="mt-1 text-body-sm text-neutral-400">
                  Full analytics, screener, and institutional data access.
                </p>
              </div>
              <ul class="space-y-3">
                <li
                  v-for="f in enterpriseFeatures"
                  :key="f"
                  class="flex items-start gap-3"
                >
                  <svg
                    class="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-body-sm text-neutral-200">{{ f }}</span>
                </li>
              </ul>
              <NuxtLink
                to="/contact?type=enterprise&topic=pulse"
                class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-body font-bold text-white hover:bg-brand-700 transition-colors"
              >
                Contact Sales
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Final CTA Banner -->
      <div class="border-t border-neutral-800 px-page-x py-16">
        <div class="mx-auto max-w-page">
          <div class="rounded-2xl border border-brand-600/40 bg-gradient-to-r from-brand-600/20 via-neutral-800 to-brand-600/20 p-10 text-center">
            <h2 class="text-h2 font-bold text-white">
              Unlock Pulse
            </h2>
            <p class="mx-auto mt-3 max-w-lg text-body text-neutral-300">
              Start with Plus for market snapshots, or go Enterprise for full analytics.
            </p>
            <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <NuxtLink
                to="/plus"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-body font-bold text-white hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Icon
                  name="sparkles"
                  :size="20"
                  class="text-current"
                />
                Get Plus
              </NuxtLink>
              <NuxtLink
                to="/contact?type=enterprise&topic=pulse"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-8 py-3.5 text-body font-semibold text-white hover:bg-neutral-700 transition-colors"
              >
                Contact Enterprise Sales
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pulse Content: Only show if Plus member -->
    <div v-else>
      <div class="border-b border-neutral-700 bg-neutral-800">
        <div class="container py-12 lg:py-16">
          <!-- Data Status Badge (no fabricated freshness) -->
          <div class="flex items-center gap-4 mb-8">
            <div
              class="flex items-center gap-2.5 rounded-full border px-4 py-2"
              :class="store.lastUpdated ? 'bg-success-600/15 border-success-600/30' : 'bg-neutral-900 border-neutral-700'"
            >
              <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="store.lastUpdated ? 'bg-success-600' : 'bg-neutral-500'"
                aria-hidden="true"
              />
              <span class="text-body-sm font-semibold text-white">
                {{ pulseUpdatedBadgeLabel }}
              </span>
            </div>
            <span class="text-body-sm text-neutral-400">Market analytics for remittance pricing</span>
            <span
              v-if="pulseEnvironmentBadge"
              class="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300"
            >
              {{ pulseEnvironmentBadge }}
            </span>
          </div>

          <!-- Main Header Content -->
          <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <!-- Title and Description -->
            <div class="flex-1 space-y-4">
              <div>
                <h1 class="text-hero font-bold text-white mb-4 leading-tight">
                  <span class="text-white">Remit</span><span class="text-brand-600">-</span><span class="text-brand-600">Pulse</span>
                </h1>
                <p class="text-body-lg text-neutral-300 max-w-2xl leading-relaxed">
                  Market intelligence for remittance pricing. Track spreads, markups, provider performance, volatility, and reliability across corridors and payment methods.
                </p>
              </div>
              <p class="text-body-sm text-neutral-400 max-w-2xl">
                Built for analysts, researchers, and enterprise teams who need accurate, up-to-date pricing data.
              </p>
            </div>

            <!-- Action Links -->
            <div class="flex flex-col items-end gap-4">
              <!-- View Mode Toggle -->
              <div
                v-if="isPro"
                class="flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-900 p-1"
              >
                <button
                  type="button"
                  class="rounded-lg px-4 py-2 text-body-sm font-bold uppercase tracking-wider transition-colors"
                  :class="store.viewMode === 'sender' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="setViewMode('sender')"
                >
                  Decision
                </button>
                <button
                  type="button"
                  class="rounded-lg px-4 py-2 text-body-sm font-bold uppercase tracking-wider transition-colors"
                  :class="store.viewMode === 'analyst' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="setViewMode('analyst')"
                >
                  Deep Dive
                </button>
              </div>
              <div
                v-else
                class="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-body-sm font-bold uppercase tracking-wider text-white"
              >
                Sender View
              </div>
              <span class="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-body-sm font-medium text-neutral-300">
                Verified Pipeline v2.4.1
              </span>
              <div class="flex flex-col gap-3">
                <NuxtLink
                  to="/contact?type=enterprise&topic=pulse"
                  class="inline-flex items-center gap-2.5 rounded-xl border-2 border-primary-500 bg-primary-500 px-6 py-3 text-body font-semibold text-white hover:bg-brand-600 hover:border-brand-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  Enterprise
                  <Icon
                    name="arrow-right"
                    :size="20"
                    class="text-current"
                  />
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="inline-flex items-center gap-2.5 rounded-xl border-2 border-success-600 bg-success-600 px-6 py-3 text-body font-semibold text-white hover:bg-success-600 hover:border-success-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  Methodology
                  <Icon
                    name="arrow-right"
                    :size="20"
                    class="text-current"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col py-8">
        <!-- Sender-First Gauge (mobile-first: renders at top on small screens) -->
        <div
          id="decision"
          ref="decisionPanelRef"
          class="mb-10 px-page-x order-first md:order-none"
        >
          <div class="mx-auto max-w-page">
            <div class="space-y-6">
              <PulseSmartGauge />

              <button
                type="button"
                class="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-body font-bold text-white hover:bg-brand-700 transition-colors"
                @click="handleCreateAlert"
              >
                Set alert
              </button>

              <PulseHeadlineTiles
                :tiles="headlineTiles"
                :loading="headlineLoading"
                @tile-click="handleHeadlineTileClick"
              />

              <PulseNarrative
                :summary="narrative?.summary"
                :generated-at="narrative?.generatedAt || null"
                :loading="highlightsLoading"
              />

              <PulsePersonalHistory
                :data="personalHistory"
                :loading="highlightsLoading"
              />

              <PulseHeroChart metric="rate" />

              <PulseMarketQuotes />
            </div>

            <!-- Actions Bar -->
            <div class="mt-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="text-body-sm font-semibold text-white">
                    Actions
                  </div>
                  <div class="text-body-sm text-neutral-400">
                    Compare now, set a smart alert, and export a snapshot for your records.
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    :to="compareCorridorUrl"
                    class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-bold text-white hover:bg-brand-700 transition-colors"
                  >
                    Compare quotes
                  </NuxtLink>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                    @click="handleAddToWatchlist"
                  >
                    Add to watchlist
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                    @click="handleCreateAlert"
                  >
                    Create alert
                  </button>
                  <NuxtLink
                    :to="{ path: '/dashboard', query: { tab: 'account', section: 'notifications' } }"
                    class="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                  >
                    Enable notifications
                  </NuxtLink>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="snapshotExporting"
                    @click="downloadSnapshotCsv"
                  >
                    {{ snapshotExporting ? 'Exporting...' : 'Export snapshot CSV' }}
                  </button>
                </div>
              </div>

              <div
                v-if="actionError || actionStatus || snapshotExportError || snapshotExportStatus"
                class="mt-3 text-body-sm"
              >
                <p
                  v-if="actionError"
                  class="text-danger-600"
                >
                  {{ actionError }}
                </p>
                <p
                  v-else-if="snapshotExportError"
                  class="text-danger-600"
                >
                  {{ snapshotExportError }}
                </p>
                <p
                  v-else
                  class="text-neutral-400"
                >
                  {{ actionStatus || snapshotExportStatus }}
                </p>
              </div>
            </div>

            <div
              v-if="isPro && store.viewMode === 'sender'"
              class="mt-4 rounded-xl border border-neutral-700 bg-neutral-900/40 p-4 text-body-sm text-neutral-300"
            >
              Want deeper analytics (dispersion, reliability, deep dives)? Switch to Deep Dive.
              <button
                type="button"
                class="ml-2 inline-flex items-center gap-2 text-brand-600 hover:text-brand-500 font-semibold"
                @click="setViewMode('analyst')"
              >
                Switch to Deep Dive →
              </button>
            </div>
          </div>
        </div>

        <!-- Screener-first (Enterprise) -->
        <div class="mb-8 px-page-x order-2 md:order-none">
          <div class="mx-auto max-w-page grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div
              v-if="isPro && pulseScreenerEnabled"
              class="lg:col-span-7"
            >
              <PulseScreener
                :rows="screenerRows"
                :loading="screenerLoading"
                :error="screenerError"
                :selected-corridor-id="store.corridor.corridorId || null"
                :pinned-corridor-ids="effectivePinnedCorridorIds"
                @select="handleScreenerSelect"
                @pin="handlePinCorridor"
                @unpin="handleUnpinCorridor"
              />
            </div>

            <div :class="isPro && pulseScreenerEnabled ? 'lg:col-span-5' : 'lg:col-span-12'">
              <PulseMoversList
                variant="plus"
                :limit="10"
                :selected-corridor-id="store.corridor.corridorId || null"
                @select="handleMoverSelect"
                @added="handleMoverAdded"
              />
            </div>
          </div>

          <div class="mx-auto max-w-page mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-body-sm text-neutral-400">
              <template v-if="isPro && pulseScreenerEnabled">
                Tip: Click a screener row or mover to load the decision panel.
                <span
                  v-if="screenerUpdatedAt"
                  class="ml-2 text-neutral-500"
                >Screener {{ formatUpdatedLabel(screenerUpdatedAt) }}</span>
              </template>
              <template v-else>
                Tip: Click a mover to load the decision panel below.
              </template>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="filtersForcedVisible"
              @click="toggleAdvancedFilters"
            >
              {{ filtersForcedVisible ? 'Filters (required)' : (filtersVisible ? 'Hide filters' : 'Show filters') }}
            </button>
          </div>
        </div>

        <!-- Advanced Filters (optional) -->
        <div
          v-if="filtersVisible"
          class="mb-8 px-page-x"
        >
          <div class="mx-auto max-w-page">
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6 shadow-lg">
              <div class="mb-4">
                <h2 class="text-body-lg font-bold text-white mb-1">
                  Advanced Filters
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Override the selected corridor, amount, and timeframe.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
                <!-- Tracked Corridor -->
                <div class="lg:col-span-10">
                  <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wide text-neutral-400">
                    Tracked corridor
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedCorridorKey"
                      class="h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 pr-10 text-body-sm font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="trackedCorridors.length === 0"
                      @change="handleCorridorSelect"
                    >
                      <option
                        v-for="corridor in trackedCorridors"
                        :key="corridor.corridorId || corridor.value"
                        :value="corridor.corridorId || corridor.value"
                        class="bg-neutral-900"
                      >
                        {{ corridor.fromFlag }} {{ corridor.label }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <Icon
                        name="chevron-down"
                        :size="16"
                        class="text-neutral-400"
                      />
                    </div>
                  </div>
                  <p
                    v-if="trackedCorridors.length === 0"
                    class="mt-2 text-body-sm text-neutral-400"
                  >
                    No tracked corridors are available right now.
                  </p>
                  <p
                    v-else-if="corridorCoverageLabel"
                    class="mt-2 text-body-sm text-neutral-400"
                  >
                    {{ corridorCoverageLabel }}
                  </p>
                </div>

                <!-- Amount Input -->
                <div class="lg:col-span-2">
                  <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wide text-neutral-400">
                    Amount
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="amountInput"
                      type="number"
                      min="1"
                      step="1"
                      class="h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 pr-4 text-body-sm font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                      placeholder="1000"
                      @input="handleAmountInput"
                    >
                  </div>
                </div>
              </div>

              <!-- Timeframe Toggle -->
              <div class="mt-4">
                <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wide text-neutral-400">
                  Timeframe
                </label>
                <div class="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
                  <button
                    v-for="tf in timeframes"
                    :key="tf"
                    class="flex-1 rounded-md px-3 py-2.5 text-body-sm font-semibold transition-colors"
                    :class="store.timeframe === tf
                      ? 'bg-brand-600 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700'"
                    @click="store.setTimeframe(tf)"
                  >
                    {{ tf }}
                  </button>
                </div>
              </div>

              <!-- Coverage Summary -->
              <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-700 pt-4 text-body-sm text-neutral-400">
                <span>{{ summary ? `${formatCount(summary.quotesInRange)} quotes in range` : 'Loading coverage...' }}</span>
                <span class="text-neutral-600">|</span>
                <span>{{ summary ? `${summary.providersIncluded} providers included` : '-' }}</span>
                <span class="text-neutral-600">|</span>
                <span>{{ summary ? `Methods: ${formatMethods(summary.methodsIncluded)}` : 'Methods: Bank' }}</span>
                <span class="text-neutral-600">|</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="summary?.lastUpdated"
                    class="relative flex h-2 w-2"
                    aria-hidden="true"
                  >
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                  </span>
                  <span>{{ formatUpdatedLabel(summary?.lastUpdated || null) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Decision panel is now rendered above with order-first on mobile -->

        <div v-if="store.viewMode === 'analyst'">
          <!-- Navigation Bar -->
          <div class="sticky top-[72px] z-sticky -mx-page-x mb-6 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
            <div class="container flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400">
                <button
                  class="hover:text-white"
                  @click="scrollToSection('snapshot')"
                >
                  Snapshot
                </button>
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('dispersion')"
                >
                  Pricing Dispersion
                </button>
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('competition')"
                >
                  Provider Competition
                </button>
                <template v-if="isPro">
                  <span class="text-neutral-700">|</span>
                  <button
                    class="hover:text-white"
                    @click="scrollToSection('reliability')"
                  >
                    Reliability
                  </button>
                  <span class="text-neutral-700">|</span>
                  <button
                    class="hover:text-white"
                    @click="scrollToSection('indices')"
                  >
                    Indices
                  </button>
                  <span class="text-neutral-700">|</span>
                  <button
                    class="hover:text-white"
                    @click="scrollToSection('risk')"
                  >
                    Risk & Anomalies
                  </button>
                </template>
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('deep-dives')"
                >
                  Deep Dives
                </button>
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('exports')"
                >
                  Exports
                </button>
                <template v-if="isPro">
                  <span class="text-neutral-700">|</span>
                  <button
                    class="hover:text-white"
                    @click="scrollToSection('enterprise')"
                  >
                    Enterprise
                  </button>
                </template>
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('methodology')"
                >
                  Methodology
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-neutral-700"
                  @click="scrollToSection('exports')"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
          <!-- 1. Market Snapshot - Overview KPIs -->
          <section
            id="snapshot"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'snapshot' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 class="text-h3 font-bold text-white">
                    Market Snapshot
                  </h2>
                  <p class="text-body-sm text-neutral-400">
                    Executive summary for the selected corridor and timeframe.
                  </p>
                </div>
                <div class="flex items-center gap-3 text-body-sm text-neutral-500">
                  <label class="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1">
                    <span class="text-neutral-400">Metric</span>
                    <select
                      v-model="activeMetric"
                      class="bg-transparent text-neutral-200 focus:outline-none"
                    >
                      <option value="rate">Effective Rate</option>
                      <option value="markup">FX Markup (bps)</option>
                    </select>
                  </label>
                  <span>{{ snapshotSummary ? formatUpdatedLabel(snapshotSummary.lastUpdated || null) : 'Loading snapshot...' }}</span>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <button
                  v-for="kpi in snapshotSummary?.kpis"
                  :key="kpi.id"
                  type="button"
                  class="rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-left transition-colors hover:border-brand-600/60"
                  @click="handleKpiClick(kpi.id)"
                >
                  <div class="flex items-center justify-between text-body-sm text-neutral-500">
                    <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ kpi.label }}</span>
                    <span
                      class="text-neutral-600 flex-shrink-0 ml-1"
                      :title="kpi.tooltip"
                    >(i)</span>
                  </div>
                  <div class="mt-2 text-h3 font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                    {{ kpi.value }}
                  </div>
                  <div
                    class="mt-1 text-body-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="getDeltaClass(kpi.deltaType)"
                  >
                    {{ kpi.delta }}
                  </div>
                </button>
                <template v-if="!snapshotSummary">
                  <div
                    v-for="i in 5"
                    :key="`kpi-skeleton-${i}`"
                    class="rounded-xl border border-neutral-700 bg-neutral-800 p-4"
                  >
                    <SkeletonBlock
                      width="6rem"
                      height="16"
                      tone="dark"
                    />
                    <SkeletonBlock
                      class="mt-3"
                      width="5rem"
                      height="24"
                      tone="dark"
                    />
                    <SkeletonBlock
                      class="mt-2"
                      width="7rem"
                      height="12"
                      tone="dark"
                    />
                  </div>
                </template>
              </div>

              <div class="mt-6 rounded-xl border border-neutral-700 bg-neutral-800 p-6">
                <div class="text-body-sm uppercase tracking-wider text-neutral-500 mb-2">
                  Executive Note
                </div>
                <p class="text-body-sm text-neutral-200">
                  {{ executiveNote || 'Loading insight...' }}
                </p>
              </div>
            </div>
          </section>

          <!-- 2. Pricing Analysis - Main Charts -->
          <section
            id="dispersion"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'dispersion' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Pricing Analysis
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Effective rates, market spread, and pricing dispersion over time.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div
                  id="snapshot-chart"
                  class="lg:col-span-8"
                  :class="highlightedSection === 'snapshot-chart' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
                >
                  <PulseHeroChart :metric="activeMetric" />
                </div>
                <div
                  v-if="isPro"
                  id="market-spread"
                  class="lg:col-span-4"
                  :class="highlightedSection === 'market-spread' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
                >
                  <PulseMarketDepth />
                </div>
              </div>
            </div>
          </section>

          <!-- 3. Provider Benchmarking (Enterprise only) -->
          <section
            v-if="isPro"
            id="competition"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'competition' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Provider Benchmarking
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Leaderboard and win-share timeline across providers.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-6">
                <PulseProviderLeaderboard />
                <PulseProviderHeatmap />
              </div>
            </div>
          </section>

          <!-- 4. Bank vs Specialist Comparison -->
          <section
            id="bank-gap"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'bank-gap' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Bank vs Specialist Comparison
                </h2>
                <p class="text-body-sm text-neutral-400">
                  See how traditional banks compare to specialist providers.
                </p>
              </div>
              <PulseBankComparison />
            </div>
          </section>

          <!-- 4.5. Operational Coverage -->
          <section
            id="operational-coverage"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'operational-coverage' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <PulseOperationalCoverage />
            </div>
          </section>

          <!-- 5. Reliability & Coverage (Enterprise only) -->
          <section
            v-if="isPro"
            id="reliability"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'reliability' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Reliability & Coverage
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Quote success rates, method support, and data freshness.
                </p>
              </div>
              <PulseReliabilityCoverage :is-pro="isPro" />
            </div>
          </section>

          <!-- 5b. Gold Indices Health (Enterprise only) -->
          <section
            v-if="isPro"
            id="indices"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'indices' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Gold Indices Health
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Coverage confidence, provider eligibility, and suppression diagnostics for TEER/RCI/RVI.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <button
                  v-for="chart in indicesCharts"
                  :key="chart.id"
                  type="button"
                  class="rounded-xl border border-neutral-700 bg-neutral-800 p-5 text-left transition-colors hover:border-brand-600/60"
                  @click="navigateToChart(chart.id)"
                >
                  <div class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {{ chart.categoryLabel }}
                  </div>
                  <div class="mt-1 text-body font-bold text-white">
                    {{ chart.title }}
                  </div>
                  <p class="mt-2 text-body-sm text-neutral-400">
                    {{ chart.description }}
                  </p>
                  <div
                    v-if="chartData[chart.id]?.insight && !isIndicesChartPending(chart.id)"
                    class="mt-3 rounded-lg bg-neutral-900 px-3 py-2 text-body-sm text-neutral-300"
                  >
                    {{ chartData[chart.id]?.insight }}
                  </div>
                  <div
                    v-else-if="isIndicesChartPending(chart.id)"
                    class="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-body-sm text-neutral-400"
                  >
                    Data pending for this corridor.
                  </div>
                  <div
                    v-if="indicesCardUpdatedAtLabel(chart.id)"
                    class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    {{ indicesCardUpdatedAtLabel(chart.id) }}
                  </div>
                  <div class="mt-3 text-body-sm font-semibold text-brand-600 hover:text-brand-500">
                    View chart →
                  </div>
                </button>
              </div>
            </div>
          </section>

          <!-- 6. Risk & Anomalies (Enterprise only) -->
          <section
            v-if="isPro"
            id="risk"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'risk' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">
                  Risk & Anomalies
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Event feed with anomaly signals and recommended actions.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
                <div class="lg:col-span-7 flex">
                  <div class="flex-1">
                    <PulseEventFeed @view="navigateToChart" />
                  </div>
                </div>
                <div class="lg:col-span-5 flex">
                  <div class="flex-1">
                    <PulseArbitrageAlert />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 7. Deep Dives - Historical Charts -->
          <section
            id="deep-dives"
            ref="deepDivesRef"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'deep-dives' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="mb-6">
                <h2 class="text-h3 font-bold text-white">
                  Deep Dives
                </h2>
                <p class="text-body-sm text-neutral-400">
                  Historical analysis and detailed chart breakdowns.
                </p>
              </div>
              <PulseChartGrid
                :chart-data="chartData"
                :chart-availability="chartAvailability"
                :filters="legacyFilters"
                :pulse-level="pulseLevel"
                @view="navigateToChart"
                @share="handleShare"
                @embed="handleEmbed"
              />
            </div>
          </section>

          <!-- 8. Exports & Integrations -->
          <section
            id="exports"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'exports' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
                <div class="border-b border-neutral-700 px-6 py-4">
                  <h2 class="text-body-lg font-bold text-white">
                    Exports & Integrations
                  </h2>
                  <p class="text-body-sm text-neutral-400">
                    Use Pulse data in reports, workflows, and pricing systems.
                  </p>
                </div>
                <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">
                      Download Snapshot
                    </div>
                    <p class="mt-1 text-body-sm text-neutral-400">
                      CSV export for the selected corridor. Plus exports are capped at 30 days.
                    </p>
                    <button
                      type="button"
                      class="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="snapshotExporting"
                      @click="downloadSnapshotCsv"
                    >
                      {{ snapshotExporting ? 'Exporting...' : 'Download CSV' }}
                    </button>
                    <p
                      v-if="snapshotExportStatus"
                      class="mt-2 text-[11px] text-neutral-400"
                    >
                      {{ snapshotExportStatus }}
                    </p>
                    <p
                      v-if="snapshotExportError"
                      class="mt-2 text-[11px] text-danger-600"
                    >
                      {{ snapshotExportError }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">
                      Embed Charts
                    </div>
                    <p class="mt-1 text-body-sm text-neutral-400">
                      Share corridor charts with attribution and timestamps.
                    </p>
                    <button class="mt-3 w-full rounded-lg border border-neutral-600 px-3 py-2 text-body-sm font-semibold text-white">
                      Get Embed Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 8b. Enterprise Access (Enterprise only) -->
          <section
            v-if="isPro"
            id="enterprise"
            class="mb-10 px-page-x"
            :class="highlightedSection === 'enterprise' ? 'ring-1 ring-primary-500/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <div class="rounded-xl border border-primary-500/40 bg-gradient-to-br from-primary-500/15 to-neutral-800 overflow-hidden">
                <div class="border-b border-primary-500/40 px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/30">
                      <Icon
                        name="building-library"
                        :size="20"
                        class="text-primary-400"
                      />
                    </div>
                    <div>
                      <h2 class="text-body-lg font-bold text-white">
                        Enterprise Access
                      </h2>
                      <p class="text-body-sm text-neutral-400">
                        API, webhooks, extended history, and advanced signals for enterprise teams
                      </p>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-4">
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <Icon
                        name="document-text"
                        :size="16"
                        class="text-primary-400"
                      />
                      <div class="text-body-sm font-semibold text-white">
                        API Access
                      </div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      RESTful API for programmatic access to current and historical pricing data
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <Icon
                        name="share"
                        :size="16"
                        class="text-primary-400"
                      />
                      <div class="text-body-sm font-semibold text-white">
                        Webhooks
                      </div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Event notifications for price changes, anomalies, and market shifts
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <Icon
                        name="clock"
                        :size="16"
                        class="text-primary-400"
                      />
                      <div class="text-body-sm font-semibold text-white">
                        Extended History
                      </div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Access to multi-year historical data for trend analysis and backtesting
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <Icon
                        name="chart-bar"
                        :size="16"
                        class="text-primary-400"
                      />
                      <div class="text-body-sm font-semibold text-white">
                        Advanced Signals
                      </div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Additional market signals, volatility metrics, and predictive indicators
                    </p>
                  </div>
                </div>
                <div class="border-t border-primary-500/40 px-6 py-4">
                  <NuxtLink
                    to="/contact?type=enterprise&topic=pulse"
                    class="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-body-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    Learn More About Enterprise Access
                    <Icon
                      name="arrow-right"
                      :size="16"
                      class="text-current"
                    />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </section>

          <!-- 9. Report Discrepancy -->
          <section class="py-12 sm:py-16 bg-neutral-900 w-full">
            <div class="container">
              <div class="text-center mb-8">
                <h2 class="text-h3 font-bold text-white mb-3">
                  See something that doesn't look right?
                </h2>
                <p class="text-body text-neutral-300 max-w-2xl mx-auto">
                  If you notice a mismatch between our displayed quote and checkout, we want to know.
                  We investigate every report and update our data pipeline accordingly.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <NuxtLink
                  to="/contact"
                  class="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl border-2 border-neutral-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
                >
                  <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon
                      name="exclamation-triangle"
                      :size="24"
                      class="text-white"
                    />
                  </div>
                  <div class="text-center">
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      Report a rate issue
                    </h3>
                    <p class="text-body-sm text-neutral-600">
                      Spotted a discrepancy between our quote and your checkout? Let us know so we can investigate and improve our data.
                    </p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/methodology"
                  class="flex flex-col items-center gap-4 p-8 bg-surface rounded-2xl border-2 border-neutral-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
                >
                  <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon
                      name="book-open"
                      :size="24"
                      class="text-white"
                    />
                  </div>
                  <div class="text-center">
                    <h3 class="text-body-lg font-bold text-neutral-900 mb-2">
                      View our methodology
                    </h3>
                    <p class="text-body-sm text-neutral-600">
                      See exactly how we collect quotes, calculate scores, and ensure data quality across all providers.
                    </p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </section>

          <!-- 11. Our Impact So Far -->
          <TrustMetricsStrip bg-class="bg-brand-600" />
        </div>
      </div>

      <PulseShareModal
        v-if="shareModalChart"
        :chart-id="shareModalChart"
        :filters="legacyFilters"
        mode="share"
        @close="shareModalChart = null"
      />

      <PulseShareModal
        v-if="embedModalChart"
        :chart-id="embedModalChart"
        :filters="legacyFilters"
        mode="embed"
        @close="embedModalChart = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { PulseFilters, ChartData, PulseSnapshotSummary, PulseDeltaType, PulseCoverageSummary, CorridorOption, PulseScreenerRow, HeadlineTile } from '~/types/pulse'
import { getChartsBatch, getPulseSnapshotSummary, getPulseCoverageSummary, getPulseScreener, getCorridors, getCorridorById, getCorridorBySlug, getPulseOverview, getPulseNarrative, getPulsePersonalHistory, getPulsePinnedCorridors, pinPulseCorridor, unpinPulseCorridor } from '~/domains/pulse/infrastructure/pulseApi'
import type { PulseNarrativeData, PulsePersonalHistoryData } from '~/domains/pulse/infrastructure/pulseApi'
import { pulseChartRegistry, getChartById } from '~/lib/pulseChartRegistry'
import { usePulseStore, type PulseCorridor, type PulseTimeframe, type PulseViewMode } from '~/stores/pulse'
import { Icon } from '~/ui'
import { formatNumber as formatCount, formatUpdatedLabel } from '~/shared/lib/format'
import { COUNTRIES } from '~/utils/countries-currencies'
import { useEntitlements } from '~/composables/useEntitlements'
import { useWatchlist } from '~/composables/useWatchlist'
import { useSaveAlertModal } from '~/composables/useSaveAlertModal'
import { useExports } from '~/composables/useExports'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { createHeadlineFallbackController, mergePinnedCorridorIds } from '~/domains/pulse/application'
import { getCorridorUrl } from '~/utils/country-slugs'

const PulseShareModal = defineAsyncComponent(() => import('~/components/pulse/PulseShareModal.vue'))
const PulseSmartGauge = defineAsyncComponent(() => import('~/components/pulse/PulseSmartGauge.vue'))
const PulseMarketQuotes = defineAsyncComponent(() => import('~/components/pulse/PulseMarketQuotes.vue'))
const PulseHeroChart = defineAsyncComponent(() => import('~/components/pulse/PulseHeroChart.vue'))
const PulseMarketDepth = defineAsyncComponent(() => import('~/components/pulse/PulseMarketDepth.vue'))
const PulseProviderLeaderboard = defineAsyncComponent(() => import('~/components/pulse/PulseProviderLeaderboard.vue'))
const PulseProviderHeatmap = defineAsyncComponent(() => import('~/components/pulse/PulseProviderHeatmap.vue'))
const PulseBankComparison = defineAsyncComponent(() => import('~/components/pulse/PulseBankComparison.vue'))
const PulseOperationalCoverage = defineAsyncComponent(() => import('~/components/pulse/PulseOperationalCoverage.vue'))
const PulseReliabilityCoverage = defineAsyncComponent(() => import('~/components/pulse/PulseReliabilityCoverage.vue'))
const PulseArbitrageAlert = defineAsyncComponent(() => import('~/components/pulse/PulseArbitrageAlert.vue'))

const { pulseEnabled, pulseScreenerEnabled } = useFeatureFlags()

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 })
}

const router = useRouter()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const store = usePulseStore()
const { isPlus, pulseLevel, limits } = useEntitlements()
const isPro = computed(() => pulseLevel.value === 'full')

const previewScreenerRows = [
  { flag: '🇺🇸', corridor: 'USD → PHP', badge: 'Great', detail: 'Best: Provider • Gets: ---' },
  { flag: '🇬🇧', corridor: 'GBP → NGN', badge: 'Good', detail: 'Best: Provider • Gets: ---' },
  { flag: '🇪🇺', corridor: 'EUR → INR', badge: 'Great', detail: 'Best: Provider • Gets: ---' },
  { flag: '🇺🇸', corridor: 'USD → MXN', badge: 'Fair', detail: 'Best: Provider • Gets: ---' },
]

const PREVIEW_CHART_IDS = ['all-in-cost', 'fx-markup', 'provider-winner', 'volatility-pulse', 'quote-success', 'indices-confidence'] as const
const PREVIEW_SPARKLINES: Record<string, { sparkline: string, areaPath: string }> = {
  'all-in-cost': { sparkline: '0,40 33,35 66,42 100,30 133,38 166,25 200,20', areaPath: 'M 0,60 L 0,40 L 33,35 L 66,42 L 100,30 L 133,38 L 166,25 L 200,20 L 200,60 Z' },
  'fx-markup': { sparkline: '0,45 33,38 66,30 100,35 133,28 166,32 200,22', areaPath: 'M 0,60 L 0,45 L 33,38 L 66,30 L 100,35 L 133,28 L 166,32 L 200,22 L 200,60 Z' },
  'provider-winner': { sparkline: '0,30 33,25 66,35 100,20 133,30 166,15 200,25', areaPath: 'M 0,60 L 0,30 L 33,25 L 66,35 L 100,20 L 133,30 L 166,15 L 200,25 L 200,60 Z' },
  'volatility-pulse': { sparkline: '0,50 33,35 66,45 100,25 133,40 166,30 200,35', areaPath: 'M 0,60 L 0,50 L 33,35 L 66,45 L 100,25 L 133,40 L 166,30 L 200,35 L 200,60 Z' },
  'quote-success': { sparkline: '0,20 33,15 66,18 100,10 133,12 166,8 200,5', areaPath: 'M 0,60 L 0,20 L 33,15 L 66,18 L 100,10 L 133,12 L 166,8 L 200,5 L 200,60 Z' },
  'indices-confidence': { sparkline: '0,35 33,30 66,25 100,28 133,20 166,22 200,15', areaPath: 'M 0,60 L 0,35 L 33,30 L 66,25 L 100,28 L 133,20 L 166,22 L 200,15 L 200,60 Z' },
}
const ENTERPRISE_CHART_IDS = new Set(['provider-winner', 'indices-confidence'])

const previewCharts = computed(() =>
  PREVIEW_CHART_IDS
    .map((id) => {
      const meta = getChartById(id)
      if (!meta) return null
      const isEnterprise = ENTERPRISE_CHART_IDS.has(id)
      const paths = PREVIEW_SPARKLINES[id] ?? { sparkline: '0,40 100,30 200,35', areaPath: 'M 0,60 L 0,40 L 100,30 L 200,35 L 200,60 Z' }
      return {
        id: meta.id,
        title: meta.title,
        categoryLabel: meta.categoryLabel,
        description: meta.description,
        gate: isEnterprise ? 'Enterprise' : 'Plus',
        ctaTo: isEnterprise ? '/contact?type=enterprise&topic=pulse' : '/plus',
        ctaLabel: isEnterprise ? 'Contact sales' : 'Upgrade to Plus',
        sparkline: paths.sparkline,
        areaPath: paths.areaPath,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c != null),
)

const plusFeatures = [
  'Corridor movers and market snapshot',
  'Headline tiles and trend deltas',
  '7-day chart history (basic line charts)',
  'Smart alert creation',
  'CSV snapshot export',
]

const enterpriseFeatures = [
  'Everything in Plus',
  'Full 365-day chart history',
  'Stacked, scatter, and matrix chart types',
  'Watchlist screener with provider rankings',
  'Gold Indices health dashboard',
]

const watchlist = useWatchlist()
const saveAlertModal = useSaveAlertModal()
const exportsApi = useExports()
const shareModalChart = ref<string | null>(null)
const embedModalChart = ref<string | null>(null)
const activeMetric = ref<'rate' | 'markup'>('rate')
const highlightedSection = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

const timeframes = computed<PulseTimeframe[]>(() => {
  if (isPro.value) return ['24H', '7D', '30D', '1Y', 'MAX']
  return ['7D', '30D']
})
const summary = ref<PulseCoverageSummary | null>(null)
const overview = ref<{ tiles: HeadlineTile[], lastUpdated?: string } | null>(null)
const narrative = ref<PulseNarrativeData | null>(null)
const personalHistory = ref<PulsePersonalHistoryData | null>(null)
const highlightsLoading = ref(false)
const headlineLoading = ref(false)
const pulseUpdatedBadgeLabel = computed(() => formatUpdatedLabel(store.lastUpdated || null))
const pulseEnvironmentBadge = computed(() => {
  const raw = String(runtimeConfig.public?.remitScoutEnv || runtimeConfig.public?.environmentName || '').trim().toLowerCase()
  if (!raw || raw === 'prod' || raw === 'production') return null
  if (raw === 'staging') return 'Staging'
  if (raw === 'dev' || raw === 'development') return 'Dev'
  return raw.toUpperCase()
})

const defaultHeadlineTiles: HeadlineTile[] = [
  {
    id: 'best-rate',
    label: 'Best rate',
    value: '—',
    delta: 'n/a',
    deltaType: 'neutral',
    deltaLabel: 'now',
    tooltip: 'Current cheapest provider and fee for this corridor.',
    chartId: 'all-in-cost',
    icon: 'trending',
  },
  {
    id: 'avg-fee',
    label: 'Avg fee',
    value: '—',
    delta: 'n/a',
    deltaType: 'neutral',
    deltaLabel: 'now',
    tooltip: 'Average fee across currently live providers.',
    chartId: 'fee-vs-markup',
    icon: 'percent',
  },
  {
    id: 'provider-count',
    label: 'Provider count',
    value: '—',
    delta: 'n/a',
    deltaType: 'neutral',
    deltaLabel: 'live',
    tooltip: 'How many providers are currently live for this corridor.',
    chartId: 'provider-availability',
    icon: 'trophy',
  },
  {
    id: 'indices-rci',
    label: 'RCI',
    value: '—',
    delta: 'n/a',
    deltaType: 'neutral',
    deltaLabel: 'bank',
    tooltip: 'Remittance Cost Index from Gold indices (lower is better).',
    chartId: 'all-in-cost',
    icon: 'activity',
  },
]

const headlineTiles = computed<HeadlineTile[]>(() => {
  const tiles = overview.value?.tiles
  if (Array.isArray(tiles) && tiles.length >= 4) return tiles.slice(0, 4)
  return defaultHeadlineTiles
})

const amountInput = ref(store.amount || 1000)

const { data: trackedCorridorsData, refresh: refreshTrackedCorridors } = await useAsyncData(
  'pulse-corridors',
  async () => {
    // Avoid Plus-gated calls for public preview SSR. We'll refresh client-side after entitlements hydrate.
    if (!isPlus.value) return []
    return await getCorridors()
  },
  { server: true },
)
const trackedCorridors = computed<CorridorOption[]>(() => trackedCorridorsData.value || [])
const selectedCorridorKey = ref<string>('')
const decisionPanelRef = ref<HTMLElement | null>(null)

// Screener state (Plus)
const showAdvancedFilters = ref(false)

const pickBestByCoverage = (candidates: CorridorOption[]): CorridorOption | undefined => {
  if (candidates.length === 0) return undefined

  let best = candidates[0]
  let bestRank: [number, number, number] = [
    best.isUsdOrigin ? 1 : 0,
    typeof best.dataPoints === 'number' ? best.dataPoints : 0,
    best.lastUpdated ? new Date(best.lastUpdated).getTime() : 0,
  ]

  for (const entry of candidates.slice(1)) {
    const rank: [number, number, number] = [
      entry.isUsdOrigin ? 1 : 0,
      typeof entry.dataPoints === 'number' ? entry.dataPoints : 0,
      entry.lastUpdated ? new Date(entry.lastUpdated).getTime() : 0,
    ]

    if (rank[0] !== bestRank[0]) {
      if (rank[0] > bestRank[0]) {
        best = entry
        bestRank = rank
      }
      continue
    }
    if (rank[1] !== bestRank[1]) {
      if (rank[1] > bestRank[1]) {
        best = entry
        bestRank = rank
      }
      continue
    }
    if (rank[2] > bestRank[2]) {
      best = entry
      bestRank = rank
    }
  }

  return best
}

const watchlistTrackedCorridors = computed<CorridorOption[]>(() => {
  if (!isPlus.value) return []
  if (!trackedCorridors.value.length) return []

  const out: CorridorOption[] = []
  const seen = new Set<string>()

  for (const item of watchlist.items.value) {
    if (item.target.type !== 'corridor') continue
    const from = item.target.from.toUpperCase()
    const to = item.target.to.toUpperCase()
    const key = `${from}-${to}`
    if (seen.has(key)) continue
    seen.add(key)

    const candidates = trackedCorridors.value.filter((c) => {
      const src = (c.sourceCountry || '').toUpperCase()
      const dst = (c.destCountry || '').toUpperCase()
      return src === from && dst === to
    })

    const best = pickBestByCoverage(candidates)
    if (best?.corridorId) out.push(best)
    if (out.length >= 16) break
  }

  return out
})

const pulsePinnedCorridorIds = ref<string[]>([])

const pulsePinnedTrackedCorridors = computed<CorridorOption[]>(() => {
  if (!isPro.value) return []
  if (!trackedCorridors.value.length) return []

  const out: CorridorOption[] = []
  const seen = new Set<string>()

  for (const corridorId of pulsePinnedCorridorIds.value) {
    const option = trackedCorridors.value.find(c => c.corridorId === corridorId)
    if (!option?.corridorId || seen.has(option.corridorId)) continue
    seen.add(option.corridorId)
    out.push(option)
  }

  return out
})

const prioritizedTrackedCorridors = computed<CorridorOption[]>(() => {
  const out: CorridorOption[] = []
  const seen = new Set<string>()
  const add = (corridor: CorridorOption) => {
    const id = corridor.corridorId
    if (!id || seen.has(id)) return
    seen.add(id)
    out.push(corridor)
  }

  for (const corridor of watchlistTrackedCorridors.value) add(corridor)
  for (const corridor of pulsePinnedTrackedCorridors.value) add(corridor)
  return out
})

const screenerCorridorIds = computed<string[]>(() => {
  const ids = prioritizedTrackedCorridors.value
    .map(c => c.corridorId)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  return Array.from(new Set(ids)).slice(0, 16)
})

const filtersForcedVisible = computed(() => !pulseScreenerEnabled.value || screenerCorridorIds.value.length === 0)
const filtersVisible = computed(() => showAdvancedFilters.value || filtersForcedVisible.value)

const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

const screenerRows = ref<PulseScreenerRow[]>([])
const screenerLoading = ref(false)
const screenerError = ref<string | null>(null)
const screenerUpdatedAt = ref<string | null>(null)

// Pinned corridors (Enterprise watchlist)
const effectivePinnedCorridorIds = computed<string[]>(() => {
  return mergePinnedCorridorIds(pulsePinnedCorridorIds.value, watchlistTrackedCorridors.value)
})

const loadPinnedCorridors = async () => {
  if (!isPro.value) return
  try {
    const pinned = await getPulsePinnedCorridors()
    pulsePinnedCorridorIds.value = pinned.map((p) => p.corridorId)
  } catch {
    pulsePinnedCorridorIds.value = []
  }
}

const handlePinCorridor = async (corridorId: string) => {
  try {
    await pinPulseCorridor(corridorId)
    pulsePinnedCorridorIds.value = [...pulsePinnedCorridorIds.value, corridorId]
  } catch (error: any) {
    actionError.value = error?.message || 'Failed to pin corridor'
  }
}

const handleUnpinCorridor = async (corridorId: string) => {
  try {
    await unpinPulseCorridor(corridorId)
    pulsePinnedCorridorIds.value = pulsePinnedCorridorIds.value.filter((id) => id !== corridorId)
  } catch (error: any) {
    actionError.value = error?.message || 'Failed to unpin corridor'
  }
}

const loadScreener = async () => {
  if (!isPro.value) return
  if (!pulseScreenerEnabled.value) return

  const corridorIds = screenerCorridorIds.value
  if (corridorIds.length === 0) {
    screenerRows.value = []
    screenerUpdatedAt.value = null
    screenerError.value = null
    return
  }

  screenerLoading.value = true
  screenerError.value = null

  try {
    const response = await getPulseScreener({
      corridorIds,
      timeframe: '7D',
      amount: 1000,
      payin: 'bank',
      payout: 'bank',
      includeMovers: true,
    })
    screenerRows.value = response.rows ?? []
    screenerUpdatedAt.value = response.updatedAt ?? null
  }
  catch (error: any) {
    screenerError.value = error?.message || 'Unable to load screener right now.'
    screenerRows.value = []
    screenerUpdatedAt.value = null
  }
  finally {
    screenerLoading.value = false
  }
}

const scrollToDecisionPanel = async () => {
  if (!import.meta.client) return
  await nextTick()
  const el = decisionPanelRef.value || document.getElementById('decision')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function handleScreenerSelect(corridorId: string) {
  const option = trackedCorridors.value.find(c => c.corridorId === corridorId)
  if (!option) return

  // Screener is a decision tool; force Decision mode to keep the UI predictable.
  store.setViewMode('sender')

  setCorridorFromOption(option)
  void router.replace({ path: route.path, query: store.getQueryParams() })
  await scrollToDecisionPanel()
}

type PulseTeaserMover = {
  corridorId: string
  fromCountry: string
  toCountry: string
  sendCurrency: string
  recvCurrency: string
  deltaPct: number
  providerCount: number
  timestampBucket: string
}

async function handleMoverSelect(mover: PulseTeaserMover) {
  const optionById = trackedCorridors.value.find(c => c.corridorId === mover.corridorId)
  const slug = `${mover.sendCurrency.toLowerCase()}-${mover.recvCurrency.toLowerCase()}`
  const optionBySlug = getCorridorBySlug(slug) || trackedCorridors.value.find(c => (c.slug || c.value) === slug)
  const option = optionById || optionBySlug
  if (!option) return

  store.setViewMode('sender')
  setCorridorFromOption(option)
  void router.replace({ path: route.path, query: store.getQueryParams() })
  await scrollToDecisionPanel()
}

async function handleMoverAdded(mover: PulseTeaserMover) {
  // Watchlist mutations will naturally refresh `screenerCorridorIds` and trigger `loadScreener`.
  await handleMoverSelect(mover)
}

const selectedCorridorOption = computed<CorridorOption | null>(() => {
  const key = selectedCorridorKey.value
  if (!key) return null
  return trackedCorridors.value.find(c => c.corridorId === key || c.value === key) || null
})

const toCountryName = (code?: string | null): string => {
  if (!code) return ''
  const normalized = code.trim().toUpperCase()
  const found = COUNTRIES.find(c => c.code.toUpperCase() === normalized)
  return found?.name || normalized
}

const toCountryFlag = (code?: string | null, fallback?: string): string => {
  if (fallback) return fallback
  if (!code) return '🌍'
  const normalized = code.trim().toUpperCase()
  const found = COUNTRIES.find(c => c.code.toUpperCase() === normalized)
  return found?.flag || '🌍'
}

const toPulseCorridor = (option: CorridorOption): PulseCorridor => {
  const corridorId = option.corridorId
  const parts = corridorId ? corridorId.split('-') : []
  const sourceCountry = (option.sourceCountry || parts[0] || '').toUpperCase()
  const destCountry = (option.destCountry || parts[1] || '').toUpperCase()

  const fromCode = (option.fromCode || option.sourceCurrency || parts[2] || '').toUpperCase()
  const toCode = (option.toCode || option.destCurrency || parts[3] || '').toUpperCase()

  const slug = String(option.slug || option.value || `${fromCode.toLowerCase()}-${toCode.toLowerCase()}`).trim().toLowerCase()
  const label = option.label || `${fromCode} → ${toCode}`

  return {
    from: toCountryName(sourceCountry) || sourceCountry || fromCode,
    to: toCountryName(destCountry) || destCountry || toCode,
    fromCode,
    toCode,
    fromFlag: option.fromFlag || toCountryFlag(sourceCountry),
    toFlag: option.toFlag || toCountryFlag(destCountry),
    label,
    slug,
    corridorId,
  }
}

const setCorridorFromOption = (option: CorridorOption) => {
  store.setCorridor(toPulseCorridor(option))
  selectedCorridorKey.value = option.corridorId || option.value
}

const corridorCoverageLabel = computed(() => {
  const c = selectedCorridorOption.value
  if (!c?.minDate || !c?.maxDate) return ''
  const min = new Date(`${c.minDate}T00:00:00.000Z`)
  const max = new Date(`${c.maxDate}T00:00:00.000Z`)
  if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime())) return ''
  const daysAvailable = Math.floor((max.getTime() - min.getTime()) / (24 * 60 * 60 * 1000)) + 1
  if (!Number.isFinite(daysAvailable) || daysAvailable <= 0) return ''
  const desiredDays = store.timeframeDays
  const cappedNote = desiredDays > daysAvailable ? ` • Only ${daysAvailable}d available for this corridor` : ''
  return `Coverage: ${c.minDate} to ${c.maxDate} (${formatCount(daysAvailable)} days available)${cappedNote}`
})

function handleCorridorSelect() {
  const key = selectedCorridorKey.value
  const option = trackedCorridors.value.find(c => c.corridorId === key || c.value === key)
  if (!option) return
  setCorridorFromOption(option)
  void router.replace({ path: route.path, query: store.getQueryParams() })
}

const initializeCorridorSelection = () => {
  if (trackedCorridors.value.length === 0) return

  const corridorIdFromUrl = typeof route.query.corridor_id === 'string' ? route.query.corridor_id : undefined
  const corridorSlugFromUrl = typeof route.query.corridor === 'string' ? route.query.corridor : undefined

  let option: CorridorOption | undefined

  if (corridorIdFromUrl) {
    option = getCorridorById(corridorIdFromUrl) || trackedCorridors.value.find(c => c.corridorId === corridorIdFromUrl)
  }
  if (!option && corridorSlugFromUrl) {
    option = getCorridorBySlug(corridorSlugFromUrl) || trackedCorridors.value.find(c => (c.slug || c.value) === corridorSlugFromUrl)
  }
  if (!option && store.corridor.corridorId) {
    option = getCorridorById(store.corridor.corridorId) || trackedCorridors.value.find(c => c.corridorId === store.corridor.corridorId)
  }
  if (!option) {
    option = prioritizedTrackedCorridors.value[0] || trackedCorridors.value[0]
  }

  if (option) {
    setCorridorFromOption(option)
  }
}

const deepDivesRef = ref<HTMLElement | null>(null)
const deepDivesVisible = ref(false)
let deepDivesObserver: IntersectionObserver | null = null

const teardownDeepDivesObserver = () => {
  if (deepDivesObserver) {
    deepDivesObserver.disconnect()
    deepDivesObserver = null
  }
  deepDivesVisible.value = false
}

const setupDeepDivesObserver = async () => {
  if (!import.meta.client) return
  if (!isPlus.value) return
  if (store.viewMode !== 'analyst') return

  teardownDeepDivesObserver()
  await nextTick()

  const el = deepDivesRef.value
  if (!el) return

  deepDivesObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry?.isIntersecting) return

      deepDivesVisible.value = true
      if (deepDivesObserver) {
        deepDivesObserver.disconnect()
        deepDivesObserver = null
      }
      void loadChartData()
    },
    // Preload slightly before the section is visible to avoid a "blank chart grid" moment.
    { root: null, rootMargin: '200px 0px', threshold: 0.01 },
  )

  deepDivesObserver.observe(el as unknown as Element)
}

const actionStatus = ref<string | null>(null)
const actionError = ref<string | null>(null)

const snapshotExporting = ref(false)
const snapshotExportStatus = ref<string | null>(null)
const snapshotExportError = ref<string | null>(null)
let snapshotExportPoll: ReturnType<typeof setInterval> | null = null

const clearSnapshotExportPoll = () => {
  if (!snapshotExportPoll) return
  clearInterval(snapshotExportPoll)
  snapshotExportPoll = null
}

const corridorCountries = computed(() => {
  const id = store.corridor.corridorId
  if (!id) return { from: 'US', to: 'PH' }
  const [from, to] = id.split('-')
  return { from: (from || 'US').toUpperCase(), to: (to || 'PH').toUpperCase() }
})

const compareCorridorUrl = computed(() => {
  const base = getCorridorUrl(corridorCountries.value.from, corridorCountries.value.to)
  return `${base}?amount=${encodeURIComponent(String(store.amount))}`
})

function setViewMode(mode: PulseViewMode) {
  if (!isPro.value && mode === 'analyst') {
    store.setViewMode('sender')
    return
  }
  store.setViewMode(mode)
  const nextQuery = { ...route.query } as Record<string, any>
  if (mode === 'sender') {
    delete nextQuery.mode
  }
  else {
    nextQuery.mode = mode
  }
  void router.replace({ path: route.path, query: nextQuery })
}

const setActionMessage = (next: { status?: string | null, error?: string | null }) => {
  actionStatus.value = next.status ?? null
  actionError.value = next.error ?? null
  if (actionStatus.value || actionError.value) {
    setTimeout(() => {
      actionStatus.value = null
      actionError.value = null
    }, 3500)
  }
}

async function handleAddToWatchlist() {
  const { from, to } = corridorCountries.value
  try {
    const result = await watchlist.ensure({ type: 'corridor', from, to, method: 'bank' })
    if (result.status === 'limit_reached') {
      setActionMessage({ error: result.message })
      return
    }
    setActionMessage({ status: 'Added to watchlist.' })
  }
  catch (error: any) {
    setActionMessage({ error: error?.message || 'Unable to add to watchlist.' })
  }
}

function handleCreateAlert() {
  const { from, to } = corridorCountries.value
  saveAlertModal.open({
    source: 'pulse',
    target: { type: 'corridor', from, to, method: 'bank' },
    label: `${from}→${to} • bank`,
  })
}

const resolveExportDays = () => {
  if (!limits.value.exports) return 0
  const max = limits.value.exportsMaxDays
  // Plus is capped at 30d exports. Enterprise full history export is handled via Dashboard.
  if (max === 'unlimited') return 30
  if (typeof max === 'number' && max > 0) return Math.min(30, max)
  return 0
}

const pollExportStatus = async (jobId: string) => {
  clearSnapshotExportPoll()

  const tick = async () => {
    try {
      const response = await exportsApi.getExportStatus(jobId)
      if (!response.success) return

      if (response.job.status === 'failed') {
        snapshotExportError.value = response.job.error || 'Export failed. Please try again.'
        snapshotExporting.value = false
        clearSnapshotExportPoll()
        return
      }

      if (response.job.status === 'done') {
        snapshotExportStatus.value = 'Export ready. Downloading...'
        const download = await exportsApi.getExportDownloadUrl(jobId)
        snapshotExporting.value = false
        clearSnapshotExportPoll()
        if (import.meta.client) {
          window.location.href = download.url
        }
        return
      }

      snapshotExportStatus.value = 'Export in progress...'
    }
    catch (error: any) {
      snapshotExportError.value = error?.message || 'Unable to export right now.'
      snapshotExporting.value = false
      clearSnapshotExportPoll()
    }
  }

  await tick()
  snapshotExportPoll = setInterval(tick, 2500)
}

async function downloadSnapshotCsv() {
  if (snapshotExporting.value) return
  snapshotExportError.value = null
  snapshotExportStatus.value = null
  snapshotExporting.value = true

  try {
    const days = resolveExportDays()
    if (days <= 0) {
      throw new Error('Exports are not available on your plan.')
    }

    const toDateOnlyUtc = (date: Date) => date.toISOString().split('T')[0]
    const dateTo = toDateOnlyUtc(new Date())
    const dateFrom = toDateOnlyUtc(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000))
    const corridorId = store.corridor.corridorId
    const response = await exportsApi.createExport({
      dataType: 'history',
      format: 'csv',
      dateFrom,
      dateTo,
      corridorIds: corridorId ? [corridorId] : undefined,
    })

    if (!response.success) {
      throw new Error('Export request failed.')
    }

    snapshotExportStatus.value = 'Export queued. We will start processing shortly.'
    await pollExportStatus(response.job.id)
  }
  catch (error: any) {
    snapshotExportError.value = error?.message || 'Unable to export right now.'
    snapshotExporting.value = false
    clearSnapshotExportPoll()
  }
}

function handleAmountInput() {
  const amount = Number.parseInt(String(amountInput.value), 10)
  if (!Number.isNaN(amount) && amount > 0) {
    store.setAmount(amount)
  }
}

const legacyFilters = computed<PulseFilters>(() => ({
  corridor: store.corridor.slug,
  corridorId: store.corridor.corridorId,
  amount: store.amount as 100 | 200 | 500 | 1000,
  fundingMethod: 'bank',
  payoutMethod: 'bank',
}))

type ChartAvailabilityEntry = {
  dataAvailable: boolean
  updatedAt: string | null
  source: 'gold_export' | 'gold_cache' | 'none'
}

const chartData = ref<Record<string, ChartData | null>>({})
const chartAvailability = ref<Record<string, ChartAvailabilityEntry>>({})

const INDICES_CHART_IDS = ['indices-confidence', 'indices-provider-count', 'indices-suppression'] as const
const indicesCharts = computed(() =>
  INDICES_CHART_IDS.map(id => getChartById(id)).filter((c): c is NonNullable<typeof c> => c != null),
)

const snapshotSummary = ref<PulseSnapshotSummary | null>(null)
const chartLoadKey = computed(() => `${legacyFilters.value.corridorId || ''}:${store.timeframe}:${store.amount}`)
const chartLoadedKey = ref<string | null>(null)
const chartLoading = ref(false)

const executiveNote = computed(() => {
  if (!snapshotSummary.value) return ''
  const getValue = (id: string) => snapshotSummary.value?.kpis.find(kpi => kpi.id === id)?.value || ''
  const spread = getValue('market-spread')
  const leader = getValue('leader')
  const volatility = getValue('volatility')
  const success = getValue('quote-success')

  return `Dispersion is ${spread}. Leader is ${leader}. Volatility: ${volatility}. Quote success: ${success}.`
})

async function loadChartData() {
  if (!isPlus.value) return
  if (store.viewMode !== 'analyst') return
  if (!deepDivesVisible.value) return
  if (chartLoading.value) return
  const key = chartLoadKey.value
  if (chartLoadedKey.value === key) return
  try {
    chartLoading.value = true
    const enterpriseOnlyChartIds = new Set(['corridor-liquidity'])
    const chartIds = pulseChartRegistry
      .filter(c => isPro.value || !enterpriseOnlyChartIds.has(c.id))
      .map(c => c.id)
    const response = await getChartsBatch(chartIds, legacyFilters.value)
    const newData: Record<string, ChartData | null> = {}
    const availability: Record<string, ChartAvailabilityEntry> = {}
    for (const item of response.charts || []) {
      newData[item.id] = item.chart
      availability[item.id] = {
        dataAvailable: item.dataAvailable,
        updatedAt: item.updatedAt,
        source: item.source,
      }
    }
    chartData.value = newData
    chartAvailability.value = availability
    chartLoadedKey.value = key
  }
  catch (e) {
    useLogger('PulsePage').error('Failed to load chart data', e)
  }
  finally {
    chartLoading.value = false
  }
}

async function loadSnapshotSummary() {
  if (!isPlus.value) return
  if (store.viewMode !== 'analyst') return
  try {
    snapshotSummary.value = await getPulseSnapshotSummary(store.corridor, store.timeframe, store.amount)
    if (snapshotSummary.value?.lastUpdated) {
      store.setLastUpdated(snapshotSummary.value.lastUpdated)
    }
  }
  catch (e) {
    useLogger('PulsePage').error('Failed to load snapshot summary', e)
  }
}

function navigateToChart(chartId: string) {
  const params = store.getQueryParams()
  const queryString = new URLSearchParams(params).toString()
  router.push(`/pulse/charts/${chartId}${queryString ? '?' + queryString : ''}`)
}

function handleShare(chartId: string) {
  shareModalChart.value = chartId
}

function handleEmbed(chartId: string) {
  embedModalChart.value = chartId
}

function getDeltaClass(deltaType: PulseDeltaType) {
  if (deltaType === 'positive') return 'text-success-600'
  if (deltaType === 'negative') return 'text-danger-600'
  return 'text-neutral-400'
}

function highlightSection(sectionId: string) {
  highlightedSection.value = sectionId
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }
  highlightTimer = setTimeout(() => {
    highlightedSection.value = null
  }, 2000)
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    highlightSection(sectionId)
  }
}

function handleKpiClick(kpiId: string) {
  const mapping: Record<string, { section: string, metric?: 'rate' | 'markup' }> = {
    'all-in-cost': { section: 'snapshot-chart', metric: 'markup' },
    'market-spread': { section: 'market-spread', metric: 'markup' },
    'leader': { section: 'competition', metric: 'rate' },
    'volatility': { section: 'risk', metric: 'rate' },
    'quote-success': { section: 'reliability', metric: 'rate' },
  }

  const target = mapping[kpiId]
  if (!target) return
  if (target.metric) {
    activeMetric.value = target.metric
  }
  scrollToSection(target.section)
}

function handleKeyDown(event: KeyboardEvent) {
  // Reserved for future use
}

function formatMethods(methods: string[]): string {
  return methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ')
}

function handleHeadlineTileClick(tile: HeadlineTile) {
  if (!tile.chartId) return
  navigateToChart(tile.chartId)
}

const headlineFallback = createHeadlineFallbackController(() => {
  if (!headlineLoading.value) return
  headlineLoading.value = false
}, 10_000)

const startHeadlineFallbackTimer = () => {
  headlineFallback.start()
}

const hasChartSeries = (chartId: string) => {
  const data = chartData.value[chartId]
  if (!data || !Array.isArray(data.series)) return false
  return data.series.some(series => Array.isArray(series.points) && series.points.length > 0)
}

const isIndicesChartPending = (chartId: string) => {
  const availability = chartAvailability.value[chartId]
  if (!availability) return chartLoading.value || !hasChartSeries(chartId)
  if (!availability.dataAvailable) return true
  return !hasChartSeries(chartId)
}

const indicesCardUpdatedAtLabel = (chartId: string) => {
  const updatedAt = chartAvailability.value[chartId]?.updatedAt
  if (!updatedAt) return null
  return formatUpdatedLabel(updatedAt)
}

async function loadSenderHighlights() {
  if (!isPlus.value) return
  highlightsLoading.value = true
  headlineLoading.value = true
  startHeadlineFallbackTimer()
  try {
    const [overviewResponse, narrativeResponse, personalHistoryResponse] = await Promise.all([
      getPulseOverview(legacyFilters.value),
      getPulseNarrative(store.corridor, store.timeframe, store.amount),
      getPulsePersonalHistory(store.corridor, store.amount),
    ])

    overview.value = {
      tiles: overviewResponse.tiles || [],
      lastUpdated: overviewResponse.lastUpdated,
    }
    narrative.value = narrativeResponse
    personalHistory.value = personalHistoryResponse

    if (overviewResponse.lastUpdated) {
      store.setLastUpdated(overviewResponse.lastUpdated)
    }
    headlineLoading.value = false
    headlineFallback.clear()
  }
  catch (e) {
    useLogger('PulsePage').error('Failed to load sender highlights', e)
    headlineFallback.clear()
    headlineLoading.value = false
  }
  finally {
    highlightsLoading.value = false
  }
}

async function loadCoverageSummary() {
  if (!isPlus.value) return
  try {
    summary.value = await getPulseCoverageSummary(store.corridor, store.timeframe)
    if (summary.value?.lastUpdated) {
      store.setLastUpdated(summary.value.lastUpdated)
    }
  }
  catch (e) {
    useLogger('PulsePage').error('Failed to load coverage summary', e)
  }
}

watch(
  () => isPlus.value,
  (plus) => {
    if (!import.meta.client) return
    if (!plus) return

    // Entitlements hydrate client-side; refresh Plus-gated data once we know the plan.
    void refreshTrackedCorridors()
    void loadCoverageSummary()
    void loadSenderHighlights()
    if (store.viewMode === 'analyst') {
      void loadSnapshotSummary()
      void setupDeepDivesObserver()
    }
  },
  { immediate: true },
)

watch(
  () => [isPro.value, pulseScreenerEnabled.value, screenerCorridorIds.value.join(',')],
  ([pro]) => {
    if (!import.meta.client) return
    if (!pro) return
    void loadScreener()
  },
  { immediate: true },
)

watch(
  () => isPro.value,
  (pro) => {
    if (pro) return
    if (store.timeframe !== '7D' && store.timeframe !== '30D') {
      store.setTimeframe('30D')
    }
    if (store.viewMode !== 'sender') {
      store.setViewMode('sender')
      const nextQuery = { ...route.query } as Record<string, any>
      delete nextQuery.mode
      void router.replace({ path: route.path, query: nextQuery })
    }
  },
  { immediate: true },
)

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => {
    if (!isPlus.value) return
    void loadSnapshotSummary()
    void loadChartData()
    void loadCoverageSummary()
    void loadSenderHighlights()
  },
  { deep: true },
)

watch(
  () => store.viewMode,
  (mode) => {
    if (!isPlus.value) return
    if (mode === 'analyst') {
      void loadSnapshotSummary()
      void loadCoverageSummary()
      void setupDeepDivesObserver()
      return
    }
    void loadSenderHighlights()
    teardownDeepDivesObserver()
  },
)

watch(
  () => trackedCorridors.value.length,
  (len) => {
    if (!import.meta.client) return
    if (len === 0) return
    if (!selectedCorridorKey.value) {
      initializeCorridorSelection()
    }
  },
  { immediate: true },
)

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  await store.initFromRoute(route.query as Record<string, string>)
  amountInput.value = store.amount

  initializeCorridorSelection()

  // Avoid Plus-gated Pulse API calls for public preview users.
  if (isPlus.value) {
    void refreshTrackedCorridors()
    if (isPro.value) {
      void loadScreener()
      void loadPinnedCorridors()
    }
    void loadSnapshotSummary()
    void loadChartData()
    void loadCoverageSummary()
    void loadSenderHighlights()
    void setupDeepDivesObserver()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  teardownDeepDivesObserver()
  clearSnapshotExportPoll()
  headlineFallback.clear()
})

useHead({
  title: 'Remit-Pulse | Remittance Market Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:title',
      content: 'Remit-Pulse | Remittance Market Dashboard',
    },
    {
      property: 'og:description',
      content: 'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://remitscout.com/pulse',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Remit-Pulse | Remittance Market Dashboard',
    },
    {
      name: 'twitter:description',
      content: 'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://remitscout.com/pulse',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Remit-Pulse',
        'description': 'Market dashboard for remittance pricing',
        'url': 'https://remitscout.com/pulse',
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
        'provider': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': 'https://remitscout.com',
        },
      }),
    },
  ],
})
</script>
