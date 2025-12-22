<template>
  <section class="py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 mb-12">
        <!-- Left: Messaging -->
        <div class="lg:max-w-2xl">
          <p class="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">Enterprise Solutions</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 leading-tight">
            Remittance Intelligence for Enterprise
          </h2>
          <p class="text-lg text-slate-700 leading-relaxed mb-6">
            Access institutional-grade corridor data, pricing feeds, and market analytics built for compliance teams, treasury desks, and research analysts who need reliable, real-time remittance intelligence. Power your financial operations with comprehensive data across 150+ global corridors, monitor pricing trends in real-time, and ensure regulatory compliance with audit-ready exports.
          </p>
          <p class="text-base text-slate-600 leading-relaxed mb-6">
            Whether you're optimizing treasury operations, conducting market research, or ensuring regulatory compliance, Remit-Scout provides the data infrastructure your institution needs. Our synthetically verified pricing intelligence helps you make informed decisions, identify arbitrage opportunities, and maintain competitive positioning in the remittance market.
          </p>
          <p class="text-base text-slate-600 leading-relaxed">
            Our data collection methodology combines automated monitoring of 33+ licensed providers with independent verification processes, ensuring every pricing point is timestamped, cross-referenced against mid-market rates, and validated through multiple data sources. Enterprise customers benefit from dedicated support, custom data delivery formats, and flexible integration options. Whether you need real-time API access, scheduled batch exports, or custom reporting dashboards, we deliver data in formats that fit your operational workflows and compliance requirements.
          </p>
        </div>

        <!-- Right: Data Products Grid -->
        <div class="lg:max-w-xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <!-- Data API -->
          <NuxtLink
            to="/institutions/api"
            class="group flex flex-col p-5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h3 class="text-base font-semibold text-slate-900 mb-2">Data API</h3>
            <p class="text-sm text-slate-600 mb-4 leading-relaxed">RESTful API for historical & live pricing feeds with comprehensive documentation</p>
            <div class="mt-auto space-y-1.5 text-xs text-slate-500">
              <div>REST & GraphQL support</div>
              <div>99.9% uptime SLA</div>
            </div>
            <span class="mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors inline-flex items-center gap-1">
              Learn more
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>

          <!-- Compliance -->
          <NuxtLink
            to="/institutions/compliance"
            class="group flex flex-col p-5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h3 class="text-base font-semibold text-slate-900 mb-2">Compliance</h3>
            <p class="text-sm text-slate-600 mb-4 leading-relaxed">Regulatory exports, audit trails, and compliance-ready documentation</p>
            <div class="mt-auto space-y-1.5 text-xs text-slate-500">
              <div>Audit-ready exports</div>
              <div>Regulatory compliance frameworks</div>
            </div>
            <span class="mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors inline-flex items-center gap-1">
              Learn more
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </NuxtLink>
          </div>
          
          <!-- Features Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-1">Real-time Data</h3>
                <p class="text-xs text-slate-600">Live pricing updates across all monitored corridors with sub-minute latency</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-1">RESTful API</h3>
                <p class="text-xs text-slate-600">Seamless integration with your existing systems and workflows</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-1">Compliance Ready</h3>
                <p class="text-xs text-slate-600">Regulatory exports and audit trails built for financial institutions</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-1">Historical Analytics</h3>
                <p class="text-xs text-slate-600">Deep historical data for trend analysis and forecasting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Provenance footer -->
      <div class="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <p class="text-xs text-slate-600">
          <span class="inline-flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Synthetically Verified v2.1</span>
            <span class="text-slate-400">·</span>
            <span>Timestamped</span>
            <span class="text-slate-400">·</span>
            <span>Independent Sources</span>
          </span>
        </p>
        <NuxtLink
          to="/institutions"
          class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
        >
          Explore all enterprise products
          <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

