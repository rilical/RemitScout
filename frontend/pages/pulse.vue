<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Plus Gate: Show upgrade prompt if not Plus member -->
    <div v-if="!isPlus" class="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl w-full text-center">
        <div class="mb-8 flex justify-center">
          <div class="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/20">
            <svg class="h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">
          Remit-Pulse is a Plus Feature
        </h1>
        <p class="text-xl text-neutral-300 mb-8 max-w-xl mx-auto">
          Unlock real-time market intelligence, advanced analytics, and professional-grade remittance data with Remit-Scout Plus.
        </p>
        <div class="bg-neutral-800 rounded-2xl border border-neutral-700 p-8 mb-8">
          <h2 class="text-2xl font-bold text-white mb-6">What you get with Plus:</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-white">Remit-Pulse Dashboard</div>
                <div class="text-sm text-neutral-400">Full access to market analytics</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-white">365-Day History</div>
                <div class="text-sm text-neutral-400">Extended historical data access</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-white">Data Exports</div>
                <div class="text-sm text-neutral-400">CSV/PDF exports for analysis</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-white">Unlimited Alerts</div>
                <div class="text-sm text-neutral-400">Track unlimited corridors</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/plus"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-lg font-bold text-white hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Upgrade to Plus
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-8 py-4 text-lg font-semibold text-white hover:bg-neutral-700 transition-colors"
          >
            Back to Home
          </NuxtLink>
        </div>
        <p class="mt-6 text-sm text-neutral-400">
          Already a Plus member? <NuxtLink to="/sign-in" class="text-blue-400 hover:text-blue-300 underline">Sign in</NuxtLink>
        </p>
      </div>
    </div>

    <!-- Pulse Content: Only show if Plus member -->
    <div v-else>
    <div class="border-b border-neutral-700 bg-neutral-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <!-- Live Data Badge -->
        <div class="flex items-center gap-4 mb-8">
          <div class="flex items-center gap-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Live Data</span>
          </div>
          <span class="text-sm text-neutral-400">Market dashboard for remittance pricing</span>
        </div>

        <!-- Main Header Content -->
        <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <!-- Title and Description -->
          <div class="flex-1 space-y-4">
            <div>
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                <span class="text-white">Remit</span><span class="text-brand-600">-</span><span class="text-brand-600">Pulse</span>
              </h1>
              <p class="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed">
                Real-time market intelligence for remittance pricing. Track spreads, markups, provider performance, volatility, and reliability across corridors and payment methods.
              </p>
            </div>
            <p class="text-sm text-neutral-400 max-w-2xl">
              Built for analysts, researchers, and enterprise teams who need accurate, up-to-date pricing data.
            </p>
          </div>

          <!-- Action Links -->
          <div class="flex flex-col items-end gap-4">
            <span class="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300">
              Verified Pipeline v2.4.1
            </span>
            <div class="flex flex-col gap-3">
              <NuxtLink
                to="/institutions/data-products"
                class="inline-flex items-center gap-2.5 rounded-xl border-2 border-blue-500 bg-blue-500 px-6 py-3 text-base font-semibold text-white hover:bg-blue-600 hover:border-blue-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Enterprise
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/methodology"
                class="inline-flex items-center gap-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 hover:border-emerald-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Methodology
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="py-8">
      <!-- Filter Form Section -->
      <div class="mb-8 px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6 shadow-lg">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-white mb-1">Configure Your Analysis</h2>
          <p class="text-sm text-neutral-400">Select source and destination countries, currencies, amount, and timeframe</p>
        </div>
        
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <!-- Source Country -->
          <div class="lg:col-span-3">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Sending from
            </label>
            <CountrySelect
              id="pulse-from-country"
              v-model="fromCountry"
              label="Sending from"
              :exclude-country="toCountry"
              placeholder="Select country"
              theme="dark"
              :select-class="'!border-neutral-600 !bg-neutral-900 !text-white placeholder:text-neutral-500 focus:!border-brand-600 focus:!ring-brand-600 disabled:!bg-neutral-800 disabled:!text-neutral-500'"
              @country-selected="handleFromCountryChange"
            />
          </div>

          <!-- Source Currency -->
          <div class="lg:col-span-2">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              From currency
            </label>
            <CurrencySelect
              id="pulse-from-currency"
              v-model="fromCurrency"
              :country-code="fromCountry"
              :exclude-currency="toCurrency"
              placeholder="USD"
              theme="dark"
              :select-class="'!border-neutral-600 !bg-neutral-900 !text-white placeholder:text-neutral-500 focus:!border-brand-600 focus:!ring-brand-600 disabled:!bg-neutral-800 disabled:!text-neutral-500'"
            />
          </div>

          <!-- Destination Country -->
          <div class="lg:col-span-3">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Receiving in
            </label>
            <CountrySelect
              id="pulse-to-country"
              v-model="toCountry"
              label="Receiving in"
              :exclude-country="fromCountry"
              placeholder="Select country"
              theme="dark"
              :select-class="'!border-neutral-600 !bg-neutral-900 !text-white placeholder:text-neutral-500 focus:!border-brand-600 focus:!ring-brand-600 disabled:!bg-neutral-800 disabled:!text-neutral-500'"
              @country-selected="handleToCountryChange"
            />
          </div>

          <!-- Destination Currency -->
          <div class="lg:col-span-2">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              To currency
            </label>
            <CurrencySelect
              id="pulse-to-currency"
              v-model="toCurrency"
              :country-code="toCountry"
              :exclude-currency="fromCurrency"
              :placeholder="toCountry ? 'Select currency' : 'Select country first'"
              :disabled="!toCountry"
              theme="dark"
              :select-class="'!border-neutral-600 !bg-neutral-900 !text-white placeholder:text-neutral-500 focus:!border-brand-600 focus:!ring-brand-600 disabled:!bg-neutral-800 disabled:!text-neutral-500'"
            />
          </div>

          <!-- Amount Input -->
          <div class="lg:col-span-2">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Amount
            </label>
            <div class="relative">
              <input
                v-model.number="amountInput"
                type="number"
                min="1"
                step="1"
                class="h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 pr-4 text-sm font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                placeholder="1000"
                @input="handleAmountInput"
              />
            </div>
          </div>
        </div>

        <!-- Timeframe Toggle -->
        <div class="mt-4">
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Timeframe
          </label>
          <div class="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
            <button
              v-for="tf in timeframes"
              :key="tf"
              class="flex-1 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors"
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
        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-700 pt-4 text-xs text-neutral-400">
          <span>{{ summary ? `${formatNumber(summary.quotesInRange)} quotes in range` : 'Loading coverage...' }}</span>
          <span class="text-neutral-600">|</span>
          <span>{{ summary ? `${summary.providersIncluded} providers included` : '-' }}</span>
          <span class="text-neutral-600">|</span>
          <span>{{ summary ? `Methods: ${formatMethods(summary.methodsIncluded)}` : 'Methods: Bank' }}</span>
          <span class="text-neutral-600">|</span>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            <span>Updated {{ store.lastUpdatedRelative }}</span>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- Navigation Bar -->
      <div class="sticky top-[72px] z-40 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
        <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div class="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <button class="hover:text-white" @click="scrollToSection('snapshot')">Snapshot</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('dispersion')">Pricing Dispersion</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('competition')">Provider Competition</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('reliability')">Reliability</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('risk')">Risk & Anomalies</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('deep-dives')">Deep Dives</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('exports')">Exports</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('enterprise')">Enterprise</button>
            <span class="text-neutral-700">|</span>
            <button class="hover:text-white" @click="scrollToSection('methodology')">Methodology</button>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
              @click="scrollToSection('exports')"
            >
              Download
            </button>
          </div>
        </div>
      </div>
      <!-- 1. Market Snapshot - Overview KPIs -->
      <section id="snapshot" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'snapshot' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-2xl font-bold text-white">Market Snapshot</h2>
            <p class="text-sm text-neutral-400">Executive summary for the selected corridor and timeframe.</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-neutral-500">
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
            <span>{{ snapshotSummary ? `Updated ${formatTimestamp(snapshotSummary.lastUpdated)} UTC` : 'Loading snapshot...' }}</span>
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
            <div class="flex items-center justify-between text-xs text-neutral-500">
              <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ kpi.label }}</span>
              <span class="text-neutral-600 flex-shrink-0 ml-1" :title="kpi.tooltip">(i)</span>
            </div>
            <div class="mt-2 text-2xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{{ kpi.value }}</div>
            <div class="mt-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis" :class="getDeltaClass(kpi.deltaType)">{{ kpi.delta }}</div>
          </button>
          <div
            v-if="!snapshotSummary"
            v-for="i in 5"
            :key="`kpi-skeleton-${i}`"
            class="rounded-xl border border-neutral-700 bg-neutral-800 p-4"
          >
            <div class="h-4 w-24 rounded bg-neutral-700" />
            <div class="mt-3 h-6 w-20 rounded bg-neutral-700" />
            <div class="mt-2 h-3 w-28 rounded bg-neutral-700" />
          </div>
        </div>

          <div class="mt-6 rounded-xl border border-neutral-700 bg-neutral-800 p-6">
            <div class="text-xs uppercase tracking-wider text-neutral-500 mb-2">Executive Note</div>
            <p class="text-sm text-neutral-200">
              {{ executiveNote || 'Loading insight...' }}
            </p>
          </div>
        </div>
      </section>

      <!-- 2. Pricing Analysis - Main Charts -->
      <section
        id="dispersion"
        class="mb-10 px-4 sm:px-6 lg:px-8"
        :class="highlightedSection === 'dispersion' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
      >
        <div class="mx-auto max-w-7xl">
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-white">Pricing Analysis</h2>
            <p class="text-sm text-neutral-400">Effective rates, market spread, and pricing dispersion over time.</p>
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
      <section id="competition" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'competition' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-white">Provider Benchmarking</h2>
            <p class="text-sm text-neutral-400">Leaderboard and win-share timeline across providers.</p>
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
        class="mb-10 px-4 sm:px-6 lg:px-8"
        :class="highlightedSection === 'bank-gap' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
      >
        <div class="mx-auto max-w-7xl">
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-white">Bank vs Specialist Comparison</h2>
            <p class="text-sm text-neutral-400">See how traditional banks compare to specialist providers.</p>
          </div>
          <PulseBankComparison />
        </div>
      </section>

      <!-- 4.5. Operational Coverage -->
      <section
        id="operational-coverage"
        class="mb-10 px-4 sm:px-6 lg:px-8"
        :class="highlightedSection === 'operational-coverage' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''"
      >
        <div class="mx-auto max-w-7xl">
          <PulseOperationalCoverage />
        </div>
      </section>

      <!-- 5. Reliability & Coverage -->
      <section id="reliability" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'reliability' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-white">Reliability & Coverage</h2>
            <p class="text-sm text-neutral-400">Quote success rates, method support, and data freshness.</p>
          </div>
          <PulseReliabilityCoverage />
        </div>
      </section>

      <!-- 6. Risk & Anomalies -->
      <section id="risk" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'risk' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="mb-4">
            <h2 class="text-2xl font-bold text-white">Risk & Anomalies</h2>
            <p class="text-sm text-neutral-400">Live event feed with anomaly signals and recommended actions.</p>
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
      <section id="deep-dives" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'deep-dives' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-white">Deep Dives</h2>
            <p class="text-sm text-neutral-400">Historical analysis and detailed chart breakdowns.</p>
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
      <section id="exports" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'exports' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
            <div class="border-b border-neutral-700 px-6 py-4">
              <h2 class="text-lg font-bold text-white">Exports & Integrations</h2>
              <p class="text-sm text-neutral-400">Use Pulse data in reports, workflows, and pricing systems.</p>
            </div>
            <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
              <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                <div class="text-sm font-semibold text-white">Download Snapshot</div>
                <p class="mt-1 text-xs text-neutral-400">CSV/PDF exports for the current corridor and timeframe.</p>
                <button class="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Download CSV</button>
              </div>
              <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                <div class="text-sm font-semibold text-white">Embed Charts</div>
                <p class="mt-1 text-xs text-neutral-400">Share corridor charts with attribution and timestamps.</p>
                <button class="mt-3 w-full rounded-lg border border-neutral-600 px-3 py-2 text-xs font-semibold text-white">Get Embed Code</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 8b. Enterprise Access -->
      <section id="enterprise" class="mb-10 px-4 sm:px-6 lg:px-8" :class="highlightedSection === 'enterprise' ? 'ring-1 ring-blue-500/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
        <div class="rounded-xl border border-blue-500/40 bg-gradient-to-br from-blue-500/15 to-neutral-800 overflow-hidden">
          <div class="border-b border-blue-500/40 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/30">
                <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Enterprise Access</h2>
                <p class="text-sm text-neutral-400">API, webhooks, extended history, and advanced signals for enterprise teams</p>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-4">
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div class="text-sm font-semibold text-white">API Access</div>
              </div>
              <p class="text-xs text-neutral-400">RESTful API for programmatic access to real-time and historical pricing data</p>
            </div>
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <div class="text-sm font-semibold text-white">Webhooks</div>
              </div>
              <p class="text-xs text-neutral-400">Real-time event notifications for price changes, anomalies, and market shifts</p>
            </div>
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm font-semibold text-white">Extended History</div>
              </div>
              <p class="text-xs text-neutral-400">Access to multi-year historical data for trend analysis and backtesting</p>
            </div>
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div class="text-sm font-semibold text-white">Advanced Signals</div>
              </div>
              <p class="text-xs text-neutral-400">Additional market signals, volatility metrics, and predictive indicators</p>
            </div>
          </div>
          <div class="border-t border-blue-500/40 px-6 py-4">
            <NuxtLink
              to="/institutions/data-products"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              Learn More About Enterprise Access
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>
        </div>
        </div>
      </section>

      <!-- 9. Methodology & Data Notes -->
      <section id="methodology" class="px-4 sm:px-6 lg:px-8 mb-10" :class="highlightedSection === 'methodology' ? 'ring-1 ring-brand-600/60 rounded-xl ring-offset-2 ring-offset-neutral-900' : ''">
        <div class="mx-auto max-w-7xl">
          <PulseDataNotes />
        </div>
      </section>

      <!-- 10. Report Discrepancy -->
      <section class="py-12 sm:py-16 bg-slate-900 w-full">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
              See something that doesn't look right?
            </h2>
            <p class="text-base text-slate-300 max-w-2xl mx-auto">
              If you notice a mismatch between our displayed quote and checkout, we want to know. 
              We investigate every report and update our data pipeline accordingly.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <NuxtLink
              to="/contact"
              class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
            >
              <div class="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="text-center">
                <h3 class="text-lg font-bold text-neutral-900 mb-2">
                  Report a rate issue
                </h3>
                <p class="text-sm text-neutral-600">
                  Spotted a discrepancy between our quote and your checkout? Let us know so we can investigate and improve our data.
                </p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/methodology"
              class="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-700 hover:border-brand-500 hover:shadow-2xl transition-all group"
            >
              <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="text-center">
                <h3 class="text-lg font-bold text-neutral-900 mb-2">
                  View our methodology
                </h3>
                <p class="text-sm text-neutral-600">
                  See exactly how we collect quotes, calculate scores, and ensure data quality across all providers.
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 11. Our Impact So Far -->
      <section class="py-12 sm:py-16 bg-brand-600 w-full">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Impact So Far
            </h2>
            <p class="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              Built by an expat who got tired of watching money disappear to bank fees. We track <span class="font-semibold whitespace-nowrap">30+ providers</span> across <span class="font-semibold whitespace-nowrap">150+ countries</span> in real time. <span class="font-semibold whitespace-nowrap">Providers cannot pay to rank higher</span>, we just show you which option gets the most money to your recipient.
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="text-5xl font-bold text-white mb-2">
                50,000+
              </div>
              <div class="text-sm text-white/90">
                Users helped
              </div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="text-5xl font-bold text-white mb-2">
                $2M+
              </div>
              <div class="text-sm text-white/90">
                Saved by users
              </div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="text-5xl font-bold text-white mb-2">
                30+
              </div>
              <div class="text-sm text-white/90">
                Providers tracked
              </div>
            </div>

            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-5xl font-bold text-white mb-2">
                150+
              </div>
              <div class="text-sm text-white/90">
                Countries covered
              </div>
            </div>
          </div>

          <div class="mt-12 text-center">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors group"
            >
              <span class="text-sm font-semibold">Learn about our methodology</span>
              <svg
                class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
      </section>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { PulseFilters, ChartData, PulseSnapshotSummary, PulseDeltaType, PulseTimeframe, PulseCoverageSummary } from '~/types/pulse'
