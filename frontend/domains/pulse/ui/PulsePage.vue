<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Public preview (no Plus required) -->
    <div v-if="!isPlus" class="min-h-screen">
      <!-- Hero -->
      <div class="px-page-x pb-12 pt-16">
        <div class="mx-auto max-w-page">
          <div class="grid grid-cols-1 gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
            <div class="space-y-6">
              <h1 class="text-hero font-bold leading-tight" aria-label="Remit-Scout Pulse">
                <span class="text-white">Remit-Scout</span>
                <span class="text-brand-600">Pulse</span>
              </h1>
              <p class="text-body-lg max-w-xl leading-relaxed text-white/70">
                Real-time market intelligence for remittance pricing. Track rates, fees, and
                provider performance across 49,000+ corridors with 18 market charts and 25+
                monitored providers.
              </p>
              <p class="text-body max-w-lg text-white/50">
                Built for analysts, compliance teams, and operations managers who need accurate,
                up-to-date pricing data.
              </p>
              <div class="flex flex-col gap-3 sm:flex-row">
                <NuxtLink
                  to="/plus"
                  class="text-body inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-brand-500 hover:shadow-xl"
                >
                  Get Plus
                </NuxtLink>
                <NuxtLink
                  to="/sign-in"
                  class="text-body inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-surface/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Sign in
                </NuxtLink>
              </div>
              <NuxtLink
                to="/methodology"
                class="text-body-sm inline-flex items-center gap-1.5 font-medium text-white/40 transition-colors hover:text-white/70"
              >
                Our methodology
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </NuxtLink>
            </div>

            <div class="w-full">
              <PulseDashboardPreview />
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Dashboard + Sample Chart -->
      <div class="bg-surface px-page-x py-16 lg:py-20">
        <div class="mx-auto max-w-page">
          <div class="mb-10">
            <div class="mb-3 flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                />
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span class="text-body-sm font-semibold uppercase tracking-wider text-neutral-500"
                >Illustrative sample — US → Philippines</span
              >
            </div>
            <h2 class="text-h2 font-bold text-neutral-900">Market Snapshot</h2>
            <p class="text-body mt-2 text-neutral-600">
              Sending $1,000 USD — this sample shows how Pulse frames a corridor snapshot across 7
              providers.
            </p>
          </div>

          <!-- 4 KPI Tiles -->
          <div ref="kpiSectionRef" class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
              v-for="(kpi, idx) in sampleKpis"
              :key="kpi.id"
              class="translate-y-4 rounded-xl border border-l-2 border-neutral-200 border-l-brand-600 bg-surface p-4 opacity-0 shadow-sm duration-500 motion-safe:transition-all"
              :style="{ transitionDelay: `${idx * 100}ms` }"
            >
              <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <svg
                  v-if="kpi.icon === 'trending'"
                  class="h-5 w-5 text-brand-600"
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
                <svg
                  v-else-if="kpi.icon === 'percent'"
                  class="h-5 w-5 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6"
                  />
                </svg>
                <svg
                  v-else-if="kpi.icon === 'trophy'"
                  class="h-5 w-5 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-brand-600"
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
              </div>
              <div class="text-body-sm mb-1 font-medium text-neutral-500">{{ kpi.label }}</div>
              <div
                class="kpi-value text-h4 mb-1 font-bold tabular-nums text-neutral-900"
                :data-target="kpi.value"
              >
                {{ kpi.value }}
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-body-sm font-semibold" :class="kpi.deltaClass">
                  <svg
                    v-if="kpi.deltaType === 'positive'"
                    class="inline h-3 w-3"
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
                  {{ kpi.delta }}
                </span>
                <span v-if="kpi.deltaLabel" class="text-body-sm text-neutral-400">{{
                  kpi.deltaLabel
                }}</span>
              </div>
            </div>
          </div>

          <!-- Full-width Sample Area Chart -->
          <div
            ref="chartRef"
            class="overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm"
            data-chart-export-root
          >
            <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div>
                <h3 class="text-body-lg font-bold text-neutral-900">All-in Cost Index</h3>
                <p class="text-body-sm text-neutral-500">
                  Effective exchange rate over 7 days — USD → PHP
                </p>
              </div>
              <div class="text-body-sm hidden items-center gap-4 sm:flex">
                <span class="flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-brand-600" />
                  <span class="text-neutral-500">Best rate</span>
                </span>
                <span class="flex items-center gap-1.5">
                  <span
                    class="h-0.5 w-4 bg-neutral-300"
                    style="border-bottom: 2px dashed #d4d4d4; height: 0"
                  />
                  <span class="text-neutral-500">Mid-market</span>
                </span>
              </div>
            </div>
            <div class="px-4 py-6 sm:px-6">
              <svg viewBox="0 0 780 280" class="w-full" preserveAspectRatio="xMidYMid meet">
                <line
                  v-for="tick in previewRateYTicks"
                  :key="`grid-${tick.y}`"
                  x1="55"
                  :y1="tick.y"
                  x2="770"
                  :y2="tick.y"
                  :stroke="tick.isBaseline ? '#e5e5e5' : '#f5f5f5'"
                  stroke-width="1"
                />

                <text
                  v-for="tick in previewRateYTicks"
                  :key="`label-${tick.y}`"
                  x="48"
                  :y="tick.y + 4"
                  text-anchor="end"
                  fill="#a3a3a3"
                  font-size="11"
                  font-family="system-ui"
                >
                  {{ tick.label }}
                </text>

                <text
                  v-for="tick in previewRateDayTicks"
                  :key="`day-${tick.label}`"
                  :x="tick.x"
                  y="262"
                  text-anchor="middle"
                  fill="#a3a3a3"
                  font-size="11"
                  font-family="system-ui"
                >
                  {{ tick.label }}
                </text>

                <defs>
                  <linearGradient id="sample-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563EB" stop-opacity="0.12" />
                    <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  :d="previewRateBestAreaPath"
                  fill="url(#sample-area-grad)"
                  :class="{ 'chart-area-animate': chartVisible }"
                />
                <polyline
                  :points="previewRateMidPolyline"
                  fill="none"
                  stroke="#9ca3af"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-dasharray="6 4"
                />
                <polyline
                  :points="previewRateBestPolyline"
                  fill="none"
                  stroke="#2563EB"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :class="{ 'chart-line-animate': chartVisible }"
                />

                <circle
                  v-for="point in previewRateBestPoints"
                  :key="`best-${point.x}`"
                  :cx="point.x"
                  :cy="point.y"
                  :r="point.highlight ? 4.5 : 3.5"
                  :fill="point.highlight ? '#2563EB' : 'white'"
                  stroke="#2563EB"
                  stroke-width="2"
                />

                <rect
                  :x="previewPeakBestLabelRect.x"
                  :y="previewPeakBestLabelRect.y"
                  :width="previewPeakBestLabelRect.width"
                  :height="previewPeakBestLabelRect.height"
                  rx="4"
                  fill="#2563EB"
                />
                <text
                  :x="previewPeakBestLabelRect.x + previewPeakBestLabelRect.width / 2"
                  :y="previewPeakBestLabelRect.y + 13"
                  text-anchor="middle"
                  fill="white"
                  font-size="10"
                  font-weight="bold"
                  font-family="system-ui"
                >
                  {{ previewPeakBestLabel }}
                </text>

                <rect
                  :x="previewLatestMidLabelRect.x"
                  :y="previewLatestMidLabelRect.y"
                  :width="previewLatestMidLabelRect.width"
                  :height="previewLatestMidLabelRect.height"
                  rx="3"
                  fill="white"
                  stroke="#d4d4d4"
                  stroke-width="1"
                />
                <text
                  :x="previewLatestMidLabelRect.x + previewLatestMidLabelRect.width / 2"
                  :y="previewLatestMidLabelRect.y + 11"
                  text-anchor="middle"
                  fill="#9ca3af"
                  font-size="9.5"
                  font-family="system-ui"
                >
                  {{ previewLatestMidLabel }}
                </text>

                <rect
                  :x="previewLatestBestLabelRect.x"
                  :y="previewLatestBestLabelRect.y"
                  :width="previewLatestBestLabelRect.width"
                  :height="previewLatestBestLabelRect.height"
                  rx="3"
                  fill="#eff6ff"
                  stroke="#2563EB"
                  stroke-width="0.5"
                />
                <text
                  :x="previewLatestBestLabelRect.x + previewLatestBestLabelRect.width / 2"
                  :y="previewLatestBestLabelRect.y + 11"
                  text-anchor="middle"
                  fill="#2563EB"
                  font-size="10"
                  font-weight="600"
                  font-family="system-ui"
                >
                  {{ previewLatestBestLabel }}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Coverage -->
      <div class="bg-surface px-page-x pb-12">
        <div class="mx-auto max-w-page">
          <p
            class="text-body-sm mb-6 text-center font-semibold uppercase tracking-wider text-neutral-500"
          >
            Tracking 25+ providers in real-time
          </p>
          <div class="flex flex-wrap items-center justify-center gap-5">
            <div
              v-for="slug in providerSlugs"
              :key="slug"
              class="flex h-10 w-20 items-center justify-center rounded-lg border border-neutral-100 bg-white p-1.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            >
              <ProviderLogo :slug="slug" :alt="slug" size="small" fit />
            </div>
          </div>
        </div>
      </div>

      <!-- Sample Charts Gallery -->
      <div class="bg-neutral-950 px-page-x py-16 lg:py-20">
        <div class="mx-auto max-w-page">
          <div class="mb-10 text-center">
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-1.5"
            >
              <span class="relative flex h-2 w-2">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"
                />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              <span class="text-body-sm font-semibold text-neutral-300"
                >Illustrative sample — 🇺🇸 USD → 🇵🇭 PHP</span
              >
            </div>
            <h2 class="text-h2 font-bold text-white">18 Charts Across 4 Categories</h2>
            <p class="text-body mx-auto mt-2 max-w-2xl text-neutral-400">
              Preview the pricing, competition, volatility, and coverage views Pulse exposes once
              live corridor data is available.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              v-for="(chart, idx) in previewChartCards"
              :key="chart.id"
              v-reveal="{ delay: idx * 80 }"
              class="preview-card overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg"
            >
              <div class="px-5 pb-2 pt-5">
                <div class="mb-2 flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: chart.accent }" />
                  <span
                    class="text-body-sm font-semibold uppercase tracking-wider text-neutral-500"
                    >{{ chart.category }}</span
                  >
                </div>
                <h3 class="text-body-lg mb-1 font-bold text-white">{{ chart.title }}</h3>
                <p class="text-body-sm text-neutral-500">{{ chart.description }}</p>
              </div>
              <div class="px-2 pb-2">
                <PulseLineChart
                  v-if="chart.type === 'line'"
                  :series="sampleChartSeries[chart.id] || []"
                  :unit="chart.unit"
                  :show-area="chart.showArea ?? true"
                />
                <PulseBarChart
                  v-else
                  :series="sampleChartSeries[chart.id] || []"
                  :unit="chart.unit"
                  :threshold="chart.threshold ?? null"
                />
              </div>
            </div>
          </div>

          <p class="text-body-sm mt-8 text-center text-neutral-500">
            Plus unlocks the live decision dashboard. Enterprise adds deep-dive chart drill-downs,
            screener access, and exports.
          </p>
        </div>
      </div>

      <!-- Data Quality / Methodology Strip -->
      <div class="bg-neutral-900 px-page-x py-12">
        <div class="mx-auto max-w-page">
          <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg
                  class="h-4.5 w-4.5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">5-min refresh cadence</div>
                <div class="text-[12px] text-neutral-500">
                  Quotes refreshed across all monitored providers
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg
                  class="h-4.5 w-4.5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">SHA-256 audit trail</div>
                <div class="text-[12px] text-neutral-500">
                  Every quote timestamped and cryptographically verified
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg
                  class="h-4.5 w-4.5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">Synthetic verification v2.5</div>
                <div class="text-[12px] text-neutral-500">
                  Rates validated against mid-market benchmarks
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg
                  class="h-4.5 w-4.5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">Open methodology</div>
                <div class="text-[12px] text-neutral-500">
                  Full documentation of indices, scoring, and data pipeline
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 text-center">
            <NuxtLink
              to="/methodology"
              class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-400 transition-colors hover:text-brand-300"
            >
              Read our full methodology
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <!-- Corridor Screener + Movers -->
      <div class="bg-surface px-page-x py-16 lg:py-20">
        <div class="mx-auto max-w-page">
          <div class="mb-10 text-center">
            <h2 class="text-h2 font-bold text-neutral-900">Corridor Intelligence</h2>
            <p class="text-body mt-2 text-neutral-600">
              Monitor pricing signals and movement across the corridors that matter most.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- Mini Screener -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-body-lg font-bold text-neutral-900">Preview Screener</h3>
                <span class="text-body-sm text-neutral-500">Illustrative 8-row sample</span>
              </div>
              <div
                class="overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm"
              >
                <div
                  class="grid grid-cols-[auto,1fr,auto] gap-4 border-b border-neutral-200 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
                >
                  <span />
                  <span>Corridor / Best Provider</span>
                  <span class="text-right">Spread / Coverage</span>
                </div>
                <div class="divide-y divide-neutral-100">
                  <div
                    v-for="(row, idx) in previewScreenerRows"
                    :key="row.corridor"
                    v-reveal="{ delay: idx * 60 }"
                    class="screener-row flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50"
                  >
                    <span class="text-xl leading-none">{{ row.flag }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-body font-bold text-neutral-900">{{ row.corridor }}</span>
                        <span
                          class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
                          :class="{
                            'bg-emerald-100 text-emerald-700': row.badge === 'Great',
                            'bg-blue-100 text-blue-700': row.badge === 'Good',
                            'bg-amber-100 text-amber-700': row.badge === 'Fair',
                          }"
                        >
                          {{ row.badge }}
                        </span>
                      </div>
                      <div class="text-body-sm mt-0.5 text-neutral-500">
                        Best: {{ row.bestProvider }} @ {{ row.bestRate }} · Gets
                        {{ row.recipientGets }}
                      </div>
                    </div>
                    <div class="shrink-0 text-right">
                      <div class="text-body-sm font-bold tabular-nums text-neutral-900">
                        {{ row.spread }} bps
                      </div>
                      <div class="text-[11px] text-neutral-400">
                        {{ row.providers }} providers · {{ row.updated }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-body-sm mt-3 text-neutral-500">
                Illustrative rows for layout and workflow only. Enterprise unlocks the live corridor
                screener and rankings.
              </p>
            </div>

            <!-- Movers -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-body-lg font-bold text-neutral-900">Corridor Movers</h3>
                <span class="text-body-sm text-neutral-500">Biggest pricing changes</span>
              </div>
              <PulseMoversList variant="public" :limit="6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Features + CTA -->
      <div class="bg-neutral-900 px-page-x py-16 lg:py-24">
        <div class="mx-auto max-w-page">
          <div class="mb-12 text-center">
            <h2 class="text-h2 font-bold text-white">Unlock more from Pulse</h2>
            <p class="text-body-lg mx-auto mt-3 max-w-2xl text-white/70">
              Plus unlocks live corridor monitoring, narrative, and alerts. Enterprise adds full
              chart drill-downs, screener access, exports, and embeds.
            </p>
          </div>

          <div class="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
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
              </div>
              <div class="text-body mb-1 font-bold text-white">Smart Gauge</div>
              <p class="text-body-sm text-neutral-400">
                Data-driven timing signals for the selected corridor.
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div class="text-body mb-1 font-bold text-white">18 Market Charts</div>
              <p class="text-body-sm text-neutral-400">
                Plus includes live preview cards. Enterprise unlocks drill-down views and extended
                history.
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="text-body mb-1 font-bold text-white">Corridor Screener</div>
              <p class="text-body-sm text-neutral-400">
                Enterprise-only scanning across 49,000+ corridors with spread and provider rankings.
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
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
              <div class="text-body mb-1 font-bold text-white">Smart Alerts</div>
              <p class="text-body-sm text-neutral-400">
                Get notified when rates hit your target or providers change pricing.
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div class="text-body mb-1 font-bold text-white">Exports & Embeds</div>
              <p class="text-body-sm text-neutral-400">
                Plus includes snapshot CSVs. Enterprise adds compliance-ready exports and public
                embeds.
              </p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div
                class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15"
              >
                <svg
                  class="h-5 w-5 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="text-body mb-1 font-bold text-white">Provider Benchmarking</div>
              <p class="text-body-sm text-neutral-400">
                Enterprise teams can compare provider performance, reliability, and coverage in one
                workspace.
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink
              to="/plus"
              class="text-body-lg inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-xl"
            >
              Get Plus
            </NuxtLink>
            <NuxtLink
              to="/contact?type=enterprise&topic=pulse"
              class="text-body-lg inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/5"
            >
              Contact sales
            </NuxtLink>
          </div>
          <div class="mt-3 text-center">
            <p class="text-body-sm text-white/50">
              Need screener access, exports, or embeds? Those workflows stay on Enterprise.
            </p>
          </div>
        </div>
      </div>

      <!-- Institutional Teaser -->
      <InstitutionalTeaser />

      <!-- Trust Strip -->
      <TrustMetricsStrip bg-class="bg-brand-600" />
    </div>

    <!-- Pulse Content: Only show if Plus member -->
    <div v-else>
      <div class="border-b border-neutral-700 bg-neutral-800">
        <div class="container py-12 lg:py-16">
          <!-- Data Status Badge (no fabricated freshness) -->
          <div class="mb-8 flex items-center gap-4">
            <div
              class="flex items-center gap-2.5 rounded-full border px-4 py-2"
              :class="
                store.lastUpdated
                  ? 'border-success-600/30 bg-success-600/15'
                  : 'border-neutral-700 bg-neutral-900'
              "
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
            <span class="text-body-sm text-neutral-400"
              >Market analytics for remittance pricing</span
            >
            <span
              v-if="pulseEnvironmentBadge"
              class="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300"
            >
              {{ pulseEnvironmentBadge }}
            </span>
          </div>

          <div class="mb-8 rounded-2xl border border-brand-500/25 bg-brand-500/10 p-4">
            <div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div class="text-body-sm font-semibold uppercase tracking-wider text-brand-100">
                  Benchmark Note
                </div>
                <p class="text-body-sm mt-1 max-w-3xl text-brand-50/90">
                  Gold export-backed Pulse analytics normalize to a standard ${{
                    GOLD_STANDARD_BENCHMARK_AMOUNT
                  }}
                  USD-equivalent send amount so corridor benchmarks stay comparable. Compare,
                  alerts, and sender actions still use the amount you select.
                </p>
              </div>
              <span
                class="inline-flex shrink-0 items-center rounded-full border border-brand-400/30 bg-neutral-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100"
              >
                Standard Gold benchmark · ${{ GOLD_STANDARD_BENCHMARK_AMOUNT }}
              </span>
            </div>
          </div>

          <!-- Main Header Content -->
          <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <!-- Title and Description -->
            <div class="flex-1 space-y-4">
              <div>
                <h1 class="text-hero mb-4 font-bold leading-tight text-white">
                  <span class="text-white">Remit</span><span class="text-brand-600">-</span
                  ><span class="text-brand-600">Pulse</span>
                </h1>
                <p class="text-body-lg max-w-2xl leading-relaxed text-neutral-300">
                  Market intelligence for remittance pricing. Track spreads, markups, provider
                  performance, volatility, and reliability across corridors and payment methods.
                </p>
              </div>
              <p class="text-body-sm max-w-2xl text-neutral-400">
                Built for analysts, researchers, and enterprise teams who need accurate, up-to-date
                pricing data.
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
                  class="text-body-sm rounded-lg px-4 py-2 font-bold uppercase tracking-wider transition-colors"
                  :class="
                    store.viewMode === 'sender'
                      ? 'bg-brand-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="setViewMode('sender')"
                >
                  Decision
                </button>
                <button
                  type="button"
                  class="text-body-sm rounded-lg px-4 py-2 font-bold uppercase tracking-wider transition-colors"
                  :class="
                    store.viewMode === 'analyst'
                      ? 'bg-brand-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="setViewMode('analyst')"
                >
                  Deep Dive
                </button>
              </div>
              <div
                v-else
                class="text-body-sm rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 font-bold uppercase tracking-wider text-white"
              >
                Sender View
              </div>
              <div class="flex flex-col gap-3">
                <NuxtLink
                  to="/contact?type=enterprise&topic=pulse"
                  class="text-body inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl border-2 border-primary-500 bg-primary-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:border-brand-600 hover:bg-brand-600 hover:shadow-xl"
                >
                  Enterprise
                  <Icon name="arrow-right" :size="20" class="text-current" />
                </NuxtLink>
                <NuxtLink
                  to="/methodology"
                  class="text-body inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl border-2 border-success-600 bg-success-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:border-success-600 hover:bg-success-600 hover:shadow-xl"
                >
                  Methodology
                  <Icon name="arrow-right" :size="20" class="text-current" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col py-8">
        <div class="mb-8 px-page-x">
          <div class="mx-auto max-w-page">
            <PulseCorridorFinder
              :corridors="trackedCorridors"
              :featured-corridors="corridorFinderFeaturedCorridors"
              :selected-corridor-id="
                selectedCorridorOption?.corridorId || store.corridor?.corridorId || null
              "
              :selected-timeframe="store.timeframe"
              :selected-amount="store.amount"
              :latest-updated-at="store.lastUpdated || null"
              :gold-benchmark-amount="GOLD_STANDARD_BENCHMARK_AMOUNT"
              @select-corridor="handleCorridorFinderSelect"
              @select-timeframe="handleCorridorFinderTimeframeSelect"
              @select-amount="handleCorridorFinderAmountSelect"
            />
          </div>
        </div>

        <!-- Sender-First Gauge (mobile-first: renders at top on small screens) -->
        <div id="decision" ref="decisionPanelRef" class="order-first mb-10 px-page-x md:order-none">
          <div class="mx-auto max-w-page">
            <div class="space-y-6">
              <PulseSmartGauge />

              <button
                type="button"
                class="text-body inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition-colors hover:bg-brand-700"
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
                :source="narrative?.source || null"
                :loading="highlightsLoading"
              />

              <PulsePersonalHistory :data="personalHistory" :loading="highlightsLoading" />

              <PulseHeroChart metric="rate" :days-available="selectedCorridorDaysAvailable" />

              <PulseMarketQuotes />
            </div>

            <!-- Actions Bar -->
            <div class="mt-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="text-body-sm font-semibold text-white">Actions</div>
                  <div class="text-body-sm text-neutral-400">
                    Compare now, set a smart alert, and export a snapshot for your records.
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    :to="compareCorridorUrl"
                    class="text-body-sm inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 font-bold text-white transition-colors hover:bg-brand-700"
                  >
                    Compare quotes
                  </NuxtLink>
                  <button
                    type="button"
                    class="text-body-sm inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-800"
                    @click="handleAddToWatchlist"
                  >
                    Add to watchlist
                  </button>
                  <button
                    type="button"
                    class="text-body-sm inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-800"
                    @click="handleCreateAlert"
                  >
                    Create alert
                  </button>
                  <NuxtLink
                    :to="{
                      path: '/dashboard',
                      query: { tab: 'account', section: 'notifications' },
                    }"
                    class="text-body-sm inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    Enable notifications
                  </NuxtLink>
                  <button
                    type="button"
                    class="text-body-sm inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="snapshotExporting"
                    @click="downloadSnapshotCsv"
                  >
                    {{ snapshotExporting ? 'Exporting...' : 'Export snapshot CSV' }}
                  </button>
                </div>
              </div>

              <div
                v-if="actionError || actionStatus || snapshotExportError || snapshotExportStatus"
                class="text-body-sm mt-3"
              >
                <p v-if="actionError" class="text-danger-600">
                  {{ actionError }}
                </p>
                <p v-else-if="snapshotExportError" class="text-danger-600">
                  {{ snapshotExportError }}
                </p>
                <p v-else class="text-neutral-400">
                  {{ actionStatus || snapshotExportStatus }}
                </p>
              </div>
            </div>

            <div
              v-if="isPro && store.viewMode === 'sender'"
              class="text-body-sm mt-4 rounded-xl border border-neutral-700 bg-neutral-900/40 p-4 text-neutral-300"
            >
              Want deeper analytics (dispersion, reliability, deep dives)? Switch to Deep Dive.
              <button
                type="button"
                class="ml-2 inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-500"
                @click="setViewMode('analyst')"
              >
                Switch to Deep Dive →
              </button>
            </div>
          </div>
        </div>

        <!-- Screener-first (Enterprise) -->
        <div class="order-2 mb-8 px-page-x md:order-none">
          <div class="mx-auto grid max-w-page grid-cols-1 gap-6 lg:grid-cols-12">
            <div v-if="isPro && pulseScreenerEnabled" class="lg:col-span-7">
              <PulseScreener
                :rows="screenerRows"
                :loading="screenerLoading"
                :error="screenerError"
                :selected-corridor-id="store.corridor?.corridorId || null"
                :selected-timeframe="store.timeframe"
                :pinned-corridor-ids="effectivePinnedCorridorIds"
                :corridor-options="trackedCorridors"
                :corridor-days-map="corridorDaysMap"
                :tracked-corridor-count="trackedCorridors.length"
                :requested-amount="store.amount"
                :query-amount="screenerQueryAmount"
                :gold-benchmark-amount="GOLD_STANDARD_BENCHMARK_AMOUNT"
                @select="handleScreenerSelect"
                @pin="handlePinCorridor"
                @unpin="handleUnpinCorridor"
                @select-timeframe="handleScreenerSelectTimeframe"
              />
            </div>

            <div :class="isPro && pulseScreenerEnabled ? 'lg:col-span-5' : 'lg:col-span-12'">
              <PulseMoversList
                variant="plus"
                :limit="10"
                :selected-corridor-id="store.corridor?.corridorId || null"
                @select="handleMoverSelect"
                @added="handleMoverAdded"
              />
            </div>
          </div>

          <div
            class="mx-auto mt-4 flex max-w-page flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="text-body-sm text-neutral-400">
              <template v-if="isPro && pulseScreenerEnabled">
                Tip: Click a screener row or mover to load the decision panel.
                <span v-if="screenerUpdatedAt" class="ml-2 text-neutral-500"
                  >Screener {{ formatUpdatedLabel(screenerUpdatedAt) }}</span
                >
              </template>
              <template v-else> Tip: Click a mover to load the decision panel below. </template>
            </div>
            <button
              type="button"
              class="text-body-sm inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="filtersForcedVisible"
              @click="toggleAdvancedFilters"
            >
              {{
                filtersForcedVisible
                  ? 'Filters (required)'
                  : filtersVisible
                    ? 'Hide filters'
                    : 'Show filters'
              }}
            </button>
          </div>
        </div>

        <!-- Advanced Filters (optional) -->
        <div v-if="filtersVisible" class="mb-8 px-page-x">
          <div class="mx-auto max-w-page">
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6 shadow-lg">
              <div class="mb-4">
                <h2 class="text-body-lg mb-1 font-bold text-white">Precision Controls</h2>
                <p class="text-body-sm text-neutral-400">
                  Use the navigator above for fast corridor search. This panel stays available for
                  manual overrides and custom amounts.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
                <!-- Tracked Corridor -->
                <div class="lg:col-span-10">
                  <label
                    class="text-body-sm mb-2 block font-semibold uppercase tracking-wide text-neutral-400"
                  >
                    Tracked corridor
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedCorridorKey"
                      class="text-body-sm h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 pr-10 font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <Icon name="chevron-down" :size="16" class="text-neutral-400" />
                    </div>
                  </div>
                  <p
                    v-if="trackedCorridors.length === 0"
                    class="text-body-sm mt-2 text-neutral-400"
                  >
                    No tracked corridors are available right now.
                  </p>
                  <p v-else-if="corridorCoverageLabel" class="text-body-sm mt-2 text-neutral-400">
                    {{ corridorCoverageLabel }}
                  </p>
                </div>

                <!-- Amount Input -->
                <div class="lg:col-span-2">
                  <label
                    class="text-body-sm mb-2 block font-semibold uppercase tracking-wide text-neutral-400"
                  >
                    Amount
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="amountInput"
                      type="number"
                      min="1"
                      step="1"
                      class="text-body-sm h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 pr-4 font-medium text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                      placeholder="500"
                      @input="handleAmountInput"
                    />
                  </div>
                </div>
              </div>

              <!-- Timeframe Toggle -->
              <div class="mt-4">
                <label
                  class="text-body-sm mb-2 block font-semibold uppercase tracking-wide text-neutral-400"
                >
                  Timeframe
                </label>
                <div class="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
                  <button
                    v-for="tf in timeframes"
                    :key="tf"
                    class="text-body-sm flex-1 rounded-md px-3 py-2.5 font-semibold transition-colors"
                    :class="
                      store.timeframe === tf
                        ? 'bg-brand-600 text-white'
                        : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    "
                    @click="store.setTimeframe(tf)"
                  >
                    {{ tf }}
                  </button>
                </div>
              </div>

              <!-- Coverage Summary -->
              <div
                class="text-body-sm mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-700 pt-4 text-neutral-400"
              >
                <span>{{
                  summary
                    ? `${formatCount(summary.quotesInRange)} quotes in range`
                    : 'Loading coverage...'
                }}</span>
                <span class="text-neutral-600">|</span>
                <span>{{ summary ? `${summary.providersIncluded} providers included` : '-' }}</span>
                <span class="text-neutral-600">|</span>
                <span>{{
                  summary ? `Methods: ${formatMethods(summary.methodsIncluded)}` : 'Methods: Bank'
                }}</span>
                <span class="text-neutral-600">|</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="summary?.lastUpdated"
                    class="relative flex h-2 w-2"
                    aria-hidden="true"
                  >
                    <span
                      class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75"
                    />
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
          <div
            class="sticky top-[72px] z-sticky -mx-page-x mb-6 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur"
          >
            <div
              class="container flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="text-body-sm flex flex-wrap items-center gap-1">
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'snapshot'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('snapshot')"
                >
                  Snapshot
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'dispersion'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('dispersion')"
                >
                  Pricing Dispersion
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'competition'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('competition')"
                >
                  Provider Competition
                </button>
                <template v-if="isPro">
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="
                      activeSection === 'reliability'
                        ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    "
                    @click="scrollToSection('reliability')"
                  >
                    Reliability
                  </button>
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="
                      activeSection === 'indices'
                        ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    "
                    @click="scrollToSection('indices')"
                  >
                    Indices
                  </button>
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="
                      activeSection === 'risk'
                        ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    "
                    @click="scrollToSection('risk')"
                  >
                    Risk & Anomalies
                  </button>
                </template>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'deep-dives'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('deep-dives')"
                >
                  Deep Dives
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'exports'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('exports')"
                >
                  Exports
                </button>
                <template v-if="isPro">
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="
                      activeSection === 'enterprise'
                        ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    "
                    @click="scrollToSection('enterprise')"
                  >
                    Enterprise
                  </button>
                </template>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="
                    activeSection === 'methodology'
                      ? 'border-b-2 border-brand-600 bg-neutral-800 font-semibold text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  "
                  @click="scrollToSection('methodology')"
                >
                  Methodology
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="text-body-sm rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 font-semibold text-white hover:bg-neutral-700"
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
            :class="
              highlightedSection === 'snapshot'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 class="text-h3 font-bold text-white">Market Snapshot</h2>
                  <p class="text-body-sm text-neutral-400">
                    Executive summary for the selected corridor and timeframe.
                  </p>
                </div>
                <div class="text-body-sm flex items-center gap-3 text-neutral-500">
                  <label
                    class="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1"
                  >
                    <span class="text-neutral-400">Metric</span>
                    <select
                      v-model="activeMetric"
                      class="bg-transparent text-neutral-200 focus:outline-none"
                    >
                      <option value="rate">Effective Rate</option>
                      <option value="markup">FX Markup (bps)</option>
                    </select>
                  </label>
                  <span>{{
                    snapshotSummary
                      ? formatUpdatedLabel(snapshotSummary.lastUpdated || null)
                      : 'Loading snapshot...'
                  }}</span>
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
                  <div class="text-body-sm flex items-center justify-between text-neutral-500">
                    <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{
                      kpi.label
                    }}</span>
                    <span class="ml-1 flex-shrink-0 text-neutral-600" :title="kpi.tooltip"
                      >(i)</span
                    >
                  </div>
                  <div
                    class="text-h3 mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-white"
                  >
                    {{ kpi.value }}
                  </div>
                  <div
                    class="text-body-sm mt-1 overflow-hidden text-ellipsis whitespace-nowrap"
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
                    <SkeletonBlock width="6rem" height="16" tone="dark" />
                    <SkeletonBlock class="mt-3" width="5rem" height="24" tone="dark" />
                    <SkeletonBlock class="mt-2" width="7rem" height="12" tone="dark" />
                  </div>
                </template>
              </div>

              <div class="mt-6 rounded-xl border border-neutral-700 bg-neutral-800 p-6">
                <div class="text-body-sm mb-2 uppercase tracking-wider text-neutral-500">
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
            :class="
              highlightedSection === 'dispersion'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Pricing Analysis</h2>
                <p class="text-body-sm text-neutral-400">
                  Effective rates, market spread, and pricing dispersion over time.
                </p>
              </div>
              <div
                v-if="selectedCorridorDaysAvailable > 0 && selectedCorridorDaysAvailable < 7"
                class="text-body-sm mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
              >
                <span class="font-semibold">Limited data:</span> This corridor has
                {{ selectedCorridorDaysAvailable }} day(s) of data. Charts become more accurate
                after 7+ days of collection.
              </div>
              <div
                v-else-if="selectedCorridorDaysAvailable >= 7 && selectedCorridorDaysAvailable < 30"
                class="text-body-sm mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700"
              >
                {{ selectedCorridorDaysAvailable }} days of data available. Trend analysis improves
                with 30+ days.
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div
                  id="snapshot-chart"
                  class="lg:col-span-8"
                  :class="
                    highlightedSection === 'snapshot-chart'
                      ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                      : ''
                  "
                >
                  <PulseHeroChart
                    :metric="activeMetric"
                    :days-available="selectedCorridorDaysAvailable"
                  />
                </div>
                <div
                  v-if="isPro"
                  id="market-spread"
                  class="lg:col-span-4"
                  :class="
                    highlightedSection === 'market-spread'
                      ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                      : ''
                  "
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
            :class="
              highlightedSection === 'competition'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Provider Benchmarking</h2>
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
            :class="
              highlightedSection === 'bank-gap'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Bank vs Specialist Comparison</h2>
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
            :class="
              highlightedSection === 'operational-coverage'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
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
            :class="
              highlightedSection === 'reliability'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Reliability & Coverage</h2>
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
            :class="
              highlightedSection === 'indices'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Gold Indices Health</h2>
                <p class="text-body-sm text-neutral-400">
                  Coverage confidence, provider eligibility, and suppression diagnostics for
                  TEER/RCI/RVI.
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
                  <div class="text-body mt-1 font-bold text-white">
                    {{ chart.title }}
                  </div>
                  <p class="text-body-sm mt-2 text-neutral-400">
                    {{ chart.description }}
                  </p>
                  <div
                    v-if="chartData[chart.id]?.insight && !isIndicesChartPending(chart.id)"
                    class="text-body-sm mt-3 rounded-lg bg-neutral-900 px-3 py-2 text-neutral-300"
                  >
                    {{ chartData[chart.id]?.insight }}
                  </div>
                  <div
                    v-else-if="isIndicesChartPending(chart.id)"
                    class="text-body-sm mt-3 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-400"
                  >
                    Data pending for this corridor.
                  </div>
                  <div
                    v-if="indicesCardUpdatedAtLabel(chart.id)"
                    class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    {{ indicesCardUpdatedAtLabel(chart.id) }}
                  </div>
                  <div class="text-body-sm mt-3 font-semibold text-brand-600 hover:text-brand-500">
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
            :class="
              highlightedSection === 'risk'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-4">
                <h2 class="text-h3 font-bold text-white">Risk & Anomalies</h2>
                <p class="text-body-sm text-neutral-400">
                  Event feed with anomaly signals and recommended actions.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
                <div class="flex lg:col-span-7">
                  <div class="flex-1">
                    <PulseEventFeed @view="navigateToChart" />
                  </div>
                </div>
                <div class="flex lg:col-span-5">
                  <div class="flex-1">
                    <PulseArbitrageAlert />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 7. Deep Dives - Historical Charts -->
          <section
            v-if="isPro"
            id="deep-dives"
            ref="deepDivesRef"
            class="mb-10 px-page-x"
            :class="
              highlightedSection === 'deep-dives'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="mb-6">
                <h2 class="text-h3 font-bold text-white">Deep Dives</h2>
                <p class="text-body-sm text-neutral-400">
                  Historical analysis and detailed chart breakdowns.
                </p>
              </div>
              <PulseChartGrid
                :chart-data="chartData"
                :chart-availability="chartAvailability"
                :filters="legacyFilters"
                :pulse-level="pulseLevel"
                :days-available="selectedCorridorDaysAvailable"
                :can-embed="pulseEmbedsEnabled"
                @view="navigateToChart"
                @embed="handleEmbed"
              />
            </div>
          </section>

          <!-- 8. Exports & Integrations -->
          <section
            id="exports"
            class="mb-10 px-page-x"
            :class="
              highlightedSection === 'exports'
                ? 'rounded-xl ring-1 ring-brand-600/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div class="overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800">
                <div class="border-b border-neutral-700 px-6 py-4">
                  <h2 class="text-body-lg font-bold text-white">Exports & Integrations</h2>
                  <p class="text-body-sm text-neutral-400">
                    Use Pulse data in reports, workflows, and pricing systems.
                  </p>
                </div>
                <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">Download Snapshot</div>
                    <p class="text-body-sm mt-1 text-neutral-400">
                      CSV export for the selected corridor. Plus exports are capped at 30 days.
                    </p>
                    <button
                      type="button"
                      class="text-body-sm mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="snapshotExporting"
                      @click="downloadSnapshotCsv"
                    >
                      {{ snapshotExporting ? 'Exporting...' : 'Download CSV' }}
                    </button>
                    <p v-if="snapshotExportStatus" class="mt-2 text-[11px] text-neutral-400">
                      {{ snapshotExportStatus }}
                    </p>
                    <p v-if="snapshotExportError" class="mt-2 text-[11px] text-danger-600">
                      {{ snapshotExportError }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">Download Visual</div>
                    <p class="text-body-sm mt-1 text-neutral-400">
                      Export the rendered chart card as PNG, SVG, or PDF with the on-screen legend
                      and attribution intact.
                    </p>
                    <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        v-for="format in chartVisualButtons"
                        :key="format.value"
                        type="button"
                        class="text-body-sm rounded-lg bg-brand-600 px-3 py-2 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="chartImageExporting || !chartRef"
                        @click="downloadChartVisual(format.value)"
                      >
                        {{
                          chartImageExporting && activeChartVisualFormat === format.value
                            ? `Generating ${format.label}...`
                            : format.label
                        }}
                      </button>
                    </div>
                    <p v-if="chartImageError" class="mt-2 text-[11px] text-danger-600">
                      {{ chartImageError }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">Embed Charts</div>
                    <p class="text-body-sm mt-1 text-neutral-400">
                      Static public Pulse snapshots for your website with backlink attribution.
                    </p>
                    <button
                      v-if="pulseEmbedsEnabled"
                      class="text-body-sm mt-3 w-full rounded-lg border border-neutral-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-700"
                      @click="handleEmbed('all-in-cost')"
                    >
                      Generate Static Embed
                    </button>
                    <NuxtLink
                      v-else
                      to="/contact?type=enterprise&topic=pulse"
                      class="text-body-sm mt-3 inline-flex w-full items-center justify-center rounded-lg border border-neutral-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-neutral-700"
                    >
                      Contact Sales
                    </NuxtLink>
                    <p v-if="!pulseEmbedsEnabled" class="mt-2 text-[11px] text-neutral-500">
                      Static public Pulse embeds are available on Enterprise only.
                    </p>
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
            :class="
              highlightedSection === 'enterprise'
                ? 'rounded-xl ring-1 ring-primary-500/60 ring-offset-2 ring-offset-neutral-900'
                : ''
            "
          >
            <div class="mx-auto max-w-page">
              <div
                class="overflow-hidden rounded-xl border border-primary-500/40 bg-gradient-to-br from-primary-500/15 to-neutral-800"
              >
                <div class="border-b border-primary-500/40 px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/30"
                    >
                      <Icon name="building-library" :size="20" class="text-primary-400" />
                    </div>
                    <div>
                      <h2 class="text-body-lg font-bold text-white">Enterprise Access</h2>
                      <p class="text-body-sm text-neutral-400">
                        API, webhooks, extended history, and advanced signals for enterprise teams
                      </p>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-4">
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="mb-2 flex items-center gap-2">
                      <Icon name="document-text" :size="16" class="text-primary-400" />
                      <div class="text-body-sm font-semibold text-white">API Access</div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      RESTful API for programmatic access to current and historical pricing data
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="mb-2 flex items-center gap-2">
                      <Icon name="share" :size="16" class="text-primary-400" />
                      <div class="text-body-sm font-semibold text-white">Webhooks</div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Event notifications for price changes, anomalies, and market shifts
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="mb-2 flex items-center gap-2">
                      <Icon name="clock" :size="16" class="text-primary-400" />
                      <div class="text-body-sm font-semibold text-white">Extended History</div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Access to multi-year historical data for trend analysis and backtesting
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="mb-2 flex items-center gap-2">
                      <Icon name="chart-bar" :size="16" class="text-primary-400" />
                      <div class="text-body-sm font-semibold text-white">Advanced Signals</div>
                    </div>
                    <p class="text-body-sm text-neutral-400">
                      Additional market signals, volatility metrics, and predictive indicators
                    </p>
                  </div>
                </div>
                <div class="border-t border-primary-500/40 px-6 py-4">
                  <NuxtLink
                    to="/contact?type=enterprise&topic=pulse"
                    class="text-body-sm inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Learn More About Enterprise Access
                    <Icon name="arrow-right" :size="16" class="text-current" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </section>

          <!-- 9. Report Discrepancy -->
          <section class="w-full bg-neutral-900 py-12 sm:py-16">
            <div class="container">
              <div class="mb-8 text-center">
                <h2 class="text-h3 mb-3 font-bold text-white">
                  See something that doesn't look right?
                </h2>
                <p class="text-body mx-auto max-w-2xl text-neutral-300">
                  If you notice a mismatch between our displayed quote and checkout, we want to
                  know. We investigate every report and update our data pipeline accordingly.
                </p>
              </div>

              <div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
                <NuxtLink
                  to="/contact"
                  class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-neutral-700 bg-surface p-8 transition-all hover:border-brand-500 hover:shadow-2xl"
                >
                  <div
                    class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 transition-transform group-hover:scale-110"
                  >
                    <Icon name="exclamation-triangle" :size="24" class="text-white" />
                  </div>
                  <div class="text-center">
                    <h3 class="text-body-lg mb-2 font-bold text-neutral-900">
                      Report a rate issue
                    </h3>
                    <p class="text-body-sm text-neutral-600">
                      Spotted a discrepancy between our quote and your checkout? Let us know so we
                      can investigate and improve our data.
                    </p>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/methodology"
                  class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-neutral-700 bg-surface p-8 transition-all hover:border-brand-500 hover:shadow-2xl"
                >
                  <div
                    class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 transition-transform group-hover:scale-110"
                  >
                    <Icon name="book-open" :size="24" class="text-white" />
                  </div>
                  <div class="text-center">
                    <h3 class="text-body-lg mb-2 font-bold text-neutral-900">
                      View our methodology
                    </h3>
                    <p class="text-body-sm text-neutral-600">
                      See exactly how we collect quotes, calculate scores, and ensure data quality
                      across all providers.
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
        v-if="embedModalChart"
        :chart-id="embedModalChart"
        :filters="legacyFilters"
        :range="embedModalRange"
        :chart-container-ref="chartRef as unknown as HTMLElement | null"
        @close="embedModalChart = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type {
  PulseFilters,
  ChartData,
  PulseSnapshotSummary,
  PulseDeltaType,
  PulseCoverageSummary,
  CorridorOption,
  PulseScreenerRow,
  HeadlineTile,
  TimeRange,
} from '~/types/pulse';
import {
  getChartsBatch,
  getPulseSnapshotSummary,
  getPulseCoverageSummary,
  getPulseScreener,
  getCorridors,
  getCorridorById,
  getCorridorBySlug,
  getPulseOverview,
  getPulseNarrative,
  getPulsePersonalHistory,
  getPulsePinnedCorridors,
  pinPulseCorridor,
  unpinPulseCorridor,
} from '~/domains/pulse/infrastructure/pulseApi';
import type {
  PulseNarrativeData,
  PulsePersonalHistoryData,
} from '~/domains/pulse/infrastructure/pulseApi';
import { pulseChartRegistry, getChartById } from '~/lib/pulseChartRegistry';
import { getCategoryAccent } from '~/lib/pulseChartStyle';
import {
  usePulseStore,
  type PulseCorridor,
  type PulseTimeframe,
  type PulseViewMode,
} from '~/stores/pulse';
import { Icon } from '~/ui';
import { formatNumber as formatCount, formatUpdatedLabel } from '~/shared/lib/format';
import { COUNTRIES } from '~/utils/countries-currencies';
import { useEntitlements } from '~/composables/useEntitlements';
import { useWatchlist } from '~/composables/useWatchlist';
import { useSaveAlertModal } from '~/composables/useSaveAlertModal';
import { useExports } from '~/composables/useExports';
import {
  CHART_VISUAL_EXPORT_FORMATS,
  type ChartVisualExportFormat,
  useChartImageExport,
} from '~/composables/useChartImageExport';
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue';
import InstitutionalTeaser from '~/components/home/InstitutionalTeaser.vue';
import ProviderLogo from '~/components/shared/ProviderLogo.vue';
import PulseCorridorFinder from '~/components/pulse/PulseCorridorFinder.vue';
import PulseDashboardPreview from '~/components/pulse/PulseDashboardPreview.vue';
import PulseLineChart from '~/components/pulse/PulseLineChart.vue';
import PulseBarChart from '~/components/pulse/PulseBarChart.vue';
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue';
import { useFeatureFlags } from '~/composables/useFeatureFlags';
import {
  computeCorridorDaysAvailable,
  createHeadlineFallbackController,
  mergePinnedCorridorIds,
  sortCorridorsByCoverage,
} from '~/domains/pulse/application';
import { getCorridorUrl } from '~/utils/country-slugs';

const PulseShareModal = defineAsyncComponent(
  () => import('~/components/pulse/PulseShareModal.vue')
);
const PulseSmartGauge = defineAsyncComponent(
  () => import('~/components/pulse/PulseSmartGauge.vue')
);
const PulseMarketQuotes = defineAsyncComponent(
  () => import('~/components/pulse/PulseMarketQuotes.vue')
);
const PulseHeroChart = defineAsyncComponent(() => import('~/components/pulse/PulseHeroChart.vue'));
const PulseMarketDepth = defineAsyncComponent(
  () => import('~/components/pulse/PulseMarketDepth.vue')
);
const PulseProviderLeaderboard = defineAsyncComponent(
  () => import('~/components/pulse/PulseProviderLeaderboard.vue')
);
const PulseProviderHeatmap = defineAsyncComponent(
  () => import('~/components/pulse/PulseProviderHeatmap.vue')
);
const PulseBankComparison = defineAsyncComponent(
  () => import('~/components/pulse/PulseBankComparison.vue')
);
const PulseOperationalCoverage = defineAsyncComponent(
  () => import('~/components/pulse/PulseOperationalCoverage.vue')
);
const PulseReliabilityCoverage = defineAsyncComponent(
  () => import('~/components/pulse/PulseReliabilityCoverage.vue')
);
const PulseArbitrageAlert = defineAsyncComponent(
  () => import('~/components/pulse/PulseArbitrageAlert.vue')
);

const { pulseEnabled, pulseScreenerEnabled } = useFeatureFlags();

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 });
}

