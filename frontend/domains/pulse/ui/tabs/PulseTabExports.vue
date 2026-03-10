<template>
  <div class="space-y-6">
    <!-- Light layout -->
    <template v-if="density === 'light'">
      <!-- ROW 1: Section header -->
      <RsSectionHeader
        title="Exports"
        description="Download data and compare quotes"
        icon="↓"
        :variant="variant"
      />

      <!-- ROW 2: Action cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Card 1: Download Snapshot -->
        <div :class="[cardSurface, 'p-5 flex flex-col gap-4']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100'"
            >
              <span
                class="text-lg"
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
                aria-hidden="true"
              >↓</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Download Snapshot
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Download CSV for this corridor (30 day history)
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="downloadCsvClasses"
              :disabled="csvDownloading || !corridor"
              @click="handleCsvDownload"
            >
              <span v-if="csvDownloading" class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              {{ csvDownloading ? 'Generating...' : 'Download CSV' }}
            </button>
          </div>
          <p
            v-if="csvError"
            class="text-xs text-red-500"
          >
            {{ csvError }}
          </p>
        </div>

        <!-- Card 2: Compare Live Quotes -->
        <div :class="[cardSurface, 'p-5 flex flex-col gap-4']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100'"
            >
              <span
                class="text-lg"
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
                aria-hidden="true"
              >⇄</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Compare Live Quotes
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Compare current quotes from all providers
              </p>
            </div>
          </div>
          <NuxtLink
            :to="compareHref"
            class="inline-flex w-fit items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :class="variant === 'terminal'
              ? 'bg-neutral-700 text-white hover:bg-neutral-600'
              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'"
          >
            Compare Now
          </NuxtLink>
        </div>
      </div>

      <!-- ROW 3: Upgrade prompt -->
      <div
        class="rounded-xl p-6"
        :class="variant === 'terminal'
          ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/40'
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              class="font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              Need API access, webhooks, or extended history?
            </p>
            <p
              class="mt-1 text-sm"
              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
            >
              Enterprise plans include programmatic access to all market data.
            </p>
          </div>
          <NuxtLink
            to="/contact?type=enterprise&topic=pulse"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            :class="variant === 'terminal'
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'"
          >
            Learn about Enterprise
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Enterprise layout -->
    <template v-else>
      <!-- ROW 1: Section header -->
      <RsSectionHeader
        title="Exports & Integrations"
        description="Download data, export charts, and manage programmatic access"
        icon="↓"
        :variant="variant"
      />

      <!-- ROW 2: 3 action cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <!-- Card 1: Download Snapshot (CSV / XLSX) -->
        <div :class="[cardSurface, 'p-5 flex flex-col gap-4']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100'"
            >
              <span
                class="text-lg"
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
                aria-hidden="true"
              >↓</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Download Snapshot
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Export corridor data as CSV or XLSX
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="downloadCsvClasses"
              :disabled="csvDownloading || !corridor"
              @click="handleCsvDownload"
            >
              <span v-if="csvDownloading" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              {{ csvDownloading ? 'Generating...' : 'CSV' }}
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="downloadXlsxClasses"
              :disabled="xlsxDownloading || !corridor"
              @click="handleXlsxDownload"
            >
              <span v-if="xlsxDownloading" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              {{ xlsxDownloading ? 'Generating...' : 'XLSX' }}
            </button>
          </div>
          <p
            v-if="csvError"
            class="text-xs text-red-500"
          >
            {{ csvError }}
          </p>
        </div>

        <!-- Card 2: Download Visual -->
        <div :class="[cardSurface, 'p-5 flex flex-col gap-4']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100'"
            >
              <span
                class="text-lg"
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
                aria-hidden="true"
              >◫</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Download Visual
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Export chart as PNG or SVG image
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="visualExportClasses"
              :disabled="visualExporting"
              @click="handleVisualExport('png')"
            >
              <span v-if="visualExporting && activeVisualFormat === 'png'" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              PNG
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="visualExportClasses"
              :disabled="visualExporting"
              @click="handleVisualExport('svg')"
            >
              <span v-if="visualExporting && activeVisualFormat === 'svg'" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              SVG
            </button>
          </div>
          <p
            v-if="visualExportError"
            class="text-xs text-red-500"
          >
            {{ visualExportError }}
          </p>
        </div>

        <!-- Card 3: Embed Charts -->
        <div :class="[cardSurface, 'p-5 flex flex-col gap-4']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100'"
            >
              <span
                class="text-lg"
                :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
                aria-hidden="true"
              >&lt;/&gt;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Embed Charts
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Generate a static iframe embed for your site
              </p>
            </div>
          </div>
          <button
            class="inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            :class="variant === 'terminal'
              ? 'bg-neutral-700 text-white hover:bg-neutral-600'
              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'"
            @click="showEmbedCode = !showEmbedCode"
          >
            {{ showEmbedCode ? 'Hide Code' : 'Show Embed Code' }}
          </button>

          <!-- Embed code preview -->
          <div
            v-if="showEmbedCode"
            class="rounded-lg p-3 font-mono text-xs"
            :class="variant === 'terminal'
              ? 'bg-neutral-900 text-emerald-400 border border-neutral-700'
              : 'bg-neutral-900 text-emerald-400'"
          >
            <div class="flex items-start justify-between gap-2">
              <pre class="overflow-x-auto whitespace-pre-wrap break-all">{{ embedCodeSnippet }}</pre>
              <button
                class="shrink-0 rounded px-2 py-0.5 text-xs transition-colors"
                :class="embedCopied
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
                @click="copyEmbedCode"
              >
                {{ embedCopied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: Enterprise access cards -->
      <div>
        <RsSectionHeader
          title="Enterprise Access"
          description="Programmatic and real-time access to all market data"
          :variant="variant"
          class="mb-4"
        />
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- API Access -->
          <div :class="[cardSurface, 'p-5 flex flex-col gap-3']">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-indigo-900/40' : 'bg-indigo-50'"
            >
              <span class="text-base text-indigo-400" aria-hidden="true">{ }</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                API Access
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Programmatic access to all quotes and indices
              </p>
            </div>
            <NuxtLink
              to="/contact?type=enterprise&topic=api"
              class="mt-auto inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="enterpriseLinkClasses"
            >
              Learn more
            </NuxtLink>
          </div>

          <!-- Webhooks -->
          <div :class="[cardSurface, 'p-5 flex flex-col gap-3']">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-amber-900/40' : 'bg-amber-50'"
            >
              <span class="text-base text-amber-400" aria-hidden="true">&#9656;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Webhooks
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Real-time notifications for rate changes
              </p>
            </div>
            <NuxtLink
              to="/contact?type=enterprise&topic=webhooks"
              class="mt-auto inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="enterpriseLinkClasses"
            >
              Learn more
            </NuxtLink>
          </div>

          <!-- Extended History -->
          <div :class="[cardSurface, 'p-5 flex flex-col gap-3']">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-emerald-900/40' : 'bg-emerald-50'"
            >
              <span class="text-base text-emerald-400" aria-hidden="true">&#128337;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Extended History
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                365+ days of historical data
              </p>
            </div>
            <NuxtLink
              to="/contact?type=enterprise&topic=history"
              class="mt-auto inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="enterpriseLinkClasses"
            >
              Learn more
            </NuxtLink>
          </div>

          <!-- Advanced Signals -->
          <div :class="[cardSurface, 'p-5 flex flex-col gap-3']">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-rose-900/40' : 'bg-rose-50'"
            >
              <span class="text-base text-rose-400" aria-hidden="true">&#9888;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Advanced Signals
              </p>
              <p
                class="mt-0.5 text-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Stress signals, anomalies, and alerts
              </p>
            </div>
            <NuxtLink
              to="/contact?type=enterprise&topic=signals"
              class="mt-auto inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="enterpriseLinkClasses"
            >
              Learn more
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PulseDensity, PulseFilters, CorridorOption } from '~/types/pulse'
import { getMarketSnapshot, getTableData } from '~/lib/pulseApi'
import { useChartImageExport } from '~/composables/useChartImageExport'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  density: PulseDensity
  corridor: CorridorOption | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ── Theme ─────────────────────────────────────────────────────────────────────

const { variant, cardSurface } = usePulseTheme()

// ── CSV/XLSX download ─────────────────────────────────────────────────────────

const csvDownloading = ref(false)
const xlsxDownloading = ref(false)
const csvError = ref<string | null>(null)

function corridorSlug(): string {
  if (!props.corridor) return 'corridor'
  return props.corridor.slug ?? props.corridor.value ?? 'corridor'
}

function buildFilename(ext: 'csv' | 'xlsx'): string {
  const slug = corridorSlug().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const date = new Date().toISOString().slice(0, 10)
  return `remit-scout-${slug}-${date}.${ext}`
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n'))
    ? `"${v.replace(/"/g, '""')}"`
    : v

  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ]
  return lines.join('\r\n')
}

function triggerTextDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function fetchSnapshotRows(): Promise<{ headers: string[], rows: string[][] }> {
  if (!props.corridor) {
    throw new Error('No corridor selected.')
  }

  // Try the rich table endpoint first; fall back to the market snapshot.
  try {
    const tableData = await getTableData('all-in-cost', props.filters, '30d', 1, 500)
    const headers = tableData.columns.map(c => c.label)
    const rows = tableData.rows.map(row => [
      new Date(row.timestamp).toISOString().slice(0, 10),
      row.provider,
      String(row.deliveredAmount),
      row.deliveredCurrency,
      String(row.fee),
      row.feeCurrency,
      String(row.rate),
      String(row.markupBps),
      row.provenance,
    ])
    return { headers, rows }
  }
  catch {
    // Fallback: use the live market snapshot.
    const pulseCorridor = {
      from: props.corridor.sourceCountry ?? props.corridor.fromCode ?? '',
      to: props.corridor.destCountry ?? props.corridor.toCode ?? '',
      fromCode: props.corridor.fromCode ?? '',
      toCode: props.corridor.toCode ?? '',
      fromFlag: props.corridor.fromFlag ?? '',
      toFlag: props.corridor.toFlag ?? '',
      label: props.corridor.label ?? '',
      slug: props.corridor.slug ?? props.corridor.value ?? '',
      corridorId: props.corridor.corridorId,
    }
    const snapshot = await getMarketSnapshot(pulseCorridor, props.filters.amount)
    const date = new Date().toISOString().slice(0, 10)
    const headers = ['Date', 'Provider', 'Recipient Gets', 'Currency', 'Fee (USD)', 'FX Markup (bps)', 'Speed']
    const rows = snapshot.quotes.map(q => [
      date,
      q.provider,
      String(q.recipientGets),
      snapshot.currency,
      String(q.fee),
      String(q.markupBps),
      q.speed,
    ])
    return { headers, rows }
  }
}