import { getChartData, getPulseSnapshotSummary, getPulseCoverageSummary } from '~/lib/pulseApi'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'
import { usePulseStore, type PulseCorridor } from '~/stores/pulse'
import { COUNTRIES, getCountryByCode, getAvailableCurrencies } from '~/utils/countries-currencies'
import { useEntitlements } from '~/composables/useEntitlements'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'
import { FEATURE_FLAGS } from '~/utils/constants'

if (!FEATURE_FLAGS.PULSE_ENABLED) {
  await navigateTo('/plus', { redirectCode: 302 })
}

const router = useRouter()
const route = useRoute()
const store = usePulseStore()
const { isPlus } = useEntitlements()
const shareModalChart = ref<string | null>(null)
const embedModalChart = ref<string | null>(null)
const activeMetric = ref<'rate' | 'markup'>('rate')
const highlightedSection = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

const timeframes: PulseTimeframe[] = ['24H', '7D', '30D', '1Y', 'MAX']
const summary = ref<PulseCoverageSummary | null>(null)

const fromCountry = ref(store.corridor.fromCode === 'USD' ? 'US' : '')
const toCountry = ref(store.corridor.toCode === 'PHP' ? 'PH' : '')
const fromCurrency = ref(store.corridor.fromCode || 'USD')
const toCurrency = ref(store.corridor.toCode || 'PHP')
const amountInput = ref(store.amount || 1000)