const router = useRouter();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const store = usePulseStore();
const { isPlus, pulseLevel, limits, pulseEmbedsEnabled } = useEntitlements();
const isPro = computed(() => pulseLevel.value === 'full');

const previewScreenerRows = [
  {
    flag: '🇺🇸',
    corridor: 'USD → PHP',
    badge: 'Great',
    bestProvider: 'Wise',
    bestRate: '56.04',
    recipientGets: '₱55,811',
    spread: '38',
    providers: '7',
    updated: 'Preview only',
  },
  {
    flag: '🇬🇧',
    corridor: 'GBP → NGN',
    badge: 'Good',
    bestProvider: 'WorldRemit',
    bestRate: '1,892.50',
    recipientGets: '₦1,890,608',
    spread: '61',
    providers: '5',
    updated: 'Preview only',
  },
  {
    flag: '🇪🇺',
    corridor: 'EUR → INR',
    badge: 'Great',
    bestProvider: 'Wise',
    bestRate: '92.17',
    recipientGets: '₹91,249',
    spread: '29',
    providers: '8',
    updated: 'Preview only',
  },
  {
    flag: '🇺🇸',
    corridor: 'USD → MXN',
    badge: 'Fair',
    bestProvider: 'Remitly',
    bestRate: '17.38',
    recipientGets: 'MX$17,345',
    spread: '95',
    providers: '6',
    updated: 'Preview only',
  },
  {
    flag: '🇦🇺',
    corridor: 'AUD → PHP',
    badge: 'Good',
    bestProvider: 'Wise',
    bestRate: '37.82',
    recipientGets: '₱37,643',
    spread: '44',
    providers: '5',
    updated: 'Preview only',
  },
  {
    flag: '🇨🇦',
    corridor: 'CAD → INR',
    badge: 'Great',
    bestProvider: 'Remitly',
    bestRate: '61.45',
    recipientGets: '₹60,937',
    spread: '31',
    providers: '6',
    updated: 'Preview only',
  },
  {
    flag: '🇺🇸',
    corridor: 'USD → NGN',
    badge: 'Fair',
    bestProvider: 'WorldRemit',
    bestRate: '1,620.30',
    recipientGets: '₦1,616,080',
    spread: '112',
    providers: '4',
    updated: 'Preview only',
  },
  {
    flag: '🇪🇺',
    corridor: 'EUR → GHS',
    badge: 'Good',
    bestProvider: 'Wise',
    bestRate: '16.92',
    recipientGets: 'GH₵16,785',
    spread: '53',
    providers: '3',
    updated: 'Preview only',
  },
];

