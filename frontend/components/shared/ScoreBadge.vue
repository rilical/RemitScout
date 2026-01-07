<template>
  <button
    v-if="clickable"
    type="button"
    class="rounded-full border-2 grid place-items-center font-semibold bg-white transition-all hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="[sizeClasses, focusRingClass]"
    :style="{ borderColor: scoreColor }"
    :aria-label="`Remit-Score: ${score.toFixed(1)} out of 10. Click to view details.`"
    @click="$emit('click')"
  >
    <span :class="scoreTextClass">
      {{ score.toFixed(1) }}
    </span>
  </button>
  <div
    v-else
    class="rounded-full border-2 grid place-items-center font-semibold bg-white transition-colors"
    :class="sizeClasses"
    :style="{ borderColor: scoreColor }"
    role="img"
    :aria-label="`Score: ${score.toFixed(1)} out of 10`"
  >
    <span :class="scoreTextClass">
      {{ score.toFixed(1) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  clickable?: boolean
  size?: 'small' | 'default' | 'large'
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  size: 'default',
})

defineEmits<Emits>()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-8 h-8 text-xs'
    case 'large':
      return 'w-12 h-12 text-base'
    default:
      return 'w-9 h-9 text-sm'
  }
})

const scoreColor = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#2563eb'
  if (score >= 7.0) return '#eab308'
  return '#6b7280'
})

const scoreTextClass = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return 'text-green-600'
  if (score >= 8.0) return 'text-brand-600'
  if (score >= 7.0) return 'text-yellow-600'
  return 'text-neutral-600'
})

const focusRingClass = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return 'focus:ring-green-500'
  if (score >= 8.0) return 'focus:ring-brand-500'
  if (score >= 7.0) return 'focus:ring-yellow-500'
  return 'focus:ring-neutral-500'
})
</script>