function buildCorridorFromCountries(): PulseCorridor | null {
  if (!fromCountry.value || !toCountry.value || !fromCurrency.value || !toCurrency.value) {
    return null
  }

  const fromCountryData = getCountryByCode(fromCountry.value)
  const toCountryData = getCountryByCode(toCountry.value)

  if (!fromCountryData || !toCountryData) {
    return null
  }

  return {
    from: fromCountryData.name,
    to: toCountryData.name,
    fromCode: fromCurrency.value,
    toCode: toCurrency.value,
    fromFlag: fromCountryData.flag,
    toFlag: toCountryData.flag,
    label: `${fromCurrency.value} → ${toCurrency.value}`,
    slug: `${fromCurrency.value.toLowerCase()}-${toCurrency.value.toLowerCase()}`,
    corridorId: `${fromCountry.value}-${toCountry.value}-${fromCurrency.value}-${toCurrency.value}`,
  }
}

function handleFromCountryChange(countryCode: string, currency: string) {
  fromCountry.value = countryCode
  if (currency && !fromCurrency.value) {
    fromCurrency.value = currency
  }
  updateCorridor()
}

function handleToCountryChange(countryCode: string, currency: string) {
  toCountry.value = countryCode
  if (currency && !toCurrency.value) {
    toCurrency.value = currency
  }
  updateCorridor()
}

