<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DataTableColumn, DataTablePagination, DataTableSort, DataTableVariant } from './types'
import { getProviderLogoPath } from '~/composables/useProviderLogo'

interface Props {
  // DataTable props (forwarded)
  variant?: DataTableVariant
  caption?: string
  columns: DataTableColumn[]
  rows: unknown[]
  rowKey: (row: unknown, rowIndex: number) => string
  loading?: boolean
  error?: { title?: string, message: string } | null
  empty?: { title: string, message?: string } | null
  sort?: DataTableSort | null
  onSortChange?: ((next: DataTableSort) => void) | null
  pagination?: DataTablePagination | null
  onPageChange?: ((nextPage: number) => void) | null

  // RsPulseTable-specific props
  providerColumn?: string
  filterableColumns?: string[]
  filters?: Record<string, string>
  highlightBest?: { column: string, direction: 'min' | 'max' }
  highlightWorst?: { column: string, direction: 'min' | 'max' }
  stickyHeader?: boolean
  dense?: boolean
  maxRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'consumer',
  caption: undefined,
  loading: false,
  error: null,
  empty: null,
  sort: null,
  onSortChange: null,
  pagination: null,
  onPageChange: null,
  providerColumn: undefined,
  filterableColumns: () => [],
  filters: () => ({}),
  highlightBest: undefined,
  highlightWorst: undefined,
  stickyHeader: false,
  dense: false,
  maxRows: undefined,
})

const emit = defineEmits<{
  'filter-change': [filters: Record<string, string>]
  'sort-change': [sort: DataTableSort]
  'page-change': [page: number]
}>()

const showAll = ref(false)

const visibleRows = computed(() => {
  if (props.maxRows === undefined || showAll.value) {
    return props.rows
  }
  return props.rows.slice(0, props.maxRows)
})

const hiddenRowCount = computed(() => {
  if (props.maxRows === undefined) return 0
  return Math.max(0, props.rows.length - props.maxRows)
})

const showExpandButton = computed(() =>
  props.maxRows !== undefined && !showAll.value && hiddenRowCount.value > 0,
)

function getValue(row: unknown, key: string): unknown {
  if (!row || typeof row !== 'object') return undefined
  return (row as Record<string, unknown>)[key]
}

function toComparableNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
  }
  return Number.NEGATIVE_INFINITY
}

const bestRowKey = computed(() => {
  if (!props.highlightBest || props.rows.length === 0) return null
  const { column, direction } = props.highlightBest
  let bestRow: unknown = null
  let bestVal = direction === 'min' ? Infinity : Number.NEGATIVE_INFINITY

  for (let i = 0; i < props.rows.length; i++) {
    const row = props.rows[i]
    const val = toComparableNumber(getValue(row, column))
    if (direction === 'min' ? val < bestVal : val > bestVal) {
      bestVal = val
      bestRow = row
    }
  }
  return bestRow ? props.rowKey(bestRow, props.rows.indexOf(bestRow)) : null
})

const worstRowKey = computed(() => {
  if (!props.highlightWorst || props.rows.length === 0) return null
  const { column, direction } = props.highlightWorst
  let worstRow: unknown = null
  let worstVal = direction === 'min' ? Number.NEGATIVE_INFINITY : Infinity

  for (let i = 0; i < props.rows.length; i++) {
    const row = props.rows[i]
    const val = toComparableNumber(getValue(row, column))
    if (direction === 'min' ? val > worstVal : val < worstVal) {
      worstVal = val
      worstRow = row
    }
  }
  return worstRow ? props.rowKey(worstRow, props.rows.indexOf(worstRow)) : null
})

function rowExtraClass(row: unknown, rowIndex: number): string {
  const key = props.rowKey(row, rowIndex)
  if (key === bestRowKey.value) return 'border-l-2 border-emerald-500'
  if (key === worstRowKey.value) return 'border-l-2 border-red-500'
  return ''
}

function isBestRow(row: unknown, rowIndex: number): boolean {
  return props.rowKey(row, rowIndex) === bestRowKey.value
}

function isWorstRow(row: unknown, rowIndex: number): boolean {
  return props.rowKey(row, rowIndex) === worstRowKey.value
}

