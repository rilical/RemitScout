<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { EmptyState, ErrorState, LoadingState } from '../states'
import type { DataTableAlign, DataTableColumn, DataTablePagination, DataTableSort, DataTableVariant } from './types'
import DataTablePaginationView from './DataTablePagination.vue'

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    variant: 'consumer',
    caption: undefined,
    loading: false,
    error: null,
    empty: null,
    sort: null,
    onSortChange: null,
    pagination: null,
    onPageChange: null,
  },
)

const slots = useSlots()
const isTerminal = computed(() => props.variant === 'terminal')

const tableClass = computed(() => {
  return isTerminal.value
    ? 'w-full border-collapse text-sm'
    : 'w-full border-collapse text-sm'
})

const theadClass = computed(() => {
  return isTerminal.value
    ? 'bg-neutral-800 text-neutral-400'
    : 'bg-slate-50 text-slate-600'
})

const thBaseClass = computed(() => {
  return isTerminal.value
    ? 'px-4 py-3 text-xs font-semibold uppercase tracking-wider'
    : 'px-4 py-3 text-xs font-semibold uppercase tracking-wider'
})

const trHoverClass = computed(() => {
  return isTerminal.value
    ? 'border-t border-neutral-700 transition-colors hover:bg-neutral-800/60'
    : 'border-t border-slate-200 transition-colors hover:bg-slate-50'
})

const tdBaseClass = computed(() => {
  return isTerminal.value
    ? 'px-4 py-3 text-sm text-neutral-200'
    : 'px-4 py-3 text-sm text-slate-700'
})

function alignClass(align?: DataTableAlign): string {
  switch (align) {
    case 'right':
      return 'text-right'
    case 'center':
      return 'text-center'
    default:
      return 'text-left'
  }
}

function sortableClass(column: DataTableColumn): string {
  if (!column.sortable || !props.onSortChange) return ''
  return isTerminal.value ? 'cursor-pointer hover:bg-neutral-700' : 'cursor-pointer hover:bg-slate-100'
}

function thClass(column: DataTableColumn): string {
  return [thBaseClass.value, alignClass(column.align), column.widthClass, sortableClass(column)].filter(Boolean).join(' ')
}

function tdClass(column: DataTableColumn): string {
  return [tdBaseClass.value, alignClass(column.align), column.widthClass].filter(Boolean).join(' ')
}

function getValue(row: unknown, column: DataTableColumn): unknown {
  if (!row || typeof row !== 'object') return undefined
  return (row as any)[column.key]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return String(value)
}

function nextSortFor(columnKey: string): DataTableSort {
  if (!props.sort || props.sort.key !== columnKey) return { key: columnKey, direction: 'desc' }
  return {
    key: columnKey,
    direction: props.sort.direction === 'asc' ? 'desc' : 'asc',
  }
}

function onHeaderClick(column: DataTableColumn) {
  if (!column.sortable || !props.onSortChange) return
  props.onSortChange(nextSortFor(column.key))
}
</script>

<template>
  <section
    class="w-full"
    :class="isTerminal ? 'rounded-lg border border-neutral-700 bg-neutral-900' : 'rounded-xl border border-slate-200 bg-white'"
  >
    <div class="overflow-x-auto">
      <table
        :class="tableClass"
        :aria-busy="loading ? 'true' : undefined"
      >
        <caption
          v-if="caption"
          class="sr-only"
        >
          {{ caption }}
        </caption>

        <thead :class="theadClass">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :class="thClass(col)"
              @click="onHeaderClick(col)"
            >
              <div
                class="flex items-center gap-1"
                :class="col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''"
              >
                <slot
                  v-if="slots[`header-${col.key}`]"
                  :name="`header-${col.key}`"
                  :column="col"
                />
                <template v-else>
                  {{ col.label }}
                </template>

                <span
                  v-if="col.sortable && onSortChange"
                  class="text-[10px]"
                  :class="isTerminal ? 'text-neutral-500' : 'text-slate-400'"
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
          <tr v-if="error">
            <td :colspan="columns.length">
              <slot name="error">
                <div class="p-4">
                  <ErrorState
                    :title="error.title"
                    :message="error.message"
                    :variant="variant"
                  />
                </div>
              </slot>
            </td>
          </tr>

          <tr v-else-if="loading">
            <td :colspan="columns.length">
              <slot name="loading">
                <div class="p-4">
                  <LoadingState :variant="variant" />
                </div>
              </slot>
            </td>
          </tr>

          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length">
              <slot name="empty">
                <div class="p-4">
                  <EmptyState
                    :title="empty?.title ?? 'No results'"
                    :message="empty?.message"
                    :variant="variant"
                  />
                </div>
              </slot>
            </td>
          </tr>

          <template v-else>
            <tr
              v-for="(row, rowIndex) in rows"
              :key="rowKey(row, rowIndex)"
              :class="trHoverClass"
            >
              <td
                v-for="col in columns"
                :key="`${rowKey(row, rowIndex)}:${col.key}`"
                :class="tdClass(col)"
              >
                <slot
                  v-if="slots[`cell-${col.key}`]"
                  :name="`cell-${col.key}`"
                  :row="row"
                  :column="col"
                  :value="getValue(row, col)"
                />
                <slot
                  v-else-if="col.key === 'actions' && slots['row-actions']"
                  name="row-actions"
                  :row="row"
                />
                <template v-else>
                  {{ formatValue(getValue(row, col)) }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div
      v-if="pagination && onPageChange && rows.length > 0"
      class="px-4 pb-4"
    >
      <DataTablePaginationView
        :pagination="pagination"
        :variant="variant"
        @page-change="onPageChange"
      />
    </div>
  </section>
</template>