const sampleKpis = [
  {
    id: 'best-rate',
    label: 'Best rate',
    value: '₱56.04',
    delta: '+0.12%',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs yesterday',
    icon: 'trending',
  },
  {
    id: 'avg-fee',
    label: 'Avg fee',
    value: '$1.59',
    delta: '-$0.20',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs 7d avg',
    icon: 'percent',
  },
  {
    id: 'provider-count',
    label: 'Providers live',
    value: '7',
    delta: '',
    deltaType: 'neutral',
    deltaClass: 'text-neutral-400',
    deltaLabel: 'reporting',
    icon: 'trophy',
  },
  {
    id: 'rci',
    label: 'RCI',
    value: '2.34%',
    delta: '-8 bps',
    deltaType: 'positive',
    deltaClass: 'text-brand-600',
    deltaLabel: 'vs 30d',
    icon: 'activity',
  },
];

const PREVIEW_RATE_CHART_BOUNDS = {
  xStart: 55,
  xEnd: 770,
  yTop: 20,
  yBottom: 240,
} as const;
const previewRateDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const previewBestRates = [55.72, 55.85, 56.04, 55.91, 55.98, 56.12, 56.04] as const;
const previewMidMarketRates = [55.8, 55.89, 56.01, 55.94, 56.0, 56.07, 56.0] as const;

