<script setup lang="ts">
import { computed } from 'vue'
import type { DataTablePagination, DataTableVariant } from './types'

const props = withDefaults(
  defineProps<{
    pagination: DataTablePagination
    variant?: DataTableVariant
    pageWindow?: number
  }>(),
  {
    variant: 'consumer',
    pageWindow: 5,
  },
)

const emit = defineEmits<{
  (e: 'pageChange', nextPage: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.pagination.total / props.pagination.pageSize)))

const startRow = computed(() => (props.pagination.page - 1) * props.pagination.pageSize + 1)
const endRow = computed(() => Math.min(props.pagination.page * props.pagination.pageSize, props.pagination.total))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.pagination.page
  const windowSize = Math.max(3, props.pageWindow)

  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + windowSize - 1)

  start = Math.max(1, end - windowSize + 1)

  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const isTerminal = computed(() => props.variant === 'terminal')

const buttonClass = computed(() => {
  return isTerminal.value
    ? 'flex h-8 min-w-[2rem] items-center justify-center rounded border border-neutral-700 px-2 text-body-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
    : 'flex h-8 min-w-[2rem] items-center justify-center rounded border border-neutral-300 px-2 text-body-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'
})

function setPage(next: number) {
  if (next < 1 || next > totalPages.value) return
  emit('pageChange', next)
}
</script>

<template>
  <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div
      class="text-body-sm"
      :class="isTerminal ? 'text-neutral-400' : 'text-rs-muted'"
    >
      <template v-if="pagination.total === 0">
        Showing 0 rows
      </template>
      <template v-else>
        Showing {{ startRow }}–{{ endRow }} of {{ pagination.total }} rows
      </template>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        :class="buttonClass"
        :disabled="pagination.page <= 1"
        @click="setPage(pagination.page - 1)"
      >
        Prev
      </button>

      <button
        v-for="p in visiblePages"
        :key="p"
        type="button"
        class="flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-body-sm font-medium transition-colors"
        :class="[
          p === pagination.page
            ? (isTerminal ? 'bg-brand-600 text-white' : 'bg-neutral-900 text-white')
            : (isTerminal ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'text-neutral-700 hover:bg-neutral-50'),
        ]"
        @click="setPage(p)"
      >
        {{ p }}
      </button>

      <button
        type="button"
        :class="buttonClass"
        :disabled="pagination.page >= totalPages"
        @click="setPage(pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
