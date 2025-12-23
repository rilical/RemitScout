<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="py-3 px-4 text-left text-sm font-semibold text-neutral-300 bg-neutral-800 sticky left-0">
            Provider
          </th>
          <th
            v-for="method in methods"
            :key="method.key"
            class="py-3 px-4 text-center text-sm font-semibold text-neutral-300 bg-neutral-800"
          >
            <div class="flex flex-col items-center gap-1">
              <component :is="method.icon" class="h-5 w-5 text-neutral-400" />
              <span>{{ method.label }}</span>
            </div>
          </th>
          <th class="py-3 px-4 text-center text-sm font-semibold text-neutral-300 bg-neutral-800">
            Speed
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.provider"
          class="border-t border-neutral-700 transition-colors hover:bg-neutral-700/50"
        >
          <td class="py-4 px-4 sticky left-0 bg-neutral-900">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-700">
                <span class="text-sm font-bold text-white">{{ row.provider.charAt(0) }}</span>
              </div>
              <span class="font-medium text-white">{{ row.provider }}</span>
            </div>
          </td>
          <td
            v-for="method in methods"
            :key="`${row.provider}-${method.key}`"
            class="py-4 px-4 text-center"
          >
            <div
              v-if="row[method.key as keyof typeof row]"
              class="flex items-center justify-center"
            >
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/20 text-brand-600">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <div v-else class="flex items-center justify-center">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-neutral-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </div>
          </td>
          <td class="py-4 px-4 text-center">
            <span class="inline-flex items-center justify-center gap-1 rounded-full bg-brand-600/10 px-3 py-1 text-xs font-medium text-brand-600 min-w-[110px]">
              <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ row.speed }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Summary -->
    <div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div
        v-for="method in methods"
        :key="`summary-${method.key}`"
        class="rounded-lg border border-neutral-700 bg-neutral-800 p-3"
      >
        <div class="text-2xl font-bold text-white">
          {{ getMethodCount(method.key) }}
        </div>
        <div class="text-xs text-neutral-400">
          providers support {{ method.label.toLowerCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import type { MethodCoverageRow } from '~/types/pulse'

interface Props {
  rows: MethodCoverageRow[]
}

const props = defineProps<Props>()

const BankIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
])

const CashIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' })
])

const WalletIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
])

const CardIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
])

const methods = computed(() => [
  { key: 'bank', label: 'Bank Transfer', icon: BankIcon },
  { key: 'cash', label: 'Cash Pickup', icon: CashIcon },
  { key: 'wallet', label: 'Mobile Wallet', icon: WalletIcon },
  { key: 'card', label: 'Card', icon: CardIcon },
])

function getMethodCount(methodKey: string): number {
  return props.rows.filter(row => row[methodKey as keyof MethodCoverageRow]).length
}
</script>