type PreviewRatePoint = {
  index: number;
  x: number;
  y: number;
  value: number;
  highlight: boolean;
};

const previewRateScale = computed(() => {
  const values = [...previewBestRates, ...previewMidMarketRates];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = 0.12;
  const min = Math.floor((rawMin - padding) * 100) / 100;
  const max = Math.ceil((rawMax + padding) * 100) / 100;
  return { min, max };
});

const previewRateToY = (value: number) => {
  const { min, max } = previewRateScale.value;
  const ratio = (value - min) / Math.max(max - min, 0.0001);
  const { yTop, yBottom } = PREVIEW_RATE_CHART_BOUNDS;
  return yBottom - ratio * (yBottom - yTop);
};

const previewRateToX = (index: number) => {
  const { xStart, xEnd } = PREVIEW_RATE_CHART_BOUNDS;
  const step = (xEnd - xStart) / Math.max(previewRateDays.length - 1, 1);
  return xStart + step * index;
};

const previewRateYTicks = computed(() => {
  const { min, max } = previewRateScale.value;
  const ticks = 5;
  return Array.from({ length: ticks }, (_, index) => {
    const ratio = index / (ticks - 1);
    const value = max - (max - min) * ratio;
    const y = previewRateToY(value);
    return {
      label: value.toFixed(2),
      y,
      isBaseline: index === ticks - 1,
    };
  });
});

