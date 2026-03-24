<template>
  <div class="space-y-6">
    <template v-if="density === 'light'">
      <RsSectionHeader
        title="Exports"
        description="Download corridor data and share chart views"
        icon-name="arrow-down-tray"
        :variant="variant"
      />

      <div
        class="rounded-2xl border p-8"
        :class="variant === 'terminal'
          ? 'border-blue-500/20 bg-neutral-900 text-white'
          : 'border-blue-200 bg-blue-50/70'"
      >
        <div class="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl"
            :class="variant === 'terminal' ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-600 text-white'"
          >
            <span
class="text-2xl"
aria-hidden="true"
>&#8595;</span>
          </div>
          <div>
            <p
              class="text-lg font-bold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              Exports are available on Pulse Plus
            </p>
            <p
              class="mt-2 text-body-sm leading-relaxed"
              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600'"
            >
              Pulse Plus includes downloadable corridor snapshots, chart image exports, and embeddable chart views for the routes you track.
            </p>
          </div>

          <ul class="grid grid-cols-1 gap-2 text-left text-body-sm sm:grid-cols-2">
            <li
              v-for="feature in lightUpgradeFeatures"
              :key="feature"
              class="flex items-center gap-2"
              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
            >
              <span
class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-500"
aria-hidden="true"
>&#10003;</span>
              {{ feature }}
            </li>
          </ul>

          <div class="flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              to="/pricing"
              class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
              :class="variant === 'terminal'
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'"
            >
              View Pulse Plus
            </NuxtLink>
            <NuxtLink
              to="/contact?type=enterprise&topic=exports"
              class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              :class="variant === 'terminal'
                ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'"
            >
              Talk to sales
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <RsSectionHeader
        title="Exports"
        description="Download corridor snapshots, export chart visuals, and share embeddable views"
        icon-name="arrow-down-tray"
        :variant="variant"
      />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div :class="[cardSurface, 'flex flex-col gap-4 p-5']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'"
            >
              <span
class="text-lg"
aria-hidden="true"
>&#8595;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Download snapshot
              </p>
              <p
                class="mt-0.5 text-body-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Export the current corridor view as CSV or spreadsheet-friendly XLSX.
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
              <span
v-if="csvDownloading"
class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
aria-hidden="true"
/>
              {{ csvDownloading ? 'Generating...' : 'CSV' }}
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="downloadXlsxClasses"
              :disabled="xlsxDownloading || !corridor"
              @click="handleXlsxDownload"
            >
              <span
v-if="xlsxDownloading"
class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
aria-hidden="true"
/>
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

        <div :class="[cardSurface, 'flex flex-col gap-4 p-5']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'"
            >
              <span
class="text-lg"
aria-hidden="true"
>&#9645;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Export visual
              </p>
              <p
                class="mt-0.5 text-body-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Save the active chart as a PNG or SVG for decks, docs, and client updates.
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
              <span
v-if="visualExporting && activeVisualFormat === 'png'"
class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
aria-hidden="true"
/>
              PNG
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="visualExportClasses"
              :disabled="visualExporting"
              @click="handleVisualExport('svg')"
            >
              <span
v-if="visualExporting && activeVisualFormat === 'svg'"
class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
aria-hidden="true"
/>
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

        <div :class="[cardSurface, 'flex flex-col gap-4 p-5']">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="variant === 'terminal' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'"
            >
              <span
class="text-lg"
aria-hidden="true"
>&lt;/&gt;</span>
            </div>
            <div>
              <p
                class="font-semibold"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                Embed chart view
              </p>
              <p
                class="mt-0.5 text-body-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                Copy an iframe snippet for the current corridor and benchmark setup.
              </p>
            </div>
          </div>
          <button
            class="inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            :class="variant === 'terminal'
              ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'"
            @click="showEmbedCode = !showEmbedCode"
          >
            {{ showEmbedCode ? 'Hide code' : 'Show embed code' }}
          </button>

          <div
            v-if="showEmbedCode"
            class="rounded-lg bg-neutral-900 p-3 font-mono text-xs text-emerald-400"
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

      <div
        :class="[cardSurface, 'flex flex-col gap-4 rounded-2xl border border-dashed p-5 lg:flex-row lg:items-center lg:justify-between']"
      >
        <div>
          <p
            class="font-semibold"
            :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
          >
            Need recurring delivery or licensed data access?
          </p>
          <p
            class="mt-1 text-body-sm leading-relaxed"
            :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-600'"
          >
            For scheduled reporting, historical extracts, or integration access, route the request through sales so we can scope it against the data we actually publish today.
          </p>
        </div>
        <NuxtLink
          to="/contact?type=enterprise&topic=exports"
          class="inline-flex w-fit items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          :class="variant === 'terminal'
            ? 'bg-blue-600 text-white hover:bg-blue-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'"
        >
          Contact sales
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CorridorOption, PulseDensity, PulseFilters } from '~/types/pulse'
import { getMarketSnapshot, getTableData } from '~/domains/pulse/infrastructure/pulseApi'
import { useChartImageExport } from '~/composables/useChartImageExport'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'

