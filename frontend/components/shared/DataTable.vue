<script setup lang="ts">
import { computed, useSlots } from 'vue'

type Row = Record<string, unknown>

export type DataTableVariant = 'terminal' | 'dashboard'

export type DataTableColumn = {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  widthClass?: string
  headerClass?: string
  cellClass?: string
  formatter?: (value: unknown, row: Row, rowIndex: number) => unknown
}

type Props = {
  variant?: DataTableVariant
  columns: DataTableColumn[]
  rows?: Row[]
  rowKey?: string | ((row: Row, rowIndex: number) => string | number)
  caption?: string
  loading?: boolean
  emptyText?: string
  rootClass?: string
  tableClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dashboard',
  rows: () => [],
  caption: undefined,
  loading: false,
  emptyText: 'No results',
  rootClass: undefined,
  tableClass: undefined,
  rowKey: 'id',
})

const slots = useSlots()

const variant = computed(() => props.variant)

const rootClasses = computed(() => {
  const base = 'w-full overflow-x-auto'
  const variant = props.variant === 'terminal'
    ? 'rounded-rs-md border border-rs-border bg-rs-surface'
    : 'rounded-rs-lg border border-rs-border bg-rs-surface'

  return [base, variant, props.rootClass].filter(Boolean).join(' ')
})

const tableClasses = computed(() => {
  const base = 'min-w-full table-auto text-rs-fg'
  const variant = props.variant === 'terminal' ? 'text-xs' : 'text-sm'
  return [base, variant, props.tableClass].filter(Boolean).join(' ')
})

function rowKeyFor(row: Row, rowIndex: number) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, rowIndex)

  const key = props.rowKey
  const candidate = key ? row[key] : undefined
  if (typeof candidate === 'string' || typeof candidate === 'number') return candidate
  return rowIndex
}

function alignClass(align: DataTableColumn['align']) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

function cellValue(column: DataTableColumn, row: Row, rowIndex: number) {
  const value = row[column.key]
  if (column.formatter) return column.formatter(value, row, rowIndex)
  if (value === null || value === undefined) return ''
  return String(value)
}

function hasSlot(name: string) {
  return Boolean(slots[name])
}
</script>

<template>
  <div :class="rootClasses" data-testid="data-table-root">
    <table
      :class="tableClasses"
      :aria-busy="loading ? 'true' : 'false'"
      data-testid="data-table"
    >
      <caption v-if="caption" class="sr-only">{{ caption }}</caption>

      <thead class="border-b border-rs-border bg-neutral-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="whitespace-nowrap font-medium text-rs-muted"
            :class="[
              variant === 'terminal' ? 'px-3 py-2' : 'px-4 py-3',
              alignClass(column.align),
              column.widthClass,
              column.headerClass,
            ]"
          >
            <slot
              v-if="hasSlot(`header-${column.key}`)"
              :name="`header-${column.key}`"
              :column="column"
            />
            <template v-else>
              {{ column.header }}
            </template>
          </th>
        </tr>
      </thead>

      <tbody v-if="loading" class="divide-y divide-rs-border">
        <tr>
          <td
            :colspan="Math.max(columns.length, 1)"
            class="px-4 py-6 text-rs-muted"
            :class="variant === 'terminal' ? 'text-xs' : 'text-sm'"
          >
            <slot name="loading">
              <span role="status" aria-live="polite">Loading…</span>
            </slot>
          </td>
        </tr>
      </tbody>

      <tbody
        v-else-if="rows.length === 0"
        class="divide-y divide-rs-border"
      >
        <tr>
          <td
            :colspan="Math.max(columns.length, 1)"
            class="px-4 py-6 text-rs-muted"
            :class="variant === 'terminal' ? 'text-xs' : 'text-sm'"
          >
            <slot name="empty" :empty-text="emptyText">
              {{ emptyText }}
            </slot>
          </td>
        </tr>
      </tbody>

      <tbody v-else class="divide-y divide-rs-border">
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowKeyFor(row, rowIndex)"
          class="hover:bg-neutral-50"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="whitespace-nowrap"
            :class="[
              variant === 'terminal' ? 'px-3 py-2' : 'px-4 py-3',
              alignClass(column.align),
              column.widthClass,
              column.cellClass,
            ]"
          >
            <slot
              v-if="hasSlot(`cell-${column.key}`)"
              :name="`cell-${column.key}`"
              :row="row"
              :row-index="rowIndex"
              :column="column"
              :value="row[column.key]"
            />
            <template v-else>
              {{ cellValue(column, row, rowIndex) }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
