<script setup lang="ts">
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Enterprise API Documentation | Remit-Scout',
  description: 'Complete reference for the Remit-Scout Enterprise API: authentication, TEER/RCI/RVI indices, corridor coverage, data tiers, embeds, and support.',
  canonical: `${siteUrl}/docs/enterprise`,
  ogType: 'article',
})

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'index-reference', label: 'Index Reference' },
  { id: 'api-endpoints', label: 'API Endpoints' },
  { id: 'data-tiers', label: 'Data Tiers' },
  { id: 'embeds', label: 'Embeds' },
  { id: 'support', label: 'Support' },
] as const

type EnterpriseDocSectionId = (typeof sections)[number]['id']

const isEnterpriseDocSectionId = (value: string): value is EnterpriseDocSectionId =>
  sections.some(section => section.id === value)

const activeSection = ref<EnterpriseDocSectionId>(sections[0].id)
let sectionObserver: IntersectionObserver | null = null

function scrollTo(id: EnterpriseDocSectionId) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && isEnterpriseDocSectionId(entry.target.id)) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )
  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el) sectionObserver.observe(el)
  }
})

onBeforeUnmount(() => sectionObserver?.disconnect())
</script>

<template>
  <div class="min-h-screen bg-surface">
    <!-- Hero -->
    <section class="relative bg-neutral-900 py-14 lg:py-20">
      <div class="relative z-10 mx-auto max-w-page px-page-x">
        <nav class="mb-8 flex items-center gap-1.5 text-xs text-neutral-400">
          <NuxtLink
to="/"
class="hover:text-white transition-colors"
>Home</NuxtLink>
          <svg
class="h-3 w-3"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M8.25 4.5l7.5 7.5-7.5 7.5"
/></svg>
          <NuxtLink
to="/dashboard?tab=enterprise"
class="hover:text-white transition-colors"
>Enterprise</NuxtLink>
          <svg
class="h-3 w-3"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M8.25 4.5l7.5 7.5-7.5 7.5"
/></svg>
          <span class="text-neutral-200">Documentation</span>
        </nav>

        <div class="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-4">
          API Reference
        </div>
        <h1 class="text-3xl font-bold leading-tight text-white lg:text-4xl">Enterprise Documentation</h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
          Everything you need to integrate Remit-Scout market indices into your systems. Covers authentication,
          endpoints, data tiers, embed publishing, and support escalation.
        </p>
      </div>
    </section>

    <!-- Content -->
    <div class="mx-auto max-w-page px-page-x py-12 lg:py-16">
      <div class="flex gap-12">
        <!-- Sidebar -->
        <aside class="hidden w-48 flex-shrink-0 lg:block">
          <nav class="sticky top-24 space-y-0.5">
            <button
              v-for="s in sections"
              :key="s.id"
              class="block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors"
              :class="activeSection === s.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'"
              @click="scrollTo(s.id)"
            >
              {{ s.label }}
            </button>
          </nav>
        </aside>

        <!-- Main -->
        <main class="min-w-0 flex-1 space-y-16">
          <!-- Getting Started -->
          <section
id="getting-started"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Getting Started</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              The Enterprise tier gives you programmatic access to Remit-Scout's proprietary market indices
              (TEER, RCI, RVI), corridor coverage metadata, and static embed publishing. All data is derived
              from live quotes across 24 licensed remittance providers.
            </p>
            <div class="mt-6 rounded-lg border border-rs-border bg-neutral-50 p-5">
              <h3 class="text-sm font-semibold text-neutral-900">Quickstart</h3>
              <ol class="mt-3 space-y-3 text-sm text-neutral-600">
                <li class="flex gap-3">
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
                  <span>
                    <strong class="text-neutral-900">Create an API key</strong> in the
                    <NuxtLink
to="/dashboard?tab=enterprise"
class="text-brand-600 hover:text-brand-700 underline"
>Enterprise Console</NuxtLink>.
                    Select the scopes your integration needs.
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
                  <span>
                    <strong class="text-neutral-900">Make your first API call.</strong> The example below fetches the latest index snapshot for the US-to-Mexico corridor.
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
                  <span>
                    <strong class="text-neutral-900">Explore indices and coverage.</strong> Use the time-series endpoint to build charts,
                    or the coverage endpoint to monitor provider freshness.
                  </span>
                </li>
              </ol>
            </div>

            <div class="mt-5 rounded-lg border border-neutral-200 bg-neutral-900 p-4">
              <div class="mb-2 flex items-center gap-2">
                <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">GET</span>
                <code class="text-xs text-neutral-300">/api/v1/indices/{corridorId}/latest</code>
              </div>
              <pre class="overflow-x-auto text-xs leading-relaxed text-neutral-300"><code>curl -H "X-API-Key: rs_live_..." \
  "https://api.remitscout.com/api/v1/indices/US-MX-USD-MXN/latest"</code></pre>
            </div>
          </section>

          <!-- Authentication -->
          <section
