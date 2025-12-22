<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
    :class="badgeClasses"
  >
    <template v-if="isBest">
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>Best Price</span>
    </template>

    <template v-else>
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
    return 'bg-emerald-500 text-white'
  }
  
  if (props.delta <= 0) {
    return 'bg-emerald-100 text-emerald-700'
  }
  
  if (props.delta < 5) {
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
  
  if (props.delta < 20) {
    return 'bg-orange-50 text-orange-700 border border-orange-200'
  }
  
  return 'bg-rose-50 text-rose-700 border border-rose-200'
})

const formattedDelta = computed(() => {
  if (props.delta <= 0) return 'Same price'
  
  const formatted = `+$${props.delta.toFixed(2)}`
  
  if (props.showPercent && props.amount > 0) {
    const percent = (props.delta / props.amount) * 100
    return `${formatted} (${percent.toFixed(1)}%)`
  }
  
  return `${formatted} more`
})
</script>
