<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Public preview (no Plus required) -->
    <div
      v-if="!isPlus"
      class="min-h-screen py-12 px-page-x"
    >
      <div class="mx-auto max-w-page">
        <div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <div class="mb-3 text-[11px] font-mono uppercase tracking-widest text-neutral-500">
              Pulse Preview
            </div>
            <h1 class="text-hero font-bold text-white leading-tight">
              Pulse for Remittance Markets
            </h1>
            <p class="mt-3 text-body-lg text-neutral-300 leading-relaxed">
              A market-screener-first view of what is moving across corridors, with honest timestamps.
            </p>
            <p class="mt-2 text-body-sm text-neutral-400">
              Public preview shows corridor moves only. Plus unlocks Smart Send, best-provider snapshots, and spread risk.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <NuxtLink
              to="/plus"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-body font-bold text-white hover:bg-brand-600 transition-colors shadow-lg hover:shadow-xl"
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

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <PulseMoversList
              variant="public"
              :limit="10"
            />
          </div>

          <div class="lg:col-span-5 space-y-6">
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
                Plus ranks your watchlist corridors and shows the best provider, spread risk, and freshness.
              </p>
              <div class="space-y-3 opacity-70 blur-[1.5px] select-none pointer-events-none">
                <div
                  v-for="n in 4"
                  :key="n"
                  class="rounded-xl border border-neutral-700 bg-neutral-900/30 p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="text-body-sm font-semibold text-white">
                      🇺🇸 USD → PHP
                    </div>
                    <div class="rounded-lg bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-200 border border-neutral-700">
                      Great
                    </div>
                  </div>
                  <div class="mt-2 text-body-sm text-neutral-400">
                    Best: Provider • Gets: PHP 56,000
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

            <div class="rounded-2xl border border-primary-500/40 bg-gradient-to-br from-primary-500/15 to-neutral-800 p-6 shadow-lg">
              <h2 class="text-body-lg font-bold text-white">
                Unlock Pulse Plus
              </h2>
              <p class="mt-2 text-body-sm text-neutral-300">
                Get the screener, deep dives, alerts, and snapshot exports. No ads.
              </p>
              <NuxtLink
                to="/plus"
                class="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-6 py-3 text-body font-bold text-white hover:bg-brand-600 transition-colors shadow-lg hover:shadow-xl"
              >
                Upgrade to Plus
              </NuxtLink>
              <div class="mt-4 text-body-sm text-neutral-400">
                Enterprise teams: <NuxtLink
                  to="/institutions/data-products"
                  class="text-primary-400 hover:text-primary-300 underline"
                >API & exports</NuxtLink>
              </div>
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
              <div class="flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-900 p-1">
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
              <span class="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-body-sm font-medium text-neutral-300">
                Verified Pipeline v2.4.1
              </span>
              <div class="flex flex-col gap-3">
                <NuxtLink
                  to="/institutions/data-products"
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

      <div class="py-8">
        <!-- Screener-first (Plus) -->
        <div class="mb-8 px-page-x">
          <div class="mx-auto max-w-page grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div
              v-if="pulseScreenerEnabled"
              class="lg:col-span-7"
            >
              <PulseScreener
                :rows="screenerRows"
                :loading="screenerLoading"
                :error="screenerError"
                :selected-corridor-id="store.corridor.corridorId || null"
                @select="handleScreenerSelect"
              />
            </div>

            <div :class="pulseScreenerEnabled ? 'lg:col-span-5' : 'lg:col-span-12'">
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
              Tip: Click a screener row or mover to load the decision panel below.
              <span
                v-if="pulseScreenerEnabled && screenerUpdatedAt"
                class="ml-2 text-neutral-500"
              >Screener {{ formatUpdatedLabel(screenerUpdatedAt) }}</span>
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

        <!-- Sender-First Pulse -->
        <div
          id="decision"
          ref="decisionPanelRef"
          class="mb-10 px-page-x"
        >
          <div class="mx-auto max-w-page">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PulseSmartGauge />
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
              v-if="store.viewMode === 'sender'"
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
                  @click="scrollToSection('risk')"
                >
                  Risk & Anomalies
                </button>
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
                <span class="text-neutral-700">|</span>
                <button
                  class="hover:text-white"
                  @click="scrollToSection('enterprise')"
                >
                  Enterprise
                </button>
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
                  id="market-spread"
                  class="lg:col-span-4"
                  :class="highlightedSection === 'market-spread' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
                >
                  <PulseMarketDepth />
                </div>
              </div>
            </div>
          </section>

          <!-- 3. Provider Benchmarking -->
          <section
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

          <!-- 5. Reliability & Coverage -->
          <section
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
              <PulseReliabilityCoverage />
            </div>
          </section>

          <!-- 6. Risk & Anomalies -->
          <section
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
                :filters="legacyFilters"
                :is-plus="isPlus"
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

          <!-- 8b. Enterprise Access -->
          <section
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
                    to="/institutions/data-products"
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

          <!-- 9. Methodology & Data Notes -->
          <section
            id="methodology"
            class="px-page-x mb-10"
            :class="highlightedSection === 'methodology' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
          >
            <div class="mx-auto max-w-page">
              <PulseDataNotes />
            </div>
          </section>

          <!-- 10. Report Discrepancy -->
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
import type { PulseFilters, ChartData, PulseSnapshotSummary, PulseDeltaType, PulseCoverageSummary, CorridorOption, PulseScreenerRow } from '~/types/pulse'
import { getChartData, getPulseSnapshotSummary, getPulseCoverageSummary, getPulseScreener, getCorridors, getCorridorById, getCorridorBySlug } from '~/domains/pulse/infrastructure/pulseApi'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'
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
const store = usePulseStore()
const { isPlus, limits } = useEntitlements()
const watchlist = useWatchlist()
const saveAlertModal = useSaveAlertModal()
const exportsApi = useExports()
const shareModalChart = ref<string | null>(null)
const embedModalChart = ref<string | null>(null)
const activeMetric = ref<'rate' | 'markup'>('rate')
const highlightedSection = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