id="authentication"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Authentication</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              All API requests require an <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-800">X-API-Key</code>
              header with your institutional API key.
            </p>

            <div class="mt-5 rounded-lg border border-neutral-200 bg-neutral-900 p-4">
              <pre class="overflow-x-auto text-xs leading-relaxed text-neutral-300"><code>curl -H "X-API-Key: rs_live_abc123..." \
  "https://api.remitscout.com/api/v1/indices/US-MX-USD-MXN/series?days=30"</code></pre>
            </div>

            <h3 class="mt-8 text-sm font-semibold text-neutral-900">Scopes</h3>
            <p class="mt-2 text-sm text-neutral-600">
              Your key's permissions depend on your contract tier. Each scope gates access to specific endpoints.
            </p>
            <div class="mt-4 overflow-hidden rounded-lg border border-rs-border">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Scope</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">What it unlocks</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Tier</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100">
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">indices:read</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">TEER, RCI, RVI time-series and latest values. Usage stats.</td>
                    <td class="px-4 py-2.5 text-neutral-600">Trial+</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">corridors:read</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">Provider coverage count, freshness metadata, publish-gate status per corridor.</td>
                    <td class="px-4 py-2.5 text-neutral-600">Standard+</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">exports:read</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">Bulk CSV and Parquet extracts of index data.</td>
                    <td class="px-4 py-2.5 text-neutral-600">Premium</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="mt-8 text-sm font-semibold text-neutral-900">Rate Limits</h3>
            <div class="mt-3 overflow-hidden rounded-lg border border-rs-border">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Tier</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Requests / min</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Requests / day</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Corridors</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100">
                  <tr>
                    <td class="px-4 py-2.5 font-medium text-neutral-900">Trial</td>
                    <td class="px-4 py-2.5 text-neutral-600">60</td>
                    <td class="px-4 py-2.5 text-neutral-600">1,000</td>
                    <td class="px-4 py-2.5 text-neutral-600">USD-origin only</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5 font-medium text-neutral-900">Standard</td>
                    <td class="px-4 py-2.5 text-neutral-600">300</td>
                    <td class="px-4 py-2.5 text-neutral-600">10,000</td>
                    <td class="px-4 py-2.5 text-neutral-600">All corridors</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5 font-medium text-neutral-900">Premium</td>
                    <td class="px-4 py-2.5 text-neutral-600">600</td>
                    <td class="px-4 py-2.5 text-neutral-600">50,000</td>
                    <td class="px-4 py-2.5 text-neutral-600">All corridors + bulk exports</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="mt-8 text-sm font-semibold text-neutral-900">Error Responses</h3>
            <p class="mt-2 text-sm text-neutral-600">
              If your key is invalid, expired, or missing a required scope, the API returns a structured error:
            </p>
            <div class="mt-3 rounded-lg border border-neutral-200 bg-neutral-900 p-4">
              <pre class="overflow-x-auto text-xs leading-relaxed text-neutral-300"><code>// 403 Forbidden
{
  "error": "forbidden",
  "code": "missing_scope",
  "requiredScope": "corridors:read"
}</code></pre>
            </div>
          </section>

          <!-- Index Reference -->
          <section
