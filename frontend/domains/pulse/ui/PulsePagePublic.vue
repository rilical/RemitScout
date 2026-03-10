<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <div class="relative overflow-hidden bg-neutral-950 px-page-x pb-12 pt-16">
      <div
        class="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden="true"
      >
        <div class="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_42%)]" />
        <div class="absolute right-0 top-12 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
        <div class="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-brand-500/8 blur-3xl" />
      </div>
      <div class="mx-auto max-w-page">
        <div class="relative grid grid-cols-1 gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
          <div class="space-y-6">
            <h1
              class="text-hero font-bold leading-tight"
              aria-label="Remit-Scout Pulse"
            >
              <span class="text-white">Remit-Scout</span>
              <span class="text-brand-600"> Pulse</span>
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
                class="text-body inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-brand-500 hover:shadow-xl focus-ring-dark"
              >
                Get Plus
              </NuxtLink>
              <NuxtLink
                to="/sign-in"
                class="text-body inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-surface/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-ring-dark"
              >
                Sign in
              </NuxtLink>
            </div>
            <NuxtLink
              to="/methodology"
              class="text-body-sm inline-flex items-center gap-1.5 font-medium text-white/40 transition-colors hover:text-white/70 focus-ring-dark"
            >
              Our methodology
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
            <span class="text-label text-neutral-500">Illustrative sample — US → Philippines</span>
          </div>
          <h2 class="text-h2 font-bold text-neutral-900">Market Snapshot</h2>
          <p class="text-body mt-2 text-neutral-600">
            Sending $1,000 USD — this sample shows how Pulse frames a corridor snapshot across 7
            providers.
          </p>
        </div>

        <!-- 4 KPI Tiles -->
        <div
          ref="kpiSectionRef"
          class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <div
            v-for="(kpi, idx) in PREVIEW_SAMPLE_KPIS"
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
              <span
                class="text-body-sm font-semibold"
                :class="kpi.deltaClass"
              >
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
              <span
                v-if="kpi.deltaLabel"
                class="text-body-sm text-neutral-400"
              >{{ kpi.deltaLabel }}</span>
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
            <svg
              viewBox="0 0 780 280"
              class="w-full"
              preserveAspectRatio="xMidYMid meet"
            >
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
                <linearGradient
                  id="sample-area-grad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stop-color="#2563EB"
                    stop-opacity="0.12"
                  />
                  <stop
                    offset="100%"
                    stop-color="#2563EB"
                    stop-opacity="0"
                  />
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
        <p class="text-label mb-6 text-center text-neutral-500">
          Tracking 25+ providers in real-time
        </p>
        <div class="flex flex-wrap items-center justify-center gap-5">
          <div
            v-for="slug in PROVIDER_SLUGS"
            :key="slug"
            class="flex h-10 w-20 items-center justify-center rounded-lg border border-neutral-100 bg-white p-1.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0"
          >
            <ProviderLogo
              :slug="slug"
              :alt="slug"
              size="small"
              fit
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Sample Charts Gallery -->
    <div class="bg-neutral-950 px-page-x py-16 lg:py-20">
      <div class="mx-auto max-w-page">
        <div class="mb-10 text-center">
          <div
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"
              />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            <span class="text-body-sm font-semibold text-neutral-300">Illustrative sample — 🇺🇸 USD → 🇵🇭 PHP</span>
          </div>
          <h2 class="text-h2 font-bold text-white">18 Charts Across 4 Categories</h2>
          <p class="text-body mx-auto mt-2 max-w-2xl text-neutral-400">
            Preview the pricing, competition, volatility, and coverage views Pulse exposes once
            live corridor data is available.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            v-for="(chart, idx) in PREVIEW_CHART_CARDS"
            :key="chart.id"
            v-reveal="{ delay: idx * 80 }"
            class="preview-card overflow-hidden card-surface shadow-lg"
          >
            <div class="px-5 pb-2 pt-5">
              <div class="mb-2 flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: chart.accent }"
                />
                <span class="text-label text-neutral-500">{{ chart.category }}</span>
              </div>
              <h3 class="text-body-lg mb-1 font-bold text-white">{{ chart.title }}</h3>
              <p class="text-body-sm text-neutral-500">{{ chart.description }}</p>
            </div>
            <div class="px-2 pb-2">
              <PulseLineChart
                v-if="chart.type === 'line'"
                :series="SAMPLE_CHART_SERIES[chart.id] || []"
                :unit="chart.unit"
                :show-area="'showArea' in chart ? (chart.showArea ?? true) : true"
              />
              <PulseBarChart
                v-else
                :series="SAMPLE_CHART_SERIES[chart.id] || []"
                :unit="chart.unit"
                :threshold="'threshold' in chart ? (chart.threshold ?? null) : null"
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
            class="text-body-sm inline-flex items-center gap-1.5 font-semibold text-brand-400 transition-colors hover:text-brand-300 focus-ring-dark"
          >
            Read our full methodology
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
                class="grid grid-cols-[auto,1fr,auto] gap-4 border-b border-neutral-200 px-5 py-2.5 text-label text-neutral-400"
              >
                <span />
                <span>Corridor / Best Provider</span>
                <span class="text-right">Spread / Coverage</span>
              </div>
              <div class="divide-y divide-neutral-100">
                <div
                  v-for="(row, idx) in PREVIEW_SCREENER_ROWS"
                  :key="row.corridor"
                  v-reveal="{ delay: idx * 60 }"
                  class="screener-row flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50"
                >
                  <span class="text-xl leading-none">{{ row.flag }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-body font-bold text-neutral-900">{{ row.corridor }}</span>
                      <span
                        class="rounded-full px-2 py-0.5 text-label"
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
                    <div class="text-body-sm text-neutral-400">
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
            <PulseMoversList
              variant="public"
              :limit="6"
            />
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
          <div class="card-surface p-6">
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
          <div class="card-surface p-6">
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
          <div class="card-surface p-6">
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
          <div class="card-surface p-6">
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
          <div class="card-surface p-6">
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
          <div class="card-surface p-6">
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
            class="text-body-lg inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-xl focus-ring-dark"
          >
            Get Plus
          </NuxtLink>
          <NuxtLink
            to="/contact?type=enterprise&topic=pulse"
            class="text-body-lg inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/5 focus-ring-dark"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import PulseDashboardPreview from '~/components/pulse/PulseDashboardPreview.vue'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'
import PulseBarChart from '~/components/pulse/PulseBarChart.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import InstitutionalTeaser from '~/components/home/InstitutionalTeaser.vue'
import {
  PREVIEW_SCREENER_ROWS,
  PREVIEW_SAMPLE_KPIS,
  PREVIEW_RATE_CHART_BOUNDS,
  PREVIEW_RATE_DAYS,
  PREVIEW_BEST_RATES,
  PREVIEW_MID_MARKET_RATES,
  PROVIDER_SLUGS,
  SAMPLE_CHART_SERIES,
  PREVIEW_CHART_CARDS,
} from '~/lib/pulseSampleData'

// ----- SVG chart computations (rate preview) -----

type PreviewRatePoint = {
  index: number
  x: number
  y: number
  value: number
  highlight: boolean
}

const previewRateScale = computed(() => {
  const values = [...PREVIEW_BEST_RATES, ...PREVIEW_MID_MARKET_RATES]
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = 0.12
  const min = Math.floor((rawMin - padding) * 100) / 100
  const max = Math.ceil((rawMax + padding) * 100) / 100
  return { min, max }
})

const previewRateToY = (value: number) => {
  const { min, max } = previewRateScale.value
  const ratio = (value - min) / Math.max(max - min, 0.0001)
  const { yTop, yBottom } = PREVIEW_RATE_CHART_BOUNDS
  return yBottom - ratio * (yBottom - yTop)
}

const previewRateToX = (index: number) => {
  const { xStart, xEnd } = PREVIEW_RATE_CHART_BOUNDS
  const step = (xEnd - xStart) / Math.max(PREVIEW_RATE_DAYS.length - 1, 1)
  return xStart + step * index
}

const previewRateYTicks = computed(() => {
  const { min, max } = previewRateScale.value
  const ticks = 5
  return Array.from({ length: ticks }, (_, index) => {
    const ratio = index / (ticks - 1)
    const value = max - (max - min) * ratio
    const y = previewRateToY(value)
    return {
      label: value.toFixed(2),
      y,
      isBaseline: index === ticks - 1,
    }
  })
})

const previewRateDayTicks = computed(() =>
  PREVIEW_RATE_DAYS.map((label, index) => ({
    label,
    x: previewRateToX(index),
  })),
)

const previewRateBestPoints = computed<PreviewRatePoint[]>(() =>
  PREVIEW_BEST_RATES.map((value, index) => ({
    index,
    value,
    x: previewRateToX(index),
    y: previewRateToY(value),
    highlight: index >= PREVIEW_BEST_RATES.length - 2,
  })),
)

const previewRateMidPoints = computed(() =>
  PREVIEW_MID_MARKET_RATES.map((value, index) => ({
    index,
    value,
    x: previewRateToX(index),
    y: previewRateToY(value),
  })),
)

const toPolyline = (points: Array<{ x: number, y: number }>) =>
  points.map(point => `${point.x},${point.y}`).join(' ')

const previewRateBestPolyline = computed(() => toPolyline(previewRateBestPoints.value))
const previewRateMidPolyline = computed(() => toPolyline(previewRateMidPoints.value))
const previewRateBestAreaPath = computed(() => {
  const points = previewRateBestPoints.value
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `M ${first.x},${first.y} L ${points
    .slice(1)
    .map(point => `${point.x},${point.y}`)
    .join(' L ')} L ${last.x},${PREVIEW_RATE_CHART_BOUNDS.yBottom} L ${first.x},${PREVIEW_RATE_CHART_BOUNDS.yBottom} Z`
})

const previewRateBestPeakPoint = computed(() => {
  const points = previewRateBestPoints.value
  return points.reduce((peak, point) => (point.value > peak.value ? point : peak), points[0])
})
const previewRateBestLatestPoint = computed(
  () => previewRateBestPoints.value[previewRateBestPoints.value.length - 1],
)
const previewRateMidLatestPoint = computed(
  () => previewRateMidPoints.value[previewRateMidPoints.value.length - 1],
)

const clampPreviewRectX = (x: number, width: number) => {
  const { xStart, xEnd } = PREVIEW_RATE_CHART_BOUNDS
  return Math.min(Math.max(x, xStart), xEnd - width)
}

const previewPeakBestLabelRect = computed(() => {
  const point = previewRateBestPeakPoint.value
  const width = 100
  const height = 18
  return {
    x: clampPreviewRectX(point.x - width / 2, width),
    y: Math.max(2, point.y - 26),
    width,
    height,
  }
})
const previewLatestBestLabelRect = computed(() => {
  const point = previewRateBestLatestPoint.value
  const width = 106
  const height = 16
  return {
    x: clampPreviewRectX(point.x + 8, width),
    y: Math.max(2, point.y - 20),
    width,
    height,
  }
})
const previewLatestMidLabelRect = computed(() => {
  const point = previewRateMidLatestPoint.value
  const width = 116
  const height = 16
  return {
    x: clampPreviewRectX(point.x - width + 2, width),
    y: Math.min(PREVIEW_RATE_CHART_BOUNDS.yBottom - height - 2, point.y + 8),
    width,
    height,
  }
})

const previewPeakBestLabel = computed(
  () => `${previewRateBestPeakPoint.value.value.toFixed(2)} Best rate`,
)
const previewLatestBestLabel = computed(
  () => `${previewRateBestLatestPoint.value.value.toFixed(2)} Best rate`,
)
const previewLatestMidLabel = computed(
  () => `${previewRateMidLatestPoint.value.value.toFixed(2)} Mid-market`,
)

// ----- Intersection-observer animations -----

const kpiSectionRef = ref<HTMLElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)
const chartVisible = ref(false)

