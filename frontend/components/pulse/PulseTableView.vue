<template>
  <div>
    <DataTable
      variant="terminal"
      caption="Pulse chart table"
      :columns="columns"
      :rows="displayRows"
      :row-key="rowKey"
      :loading="loading"
      :error="errorState"
      :empty="{ title: 'No rows yet', message: 'No data is available for this filter and time range.' }"
      :sort="{ key: sortKey, direction: sortDirection }"
      :on-sort-change="onSortChange"
    >
      <template #cell-timestamp="{ row }">
        <span class="text-neutral-200">{{ formatTimestamp((row as TableRow).timestamp) }}</span>
      </template>

      <template #cell-provider="{ row }">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded bg-neutral-700 text-body-sm font-bold text-white">
            {{ (row as TableRow).provider.charAt(0) }}
          </div>
          <span class="text-body-sm font-medium text-white">{{ (row as TableRow).provider }}</span>
        </div>
      </template>

      <template #cell-deliveredAmount="{ row }">
        <span class="text-brand-600 font-semibold">
          {{ formatCurrency((row as TableRow).deliveredAmount, (row as TableRow).deliveredCurrency) }}
        </span>
      </template>

      <template #cell-fee="{ row }">
        <span class="text-neutral-200">
          {{ formatCurrency((row as TableRow).fee, (row as TableRow).feeCurrency) }}
        </span>
      </template>

      <template #cell-rate="{ row }">
        <span class="text-neutral-200">{{ formatRate((row as TableRow).rate) }}</span>
      </template>

      <template #cell-markupBps="{ row }">
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-body-sm font-medium"
          :class="getMarkupClass((row as TableRow).markupBps)"
        >
          {{ (row as TableRow).markupBps }} bps
        </span>
      </template>

      <template #cell-provenance="{ row }">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-sm font-medium"
          :class="getProvenanceClass((row as TableRow).provenance)"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="getProvenanceDotClass((row as TableRow).provenance)"
          />
          {{ (row as TableRow).provenance }}
        </span>
      </template>
    </DataTable>

    <!-- Pagination & Export -->
    <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Row info -->
      <div class="text-body-sm text-neutral-400">
        Showing {{ startRow }}–{{ endRow }} of {{ totalRows }} rows
        <span
          v-if="!isPlus && totalRows > freeRowLimit"
          class="text-brand-600"
        >
          ({{ freeRowLimit }} free limit)
        </span>
      </div>

      <!-- Pagination -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="currentPage--"
        >
          <Icon
            name="chevron-left"
            :size="16"
            class="text-current"
          />
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-body-sm font-medium transition-colors"
            :class="page === currentPage ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage >= totalPages"
          aria-label="Next page"
          @click="currentPage++"
        >
          <Icon
            name="chevron-right"
            :size="16"
            class="text-current"
          />
        </button>
      </div>

      <!-- Export -->
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm font-medium transition-colors"
        :class="isPlus ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'"
        :disabled="!isPlus"
        @click="isPlus && exportCsv()"
      >
        <Icon
          name="arrow-down-tray"
          :size="16"
          class="text-current"
        />
        Export CSV
        <Icon
          v-if="!isPlus"
          name="lock"
          :size="16"
          class="text-current"
        />
      </button>
    </div>

    <!-- Plus upsell -->
    <div
      v-if="!isPlus && totalRows > freeRowLimit"
      class="mt-4 rounded-lg border border-brand-600/30 bg-brand-600/10 p-4"
    >
      <div class="flex items-start gap-3">
        <Icon
          name="lock"
          :size="20"
          class="text-brand-600 flex-shrink-0 mt-0.5"
        />
        <div>
          <p class="font-semibold text-brand-600">
            Unlock full history with Plus
          </p>
          <p class="mt-1 text-body-sm text-neutral-400">
            Get access to 90 days of data, full table access, and CSV export.
          </p>
          <NuxtLink
            to="/plus"
            class="mt-2 inline-flex items-center gap-1 text-body-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Learn more about Plus
            <Icon
              name="chevron-right"
              :size="16"
              class="text-current"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { TableData, TableRow, PulseFilters, TimeRange } from '~/types/pulse'
import { getTableData, formatCurrency as formatCurrencyUtil } from '~/lib/pulseApi'
import { DataTable, Icon } from '~/ui'
import type { DataTableColumn, DataTableSort } from '~/ui'
import { formatNumber, formatShortDateTime } from '~/shared/lib/format'

interface Props {
  chartId: string
  filters: PulseFilters
  range: TimeRange
  isPlus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlus: false,
})