id="index-reference"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Index Reference</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              Remit-Scout computes three proprietary indices from live provider quotes. All values are derived from
              a $500 USD send-amount bucket using the bank-deposit delivery method.
            </p>

            <div class="mt-6 space-y-5">
              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">TEER</span>
                  <h3 class="text-sm font-semibold text-neutral-900">Total Effective Exchange Rate</h3>
                </div>
                <p class="mt-2 text-sm text-neutral-600">
                  The all-in exchange rate a recipient receives after all provider fees, margins, and FX markups
                  are deducted. A higher TEER means better value for the sender.
                </p>
                <p class="mt-2 text-xs text-neutral-500">
                  <strong>Unit:</strong> destination currency per 1 unit of source currency.
                  <strong>Example:</strong> TEER of 17.42 for US-MX-USD-MXN means sending $500 USD yields approximately 8,710 MXN after all costs.
                </p>
              </div>

              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">RCI</span>
                  <h3 class="text-sm font-semibold text-neutral-900">Remittance Cost Index</h3>
                </div>
                <p class="mt-2 text-sm text-neutral-600">
                  Total cost of sending money as a percentage of the send amount. Includes explicit fees plus
                  the implicit FX margin. A lower RCI means cheaper transfers.
                </p>
                <p class="mt-2 text-xs text-neutral-500">
                  <strong>Unit:</strong> percentage (%).
                  <strong>Example:</strong> RCI of 3.2% on a $500 transfer means total costs are approximately $16.
                </p>
              </div>

              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">RVI</span>
                  <h3 class="text-sm font-semibold text-neutral-900">Rate Volatility Index</h3>
                </div>
                <p class="mt-2 text-sm text-neutral-600">
                  Measures pricing dispersion across providers in a corridor. A high RVI indicates significant
                  rate variation, meaning comparison shopping has more impact.
                </p>
                <p class="mt-2 text-xs text-neutral-500">
                  <strong>Unit:</strong> basis points (bps).
                  <strong>Example:</strong> RVI of 150 bps means provider rates differ by about 1.5% of the mid-market rate.
                </p>
              </div>
            </div>

            <h3 class="mt-8 text-sm font-semibold text-neutral-900">Suppression Codes</h3>
            <p class="mt-2 text-sm text-neutral-600">
              When index quality falls below thresholds, the data point is flagged with
              <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">suppressionFlag: true</code>
              and a reason code.
            </p>
            <div class="mt-4 overflow-hidden rounded-lg border border-rs-border">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Code</th>
                    <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Meaning</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100">
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">insufficient_providers</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">Fewer than the minimum required providers contributed data.</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">stale_data</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">Data freshness exceeds the acceptable threshold for this corridor's tier.</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">dominance_exceeded</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">A single provider dominates the rate, reducing index reliability.</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2.5"><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">anomaly_detected</code></td>
                    <td class="px-4 py-2.5 text-neutral-600">Rate inversion or statistical outlier detected in the data.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-3 text-xs text-neutral-500">
              Suppressed data points still appear in time-series responses. Your application should check
              <code class="rounded bg-neutral-100 px-1 py-0.5 text-xs font-mono">suppressionFlag</code> and handle accordingly.
            </p>
          </section>

          <!-- API Endpoints -->
          <section
id="api-endpoints"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">API Endpoints</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              Base URL: <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">https://api.remitscout.com/api/v1</code>
            </p>

            <!-- Series -->
            <div class="mt-8 rounded-lg border border-rs-border">
              <div class="border-b border-rs-border bg-neutral-50 px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-600">GET</span>
                  <code class="text-sm font-mono text-neutral-800">/indices/{corridorId}/series</code>
                </div>
                <p class="mt-1 text-xs text-neutral-500">Scope: <code class="font-mono">indices:read</code></p>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-sm text-neutral-600">
                  Returns a time-series array of TEER, RCI, and RVI values for a corridor. Useful for building charts and trend analysis.
                </p>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Parameters</h4>
                  <div class="mt-2 overflow-hidden rounded border border-neutral-200">
                    <table class="w-full text-xs">
                      <thead class="bg-neutral-50">
<tr>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">In</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Required</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Description</th>
                      </tr>
</thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr><td class="px-3 py-2 font-mono">corridorId</td><td class="px-3 py-2">path</td><td class="px-3 py-2">Yes</td><td class="px-3 py-2 text-neutral-600">e.g. <code>US-MX-USD-MXN</code></td></tr>
                        <tr><td class="px-3 py-2 font-mono">days</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Lookback window (default 30)</td></tr>
                        <tr><td class="px-3 py-2 font-mono">amount_bucket</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Send amount in USD (default 500)</td></tr>
                        <tr><td class="px-3 py-2 font-mono">method_profile</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Delivery method (default <code>standard_bank</code>)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">cURL</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>curl -H "X-API-Key: rs_live_..." \
  "https://api.remitscout.com/api/v1/indices/US-MX-USD-MXN/series?days=30"</code></pre>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Response</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>{
  "corridorId": "US-MX-USD-MXN",
  "amountBucket": 500,
  "methodProfile": "standard_bank",
  "dataTier": 1,
  "cadenceMinutes": 10,
  "collectionTier": "tier_1",
  "isUsdOrigin": true,
  "lastUpdated": "2026-03-09T12:30:00.000Z",
  "series": [
    {
      "date": "2026-03-09",
      "teer": 17.42,
      "rci": 3.21,
      "rvi_bps": 148,
      "providerCount": 8,
      "suppressionFlag": false,
      "suppressionReasonCode": null,
      "midMarketRate": 17.85,
      "weightConfidence": 0.92
    }
  ]
}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Latest -->
            <div class="mt-6 rounded-lg border border-rs-border">
              <div class="border-b border-rs-border bg-neutral-50 px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-600">GET</span>
                  <code class="text-sm font-mono text-neutral-800">/indices/{corridorId}/latest</code>
                </div>
                <p class="mt-1 text-xs text-neutral-500">Scope: <code class="font-mono">indices:read</code></p>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-sm text-neutral-600">
                  Returns the most recent data point for a corridor. Use this for real-time dashboards or single-value lookups.
                </p>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Parameters</h4>
                  <div class="mt-2 overflow-hidden rounded border border-neutral-200">
                    <table class="w-full text-xs">
                      <thead class="bg-neutral-50">
<tr>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">In</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Required</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Description</th>
                      </tr>
</thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr><td class="px-3 py-2 font-mono">corridorId</td><td class="px-3 py-2">path</td><td class="px-3 py-2">Yes</td><td class="px-3 py-2 text-neutral-600">e.g. <code>US-PH-USD-PHP</code></td></tr>
                        <tr><td class="px-3 py-2 font-mono">amount_bucket</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Send amount in USD (default 500)</td></tr>
                        <tr><td class="px-3 py-2 font-mono">method_profile</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Delivery method (default <code>standard_bank</code>)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">cURL</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>curl -H "X-API-Key: rs_live_..." \
  "https://api.remitscout.com/api/v1/indices/US-PH-USD-PHP/latest"</code></pre>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Response</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>{
  "corridorId": "US-PH-USD-PHP",
  "amountBucket": 500,
  "methodProfile": "standard_bank",
  "dataTier": 1,
  "cadenceMinutes": 10,
  "collectionTier": "tier_1",
  "isUsdOrigin": true,
  "lastUpdated": "2026-03-09T12:30:00.000Z",
  "point": {
    "date": "2026-03-09",
    "teer": 56.12,
    "rci": 2.85,
    "rvi_bps": 92,
    "providerCount": 11,
    "suppressionFlag": false,
    "suppressionReasonCode": null,
    "midMarketRate": 57.45,
    "weightConfidence": 0.96
  }
}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coverage -->
            <div class="mt-6 rounded-lg border border-rs-border">
              <div class="border-b border-rs-border bg-neutral-50 px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-600">GET</span>
                  <code class="text-sm font-mono text-neutral-800">/corridors/{corridorId}/coverage</code>
                </div>
                <p class="mt-1 text-xs text-neutral-500">Scope: <code class="font-mono">corridors:read</code></p>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-sm text-neutral-600">
                  Returns provider coverage and freshness metadata for a corridor. Tells you how many providers
                  are actively contributing data, how fresh each provider's data is, and whether the corridor meets
                  publish-gate thresholds.
                </p>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Parameters</h4>
                  <div class="mt-2 overflow-hidden rounded border border-neutral-200">
                    <table class="w-full text-xs">
                      <thead class="bg-neutral-50">
<tr>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">In</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Required</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Description</th>
                      </tr>
</thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr><td class="px-3 py-2 font-mono">corridorId</td><td class="px-3 py-2">path</td><td class="px-3 py-2">Yes</td><td class="px-3 py-2 text-neutral-600">e.g. <code>US-IN-USD-INR</code></td></tr>
                        <tr><td class="px-3 py-2 font-mono">amount_bucket</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Send amount in USD (default 500)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">cURL</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>curl -H "X-API-Key: rs_live_..." \
  "https://api.remitscout.com/api/v1/corridors/US-IN-USD-INR/coverage"</code></pre>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Response</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>{
  "corridorId": "US-IN-USD-INR",
  "amountBucket": 500,
  "providerCount": 9,
  "confidence": "high",
  "publishable": true,
  "publishGateReasons": [],
  "lastUpdated": "2026-03-09T12:25:00.000Z",
  "providers": [
    {
      "providerId": "wise",
      "providerName": "Wise",
      "lastObservedAt": "2026-03-09T12:25:00.000Z",
      "ageMinutes": 5
    }
  ]
}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Usage -->
            <div class="mt-6 rounded-lg border border-rs-border">
              <div class="border-b border-rs-border bg-neutral-50 px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-600">GET</span>
                  <code class="text-sm font-mono text-neutral-800">/usage</code>
                </div>
                <p class="mt-1 text-xs text-neutral-500">Scope: <code class="font-mono">indices:read</code></p>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-sm text-neutral-600">
                  Returns your API key's request count, error rates, and daily breakdown. Institutional clients only.
                </p>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Parameters</h4>
                  <div class="mt-2 overflow-hidden rounded border border-neutral-200">
                    <table class="w-full text-xs">
                      <thead class="bg-neutral-50">
<tr>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">In</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Required</th>
                        <th class="px-3 py-2 text-left font-medium text-neutral-600">Description</th>
                      </tr>
</thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr><td class="px-3 py-2 font-mono">days</td><td class="px-3 py-2">query</td><td class="px-3 py-2">No</td><td class="px-3 py-2 text-neutral-600">Lookback window (default 30, max 90)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">cURL</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>curl -H "X-API-Key: rs_live_..." \
  "https://api.remitscout.com/api/v1/usage?days=30"</code></pre>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Response</h4>
                  <div class="mt-2 rounded border border-neutral-200 bg-neutral-900 p-3">
                    <pre class="overflow-x-auto text-xs text-neutral-300"><code>{
  "clientId": "inst_abc123",
  "period": { "from": "2026-02-07", "to": "2026-03-09" },
  "total": { "requests": 12480, "errors4xx": 23, "errors5xx": 0 },
  "byDay": [
    { "day": "2026-03-09", "requests": 412, "errors4xx": 1, "errors5xx": 0 }
  ]
}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Response Fields -->
            <div class="mt-8">
              <h3 class="text-sm font-semibold text-neutral-900">Common Response Fields</h3>
              <div class="mt-3 overflow-hidden rounded-lg border border-rs-border">
                <table class="w-full text-sm">
                  <thead class="bg-neutral-50">
                    <tr>
                      <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Field</th>
                      <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Type</th>
                      <th class="px-4 py-2.5 text-left font-medium text-neutral-600">Description</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-100">
                    <tr><td class="px-4 py-2.5 font-mono text-xs">teer</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">Total Effective Exchange Rate</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">rci</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">Remittance Cost Index (%)</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">rvi_bps</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">Rate Volatility Index (basis points)</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">providerCount</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">Providers that contributed to this data point</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">suppressionFlag</td><td class="px-4 py-2.5 text-neutral-600">boolean</td><td class="px-4 py-2.5 text-neutral-600">True if data quality is below threshold</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">suppressionReasonCode</td><td class="px-4 py-2.5 text-neutral-600">string | null</td><td class="px-4 py-2.5 text-neutral-600">Machine-readable suppression reason</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">midMarketRate</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">OANDA mid-market reference rate</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">weightConfidence</td><td class="px-4 py-2.5 text-neutral-600">number | null</td><td class="px-4 py-2.5 text-neutral-600">Provider weighting confidence score (0-1)</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">dataTier</td><td class="px-4 py-2.5 text-neutral-600">1 | 2</td><td class="px-4 py-2.5 text-neutral-600">Data collection tier (see Data Tiers)</td></tr>
                    <tr><td class="px-4 py-2.5 font-mono text-xs">cadenceMinutes</td><td class="px-4 py-2.5 text-neutral-600">number</td><td class="px-4 py-2.5 text-neutral-600">Expected data refresh interval</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Data Tiers -->
          <section