function animateCountUp(el: HTMLElement, target: string, duration = 1200) {
  const prefix = target.match(/^[₱$]/)?.[0] || ''
  const suffix = target.match(/[%]$/)?.[0] || ''
  const numStr = target.replace(/[₱$%,]/g, '')
  const end = parseFloat(numStr)
  if (isNaN(end)) {
    el.textContent = target
    return
  }
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = (end * eased).toFixed(decimals)
    el.textContent = `${prefix}${current}${suffix}`
    if (progress < 1) requestAnimationFrame(step)
    else el.textContent = target
  }
  requestAnimationFrame(step)
}

let kpiObserver: IntersectionObserver | null = null
watch(kpiSectionRef, (el) => {
  kpiObserver?.disconnect()
  if (!el || typeof IntersectionObserver === 'undefined') return
  const observedEl = el as unknown as HTMLElement
  kpiObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observedEl.querySelectorAll<HTMLElement>('.kpi-value').forEach((valEl) => {
            const target = valEl.dataset.target
            if (target) animateCountUp(valEl, target);
            (valEl as HTMLElement).style.opacity = '1';
            (valEl as HTMLElement).style.transform = 'translateY(0)'
          })
          Array.from(observedEl.children).forEach((child) => {
            (child as HTMLElement).style.opacity = '1';
            (child as HTMLElement).style.transform = 'translateY(0)'
          })
          kpiObserver?.unobserve(entry.target as Element)
        }
      }
    },
    { rootMargin: '0px 0px -30px 0px', threshold: 0.15 },
  )
  kpiObserver.observe(observedEl as unknown as Element)
})

let chartObserver: IntersectionObserver | null = null
watch(chartRef, (el) => {
  chartObserver?.disconnect()
  if (!el || typeof IntersectionObserver === 'undefined') return
  const observedEl = el as unknown as Element
  chartObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          chartVisible.value = true
          chartObserver?.unobserve(entry.target as Element)
        }
      }
    },
    { rootMargin: '0px 0px -50px 0px', threshold: 0.1 },
  )
  chartObserver.observe(observedEl)
})

onUnmounted(() => {
  kpiObserver?.disconnect()
  chartObserver?.disconnect()
})
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