const timeframes: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']
const summary = ref<PulseCoverageSummary | null>(null)
const pulseUpdatedBadgeLabel = computed(() => formatUpdatedLabel(store.lastUpdated || null))

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

const screenerCorridorIds = computed<string[]>(() => {
  const ids = watchlistTrackedCorridors.value
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

const loadScreener = async () => {
  if (!isPlus.value) return
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
    option = watchlistTrackedCorridors.value[0] || trackedCorridors.value[0]
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

const chartData = ref<Record<string, ChartData | null>>({})
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
    const chartIds = pulseChartRegistry.map(c => c.id)
    const promises = chartIds.map(async (id) => {
      const data = await getChartData(id, legacyFilters.value)
      return { id, data }
    })

    const results = await Promise.all(promises)
    const newData: Record<string, ChartData | null> = {}
    for (const { id, data } of results) {
      newData[id] = data
    }
    chartData.value = newData
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
    if (store.viewMode === 'analyst') {
      void loadSnapshotSummary()
      void setupDeepDivesObserver()
    }
  },
  { immediate: true },
)

watch(
  () => [pulseScreenerEnabled.value, screenerCorridorIds.value.join(',')],
  () => {
    if (!import.meta.client) return
    if (!isPlus.value) return
    void loadScreener()
  },
  { immediate: true },
)

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => {
    if (!isPlus.value) return
    loadSnapshotSummary()
    loadChartData()
    loadCoverageSummary()
  },
  { deep: true },
)

watch(
  () => store.viewMode,
  (mode) => {
    if (!isPlus.value) return
    if (mode === 'analyst') {
      loadSnapshotSummary()
      loadCoverageSummary()
      void setupDeepDivesObserver()
      return
    }
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
    void loadScreener()
    loadSnapshotSummary()
    loadChartData()
    loadCoverageSummary()
    void setupDeepDivesObserver()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  teardownDeepDivesObserver()
  clearSnapshotExportPoll()
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