function handleAmountInput() {
  const amount = parseInt(String(amountInput.value), 10)
  if (!isNaN(amount) && amount > 0) {
    store.setAmount(amount)
  }
}

function updateCorridor() {
  const corridor = buildCorridorFromCountries()
  if (corridor) {
    store.setCorridor(corridor)
  }
}

watch([fromCurrency, toCurrency], () => {
  updateCorridor()
})

watch(fromCountry, (newCountry) => {
  if (newCountry) {
    const country = getCountryByCode(newCountry)
    if (country) {
      const availableCurrencies = getAvailableCurrencies(newCountry)
      if (!availableCurrencies.includes(fromCurrency.value)) {
        fromCurrency.value = country.currency
      }
    }
  }
})

watch(toCountry, (newCountry) => {
  if (newCountry) {
    const country = getCountryByCode(newCountry)
    if (country) {
      const availableCurrencies = getAvailableCurrencies(newCountry)
      if (!availableCurrencies.includes(toCurrency.value)) {
        toCurrency.value = country.currency
      }
    }
  }
})

const legacyFilters = computed<PulseFilters>(() => ({
  corridor: store.corridor.slug,
  corridorId: store.corridor.corridorId,
  amount: store.amount as 100 | 200 | 500 | 1000,
  fundingMethod: 'bank',
  payoutMethod: 'bank',
}))