const previewRateDayTicks = computed(() =>
  previewRateDays.map((label, index) => ({
    label,
    x: previewRateToX(index),
  }))
);

const previewRateBestPoints = computed<PreviewRatePoint[]>(() =>
  previewBestRates.map((value, index) => ({
    index,
    value,
    x: previewRateToX(index),
    y: previewRateToY(value),
    highlight: index >= previewBestRates.length - 2,
  }))
);

const previewRateMidPoints = computed(() =>
  previewMidMarketRates.map((value, index) => ({
    index,
    value,
    x: previewRateToX(index),
    y: previewRateToY(value),
  }))
);

const toPolyline = (points: Array<{ x: number; y: number }>) =>
  points.map(point => `${point.x},${point.y}`).join(' ');

const previewRateBestPolyline = computed(() => toPolyline(previewRateBestPoints.value));
const previewRateMidPolyline = computed(() => toPolyline(previewRateMidPoints.value));
const previewRateBestAreaPath = computed(() => {
  const points = previewRateBestPoints.value;
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `M ${first.x},${first.y} L ${points
    .slice(1)
    .map(point => `${point.x},${point.y}`)
    .join(
      ' L '
    )} L ${last.x},${PREVIEW_RATE_CHART_BOUNDS.yBottom} L ${first.x},${PREVIEW_RATE_CHART_BOUNDS.yBottom} Z`;
});

const previewRateBestPeakPoint = computed(() => {
  const points = previewRateBestPoints.value;
  return points.reduce((peak, point) => (point.value > peak.value ? point : peak), points[0]);
});
const previewRateBestLatestPoint = computed(
  () => previewRateBestPoints.value[previewRateBestPoints.value.length - 1]
);
const previewRateMidLatestPoint = computed(
  () => previewRateMidPoints.value[previewRateMidPoints.value.length - 1]
);

const clampPreviewRectX = (x: number, width: number) => {
  const { xStart, xEnd } = PREVIEW_RATE_CHART_BOUNDS;
  return Math.min(Math.max(x, xStart), xEnd - width);
};

const previewPeakBestLabelRect = computed(() => {
  const point = previewRateBestPeakPoint.value;
  const width = 100;
  const height = 18;
  return {
    x: clampPreviewRectX(point.x - width / 2, width),
    y: Math.max(2, point.y - 26),
    width,
    height,
  };
});
const previewLatestBestLabelRect = computed(() => {
  const point = previewRateBestLatestPoint.value;
  const width = 106;
  const height = 16;
  return {
    x: clampPreviewRectX(point.x + 8, width),
    y: Math.max(2, point.y - 20),
    width,
    height,
  };
});
const previewLatestMidLabelRect = computed(() => {
  const point = previewRateMidLatestPoint.value;
  const width = 116;
  const height = 16;
  return {
    x: clampPreviewRectX(point.x - width + 2, width),
    y: Math.min(PREVIEW_RATE_CHART_BOUNDS.yBottom - height - 2, point.y + 8),
    width,
    height,
  };
});

const previewPeakBestLabel = computed(
  () => `${previewRateBestPeakPoint.value.value.toFixed(2)} Best rate`
);
const previewLatestBestLabel = computed(
  () => `${previewRateBestLatestPoint.value.value.toFixed(2)} Best rate`
);
const previewLatestMidLabel = computed(
  () => `${previewRateMidLatestPoint.value.value.toFixed(2)} Mid-market`
);

const providerSlugs = [
  'wise',
  'remitly',
  'worldremit',
  'western-union',
  'xe-money',
  'ria',
  'pangea',
  'sendwave',
  'instarem',
  'xoom',
  'transfergo',
  'paysend',
  'orbitremit',
  'koronapay',
  'wirebarley',
  'intermex',
];

const sampleTs = Array.from({ length: 7 }, (_, i) => Date.now() - (6 - i) * 86400000);
const sampleChartSeries = {
  'all-in-cost': [
    {
      id: 'best',
      label: 'Best Rate',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({
        t,
        v: [55.42, 55.67, 55.91, 55.78, 56.02, 55.89, 56.04][i],
      })),
    },
    {
      id: 'avg',
      label: 'Average',
      color: '#94A3B8',
      points: sampleTs.map((t, i) => ({
        t,
        v: [55.1, 55.28, 55.52, 55.38, 55.61, 55.48, 55.65][i],
      })),
    },
  ],
  'fx-markup': [
    {
      id: 'wise',
      label: 'Wise',
      color: '#10B981',
      points: sampleTs.map((t, i) => ({ t, v: [38, 42, 40, 36, 44, 39, 42][i] })),
    },
    {
      id: 'remitly',
      label: 'Remitly',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({ t, v: [72, 78, 75, 80, 74, 76, 78][i] })),
    },
    {
      id: 'worldremit',
      label: 'WorldRemit',
      color: '#F59E0B',
      points: sampleTs.map((t, i) => ({ t, v: [105, 110, 108, 112, 106, 115, 110][i] })),
    },
  ],
  'leader-edge': [
    {
      id: 'edge',
      label: 'Leader Edge',
      color: '#6366F1',
      points: sampleTs.map((t, i) => ({ t, v: [12, 18, 5, 15, 8, 22, 14][i] })),
    },
  ],
  'volatility-pulse': [
    {
      id: 'rvi',
      label: 'RVI',
      color: '#818CF8',
      points: sampleTs.map((t, i) => ({ t, v: [28, 35, 22, 42, 31, 19, 32][i] })),
    },
  ],
  'quote-success': [
    {
      id: 'wise',
      label: 'Wise',
      color: '#10B981',
      points: sampleTs.map((t, i) => ({ t, v: [99.2, 99.5, 98.8, 99.1, 99.6, 99.3, 99.4][i] })),
    },
    {
      id: 'remitly',
      label: 'Remitly',
      color: '#2563EB',
      points: sampleTs.map((t, i) => ({ t, v: [97.1, 96.8, 97.5, 96.2, 97.8, 97.0, 97.4][i] })),
    },
    {
      id: 'worldremit',
      label: 'WorldRemit',
      color: '#F59E0B',
      points: sampleTs.map((t, i) => ({ t, v: [94.5, 95.2, 93.8, 95.0, 94.1, 95.5, 94.8][i] })),
    },
  ],
  'indices-confidence': [
    {
      id: 'confidence',
      label: 'Confidence Score',
      color: '#3B82F6',
      points: sampleTs.map((t, i) => ({ t, v: [82, 85, 88, 86, 91, 89, 92][i] })),
    },
  ],
} as Record<string, import('~/types/pulse').ChartSeries[]>;

const previewChartCards = [
  {
    id: 'all-in-cost',
    title: 'All-in Cost Index (RCI)',
    category: 'Pricing & Margin',
    accent: '#2563EB',
    description: 'Effective exchange rate including all fees and FX markup',
    type: 'line' as const,
    unit: 'rate',
    showArea: true,
  },
  {
    id: 'fx-markup',
    title: 'FX Markup by Provider',
    category: 'Pricing & Margin',
    accent: '#2563EB',
    description: 'Markup over mid-market rate in basis points',
    type: 'line' as const,
    unit: 'bps',
    showArea: false,
  },
  {
    id: 'leader-edge',
    title: 'Leader Edge vs #2',
    category: 'Competitive Dynamics',
    accent: '#6366F1',
    description: 'Pricing edge of the leader over the runner-up',
    type: 'line' as const,
    unit: 'bps',
    showArea: true,
  },
  {
    id: 'volatility-pulse',
    title: 'Volatility Pulse (RVI)',
    category: 'Volatility & Risk',
    accent: '#818CF8',
    description: 'Remittance Volatility Index in basis points',
    type: 'bar' as const,
    unit: 'bps',
    threshold: 35,
  },
  {
    id: 'quote-success',
    title: 'Quote Success Rate',
    category: 'Operational Coverage',
    accent: '#3B82F6',
    description: 'Percentage of successful quote fetches by provider',
    type: 'line' as const,
    unit: 'percent',
    showArea: false,
  },
  {
    id: 'indices-confidence',
    title: 'Indices Confidence',
    category: 'Operational Coverage',
    accent: '#3B82F6',
    description: 'Confidence score used by Gold indices weighting',
    type: 'line' as const,
    unit: 'percent',
    showArea: true,
  },
];

const PREVIEW_CHART_IDS = [
  'all-in-cost',
  'fx-markup',
  'provider-winner',
  'volatility-pulse',
  'quote-success',
  'indices-confidence',
] as const;
const PREVIEW_SPARKLINES: Record<string, { sparkline: string; areaPath: string }> = {
  'all-in-cost': {
    sparkline: '0,40 33,35 66,42 100,30 133,38 166,25 200,20',
    areaPath: 'M 0,60 L 0,40 L 33,35 L 66,42 L 100,30 L 133,38 L 166,25 L 200,20 L 200,60 Z',
  },
  'fx-markup': {
    sparkline: '0,45 33,38 66,30 100,35 133,28 166,32 200,22',
    areaPath: 'M 0,60 L 0,45 L 33,38 L 66,30 L 100,35 L 133,28 L 166,32 L 200,22 L 200,60 Z',
  },
  'provider-winner': {
    sparkline: '0,30 33,25 66,35 100,20 133,30 166,15 200,25',
    areaPath: 'M 0,60 L 0,30 L 33,25 L 66,35 L 100,20 L 133,30 L 166,15 L 200,25 L 200,60 Z',
  },
  'volatility-pulse': {
    sparkline: '0,50 33,35 66,45 100,25 133,40 166,30 200,35',
    areaPath: 'M 0,60 L 0,50 L 33,35 L 66,45 L 100,25 L 133,40 L 166,30 L 200,35 L 200,60 Z',
  },
  'quote-success': {
    sparkline: '0,20 33,15 66,18 100,10 133,12 166,8 200,5',
    areaPath: 'M 0,60 L 0,20 L 33,15 L 66,18 L 100,10 L 133,12 L 166,8 L 200,5 L 200,60 Z',
  },
  'indices-confidence': {
    sparkline: '0,35 33,30 66,25 100,28 133,20 166,22 200,15',
    areaPath: 'M 0,60 L 0,35 L 33,30 L 66,25 L 100,28 L 133,20 L 166,22 L 200,15 L 200,60 Z',
  },
};
const ENTERPRISE_CHART_IDS = new Set(['provider-winner', 'indices-confidence']);