async function handleCsvDownload() {
  if (csvDownloading.value || !props.corridor) return
  csvDownloading.value = true
  csvError.value = null
  try {
    const { headers, rows } = await fetchSnapshotRows()
    const csv = rowsToCsv(headers, rows)
    triggerTextDownload(csv, buildFilename('csv'), 'text/csv;charset=utf-8;')
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate CSV.'
    csvError.value = message
  }
  finally {
    csvDownloading.value = false
  }
}

async function handleXlsxDownload() {
  if (xlsxDownloading.value || !props.corridor) return
  xlsxDownloading.value = true
  csvError.value = null
  try {
    const { headers, rows } = await fetchSnapshotRows()
    // Build a minimal tab-separated values file that Excel/Sheets opens natively.
    // A full XLSX library would be an unnecessary heavy dependency for this CTA tab.
    const tsvLines = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t')),
    ]
    const tsvContent = tsvLines.join('\r\n')
    triggerTextDownload(tsvContent, buildFilename('xlsx'), 'application/vnd.ms-excel')
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate XLSX.'
    csvError.value = message
  }
  finally {
    xlsxDownloading.value = false
  }
}

// ── Visual export ─────────────────────────────────────────────────────────────

const { exportVisual } = useChartImageExport()
const visualExporting = ref(false)
const activeVisualFormat = ref<'png' | 'svg' | null>(null)
const visualExportError = ref<string | null>(null)

async function handleVisualExport(format: 'png' | 'svg') {
  if (visualExporting.value) return
  visualExporting.value = true
  activeVisualFormat.value = format
  visualExportError.value = null
  try {
    // Target the closest chart export root in the DOM.
    const root = document.querySelector<HTMLElement>('[data-chart-export-root]')
    if (!root) {
      throw new Error('No chart available to export. Navigate to a chart tab first.')
    }
    const slug = corridorSlug()
    await exportVisual(root, {
      format,
      filename: `remit-scout-${slug}-chart`,
      bgColor: variant.value === 'terminal' ? '#0a0a0a' : '#ffffff',
    })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Visual export failed.'
    visualExportError.value = message
  }
  finally {
    visualExporting.value = false
    activeVisualFormat.value = null
  }
}

// ── Embed code ────────────────────────────────────────────────────────────────

const showEmbedCode = ref(false)
const embedCopied = ref(false)

const embedCodeSnippet = computed(() => {
  const slug = corridorSlug()
  const amount = props.filters.amount
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://remit-scout.com'
  return `<iframe
  src="${base}/embed/pulse?corridor=${encodeURIComponent(slug)}&amount=${amount}"
  width="100%"
  height="400"
  frameborder="0"
  allowtransparency="true"
  title="Remit Scout — ${props.corridor?.label ?? slug}"
></iframe>`
})

async function copyEmbedCode() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(embedCodeSnippet.value)
    embedCopied.value = true
    setTimeout(() => {
      embedCopied.value = false
    }, 2000)
  }
  catch {
    // Clipboard write failed silently — user can still copy manually.
  }
}

// ── Compare href ──────────────────────────────────────────────────────────────

const compareHref = computed(() => {
  const slug = props.corridor?.slug ?? props.corridor?.value ?? ''
  if (!slug) return '/compare'
  return `/compare?corridor=${encodeURIComponent(slug)}`
})

// ── Style helpers ─────────────────────────────────────────────────────────────

const downloadCsvClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed',
)

const downloadXlsxClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed',
)

const visualExportClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed',
)

const enterpriseLinkClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'
    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
)
</script>