const loading = ref(true)
const tableData = ref<TableData | null>(null)
const errorMessage = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 20
const freeRowLimit = 50
const sortKey = ref<keyof TableRow>('timestamp')
const sortDirection = ref<'asc' | 'desc'>('desc')

const columns = computed<DataTableColumn[]>(() => [
  { key: 'timestamp', label: 'Timestamp', sortable: true, align: 'left' },
  { key: 'provider', label: 'Provider', sortable: true, align: 'left' },
  { key: 'deliveredAmount', label: 'Delivered', sortable: true, align: 'right' },
  { key: 'fee', label: 'Fee', sortable: true, align: 'right' },
  { key: 'rate', label: 'Rate', sortable: true, align: 'right' },
  { key: 'markupBps', label: 'Markup', sortable: true, align: 'right' },
  { key: 'provenance', label: 'Source', sortable: false, align: 'center' },
])

const totalRows = computed(() => {
  const total = tableData.value?.totalRows ?? 0
  return props.isPlus ? total : Math.min(total, freeRowLimit)
})

const totalPages = computed(() => Math.ceil(totalRows.value / pageSize))

const startRow = computed(() => (currentPage.value - 1) * pageSize + 1)
const endRow = computed(() => Math.min(currentPage.value * pageSize, totalRows.value))

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  if (current <= 3) end = Math.min(5, total)
  if (current >= total - 2) start = Math.max(1, total - 4)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const displayRows = computed(() => {
  if (!tableData.value) return []

  const rows = [...tableData.value.rows]

  if (sortKey.value) {
    rows.sort((a, b) => {
      const aVal = a[sortKey.value]
      const bVal = b[sortKey.value]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDirection.value === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }

  return rows
})

async function loadData() {
  loading.value = true
  errorMessage.value = null
  try {
    tableData.value = await getTableData(
      props.chartId,
      props.filters,
      props.range,
      currentPage.value,
      pageSize,
    )
  }
  catch (e) {
    useLogger('PulseTableView').error('Failed to load table data', e)
    errorMessage.value = 'Failed to load table data. Please try again.'
  }
  finally {
    loading.value = false
  }
}

function onSortChange(next: DataTableSort) {
  sortKey.value = next.key as keyof TableRow
  sortDirection.value = next.direction
}

function formatTimestamp(ts: number): string {
  return formatShortDateTime(new Date(ts), { locale: 'en-US' })
}

function formatCurrency(value: number, currency: string): string {
  return formatCurrencyUtil(value, currency)
}

function formatRate(value: number): string {
  return formatNumber(value, { locale: 'en-US', minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

const errorState = computed(() => {
  if (!errorMessage.value) return null
  return { title: 'Could not load rows', message: errorMessage.value }
})

const rowKey = (row: unknown, rowIndex: number) => {
  const r = row as Partial<TableRow>
  return `${String(r.timestamp ?? 't')}:${String(r.provider ?? 'p')}:${rowIndex}`
}

function getMarkupClass(bps: number): string {
  if (bps < 50) return 'bg-brand-600/20 text-brand-600'
  if (bps < 100) return 'bg-brand-600/20 text-brand-600'
  if (bps < 150) return 'bg-neutral-600/20 text-neutral-400'
  return 'bg-danger-600/20 text-danger-600'
}

function getProvenanceClass(provenance: string): string {
  switch (provenance) {
    case 'verified':
      return 'bg-brand-600/20 text-brand-600'
    case 'observed':
      return 'bg-neutral-600/20 text-neutral-400'
    case 'estimated':
      return 'bg-neutral-700/50 text-neutral-500'
    default:
      return 'bg-neutral-700/50 text-neutral-500'
  }
}

function getProvenanceDotClass(provenance: string): string {
  switch (provenance) {
    case 'verified':
      return 'bg-brand-600'
    case 'observed':
      return 'bg-neutral-400'
    case 'estimated':
      return 'bg-neutral-500'
    default:
      return 'bg-neutral-500'
  }
}

function exportCsv() {
  if (!tableData.value) return

  const headers = columns.value.map(c => c.label).join(',')
  const rows = tableData.value.rows.map(row =>
    [
      new Date(row.timestamp).toISOString(),
      row.provider,
      row.deliveredAmount,
      row.fee,
      row.rate,
      row.markupBps,
      row.provenance,
    ].join(','),
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pulse-${props.chartId}-${props.range}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch([() => props.chartId, () => props.filters, () => props.range, currentPage], loadData, { deep: true })

onMounted(loadData)
</script>