const chartData = ref<Record<string, ChartData | null>>({})
const snapshotSummary = ref<PulseSnapshotSummary | null>(null)

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
  try {
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
  } catch (e) {
    console.error('Failed to load chart data:', e)
  }
}

async function loadSnapshotSummary() {
  try {
    snapshotSummary.value = await getPulseSnapshotSummary(store.corridor, store.timeframe, store.amount)
  } catch (e) {
    console.error('Failed to load snapshot summary:', e)
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

function formatTimestamp(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16)
}

function getDeltaClass(deltaType: PulseDeltaType) {
  if (deltaType === 'positive') return 'text-emerald-400'
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
  const mapping: Record<string, { section: string; metric?: 'rate' | 'markup' }> = {
    'all-in-cost': { section: 'snapshot-chart', metric: 'markup' },
    'market-spread': { section: 'market-spread', metric: 'markup' },
    leader: { section: 'competition', metric: 'rate' },
    volatility: { section: 'risk', metric: 'rate' },
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

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function formatMethods(methods: string[]): string {
  return methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ')
}

async function loadCoverageSummary() {
  try {
    summary.value = await getPulseCoverageSummary(store.corridor, store.timeframe)
  } catch (e) {
    console.error('Failed to load coverage summary:', e)
  }
}

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => {
    loadSnapshotSummary()
    loadChartData()
    loadCoverageSummary()
  },
  { deep: true }
)

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)
  await store.initFromRoute(route.query as Record<string, string>)
  
  // Initialize form fields from store corridor
  const fromCountryData = COUNTRIES.find(c => c.name === store.corridor.from || c.currency === store.corridor.fromCode)
  const toCountryData = COUNTRIES.find(c => c.name === store.corridor.to || c.currency === store.corridor.toCode)
  
  if (fromCountryData) {
    fromCountry.value = fromCountryData.code
    fromCurrency.value = store.corridor.fromCode
  } else {
    // Fallback: try to find by currency
    const fallback = COUNTRIES.find(c => c.currency === store.corridor.fromCode)
    if (fallback) {
      fromCountry.value = fallback.code
      fromCurrency.value = store.corridor.fromCode
    }
  }
  
  if (toCountryData) {
    toCountry.value = toCountryData.code
    toCurrency.value = store.corridor.toCode
  } else {
    // Fallback: try to find by currency
    const fallback = COUNTRIES.find(c => c.currency === store.corridor.toCode)
    if (fallback) {
      toCountry.value = fallback.code
      toCurrency.value = store.corridor.toCode
    }
  }
  
  amountInput.value = store.amount

  loadSnapshotSummary()
  loadChartData()
  loadCoverageSummary()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
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
      children: JSON.stringify({
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
