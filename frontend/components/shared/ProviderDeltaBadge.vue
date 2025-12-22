<template>
  <div
    class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm"
    :class="badgeClasses"
  >
    <!-- Best Deal Badge -->
    <template v-if="isBest">
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>Best Price</span>
    </template>

    <!-- Delta Badge -->
    <template v-else>
      <svg
        v-if="delta > 0"
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
      </svg>
      <span>{{ formattedDelta }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  delta: number
  isBest?: boolean
  showPercent?: boolean
  amount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isBest: false,
  showPercent: false,
  amount: 1000,
})

const badgeClasses = computed(() => {
  if (props.isBest) {
    return 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-emerald-200'
  }
  
  if (props.delta <= 0) {
    return 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
  }
  
  if (props.delta < 5) {
    return 'bg-amber-100 text-amber-800 border-2 border-amber-300'
  }
  
  if (props.delta < 20) {
    return 'bg-orange-100 text-orange-800 border-2 border-orange-400'
  }
  
  return 'bg-rose-100 text-rose-800 border-2 border-rose-400'
})

const formattedDelta = computed(() => {
  if (props.delta <= 0) return 'Same price'
  
  const formatted = `Δ $${props.delta.toFixed(2)}`
  
  if (props.showPercent && props.amount > 0) {
    const percent = (props.delta / props.amount) * 100
    return `${formatted} (${percent.toFixed(1)}%)`
  }
  
  return `${formatted} more`
})
</script>