function isHighlightedColumn(column: DataTableColumn): boolean {
  return (
    props.highlightBest?.column === column.key
    || props.highlightWorst?.column === column.key
  )
}

function cellValueClass(row: unknown, rowIndex: number, column: DataTableColumn): string {
  if (!isHighlightedColumn(column)) return ''
  if (isBestRow(row, rowIndex)) return 'font-bold'
  if (isWorstRow(row, rowIndex)) return 'text-neutral-400 opacity-70'
  return ''
}

const isTerminal = computed(() => props.variant === 'terminal')

const theadStickyClass = computed(() =>
  props.stickyHeader ? 'sticky top-0 z-10' : '',
)

const denseTdClass = computed(() =>
  props.dense ? 'py-1.5 px-3' : '',
)

// Augment columns with widthClass overrides for dense mode (passed through)
const effectiveColumns = computed<DataTableColumn[]>(() => {
  if (!props.dense) return props.columns
  return props.columns.map(col => ({
    ...col,
    widthClass: col.widthClass ?? '',
  }))
})

function onSortChangeHandler(next: DataTableSort) {
  emit('sort-change', next)
  props.onSortChange?.(next)
}

function onPageChangeHandler(page: number) {
  emit('page-change', page)
  props.onPageChange?.(page)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}
</script>