const previewCharts = computed(() =>
  PREVIEW_CHART_IDS.map(id => {
    const meta = getChartById(id);
    if (!meta) return null;
    const isEnterprise = ENTERPRISE_CHART_IDS.has(id);
    const paths = PREVIEW_SPARKLINES[id] ?? {
      sparkline: '0,40 100,30 200,35',
      areaPath: 'M 0,60 L 0,40 L 100,30 L 200,35 L 200,60 Z',
    };
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
      accentColor: getCategoryAccent(meta.category),
    };
  }).filter((c): c is NonNullable<typeof c> => c != null)
);

const plusFeatures = [
  'Corridor movers and market snapshot',
  'Headline tiles and trend deltas',
  '7-day chart history (basic line charts)',
  'Smart alert creation',
  'CSV snapshot export',
];

const enterpriseFeatures = [
  'Everything in Plus',
  'Full 365-day chart history',
  'Stacked, scatter, and matrix chart types',
  'Watchlist screener with provider rankings',
  'Gold Indices health dashboard',
];

// Preview card and screener row animations handled by v-reveal directive

const kpiSectionRef = ref<HTMLElement | null>(null);
const chartRef = ref<HTMLElement | null>(null);
const chartVisible = ref(false);

function animateCountUp(el: HTMLElement, target: string, duration = 1200) {
  const prefix = target.match(/^[₱$]/)?.[0] || '';
  const suffix = target.match(/[%]$/)?.[0] || '';
  const numStr = target.replace(/[₱$%,]/g, '');
  const end = parseFloat(numStr);
  if (isNaN(end)) {
    el.textContent = target;
    return;
  }
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = (end * eased).toFixed(decimals);
    el.textContent = `${prefix}${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

function revealElements(container: HTMLElement, selector: string) {
  container.querySelectorAll(selector).forEach(el => {
    (el as HTMLElement).style.opacity = '1';
    (el as HTMLElement).style.transform = 'translateY(0)';
  });
}

let kpiObserver: IntersectionObserver | null = null;
watch(kpiSectionRef, el => {
  kpiObserver?.disconnect();
  if (!el || typeof IntersectionObserver === 'undefined') return;
  const observedEl = el as unknown as HTMLElement;
  kpiObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealElements(observedEl, '.kpi-value');
          observedEl.querySelectorAll<HTMLElement>('.kpi-value').forEach(valEl => {
            const target = valEl.dataset.target;
            if (target) animateCountUp(valEl, target);
          });
          if (observedEl.children) {
            Array.from(observedEl.children).forEach(child => {
              (child as HTMLElement).style.opacity = '1';
              (child as HTMLElement).style.transform = 'translateY(0)';
            });
          }
          kpiObserver?.unobserve(entry.target as Element);
        }
      }
    },
    { rootMargin: '0px 0px -30px 0px', threshold: 0.15 }
  );
  kpiObserver.observe(observedEl as unknown as Element);
});

let chartObserver: IntersectionObserver | null = null;
watch(chartRef, el => {
  chartObserver?.disconnect();
  if (!el || typeof IntersectionObserver === 'undefined') return;
  const observedEl = el as unknown as Element;
  chartObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          chartVisible.value = true;
          chartObserver?.unobserve(entry.target as Element);
        }
      }
    },
    { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
  );
  chartObserver.observe(observedEl);
});

const watchlist = useWatchlist();
const saveAlertModal = useSaveAlertModal();
const exportsApi = useExports();
const embedModalChart = ref<string | null>(null);
const embedModalRange = computed<TimeRange>(() => {
  switch (store.timeframe) {
    case '24H':
    case '7D':
      return '7d';
    case '30D':
      return '30d';
    case '1Y':
    case 'MAX':
      return '365d';
    default:
      return '30d';
  }
});
const activeMetric = ref<'rate' | 'markup'>('rate');
const highlightedSection = ref<string | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

// Scrollspy: track which section is currently in view
const activeSection = ref<string>('snapshot');
const sectionIds = [
  'snapshot',
  'dispersion',
  'competition',
  'reliability',
  'indices',
  'risk',
  'deep-dives',
  'exports',
  'enterprise',
  'methodology',
];
let scrollspyObserver: IntersectionObserver | null = null;

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return;
  scrollspyObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  );
  // Defer to next tick so sections are rendered
  nextTick(() => {
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) scrollspyObserver?.observe(el);
    }
  });
});

onUnmounted(() => {
  scrollspyObserver?.disconnect();
  kpiObserver?.disconnect();
  chartObserver?.disconnect();
});

const timeframes = computed<PulseTimeframe[]>(() => {
  if (isPro.value) return ['24H', '7D', '30D', '1Y', 'MAX'];
  return ['7D', '30D'];
});
const summary = ref<PulseCoverageSummary | null>(null);
const overview = ref<{ tiles: HeadlineTile[]; lastUpdated?: string } | null>(null);
const narrative = ref<PulseNarrativeData | null>(null);
const personalHistory = ref<PulsePersonalHistoryData | null>(null);
const highlightsLoading = ref(false);
const headlineLoading = ref(false);
const pulseUpdatedBadgeLabel = computed(() => formatUpdatedLabel(store.lastUpdated || null));
const pulseEnvironmentBadge = computed(() => {
  const raw = String(
    runtimeConfig.public?.remitScoutEnv || runtimeConfig.public?.environmentName || ''
  )
    .trim()
    .toLowerCase();
  if (!raw || raw === 'prod' || raw === 'production') return null;
  if (raw === 'staging') return 'Staging';
  if (raw === 'dev' || raw === 'development') return 'Dev';
  return raw.toUpperCase();
});

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
];

const headlineTiles = computed<HeadlineTile[]>(() => {
  const tiles = overview.value?.tiles;
  if (Array.isArray(tiles) && tiles.length >= 4) return tiles.slice(0, 4);
  return defaultHeadlineTiles;
});

const amountInput = ref(store.amount || 500);

const { data: trackedCorridorsData, refresh: refreshTrackedCorridors } = await useAsyncData(
  'pulse-corridors',
  async () => {
    // Avoid Plus-gated calls for public preview SSR. We'll refresh client-side after entitlements hydrate.
    if (!isPlus.value) return [];
    return await getCorridors();
  },
  { server: true }
);
const trackedCorridors = computed<CorridorOption[]>(() => trackedCorridorsData.value || []);
const selectedCorridorKey = ref<string>('');
const decisionPanelRef = ref<HTMLElement | null>(null);

// Screener state (Plus)
const showAdvancedFilters = ref(false);

const pickBestByCoverage = (candidates: CorridorOption[]): CorridorOption | undefined => {
  if (candidates.length === 0) return undefined;

  let best = candidates[0];
  let bestRank: [number, number, number] = [
    best.isUsdOrigin ? 1 : 0,
    typeof best.dataPoints === 'number' ? best.dataPoints : 0,
    best.lastUpdated ? new Date(best.lastUpdated).getTime() : 0,
  ];

  for (const entry of candidates.slice(1)) {
    const rank: [number, number, number] = [
      entry.isUsdOrigin ? 1 : 0,
      typeof entry.dataPoints === 'number' ? entry.dataPoints : 0,
      entry.lastUpdated ? new Date(entry.lastUpdated).getTime() : 0,
    ];

    if (rank[0] !== bestRank[0]) {
      if (rank[0] > bestRank[0]) {
        best = entry;
        bestRank = rank;
      }
      continue;
    }
    if (rank[1] !== bestRank[1]) {
      if (rank[1] > bestRank[1]) {
        best = entry;
        bestRank = rank;
      }
      continue;
    }
    if (rank[2] > bestRank[2]) {
      best = entry;
      bestRank = rank;
    }
  }

  return best;
};

const watchlistTrackedCorridors = computed<CorridorOption[]>(() => {
  if (!isPlus.value) return [];
  if (!trackedCorridors.value.length) return [];

  const out: CorridorOption[] = [];
  const seen = new Set<string>();

  for (const item of watchlist.items.value) {
    if (item.target.type !== 'corridor') continue;
    const from = item.target.from.toUpperCase();
    const to = item.target.to.toUpperCase();
    const key = `${from}-${to}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidates = trackedCorridors.value.filter(c => {
      const src = (c.sourceCountry || '').toUpperCase();
      const dst = (c.destCountry || '').toUpperCase();
      return src === from && dst === to;
    });

    const best = pickBestByCoverage(candidates);
    if (best?.corridorId) out.push(best);
    if (out.length >= 16) break;
  }

  return out;
});

const pulsePinnedCorridorIds = ref<string[]>([]);

const pulsePinnedTrackedCorridors = computed<CorridorOption[]>(() => {
  if (!isPro.value) return [];
  if (!trackedCorridors.value.length) return [];

  const out: CorridorOption[] = [];
  const seen = new Set<string>();

  for (const corridorId of pulsePinnedCorridorIds.value) {
    const option = trackedCorridors.value.find(c => c.corridorId === corridorId);
    if (!option?.corridorId || seen.has(option.corridorId)) continue;
    seen.add(option.corridorId);
    out.push(option);
  }

  return out;
});

const prioritizedTrackedCorridors = computed<CorridorOption[]>(() => {
  const out: CorridorOption[] = [];
  const seen = new Set<string>();
  const add = (corridor: CorridorOption) => {
    const id = corridor.corridorId;
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(corridor);
  };

  // Watchlist and pinned corridors get priority ordering
  for (const corridor of watchlistTrackedCorridors.value) add(corridor);
  for (const corridor of pulsePinnedTrackedCorridors.value) add(corridor);

  // Include ALL remaining tracked corridors from gold exports,
  // sorted by data coverage so best corridors appear first
  const remaining = [...trackedCorridors.value].sort(
    (a, b) => (b.dataPoints ?? 0) - (a.dataPoints ?? 0)
  );
  for (const corridor of remaining) add(corridor);

  return out;
});

const corridorFinderFeaturedCorridors = computed<CorridorOption[]>(() => {
  const prioritized = prioritizedTrackedCorridors.value.slice(0, 10);
  if (prioritized.length > 0) return prioritized;
  return sortCorridorsByCoverage(trackedCorridors.value).slice(0, 10);
});

const GOLD_STANDARD_BENCHMARK_AMOUNT = 500;
const PULSE_SCREENER_AMOUNTS = [100, 200, 500, 1000] as const;

const screenerQueryAmount = computed<number>(() => {
  const requested = store.amount;
  return PULSE_SCREENER_AMOUNTS.reduce((best, candidate) => {
    const bestDelta = Math.abs(best - requested);
    const candidateDelta = Math.abs(candidate - requested);
    return candidateDelta < bestDelta ? candidate : best;
  }, PULSE_SCREENER_AMOUNTS[0]);
});

const screenerCorridorIds = computed<string[]>(() => {
  const ids = prioritizedTrackedCorridors.value
    .map(c => c.corridorId)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  return Array.from(new Set(ids)).slice(0, 25);
});

const filtersForcedVisible = computed(
  () => !pulseScreenerEnabled.value || screenerCorridorIds.value.length === 0
);
const filtersVisible = computed(() => showAdvancedFilters.value || filtersForcedVisible.value);

const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value;
};

const screenerRows = ref<PulseScreenerRow[]>([]);
const screenerLoading = ref(false);
const screenerError = ref<string | null>(null);
const screenerUpdatedAt = ref<string | null>(null);

// Pinned corridors (Enterprise watchlist)
const effectivePinnedCorridorIds = computed<string[]>(() => {
  return mergePinnedCorridorIds(pulsePinnedCorridorIds.value, watchlistTrackedCorridors.value);
});

const loadPinnedCorridors = async () => {
  if (!isPro.value) return;
  try {
    const pinned = await getPulsePinnedCorridors();
    pulsePinnedCorridorIds.value = pinned.map(p => p.corridorId);
  } catch {
    pulsePinnedCorridorIds.value = [];
  }
};

const handlePinCorridor = async (corridorId: string) => {
  try {
    await pinPulseCorridor(corridorId);
    pulsePinnedCorridorIds.value = [...pulsePinnedCorridorIds.value, corridorId];
  } catch (error: any) {
    actionError.value = error?.message || 'Failed to pin corridor';
  }
};

const handleUnpinCorridor = async (corridorId: string) => {
  try {
    await unpinPulseCorridor(corridorId);
    pulsePinnedCorridorIds.value = pulsePinnedCorridorIds.value.filter(id => id !== corridorId);
  } catch (error: any) {
    actionError.value = error?.message || 'Failed to unpin corridor';
  }
};