id="data-tiers"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Data Tiers</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              Corridors are assigned to collection tiers based on origin country. Tier determines how frequently
              data is refreshed and the freshness SLO commitment.
            </p>
            <div class="mt-6 grid gap-5 sm:grid-cols-2">
              <div class="rounded-lg border border-rs-border bg-surface p-5 opacity-50">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-700">Tier 1</span>
                  <span class="text-sm font-medium text-neutral-900">USD-Origin Corridors</span>
                </div>
                <dl class="mt-4 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Collection cadence</dt>
                    <dd class="font-medium text-neutral-900">Every 10 minutes</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Freshness SLO</dt>
                    <dd class="font-medium text-neutral-900">10 minutes</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Example</dt>
                    <dd class="font-mono text-xs text-neutral-600">US-MX-USD-MXN</dd>
                  </div>
                </dl>
              </div>
              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">Tier 2</span>
                  <span class="text-sm font-medium text-neutral-900">All Other Corridors</span>
                </div>
                <dl class="mt-4 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Collection cadence</dt>
                    <dd class="font-medium text-neutral-900">Every 3 hours</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Freshness SLO</dt>
                    <dd class="font-medium text-neutral-900">180 minutes</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Example</dt>
                    <dd class="font-mono text-xs text-neutral-600">GB-IN-GBP-INR</dd>
                  </div>
                </dl>
              </div>
            </div>
            <p class="mt-4 text-xs text-neutral-500">
              Trial-tier API keys only have access to Tier 1 (USD-origin) corridors. Standard and Premium
              keys can query all corridors.
            </p>
          </section>

          <!-- Embeds -->
          <section
id="embeds"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Index Embeds</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              Publish a static TEER, RCI, or RVI chart embed for any corridor. Embeds are generated from the
              Enterprise Console and can be embedded via an iframe on your website.
            </p>
            <div class="mt-6 rounded-lg border border-rs-border bg-neutral-50 p-5 space-y-4">
              <h3 class="text-sm font-semibold text-neutral-900">Configuration</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-neutral-500">Amount bucket</dt>
                  <dd class="font-medium text-neutral-900">$500 USD (fixed)</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-500">Delivery method</dt>
                  <dd class="font-medium text-neutral-900">Bank deposit (fixed)</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-500">Data window</dt>
                  <dd class="font-medium text-neutral-900">7, 14, 30, 60, or 90 days</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-neutral-500">Theme</dt>
                  <dd class="font-medium text-neutral-900">Dark or Light</dd>
                </div>
              </dl>
            </div>
            <div class="mt-5">
              <h3 class="text-sm font-semibold text-neutral-900">Embedding</h3>
              <p class="mt-2 text-sm text-neutral-600">
                After publishing an embed from the Console, copy the iframe code:
              </p>
              <div class="mt-3 rounded-lg border border-neutral-200 bg-neutral-900 p-4">
                <pre class="overflow-x-auto text-xs text-neutral-300"><code>&lt;iframe
  src="https://app.remitscout.com/embed/teer/US-MX-USD-MXN?theme=dark&amp;days=30"
  width="100%"
  height="400"
  frameborder="0"
&gt;&lt;/iframe&gt;</code></pre>
              </div>
            </div>
          </section>

          <!-- Support -->
          <section
id="support"
class="scroll-mt-24"
>
            <h2 class="text-xl font-semibold text-neutral-900">Support and Escalation</h2>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
              Enterprise clients have priority access to the Remit-Scout data team.
            </p>
            <div class="mt-6 space-y-4">
              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <h3 class="text-sm font-semibold text-neutral-900">Contact</h3>
                <dl class="mt-3 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-neutral-500">Email</dt>
                    <dd class="font-medium text-brand-600">support@remit-scout.com</dd>
                  </div>
                </dl>
              </div>
              <div class="rounded-lg border border-rs-border bg-surface p-5">
                <h3 class="text-sm font-semibold text-neutral-900">Reporting Data Quality Issues</h3>
                <p class="mt-2 text-sm text-neutral-600">
                  If you detect anomalies in index values or suspect stale data, email us with:
                </p>
                <ul class="mt-2 list-disc pl-5 text-sm text-neutral-600 space-y-1">
                  <li>Corridor ID and timestamp of the data point</li>
                  <li>Expected vs. observed values</li>
                  <li>Your API key ID (visible in the Console, not the key itself)</li>
                  <li>Screenshots or response payloads if available</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Back to Console -->
          <div class="border-t border-rs-border pt-8">
            <NuxtLink
              to="/dashboard?tab=enterprise"
              class="inline-flex items-center gap-2 rounded-lg border border-rs-border bg-surface px-4 py-2 text-sm font-medium text-rs-fg transition-colors hover:bg-neutral-50"
            >
              <svg
class="h-4 w-4"
fill="none"
stroke="currentColor"
stroke-width="2"
viewBox="0 0 24 24"
><path
stroke-linecap="round"
stroke-linejoin="round"
d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
/></svg>
              Back to Enterprise Console
            </NuxtLink>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