<template>
  <div class="rs-pulse-table">
    <!-- Sticky header override wrapper when stickyHeader is set -->
    <div
      :class="[
        'w-full',
        isTerminal ? 'rounded-lg border border-neutral-700 bg-neutral-900' : 'rounded-xl border border-rs-border bg-surface',
      ]"
    >
      <div class="overflow-x-auto">
        <table
          class="w-full border-collapse text-body-sm"
          :aria-busy="loading ? 'true' : undefined"
        >
          <caption
            v-if="caption"
            class="sr-only"
          >
            {{ caption }}
          </caption>

          <!-- thead with optional sticky -->
          <thead
            :class="[
              isTerminal ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-rs-muted',
              theadStickyClass,
            ]"
          >
            <tr>
              <th
                v-for="col in effectiveColumns"
                :key="col.key"
                scope="col"
                :class="[
                  isTerminal
                    ? 'px-4 py-3 text-body-sm font-semibold uppercase tracking-wider'
                    : 'px-4 py-3 text-body-sm font-semibold uppercase tracking-wider',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.widthClass ?? '',
                  col.sortable && onSortChange
                    ? isTerminal ? 'cursor-pointer hover:bg-neutral-700' : 'cursor-pointer hover:bg-neutral-100'
                    : '',
                ]"
                @click="col.sortable && onSortChangeHandler({ key: col.key, direction: sort?.key === col.key && sort.direction === 'asc' ? 'desc' : 'asc' })"
              >
                <div
                  class="flex items-center gap-1"
                  :class="col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''"
                >
                  <slot
                    v-if="$slots[`header-${col.key}`]"
                    :name="`header-${col.key}`"
                    :column="col"
                  />
                  <template v-else>
                    {{ col.label }}
                  </template>

                  <span
                    v-if="col.sortable && onSortChange"
                    class="text-[10px]"
                    :class="isTerminal ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    <template v-if="sort?.key === col.key">
                      {{ sort.direction === 'asc' ? '▲' : '▼' }}
                    </template>
                    <template v-else>
                      ↕
                    </template>
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Error state -->
            <tr v-if="error">
              <td :colspan="effectiveColumns.length">
                <slot name="error">
                  <div
                    class="p-4 text-body-sm"
                    :class="isTerminal ? 'text-red-400' : 'text-red-600'"
                  >
                    <strong v-if="error.title">{{ error.title }}: </strong>{{ error.message }}
                  </div>
                </slot>
              </td>
            </tr>

            <!-- Loading state -->
            <tr v-else-if="loading">
              <td :colspan="effectiveColumns.length">
                <slot name="loading">
                  <div
                    class="p-8 text-center text-body-sm"
                    :class="isTerminal ? 'text-neutral-400' : 'text-neutral-500'"
                  >
                    Loading...
                  </div>
                </slot>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="visibleRows.length === 0">
              <td :colspan="effectiveColumns.length">
                <slot name="empty">
                  <div
                    class="p-8 text-center text-body-sm"
                    :class="isTerminal ? 'text-neutral-400' : 'text-neutral-500'"
                  >
                    {{ empty?.title ?? 'No results' }}
                    <p
                      v-if="empty?.message"
                      class="mt-1 text-xs opacity-70"
                    >
                      {{ empty.message }}
                    </p>
                  </div>
                </slot>
              </td>
            </tr>

            <!-- Data rows -->
            <template v-else>
              <tr
                v-for="(row, rowIndex) in visibleRows"
                :key="rowKey(row, rowIndex)"
                :class="[
                  isTerminal
                    ? 'border-t border-neutral-700 transition-colors hover:bg-neutral-800/60'
                    : 'border-t border-rs-border transition-colors hover:bg-neutral-50',
                  rowExtraClass(row, rowIndex),
                ]"
              >
                <td
                  v-for="col in effectiveColumns"
                  :key="`${rowKey(row, rowIndex)}:${col.key}`"
                  :class="[
                    dense ? denseTdClass : isTerminal ? 'px-4 py-3' : 'px-4 py-3',
                    'text-body-sm',
                    isTerminal ? 'text-neutral-200' : 'text-neutral-700',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.widthClass ?? '',
                  ]"
                >
                  <!-- Provider logo column slot -->
                  <template v-if="col.key === providerColumn">
                    <slot
                      v-if="$slots[`cell-${col.key}`]"
                      :name="`cell-${col.key}`"
                      :row="row"
                      :column="col"
                      :value="getValue(row, col.key)"
                    />
                    <div
                      v-else
                      class="flex items-center gap-2"
                    >
                      <img
                        :src="getProviderLogoPath(formatValue(getValue(row, col.key)))"
                        :alt="formatValue(getValue(row, col.key))"
                        width="24"
                        height="24"
                        class="w-6 h-6 object-contain flex-shrink-0"
                        loading="lazy"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      >
                      <span :class="cellValueClass(row, rowIndex, col)">
                        {{ formatValue(getValue(row, col.key)) }}
                      </span>
                    </div>
                  </template>

                  <!-- Custom cell slot -->
                  <slot
                    v-else-if="$slots[`cell-${col.key}`]"
                    :name="`cell-${col.key}`"
                    :row="row"
                    :column="col"
                    :value="getValue(row, col.key)"
                  />

                  <!-- Row actions slot -->
                  <slot
                    v-else-if="col.key === 'actions' && $slots['row-actions']"
                    name="row-actions"
                    :row="row"
                  />

                  <!-- Default cell rendering with highlight support -->
                  <span
                    v-else
                    :class="cellValueClass(row, rowIndex, col)"
                  >
                    {{ formatValue(getValue(row, col.key)) }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination && onPageChange && visibleRows.length > 0"
        class="px-4 pb-4"
      >
        <slot name="pagination">
          <!-- DataTable's pagination component is used inline here via forwarding -->
          <div
            class="flex items-center justify-between pt-3 text-body-sm"
            :class="isTerminal ? 'text-neutral-400' : 'text-neutral-500'"
          >
            <span>
              Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.pageSize) }}
              &mdash; {{ pagination.total }} total
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="pagination.page <= 1"
                class="px-3 py-1 rounded text-body-sm disabled:opacity-40 transition-colors"
                :class="isTerminal ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'"
                @click="onPageChangeHandler(pagination.page - 1)"
              >
                Prev
              </button>
              <button
                type="button"
                :disabled="pagination.page >= Math.ceil(pagination.total / pagination.pageSize)"
                class="px-3 py-1 rounded text-body-sm disabled:opacity-40 transition-colors"
                :class="isTerminal ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'"
                @click="onPageChangeHandler(pagination.page + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- Show all rows button -->
    <div
      v-if="showExpandButton"
      class="mt-3 flex justify-center"
    >
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-body-sm font-medium transition-colors"
        :class="isTerminal
          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200'"
        @click="showAll = true"
      >
        Show all {{ rows.length }} rows
      </button>
    </div>
  </div>
</template>
