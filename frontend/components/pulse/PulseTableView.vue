<template>
  <div>
    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-neutral-700">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-neutral-800">
            <th
              v-for="col in columns"
              :key="col.key"
              class="py-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors"
              :class="[
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.sortable ? 'cursor-pointer hover:bg-neutral-700' : ''
              ]"
              @click="col.sortable && toggleSort(col.key)"
            >
              <div class="flex items-center gap-1" :class="col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''">
                <span class="text-neutral-400">{{ col.label }}</span>
                <svg
                  v-if="col.sortable"
                  class="h-4 w-4 text-neutral-500"
                  :class="{ 'text-brand-600': sortKey === col.key }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="sortKey === col.key && sortDirection === 'asc'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                  <path
                    v-else-if="sortKey === col.key && sortDirection === 'desc'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in displayRows"
            :key="idx"
            class="border-t border-neutral-700 transition-colors hover:bg-neutral-700/50"
          >
            <td class="py-3 px-4 text-sm text-neutral-300">
              {{ formatTimestamp(row.timestamp) }}
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded bg-neutral-700 text-xs font-bold text-white">
                  {{ row.provider.charAt(0) }}
                </div>
                <span class="text-sm font-medium text-white">{{ row.provider }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-right text-sm font-semibold text-brand-600">
              {{ formatCurrency(row.deliveredAmount, row.deliveredCurrency) }}
            </td>
            <td class="py-3 px-4 text-right text-sm text-neutral-300">
              {{ formatCurrency(row.fee, row.feeCurrency) }}
            </td>
            <td class="py-3 px-4 text-right text-sm text-neutral-300">
              {{ row.rate.toFixed(4) }}
            </td>
            <td class="py-3 px-4 text-right">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="getMarkupClass(row.markupBps)"
              >
                {{ row.markupBps }} bps
              </span>
            </td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="getProvenanceClass(row.provenance)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="getProvenanceDotClass(row.provenance)" />
                {{ row.provenance }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination & Export -->
    <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Row info -->
      <div class="text-sm text-neutral-400">
        Showing {{ startRow }}–{{ endRow }} of {{ totalRows }} rows
        <span v-if="!isPlus && totalRows > freeRowLimit" class="text-brand-600">
          ({{ freeRowLimit }} free limit)
        </span>
      </div>

      <!-- Pagination -->
      <div class="flex items-center gap-2">
        <button
          class="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium transition-colors"
            :class="page === currentPage ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Export -->
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="isPlus ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'"
        :disabled="!isPlus"
        @click="isPlus && exportCsv()"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
        <svg v-if="!isPlus" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>
    </div>

    <!-- Plus upsell -->
    <div
      v-if="!isPlus && totalRows > freeRowLimit"
      class="mt-4 rounded-lg border border-brand-600/30 bg-brand-600/10 p-4"
    >
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p class="font-semibold text-brand-600">Unlock full history with Plus</p>
          <p class="mt-1 text-sm text-neutral-400">
            Get access to 365 days of data, unlimited rows, and CSV export.
          </p>
          <NuxtLink
            to="/plus"
            class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Learn more
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { TableData, TableRow, TableColumn, PulseFilters, TimeRange } from '~/types/pulse'
import { getTableData, formatCurrency as formatCurrencyUtil } from '~/lib/pulseMockApi'

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
const currentPage = ref(1)
const pageSize = 20
const freeRowLimit = 50
const sortKey = ref<keyof TableRow>('timestamp')
const sortDirection = ref<'asc' | 'desc'>('desc')

const columns = computed<TableColumn[]>(() => [
  { key: 'timestamp', label: 'Timestamp', sortable: true, align: 'left', format: 'date' },
  { key: 'provider', label: 'Provider', sortable: true, align: 'left' },
  { key: 'deliveredAmount', label: 'Delivered', sortable: true, align: 'right', format: 'currency' },
  { key: 'fee', label: 'Fee', sortable: true, align: 'right', format: 'currency' },
  { key: 'rate', label: 'Rate', sortable: true, align: 'right', format: 'number' },
  { key: 'markupBps', label: 'Markup', sortable: true, align: 'right', format: 'bps' },
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
  
  let rows = [...tableData.value.rows]
  
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
  try {
    tableData.value = await getTableData(
      props.chartId,
      props.filters,
      props.range,
      currentPage.value,
      pageSize
    )
  } catch (e) {
    console.error('Failed to load table data:', e)
  } finally {
    loading.value = false
  }
}

function toggleSort(key: keyof TableRow) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'desc'
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCurrency(value: number, currency: string): string {
  return formatCurrencyUtil(value, currency)
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
    ].join(',')
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



