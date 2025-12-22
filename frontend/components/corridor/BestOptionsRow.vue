<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <button
      v-for="option in options"
      :key="option.type"
      type="button"
      class="group relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md"
      :class="[
        option.type === 'value' 
          ? 'border-emerald-400 bg-emerald-50 hover:border-emerald-500' 
          : 'border-slate-200 bg-white hover:border-brand-300'
      ]"
      @click="$emit('select', option.providerId)"
    >
      <div class="flex items-start justify-between mb-2">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="[
            option.type === 'value' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-100 text-slate-700'
          ]"
        >
          <component :is="getIcon(option.type)" class="w-3 h-3" />
          {{ option.label }}
        </span>
        <span class="text-xs text-slate-500">{{ option.score }}/10</span>
      </div>

      <div class="mb-1">
        <span class="text-lg font-bold text-slate-900">{{ option.provider }}</span>
      </div>

      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-xl font-bold" :class="option.type === 'value' ? 'text-emerald-600' : 'text-brand-600'">
          {{ option.recipientGets }}
        </span>
        <span class="text-sm text-slate-500">{{ option.currency }}</span>
      </div>

      <div class="flex items-center gap-3 text-xs text-slate-500">
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ option.speed }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ option.fee }}
        </span>
      </div>

      <div class="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

export interface BestOption {
  type: 'value' | 'fastest' | 'cash'
  label: string
  provider: string
  providerId: string
  recipientGets: string
  currency: string
  speed: string
  fee: string
  score: string
}

const props = defineProps<{
  bestValue?: BestOption
  fastest?: BestOption
  bestCash?: BestOption
}>()

defineEmits<{
  select: [providerId: string]
}>()

const options = computed(() => {
  const items: BestOption[] = []
  
  if (props.bestValue) {
    items.push({ ...props.bestValue, type: 'value', label: 'Best value' })
  }
  if (props.fastest) {
    items.push({ ...props.fastest, type: 'fastest', label: 'Fastest' })
  }
  if (props.bestCash) {
    items.push({ ...props.bestCash, type: 'cash', label: 'Cash pickup' })
  }
  
  return items
})

function getIcon(type: string) {
  const icons = {
    value: {
      render() {
        return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 13l4 4L19 7' })
        ])
      }
    },
    fastest: {
      render() {
        return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
        ])
      }
    },
    cash: {
      render() {
        return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' })
        ])
      }
    }
  }
  return icons[type as keyof typeof icons] || icons.value
}
</script>