interface Props {
  density: PulseDensity
  corridor: CorridorOption | null
  filters: PulseFilters
}

const props = defineProps<Props>()

const { variant, cardSurface } = usePulseTheme()

const lightUpgradeFeatures = [
  'CSV and XLSX corridor snapshots',
  'PNG and SVG chart exports',
  'Embeddable chart views',
  'Historical delivery packs on request',
]

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
  const escape = (value: string) => (value.includes(',') || value.includes('"') || value.includes('\n'))
    ? `"${value.replace(/"/g, '""')}"`
    : value

  return [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\r\n')
}

function triggerTextDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function fetchSnapshotRows(): Promise<{ headers: string[], rows: string[][] }> {
  if (!props.corridor) {
    throw new Error('No corridor selected.')
  }

  try {
    const tableData = await getTableData('all-in-cost', props.filters, '30d', 1, 500)
    const headers = tableData.columns.map(column => column.label)
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
    const snapshot = await getMarketSnapshot({
      from: props.corridor.sourceCountry ?? props.corridor.fromCode ?? '',
      to: props.corridor.destCountry ?? props.corridor.toCode ?? '',
      fromCode: props.corridor.fromCode ?? '',
      toCode: props.corridor.toCode ?? '',
      fromFlag: props.corridor.fromFlag ?? '',
      toFlag: props.corridor.toFlag ?? '',
      label: props.corridor.label ?? '',
      slug: props.corridor.slug ?? props.corridor.value ?? '',
      corridorId: props.corridor.corridorId,
    }, props.filters.amount)

    const headers = ['Date', 'Provider', 'Recipient Gets', 'Currency', 'Fee', 'FX Markup (bps)', 'Speed']
    const date = new Date().toISOString().slice(0, 10)
    const rows = snapshot.quotes.map(quote => [
      date,
      quote.provider,
      String(quote.recipientGets),
      snapshot.currency,
      String(quote.fee),
      String(quote.markupBps),
      quote.speed,
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
    triggerTextDownload(rowsToCsv(headers, rows), buildFilename('csv'), 'text/csv;charset=utf-8;')
  }
  catch (error: unknown) {
    csvError.value = error instanceof Error ? error.message : 'Failed to generate CSV.'
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
    const content = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t')),
    ].join('\r\n')
    triggerTextDownload(content, buildFilename('xlsx'), 'application/vnd.ms-excel')
  }
  catch (error: unknown) {
    csvError.value = error instanceof Error ? error.message : 'Failed to generate XLSX.'
  }
  finally {
    xlsxDownloading.value = false
  }
}

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
    const root = document.querySelector<HTMLElement>('[data-chart-export-root]')
    if (!root) {
      throw new Error('No chart is available to export. Open a chart tab first.')
    }

    await exportVisual(root, {
      format,
      filename: `remit-scout-${corridorSlug()}-chart`,
      bgColor: variant.value === 'terminal' ? '#0f172a' : '#ffffff',
    })
  }
  catch (error: unknown) {
    visualExportError.value = error instanceof Error ? error.message : 'Visual export failed.'
  }
  finally {
    visualExporting.value = false
    activeVisualFormat.value = null
  }
}

const showEmbedCode = ref(false)
const embedCopied = ref(false)

const embedCodeSnippet = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://remit-scout.com'
  return `<iframe
  src="${base}/embed/pulse?corridor=${encodeURIComponent(corridorSlug())}&amount=${props.filters.amount}"
  width="100%"
  height="400"
  frameborder="0"
  allowtransparency="true"
  title="Remit-Scout Pulse — ${props.corridor?.label ?? corridorSlug()}"
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
    // Ignore clipboard errors and leave manual copy available.
  }
}

const downloadCsvClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-emerald-700 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50',
)

const downloadXlsxClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-neutral-800 text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50'
    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50',
)

const visualExportClasses = computed(() =>
  variant.value === 'terminal'
    ? 'bg-neutral-800 text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50'
    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50',
)
</script>