const loadScreener = async () => {
  if (!isPro.value) return;
  if (!pulseScreenerEnabled.value) return;

  const corridorIds = screenerCorridorIds.value;
  if (corridorIds.length === 0) {
    screenerRows.value = [];
    screenerUpdatedAt.value = null;
    screenerError.value = null;
    return;
  }

  screenerLoading.value = true;
  screenerError.value = null;

  try {
    const response = await getPulseScreener({
      corridorIds,
      timeframe: store.timeframe,
      amount: screenerQueryAmount.value,
      payin: 'bank',
      payout: 'bank',
      includeMovers: true,
    });
    screenerRows.value = response.rows ?? [];
    screenerUpdatedAt.value = response.updatedAt ?? null;
  } catch (error: any) {
    screenerError.value = error?.message || 'Unable to load screener right now.';
    screenerRows.value = [];
    screenerUpdatedAt.value = null;
  } finally {
    screenerLoading.value = false;
  }
};

const scrollToDecisionPanel = async () => {
  if (!import.meta.client) return;
  await nextTick();
  const el = decisionPanelRef.value || document.getElementById('decision');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const syncPulseRouteToState = () => {
  void router.replace({ path: route.path, query: store.getQueryParams() });
};

function handleCorridorFinderSelect(corridorId: string) {
  const option = trackedCorridors.value.find(c => c.corridorId === corridorId);
  if (!option) return;
  setCorridorFromOption(option);
  syncPulseRouteToState();
}

function handleCorridorFinderTimeframeSelect(timeframe: PulseTimeframe) {
  store.setTimeframe(timeframe);
  syncPulseRouteToState();
}

function handleCorridorFinderAmountSelect(amount: number) {
  store.setAmount(amount);
  amountInput.value = amount;
  syncPulseRouteToState();
}

async function handleScreenerSelect(corridorId: string) {
  const option = trackedCorridors.value.find(c => c.corridorId === corridorId);
  if (!option) return;

  // Screener is a decision tool; force Decision mode to keep the UI predictable.
  store.setViewMode('sender');

  setCorridorFromOption(option);
  syncPulseRouteToState();
  await scrollToDecisionPanel();
}

async function handleScreenerSelectTimeframe(corridorId: string, timeframe: PulseTimeframe) {
  const option = trackedCorridors.value.find(c => c.corridorId === corridorId);
  if (!option) return;

  store.setViewMode('sender');
  setCorridorFromOption(option);
  store.setTimeframe(timeframe);
  syncPulseRouteToState();
  await scrollToDecisionPanel();
}

type PulseTeaserMover = {
  corridorId: string;
  fromCountry: string;
  toCountry: string;
  sendCurrency: string;
  recvCurrency: string;
  deltaPct: number;
  providerCount: number;
  timestampBucket: string;
};

async function handleMoverSelect(mover: PulseTeaserMover) {
  const optionById = trackedCorridors.value.find(c => c.corridorId === mover.corridorId);
  const slug = `${mover.sendCurrency.toLowerCase()}-${mover.recvCurrency.toLowerCase()}`;
  const optionBySlug =
    getCorridorBySlug(slug) || trackedCorridors.value.find(c => (c.slug || c.value) === slug);
  const option = optionById || optionBySlug;
  if (!option) return;

  store.setViewMode('sender');
  setCorridorFromOption(option);
  syncPulseRouteToState();
  await scrollToDecisionPanel();
}

async function handleMoverAdded(mover: PulseTeaserMover) {
  // Watchlist mutations will naturally refresh `screenerCorridorIds` and trigger `loadScreener`.
  await handleMoverSelect(mover);
}

const selectedCorridorOption = computed<CorridorOption | null>(() => {
  const key = selectedCorridorKey.value;
  if (!key) return null;
  return trackedCorridors.value.find(c => c.corridorId === key || c.value === key) || null;
});

const toCountryName = (code?: string | null): string => {
  if (!code) return '';
  const normalized = code.trim().toUpperCase();
  const found = COUNTRIES.find(c => c.code.toUpperCase() === normalized);
  return found?.name || normalized;
};

const toCountryFlag = (code?: string | null, fallback?: string): string => {
  if (fallback) return fallback;
  if (!code) return '🌍';
  const normalized = code.trim().toUpperCase();
  const found = COUNTRIES.find(c => c.code.toUpperCase() === normalized);
  return found?.flag || '🌍';
};

const toPulseCorridor = (option: CorridorOption): PulseCorridor => {
  const corridorId = option.corridorId;
  const parts = corridorId ? corridorId.split('-') : [];
  const sourceCountry = (option.sourceCountry || parts[0] || '').toUpperCase();
  const destCountry = (option.destCountry || parts[1] || '').toUpperCase();

  const fromCode = (option.fromCode || option.sourceCurrency || parts[2] || '').toUpperCase();
  const toCode = (option.toCode || option.destCurrency || parts[3] || '').toUpperCase();

  const slug = String(
    option.slug || option.value || `${fromCode.toLowerCase()}-${toCode.toLowerCase()}`
  )
    .trim()
    .toLowerCase();
  const label = option.label || `${fromCode} → ${toCode}`;

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
  };
};

const setCorridorFromOption = (option: CorridorOption) => {
  store.setCorridor(toPulseCorridor(option));
  selectedCorridorKey.value = option.corridorId || option.value;
};

function computeDaysAvailable(c: CorridorOption | null | undefined): number {
  return computeCorridorDaysAvailable(c);
}

const selectedCorridorDaysAvailable = computed(() =>
  computeDaysAvailable(selectedCorridorOption.value)
);

const corridorDaysMap = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  for (const c of trackedCorridors.value) {
    const id = c.corridorId || c.value;
    if (id) map[id] = computeDaysAvailable(c);
  }
  return map;
});

const corridorCoverageLabel = computed(() => {
  const c = selectedCorridorOption.value;
  const daysAvailable = computeDaysAvailable(c);
  if (!daysAvailable) return '';
  const desiredDays = store.timeframeDays;
  const cappedNote =
    desiredDays > daysAvailable ? ` • Only ${daysAvailable}d available for this corridor` : '';
  return `Coverage: ${c?.minDate} to ${c?.maxDate} (${formatCount(daysAvailable)} days available)${cappedNote}`;
});

function handleCorridorSelect() {
  const key = selectedCorridorKey.value;
  const option = trackedCorridors.value.find(c => c.corridorId === key || c.value === key);
  if (!option) return;
  setCorridorFromOption(option);
  syncPulseRouteToState();
}

const initializeCorridorSelection = () => {
  if (trackedCorridors.value.length === 0) return;

  const corridorIdFromUrl =
    typeof route.query.corridor_id === 'string' ? route.query.corridor_id : undefined;
  const corridorSlugFromUrl =
    typeof route.query.corridor === 'string' ? route.query.corridor : undefined;

  let option: CorridorOption | undefined;

  if (corridorIdFromUrl) {
    option =
      getCorridorById(corridorIdFromUrl) ||
      trackedCorridors.value.find(c => c.corridorId === corridorIdFromUrl);
  }
  if (!option && corridorSlugFromUrl) {
    option =
      getCorridorBySlug(corridorSlugFromUrl) ||
      trackedCorridors.value.find(c => (c.slug || c.value) === corridorSlugFromUrl);
  }
  const currentCorridorId = store.corridor?.corridorId;
  if (!option && currentCorridorId) {
    option =
      getCorridorById(currentCorridorId) ||
      trackedCorridors.value.find(c => c.corridorId === currentCorridorId);
  }
  if (!option) {
    option = prioritizedTrackedCorridors.value[0] || trackedCorridors.value[0];
  }

  if (option) {
    setCorridorFromOption(option);
  }
};

const deepDivesRef = ref<HTMLElement | null>(null);
const deepDivesVisible = ref(false);
let deepDivesObserver: IntersectionObserver | null = null;

const teardownDeepDivesObserver = () => {
  if (deepDivesObserver) {
    deepDivesObserver.disconnect();
    deepDivesObserver = null;
  }
  deepDivesVisible.value = false;
};

const setupDeepDivesObserver = async () => {
  if (!import.meta.client) return;
  if (!isPlus.value) return;

  teardownDeepDivesObserver();
  await nextTick();

  const el = deepDivesRef.value;
  if (!el) return;

  deepDivesObserver = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;

      deepDivesVisible.value = true;
      if (deepDivesObserver) {
        deepDivesObserver.disconnect();
        deepDivesObserver = null;
      }
      void loadChartData();
    },
    // Preload slightly before the section is visible to avoid a "blank chart grid" moment.
    { root: null, rootMargin: '200px 0px', threshold: 0.01 }
  );

  deepDivesObserver.observe(el as unknown as Element);
};

const actionStatus = ref<string | null>(null);
const actionError = ref<string | null>(null);

const snapshotExporting = ref(false);
const snapshotExportStatus = ref<string | null>(null);
const snapshotExportError = ref<string | null>(null);
let snapshotExportPoll: ReturnType<typeof setInterval> | null = null;

const clearSnapshotExportPoll = () => {
  if (!snapshotExportPoll) return;
  clearInterval(snapshotExportPoll);
  snapshotExportPoll = null;
};

const corridorCountries = computed(() => {
  const id = store.corridor?.corridorId;
  if (!id) return { from: 'US', to: 'PH' };
  const [from, to] = id.split('-');
  return { from: (from || 'US').toUpperCase(), to: (to || 'PH').toUpperCase() };
});

const compareCorridorUrl = computed(() => {
  const base = getCorridorUrl(corridorCountries.value.from, corridorCountries.value.to);
  return `${base}?amount=${encodeURIComponent(String(store.amount))}`;
});

function setViewMode(mode: PulseViewMode) {
  if (!isPro.value && mode === 'analyst') {
    store.setViewMode('sender');
    return;
  }
  store.setViewMode(mode);
  const nextQuery = { ...route.query } as Record<string, any>;
  if (mode === 'sender') {
    delete nextQuery.mode;
  } else {
    nextQuery.mode = mode;
  }
  void router.replace({ path: route.path, query: nextQuery });
}

const setActionMessage = (next: { status?: string | null; error?: string | null }) => {
  actionStatus.value = next.status ?? null;
  actionError.value = next.error ?? null;
  if (actionStatus.value || actionError.value) {
    setTimeout(() => {
      actionStatus.value = null;
      actionError.value = null;
    }, 3500);
  }
};

async function handleAddToWatchlist() {
  const { from, to } = corridorCountries.value;
  try {
    const result = await watchlist.ensure({ type: 'corridor', from, to, method: 'bank' });
    if (result.status === 'limit_reached') {
      setActionMessage({ error: result.message });
      return;
    }
    if (result.status === 'error') {
      setActionMessage({ error: result.message });
      return;
    }
    setActionMessage({ status: 'Added to watchlist.' });
  } catch (error: any) {
    setActionMessage({ error: error?.message || 'Unable to add to watchlist.' });
  }
}

function handleCreateAlert() {
  const { from, to } = corridorCountries.value;
  saveAlertModal.open({
    source: 'pulse',
    target: { type: 'corridor', from, to, method: 'bank' },
    label: `${from}→${to} • bank`,
  });
}

const resolveExportDays = () => {
  if (!limits.value.exports) return 0;
  const max = limits.value.exportsMaxDays;
  // All plans capped at 30d exports (backend hard cap).
  if (max === 'unlimited') return 30;
  if (typeof max === 'number' && max > 0) return Math.min(30, max);
  return 0;
};

const pollExportStatus = async (jobId: string) => {
  clearSnapshotExportPoll();

  const tick = async () => {
    try {
      const response = await exportsApi.getExportStatus(jobId);
      if (!response.success) return;

      if (response.job.status === 'failed') {
        snapshotExportError.value = response.job.error || 'Export failed. Please try again.';
        snapshotExporting.value = false;
        clearSnapshotExportPoll();
        return;
      }

      if (response.job.status === 'done') {
        snapshotExportStatus.value = 'Export ready. Downloading...';
        const download = await exportsApi.getExportDownloadUrl(jobId);
        snapshotExporting.value = false;
        clearSnapshotExportPoll();
        if (import.meta.client) {
          window.location.href = download.url;
        }
        return;
      }

      snapshotExportStatus.value = 'Export in progress...';
    } catch (error: any) {
      snapshotExportError.value = error?.message || 'Unable to export right now.';
      snapshotExporting.value = false;
      clearSnapshotExportPoll();
    }
  };

  await tick();
  snapshotExportPoll = setInterval(tick, 2500);
};

const { exportVisual, exporting: chartImageExporting } = useChartImageExport();
const chartVisualButtons: Array<{ value: ChartVisualExportFormat; label: string }> =
  CHART_VISUAL_EXPORT_FORMATS.map(format => ({
    value: format,
    label: format.toUpperCase(),
  }));
const chartImageError = ref<string | null>(null);
const activeChartVisualFormat = ref<ChartVisualExportFormat | null>(null);

