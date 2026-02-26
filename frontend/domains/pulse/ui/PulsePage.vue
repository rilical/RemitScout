<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Public preview (no Plus required) -->
    <div
      v-if="!isPlus"
      class="min-h-screen"
    >
      <!-- Hero -->
      <div class="px-page-x pt-16 pb-12">
        <div class="mx-auto max-w-page">
          <div class="grid grid-cols-1 gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
            <div class="space-y-6">
              <h1 class="text-hero font-bold leading-tight">
                <span class="text-white">Remit-Scout</span> <span class="text-brand-600">Pulse</span>
              </h1>
              <p class="text-body-lg text-white/70 leading-relaxed max-w-xl">
                Real-time market intelligence for remittance pricing. Track rates, fees, and provider performance across 49,000+ corridors with 18 market charts and 25+ monitored providers.
              </p>
              <p class="text-body text-white/50 max-w-lg">
                Built for analysts, compliance teams, and operations managers who need accurate, up-to-date pricing data.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <NuxtLink
                  to="/plus"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-bold text-white hover:bg-brand-500 transition-colors shadow-lg hover:shadow-xl"
                >
                  Get Plus
                </NuxtLink>
                <NuxtLink
                  to="/sign-in"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-surface/10 px-6 py-3 text-body font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Sign in
                </NuxtLink>
              </div>
              <NuxtLink
                to="/methodology"
                class="inline-flex items-center gap-1.5 text-body-sm font-medium text-white/40 hover:text-white/70 transition-colors"
              >
                Our methodology
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
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
            <div class="flex items-center gap-2 mb-3">
              <span class="relative flex h-2.5 w-2.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span class="text-body-sm font-semibold text-neutral-500 uppercase tracking-wider">Sample Data — US → Philippines</span>
            </div>
            <h2 class="text-h2 font-bold text-neutral-900">Market Snapshot</h2>
            <p class="mt-2 text-body text-neutral-600">Sending $1,000 USD — here's what Pulse tracks in real-time across 7 providers.</p>
          </div>

          <!-- 4 KPI Tiles -->
          <div ref="kpiSectionRef" class="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
            <div
              v-for="(kpi, idx) in sampleKpis"
              :key="kpi.id"
              class="rounded-xl border border-neutral-200 border-l-2 border-l-brand-600 bg-surface p-4 shadow-sm opacity-0 translate-y-4 motion-safe:transition-all duration-500"
              :style="{ transitionDelay: `${idx * 100}ms` }"
            >
              <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <svg v-if="kpi.icon === 'trending'" class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <svg v-else-if="kpi.icon === 'percent'" class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" /></svg>
                <svg v-else-if="kpi.icon === 'trophy'" class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                <svg v-else class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div class="mb-1 text-body-sm font-medium text-neutral-500">{{ kpi.label }}</div>
              <div class="kpi-value mb-1 text-h4 font-bold text-neutral-900 tabular-nums" :data-target="kpi.value">{{ kpi.value }}</div>
              <div class="flex items-center gap-1.5">
                <span
                  class="text-body-sm font-semibold"
                  :class="kpi.deltaClass"
                >
                  <svg v-if="kpi.deltaType === 'positive'" class="inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  {{ kpi.delta }}
                </span>
                <span v-if="kpi.deltaLabel" class="text-body-sm text-neutral-400">{{ kpi.deltaLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Full-width Sample Area Chart -->
          <div ref="chartRef" class="rounded-2xl border border-neutral-200 bg-surface shadow-sm overflow-hidden">
            <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div>
                <h3 class="text-body-lg font-bold text-neutral-900">All-in Cost Index</h3>
                <p class="text-body-sm text-neutral-500">Effective exchange rate over 7 days — USD → PHP</p>
              </div>
              <div class="hidden sm:flex items-center gap-4 text-body-sm">
                <span class="flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-brand-600"></span>
                  <span class="text-neutral-500">Best rate</span>
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="h-0.5 w-4 bg-neutral-300" style="border-bottom: 2px dashed #d4d4d4; height: 0;"></span>
                  <span class="text-neutral-500">Mid-market</span>
                </span>
              </div>
            </div>
            <div class="px-4 py-6 sm:px-6">
              <svg viewBox="0 0 780 280" class="w-full" preserveAspectRatio="xMidYMid meet">
                <line x1="55" y1="20" x2="770" y2="20" stroke="#f5f5f5" stroke-width="1" />
                <line x1="55" y1="75" x2="770" y2="75" stroke="#f5f5f5" stroke-width="1" />
                <line x1="55" y1="130" x2="770" y2="130" stroke="#f5f5f5" stroke-width="1" />
                <line x1="55" y1="185" x2="770" y2="185" stroke="#f5f5f5" stroke-width="1" />
                <line x1="55" y1="240" x2="770" y2="240" stroke="#e5e5e5" stroke-width="1" />

                <text x="48" y="24" text-anchor="end" fill="#a3a3a3" font-size="11" font-family="system-ui">56.20</text>
                <text x="48" y="79" text-anchor="end" fill="#a3a3a3" font-size="11" font-family="system-ui">56.00</text>
                <text x="48" y="134" text-anchor="end" fill="#a3a3a3" font-size="11" font-family="system-ui">55.80</text>
                <text x="48" y="189" text-anchor="end" fill="#a3a3a3" font-size="11" font-family="system-ui">55.60</text>
                <text x="48" y="244" text-anchor="end" fill="#a3a3a3" font-size="11" font-family="system-ui">55.40</text>

                <text x="55" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Mon</text>
                <text x="174" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Tue</text>
                <text x="293" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Wed</text>
                <text x="413" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Thu</text>
                <text x="532" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Fri</text>
                <text x="651" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Sat</text>
                <text x="770" y="262" text-anchor="middle" fill="#a3a3a3" font-size="11" font-family="system-ui">Sun</text>

                <line x1="55" y1="75" x2="770" y2="75" stroke="#d4d4d4" stroke-width="1" stroke-dasharray="6 4" />

                <defs>
                  <linearGradient id="sample-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563EB" stop-opacity="0.12" />
                    <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 55,152 L 174,116 L 293,64 L 413,100 L 532,81 L 651,42 L 770,64 L 770,240 L 55,240 Z" fill="url(#sample-area-grad)" :class="{ 'chart-area-animate': chartVisible }" />
                <polyline points="55,152 174,116 293,64 413,100 532,81 651,42 770,64" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ 'chart-line-animate': chartVisible }" />

                <circle cx="55" cy="152" r="3.5" fill="white" stroke="#2563EB" stroke-width="2" />
                <circle cx="174" cy="116" r="3.5" fill="white" stroke="#2563EB" stroke-width="2" />
                <circle cx="293" cy="64" r="3.5" fill="white" stroke="#2563EB" stroke-width="2" />
                <circle cx="413" cy="100" r="3.5" fill="white" stroke="#2563EB" stroke-width="2" />
                <circle cx="532" cy="81" r="3.5" fill="white" stroke="#2563EB" stroke-width="2" />
                <circle cx="651" cy="42" r="4.5" fill="#2563EB" stroke="white" stroke-width="2" />
                <circle cx="770" cy="64" r="4.5" fill="#2563EB" stroke="white" stroke-width="2" />

                <rect x="618" y="16" width="66" height="18" rx="4" fill="#2563EB" />
                <text x="651" y="29" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="system-ui">56.12 Peak</text>

                <rect x="738" y="44" width="54" height="16" rx="3" fill="#eff6ff" stroke="#2563EB" stroke-width="0.5" />
                <text x="765" y="55" text-anchor="middle" fill="#2563EB" font-size="10" font-weight="600" font-family="system-ui">56.04</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Coverage -->
      <div class="bg-surface px-page-x pb-12">
        <div class="mx-auto max-w-page">
          <p class="mb-6 text-center text-body-sm font-semibold text-neutral-500 uppercase tracking-wider">
            Tracking 25+ providers in real-time
          </p>
          <div class="flex flex-wrap items-center justify-center gap-5">
            <div
              v-for="slug in providerSlugs"
              :key="slug"
              class="flex h-10 w-20 items-center justify-center rounded-lg border border-neutral-100 bg-white p-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
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
            <div class="inline-flex items-center gap-2 mb-4 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-1.5">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-500"></span>
              </span>
              <span class="text-body-sm font-semibold text-neutral-300">Sample data — 🇺🇸 USD → 🇵🇭 PHP</span>
            </div>
            <h2 class="text-h2 font-bold text-white">18 Charts Across 4 Categories</h2>
            <p class="mt-2 text-body text-neutral-400 max-w-2xl mx-auto">Pricing, competition, volatility, and operational coverage — interactive charts powered by verified pipeline data. Hover to explore.</p>
          </div>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              v-for="(chart, idx) in previewChartCards"
              :key="chart.id"
              v-reveal="{ delay: idx * 80 }"
              class="preview-card rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg overflow-hidden"
            >
              <div class="px-5 pt-5 pb-2">
                <div class="mb-2 flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: chart.accent }"></span>
                  <span class="text-body-sm font-semibold uppercase tracking-wider text-neutral-500">{{ chart.category }}</span>
                </div>
                <h3 class="mb-1 text-body-lg font-bold text-white">{{ chart.title }}</h3>
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

          <p class="mt-8 text-center text-body-sm text-neutral-500">
            Plus members get access to all 18 charts with full 7-day history — including spread distribution, quote stability, data freshness, and more.
          </p>
        </div>
      </div>

      <!-- Data Quality / Methodology Strip -->
      <div class="bg-neutral-900 px-page-x py-12">
        <div class="mx-auto max-w-page">
          <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg class="h-4.5 w-4.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">5-min refresh cadence</div>
                <div class="text-[12px] text-neutral-500">Quotes refreshed across all monitored providers</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg class="h-4.5 w-4.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">SHA-256 audit trail</div>
                <div class="text-[12px] text-neutral-500">Every quote timestamped and cryptographically verified</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg class="h-4.5 w-4.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">Synthetic verification v2.5</div>
                <div class="text-[12px] text-neutral-500">Rates validated against mid-market benchmarks</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <svg class="h-4.5 w-4.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <div class="text-body-sm font-bold text-white">Open methodology</div>
                <div class="text-[12px] text-neutral-500">Full documentation of indices, scoring, and data pipeline</div>
              </div>
            </div>
          </div>
          <div class="mt-6 text-center">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Read our full methodology
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Corridor Screener + Movers -->
      <div class="bg-surface px-page-x py-16 lg:py-20">
        <div class="mx-auto max-w-page">
          <div class="mb-10 text-center">
            <h2 class="text-h2 font-bold text-neutral-900">
              Corridor Intelligence
            </h2>
            <p class="mt-2 text-body text-neutral-600">
              Monitor pricing signals and movement across the corridors that matter most.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- Mini Screener -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-body-lg font-bold text-neutral-900">Screener</h3>
                <span class="text-body-sm text-neutral-500">8 of 49,000+ corridors</span>
              </div>
              <div class="rounded-2xl border border-neutral-200 bg-surface shadow-sm overflow-hidden">
                <div class="grid grid-cols-[auto,1fr,auto] gap-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                  <span></span>
                  <span>Corridor / Best Provider</span>
                  <span class="text-right">Spread / Coverage</span>
                </div>
                <div class="divide-y divide-neutral-100">
                  <div
                    v-for="(row, idx) in previewScreenerRows"
                    :key="row.corridor"
                    v-reveal="{ delay: idx * 60 }"
                    class="screener-row flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <span class="text-xl leading-none">{{ row.flag }}</span>
                    <div class="flex-1 min-w-0">
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
                      <div class="mt-0.5 text-body-sm text-neutral-500">
                        Best: {{ row.bestProvider }} @ {{ row.bestRate }} · Gets {{ row.recipientGets }}
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="text-body-sm font-bold text-neutral-900 tabular-nums">{{ row.spread }} bps</div>
                      <div class="text-[11px] text-neutral-400">{{ row.providers }} providers · {{ row.updated }}</div>
                    </div>
                  </div>
                </div>
              </div>
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
          <div class="text-center mb-12">
            <h2 class="text-h2 font-bold text-white">
              Get more from Pulse with Plus
            </h2>
            <p class="mt-3 text-body-lg text-white/70 max-w-2xl mx-auto">
              Unlock the full market intelligence dashboard and make data-driven remittance decisions.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">Smart Gauge</div>
              <p class="text-body-sm text-neutral-400">AI-powered timing signals that tell you the best time to send money.</p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">18 Market Charts</div>
              <p class="text-body-sm text-neutral-400">Pricing, competition, volatility, and coverage analytics with full history.</p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">Corridor Screener</div>
              <p class="text-body-sm text-neutral-400">Scan 49,000+ corridors with real-time spread and provider rankings.</p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">Smart Alerts</div>
              <p class="text-body-sm text-neutral-400">Get notified when rates hit your target or providers change pricing.</p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">CSV Exports</div>
              <p class="text-body-sm text-neutral-400">Download snapshot and historical data for analysis and reporting.</p>
            </div>
            <div class="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <svg class="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div class="text-body font-bold text-white mb-1">49,000+ Corridors</div>
              <p class="text-body-sm text-neutral-400">Coverage spanning major and emerging remittance routes worldwide.</p>
            </div>
          </div>

          <div class="text-center">
            <NuxtLink
              to="/plus"
              class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-4 text-body-lg font-bold text-white hover:bg-brand-500 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Plus
            </NuxtLink>
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
              <div class="flex flex-wrap items-center gap-1 text-body-sm">
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'snapshot' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="scrollToSection('snapshot')"
                >
                  Snapshot
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'dispersion' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="scrollToSection('dispersion')"
                >
                  Pricing Dispersion
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'competition' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="scrollToSection('competition')"
                >
                  Provider Competition
                </button>
                <template v-if="isPro">
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="activeSection === 'reliability' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                    @click="scrollToSection('reliability')"
                  >
                    Reliability
                  </button>
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="activeSection === 'indices' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                    @click="scrollToSection('indices')"
                  >
                    Indices
                  </button>
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="activeSection === 'risk' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                    @click="scrollToSection('risk')"
                  >
                    Risk & Anomalies
                  </button>
                </template>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'deep-dives' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="scrollToSection('deep-dives')"
                >
                  Deep Dives
                </button>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'exports' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                  @click="scrollToSection('exports')"
                >
                  Exports
                </button>
                <template v-if="isPro">
                  <button
                    class="rounded-full px-3 py-1.5 transition-colors"
                    :class="activeSection === 'enterprise' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
                    @click="scrollToSection('enterprise')"
                  >
                    Enterprise
                  </button>
                </template>
                <button
                  class="rounded-full px-3 py-1.5 transition-colors"
                  :class="activeSection === 'methodology' ? 'text-white font-semibold border-b-2 border-brand-600 bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
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
                <div class="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
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
                      Download as Image
                    </div>
                    <p class="mt-1 text-body-sm text-neutral-400">
                      Branded PNG with source attribution. Great for blog posts and reports.
                    </p>
                    <button
                      type="button"
                      class="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="chartImageExporting || !chartRef"
                      @click="downloadChartImage"
                    >
                      {{ chartImageExporting ? 'Generating...' : 'Download PNG' }}
                    </button>
                    <p
                      v-if="chartImageError"
                      class="mt-2 text-[11px] text-danger-600"
                    >
                      {{ chartImageError }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                    <div class="text-body-sm font-semibold text-white">
                      Embed Charts
                    </div>
                    <p class="mt-1 text-body-sm text-neutral-400">
                      Live-updating charts for your website with backlink attribution.
                    </p>
                    <button
                      class="mt-3 w-full rounded-lg border border-neutral-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
                      @click="handleEmbed('all-in-cost')"
                    >
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
        :chart-container-ref="(chartRef as unknown as HTMLElement | null)"
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
import { getCategoryAccent } from '~/lib/pulseChartStyle'
import { usePulseStore, type PulseCorridor, type PulseTimeframe, type PulseViewMode } from '~/stores/pulse'
import { Icon } from '~/ui'
import { formatNumber as formatCount, formatUpdatedLabel } from '~/shared/lib/format'
import { COUNTRIES } from '~/utils/countries-currencies'
import { useEntitlements } from '~/composables/useEntitlements'
import { useWatchlist } from '~/composables/useWatchlist'
import { useSaveAlertModal } from '~/composables/useSaveAlertModal'
import { useExports } from '~/composables/useExports'
import { useChartImageExport } from '~/composables/useChartImageExport'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import InstitutionalTeaser from '~/components/home/InstitutionalTeaser.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import PulseDashboardPreview from '~/components/pulse/PulseDashboardPreview.vue'
import PulseLineChart from '~/components/pulse/PulseLineChart.vue'
import PulseBarChart from '~/components/pulse/PulseBarChart.vue'
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
  { flag: '🇺🇸', corridor: 'USD → PHP', badge: 'Great', bestProvider: 'Wise', bestRate: '56.04', recipientGets: '₱55,811', spread: '38', providers: '7', updated: '4m ago' },
  { flag: '🇬🇧', corridor: 'GBP → NGN', badge: 'Good', bestProvider: 'WorldRemit', bestRate: '1,892.50', recipientGets: '₦1,890,608', spread: '61', providers: '5', updated: '9m ago' },
  { flag: '🇪🇺', corridor: 'EUR → INR', badge: 'Great', bestProvider: 'Wise', bestRate: '92.17', recipientGets: '₹91,249', spread: '29', providers: '8', updated: '2m ago' },
  { flag: '🇺🇸', corridor: 'USD → MXN', badge: 'Fair', bestProvider: 'Remitly', bestRate: '17.38', recipientGets: 'MX$17,345', spread: '95', providers: '6', updated: '7m ago' },
  { flag: '🇦🇺', corridor: 'AUD → PHP', badge: 'Good', bestProvider: 'Wise', bestRate: '37.82', recipientGets: '₱37,643', spread: '44', providers: '5', updated: '3m ago' },
  { flag: '🇨🇦', corridor: 'CAD → INR', badge: 'Great', bestProvider: 'Remitly', bestRate: '61.45', recipientGets: '₹60,937', spread: '31', providers: '6', updated: '5m ago' },
  { flag: '🇺🇸', corridor: 'USD → NGN', badge: 'Fair', bestProvider: 'WorldRemit', bestRate: '1,620.30', recipientGets: '₦1,616,080', spread: '112', providers: '4', updated: '11m ago' },
  { flag: '🇪🇺', corridor: 'EUR → GHS', badge: 'Good', bestProvider: 'Wise', bestRate: '16.92', recipientGets: 'GH₵16,785', spread: '53', providers: '3', updated: '8m ago' },
]

const sampleKpis = [
  { id: 'best-rate', label: 'Best rate', value: '₱56.04', delta: '+0.12%', deltaType: 'positive', deltaClass: 'text-brand-600', deltaLabel: 'vs yesterday', icon: 'trending' },
  { id: 'avg-fee', label: 'Avg fee', value: '$1.59', delta: '-$0.20', deltaType: 'positive', deltaClass: 'text-brand-600', deltaLabel: 'vs 7d avg', icon: 'percent' },
  { id: 'provider-count', label: 'Providers live', value: '7', delta: '', deltaType: 'neutral', deltaClass: 'text-neutral-400', deltaLabel: 'reporting', icon: 'trophy' },
  { id: 'rci', label: 'RCI', value: '2.34%', delta: '-8 bps', deltaType: 'positive', deltaClass: 'text-brand-600', deltaLabel: 'vs 30d', icon: 'activity' },
]

const providerSlugs = [
  'wise', 'remitly', 'worldremit', 'western-union', 'xe-money', 'ria',
  'pangea', 'sendwave', 'instarem', 'xoom', 'transfergo',
  'paysend', 'orbitremit', 'koronapay', 'wirebarley', 'intermex',
]

const sampleTs = Array.from({ length: 7 }, (_, i) => Date.now() - (6 - i) * 86400000)
const sampleChartSeries = {
  'all-in-cost': [
    { id: 'best', label: 'Best Rate', color: '#2563EB', points: sampleTs.map((t, i) => ({ t, v: [55.42, 55.67, 55.91, 55.78, 56.02, 55.89, 56.04][i] })) },
    { id: 'avg', label: 'Average', color: '#94A3B8', points: sampleTs.map((t, i) => ({ t, v: [55.10, 55.28, 55.52, 55.38, 55.61, 55.48, 55.65][i] })) },
  ],
  'fx-markup': [
    { id: 'wise', label: 'Wise', color: '#10B981', points: sampleTs.map((t, i) => ({ t, v: [38, 42, 40, 36, 44, 39, 42][i] })) },
    { id: 'remitly', label: 'Remitly', color: '#2563EB', points: sampleTs.map((t, i) => ({ t, v: [72, 78, 75, 80, 74, 76, 78][i] })) },
    { id: 'worldremit', label: 'WorldRemit', color: '#F59E0B', points: sampleTs.map((t, i) => ({ t, v: [105, 110, 108, 112, 106, 115, 110][i] })) },
  ],
  'leader-edge': [
    { id: 'edge', label: 'Leader Edge', color: '#6366F1', points: sampleTs.map((t, i) => ({ t, v: [12, 18, 5, 15, 8, 22, 14][i] })) },
  ],
  'volatility-pulse': [
    { id: 'rvi', label: 'RVI', color: '#818CF8', points: sampleTs.map((t, i) => ({ t, v: [28, 35, 22, 42, 31, 19, 32][i] })) },
  ],
  'quote-success': [
    { id: 'wise', label: 'Wise', color: '#10B981', points: sampleTs.map((t, i) => ({ t, v: [99.2, 99.5, 98.8, 99.1, 99.6, 99.3, 99.4][i] })) },
    { id: 'remitly', label: 'Remitly', color: '#2563EB', points: sampleTs.map((t, i) => ({ t, v: [97.1, 96.8, 97.5, 96.2, 97.8, 97.0, 97.4][i] })) },
    { id: 'worldremit', label: 'WorldRemit', color: '#F59E0B', points: sampleTs.map((t, i) => ({ t, v: [94.5, 95.2, 93.8, 95.0, 94.1, 95.5, 94.8][i] })) },
  ],
  'indices-confidence': [
    { id: 'confidence', label: 'Confidence Score', color: '#3B82F6', points: sampleTs.map((t, i) => ({ t, v: [82, 85, 88, 86, 91, 89, 92][i] })) },
  ],
} as Record<string, import('~/types/pulse').ChartSeries[]>

const previewChartCards = [
  { id: 'all-in-cost', title: 'All-in Cost Index (RCI)', category: 'Pricing & Margin', accent: '#2563EB', description: 'Effective exchange rate including all fees and FX markup', type: 'line' as const, unit: 'rate', showArea: true },
  { id: 'fx-markup', title: 'FX Markup by Provider', category: 'Pricing & Margin', accent: '#2563EB', description: 'Markup over mid-market rate in basis points', type: 'line' as const, unit: 'bps', showArea: false },
  { id: 'leader-edge', title: 'Leader Edge vs #2', category: 'Competitive Dynamics', accent: '#6366F1', description: 'Pricing edge of the leader over the runner-up', type: 'line' as const, unit: 'bps', showArea: true },
  { id: 'volatility-pulse', title: 'Volatility Pulse (RVI)', category: 'Volatility & Risk', accent: '#818CF8', description: 'Remittance Volatility Index in basis points', type: 'bar' as const, unit: 'bps', threshold: 35 },
  { id: 'quote-success', title: 'Quote Success Rate', category: 'Operational Coverage', accent: '#3B82F6', description: 'Percentage of successful quote fetches by provider', type: 'line' as const, unit: 'percent', showArea: false },
  { id: 'indices-confidence', title: 'Indices Confidence', category: 'Operational Coverage', accent: '#3B82F6', description: 'Confidence score used by Gold indices weighting', type: 'line' as const, unit: 'percent', showArea: true },
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
        accentColor: getCategoryAccent(meta.category),
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

// Preview card and screener row animations handled by v-reveal directive

const kpiSectionRef = ref<HTMLElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)
const chartVisible = ref(false)

function animateCountUp(el: HTMLElement, target: string, duration = 1200) {
  const prefix = target.match(/^[₱$]/)?.[0] || ''
  const suffix = target.match(/[%]$/)?.[0] || ''
  const numStr = target.replace(/[₱$%,]/g, '')
  const end = parseFloat(numStr)
  if (isNaN(end)) { el.textContent = target; return }
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

function revealElements(container: HTMLElement, selector: string) {
  container.querySelectorAll(selector).forEach((el) => {
    ;(el as HTMLElement).style.opacity = '1'
    ;(el as HTMLElement).style.transform = 'translateY(0)'
  })
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
          revealElements(observedEl, '.kpi-value')
          observedEl.querySelectorAll<HTMLElement>('.kpi-value').forEach((valEl) => {
            const target = valEl.dataset.target
            if (target) animateCountUp(valEl, target)
          })
          observedEl.children && Array.from(observedEl.children).forEach((child) => {
            ;(child as HTMLElement).style.opacity = '1'
            ;(child as HTMLElement).style.transform = 'translateY(0)'
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


const watchlist = useWatchlist()
const saveAlertModal = useSaveAlertModal()
const exportsApi = useExports()
const shareModalChart = ref<string | null>(null)
const embedModalChart = ref<string | null>(null)
const activeMetric = ref<'rate' | 'markup'>('rate')
const highlightedSection = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

// Scrollspy: track which section is currently in view
const activeSection = ref<string>('snapshot')
const sectionIds = ['snapshot', 'dispersion', 'competition', 'reliability', 'indices', 'risk', 'deep-dives', 'exports', 'enterprise', 'methodology']
let scrollspyObserver: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  scrollspyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' },
  )
  // Defer to next tick so sections are rendered
  nextTick(() => {
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) scrollspyObserver?.observe(el)
    }
  })
})

onUnmounted(() => {
  scrollspyObserver?.disconnect()
  kpiObserver?.disconnect()
  chartObserver?.disconnect()
})

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
    if (result.status === 'error') {
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

const { exportAsImage, exporting: chartImageExporting } = useChartImageExport()
const chartImageError = ref<string | null>(null)

async function downloadChartImage() {
  const el = chartRef.value
  if (!el || chartImageExporting.value) return
  chartImageError.value = null
  try {
    const label = store.corridorLabel || store.corridorSlug || 'Global'
    await exportAsImage(el as HTMLElement, {
      title: 'All-in Cost Index',
      subtitle: `${label} · $${store.amount}`,
      source: `Source: Remit-Scout · remit-scout.com/pulse · ${label}`,
      filename: `remit-scout-all-in-cost-${store.corridorSlug || 'global'}`,
    })
  }
  catch (e) {
    chartImageError.value = e instanceof Error ? e.message : 'Failed to generate image.'
  }
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
  title: 'Remit-Scout Pulse | Remittance Market Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:title',
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
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
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
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
        'name': 'Remit-Scout Pulse',
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
  to { stroke-dashoffset: 0; }
}
@keyframes fadeArea {
  to { opacity: 1; }
}
</style>