async function downloadChartVisual(format: ChartVisualExportFormat) {
  const el = chartRef.value;
  if (!el || chartImageExporting.value) return;
  chartImageError.value = null;
  activeChartVisualFormat.value = format;
  try {
    const label = store.corridorLabel || store.corridorSlug || 'Global';
    await exportVisual(el as HTMLElement, {
      title: 'All-in Cost Index',
      subtitle: `${label} · $${store.amount}`,
      source: `Source: Remit-Scout · remit-scout.com/pulse · ${label}`,
      filename: `remit-scout-all-in-cost-${store.corridorSlug || 'global'}`,
      format,
    });
  } catch (e) {
    chartImageError.value = e instanceof Error ? e.message : 'Failed to generate visual export.';
  } finally {
    activeChartVisualFormat.value = null;
  }
}

async function downloadSnapshotCsv() {
  if (snapshotExporting.value) return;
  snapshotExportError.value = null;
  snapshotExportStatus.value = null;
  snapshotExporting.value = true;

  try {
    const days = resolveExportDays();
    if (days <= 0) {
      throw new Error('Exports are not available on your plan.');
    }

    const toDateOnlyUtc = (date: Date) => date.toISOString().split('T')[0];
    const dateTo = toDateOnlyUtc(new Date());
    const dateFrom = toDateOnlyUtc(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
    const corridorId = store.corridor?.corridorId;
    const response = await exportsApi.createExport({
      dataType: 'history',
      format: 'csv',
      dateFrom,
      dateTo,
      corridorIds: corridorId ? [corridorId] : undefined,
    });

    if (!response.success) {
      throw new Error('Export request failed.');
    }

    snapshotExportStatus.value = 'Export queued. We will start processing shortly.';
    await pollExportStatus(response.job.id);
  } catch (error: any) {
    snapshotExportError.value = error?.message || 'Unable to export right now.';
    snapshotExporting.value = false;
    clearSnapshotExportPoll();
  }
}

function handleAmountInput() {
  const amount = Number.parseInt(String(amountInput.value), 10);
  if (!Number.isNaN(amount) && amount > 0) {
    store.setAmount(amount);
    syncPulseRouteToState();
  }
}

const legacyFilters = computed<PulseFilters>(() => ({
  corridor: store.corridor?.slug ?? '',
  corridorId: store.corridor?.corridorId,
  amount: store.amount as 100 | 200 | 500 | 1000,
  fundingMethod: 'bank',
  payoutMethod: 'bank',
}));

type ChartAvailabilityEntry = {
  dataAvailable: boolean;
  updatedAt: string | null;
  source: 'gold_export' | 'gold_cache' | 'none';
};

const chartData = ref<Record<string, ChartData | null>>({});
const chartAvailability = ref<Record<string, ChartAvailabilityEntry>>({});

const INDICES_CHART_IDS = [
  'indices-confidence',
  'indices-provider-count',
  'indices-suppression',
] as const;
const indicesCharts = computed(() =>
  INDICES_CHART_IDS.map(id => getChartById(id)).filter((c): c is NonNullable<typeof c> => c != null)
);

const snapshotSummary = ref<PulseSnapshotSummary | null>(null);
const chartLoadKey = computed(
  () => `${legacyFilters.value.corridorId || ''}:${store.timeframe}:${store.amount}`
);
const chartLoadedKey = ref<string | null>(null);
const chartLoading = ref(false);

const executiveNote = computed(() => {
  if (!snapshotSummary.value) return '';
  const getValue = (id: string) =>
    snapshotSummary.value?.kpis.find(kpi => kpi.id === id)?.value || '';
  const spread = getValue('market-spread');
  const leader = getValue('leader');
  const volatility = getValue('volatility');
  const success = getValue('quote-success');

  return `Dispersion is ${spread}. Leader is ${leader}. Volatility: ${volatility}. Quote success: ${success}.`;
});

async function loadChartData() {
  if (!isPro.value) return;
  if (!deepDivesVisible.value) return;
  if (chartLoading.value) return;
  const key = chartLoadKey.value;
  if (chartLoadedKey.value === key) return;
  try {
    chartLoading.value = true;
    const enterpriseOnlyChartIds = new Set(['corridor-liquidity']);
    const chartIds = pulseChartRegistry
      .filter(c => isPro.value || !enterpriseOnlyChartIds.has(c.id))
      .map(c => c.id);
    const response = await getChartsBatch(chartIds, legacyFilters.value);
    const newData: Record<string, ChartData | null> = {};
    const availability: Record<string, ChartAvailabilityEntry> = {};
    for (const item of response.charts || []) {
      newData[item.id] = item.chart;
      availability[item.id] = {
        dataAvailable: item.dataAvailable,
        updatedAt: item.updatedAt,
        source: item.source,
      };
    }
    chartData.value = newData;
    chartAvailability.value = availability;
    chartLoadedKey.value = key;
  } catch (e) {
    useLogger('PulsePage').error('Failed to load chart data', e);
  } finally {
    chartLoading.value = false;
  }
}

async function loadSnapshotSummary() {
  if (!isPlus.value) return;
  try {
    snapshotSummary.value = await getPulseSnapshotSummary(
      store.corridor,
      store.timeframe,
      store.amount
    );
    if (snapshotSummary.value?.lastUpdated) {
      store.setLastUpdated(snapshotSummary.value.lastUpdated);
    }
  } catch (e) {
    useLogger('PulsePage').error('Failed to load snapshot summary', e);
  }
}

function navigateToChart(chartId: string) {
  const params = store.getQueryParams();
  const queryString = new URLSearchParams(params).toString();
  router.push(`/pulse/charts/${chartId}${queryString ? '?' + queryString : ''}`);
}

function handleEmbed(chartId: string) {
  if (!pulseEmbedsEnabled.value) return;
  embedModalChart.value = chartId;
}

function getDeltaClass(deltaType: PulseDeltaType) {
  if (deltaType === 'positive') return 'text-success-600';
  if (deltaType === 'negative') return 'text-danger-600';
  return 'text-neutral-400';
}

function highlightSection(sectionId: string) {
  highlightedSection.value = sectionId;
  if (highlightTimer) {
    clearTimeout(highlightTimer);
  }
  highlightTimer = setTimeout(() => {
    highlightedSection.value = null;
  }, 2000);
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightSection(sectionId);
  }
}

function handleKpiClick(kpiId: string) {
  const mapping: Record<string, { section: string; metric?: 'rate' | 'markup' }> = {
    'all-in-cost': { section: 'snapshot-chart', metric: 'markup' },
    'market-spread': { section: 'market-spread', metric: 'markup' },
    leader: { section: 'competition', metric: 'rate' },
    volatility: { section: 'risk', metric: 'rate' },
    'quote-success': { section: 'reliability', metric: 'rate' },
  };

  const target = mapping[kpiId];
  if (!target) return;
  if (target.metric) {
    activeMetric.value = target.metric;
  }
  scrollToSection(target.section);
}

function handleKeyDown(event: KeyboardEvent) {
  // Reserved for future use
}

function formatMethods(methods: string[]): string {
  return methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ');
}

function handleHeadlineTileClick(tile: HeadlineTile) {
  if (!tile.chartId) return;
  navigateToChart(tile.chartId);
}

const headlineFallback = createHeadlineFallbackController(() => {
  if (!headlineLoading.value) return;
  headlineLoading.value = false;
}, 10_000);

const startHeadlineFallbackTimer = () => {
  headlineFallback.start();
};

const hasChartSeries = (chartId: string) => {
  const data = chartData.value[chartId];
  if (!data || !Array.isArray(data.series)) return false;
  return data.series.some(series => Array.isArray(series.points) && series.points.length > 0);
};

const isIndicesChartPending = (chartId: string) => {
  const availability = chartAvailability.value[chartId];
  if (!availability) return chartLoading.value || !hasChartSeries(chartId);
  if (!availability.dataAvailable) return true;
  return !hasChartSeries(chartId);
};

const indicesCardUpdatedAtLabel = (chartId: string) => {
  const updatedAt = chartAvailability.value[chartId]?.updatedAt;
  if (!updatedAt) return null;
  return formatUpdatedLabel(updatedAt);
};

async function loadSenderHighlights() {
  if (!isPlus.value) return;
  highlightsLoading.value = true;
  headlineLoading.value = true;
  startHeadlineFallbackTimer();
  try {
    const [overviewResponse, narrativeResponse, personalHistoryResponse] = await Promise.all([
      getPulseOverview(legacyFilters.value),
      getPulseNarrative(store.corridor, store.timeframe, store.amount),
      getPulsePersonalHistory(store.corridor, store.amount),
    ]);

    overview.value = {
      tiles: overviewResponse.tiles || [],
      lastUpdated: overviewResponse.lastUpdated,
    };
    narrative.value = narrativeResponse;
    personalHistory.value = personalHistoryResponse;

    if (overviewResponse.lastUpdated) {
      store.setLastUpdated(overviewResponse.lastUpdated);
    }
    headlineLoading.value = false;
    headlineFallback.clear();
  } catch (e) {
    useLogger('PulsePage').error('Failed to load sender highlights', e);
    headlineFallback.clear();
    headlineLoading.value = false;
  } finally {
    highlightsLoading.value = false;
  }
}

async function loadCoverageSummary() {
  if (!isPlus.value) return;
  try {
    summary.value = await getPulseCoverageSummary(store.corridor, store.timeframe);
    if (summary.value?.lastUpdated) {
      store.setLastUpdated(summary.value.lastUpdated);
    }
  } catch (e) {
    useLogger('PulsePage').error('Failed to load coverage summary', e);
  }
}

watch(
  () => isPlus.value,
  plus => {
    if (!import.meta.client) return;
    if (!plus) return;

    // Entitlements hydrate client-side; refresh Plus-gated data once we know the plan.
    void refreshTrackedCorridors();
    void loadCoverageSummary();
    void loadSenderHighlights();
    void loadSnapshotSummary();
    if (isPro.value) {
      void setupDeepDivesObserver();
    }
  },
  { immediate: true }
);

watch(
  () => [
    isPro.value,
    pulseScreenerEnabled.value,
    screenerCorridorIds.value.join(','),
    store.timeframe,
    screenerQueryAmount.value,
  ],
  ([pro]) => {
    if (!import.meta.client) return;
    if (!pro) return;
    void loadScreener();
  },
  { immediate: true }
);

watch(
  () => isPro.value,
  pro => {
    if (pro) return;
    if (store.timeframe !== '7D' && store.timeframe !== '30D') {
      store.setTimeframe('30D');
    }
    if (store.viewMode !== 'sender') {
      store.setViewMode('sender');
      const nextQuery = { ...route.query } as Record<string, any>;
      delete nextQuery.mode;
      void router.replace({ path: route.path, query: nextQuery });
    }
  },
  { immediate: true }
);

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => {
    if (!isPlus.value) return;
    void loadSnapshotSummary();
    if (isPro.value) {
      void loadChartData();
    }
    void loadCoverageSummary();
    void loadSenderHighlights();
  },
  { deep: true }
);

watch(
  () => store.viewMode,
  mode => {
    if (!isPlus.value) return;
    if (mode === 'analyst') {
      void loadSnapshotSummary();
      void loadCoverageSummary();
      if (isPro.value) {
        void setupDeepDivesObserver();
      }
      return;
    }
    void loadSenderHighlights();
    teardownDeepDivesObserver();
  }
);

watch(
  () => trackedCorridors.value.length,
  len => {
    if (!import.meta.client) return;
    if (len === 0) return;
    store.initCorridor(trackedCorridors.value);
    if (!selectedCorridorKey.value) {
      initializeCorridorSelection();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown);
  await store.initFromRoute(route.query as Record<string, string>);
  amountInput.value = store.amount;

  initializeCorridorSelection();

  // Avoid Plus-gated Pulse API calls for public preview users.
  if (isPlus.value) {
    void refreshTrackedCorridors();
    if (isPro.value) {
      void loadScreener();
      void loadPinnedCorridors();
      void loadChartData();
      void setupDeepDivesObserver();
    }
    void loadSnapshotSummary();
    void loadCoverageSummary();
    void loadSenderHighlights();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  teardownDeepDivesObserver();
  clearSnapshotExportPoll();
  headlineFallback.clear();
});

useHead({
  title: 'Remit-Scout Pulse | Remittance Market Dashboard',
  meta: [
    {
      name: 'description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:title',
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
    },
    {
      property: 'og:description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
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
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
    },
    {
      name: 'twitter:description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
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
        name: 'Remit-Scout Pulse',
        description: 'Market dashboard for remittance pricing',
        url: 'https://remitscout.com/pulse',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        provider: {
          '@type': 'Organization',
          name: 'Remit-Scout',
          url: 'https://remitscout.com',
        },
      }),
    },
  ],
});
</script>

<style scoped>
.chart-line-animate {
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: drawLine 1.5s ease-out forwards;
}
.chart-area-animate {
  opacity: 0;
  animation: fadeArea 1.8s ease-out 0.3s forwards;
}
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes fadeArea {
  to {
    opacity: 1;
  }
}
</style>
