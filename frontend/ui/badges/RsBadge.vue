<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'enterprise' | 'plus' | 'fresh' | 'stale'
type BadgeSize = 'xs' | 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    label: string
    variant?: BadgeVariant
    size?: BadgeSize
    icon?: string
    dot?: boolean
  }>(),
  {
    variant: 'neutral',
    size: 'sm',
    icon: undefined,
    dot: false,
  },
)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'brand':
    case 'plus':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'success':
    case 'fresh':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'warning':
    case 'stale':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'danger':
      return 'bg-red-500/10 text-red-400 border border-red-500/20'
    case 'enterprise':
      return 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
    case 'neutral':
    default:
      return 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
  }
})

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'text-[10px] px-1.5 py-0'
  if (props.size === 'md') return 'text-sm px-2.5 py-1'
  return 'text-xs px-2 py-0.5'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium"
    :class="[variantClass, sizeClass]"
  >
    <span
      v-if="dot"
      class="animate-pulse w-1.5 h-1.5 rounded-full bg-current"
      aria-hidden="true"
    />
    <span
      v-if="icon"
      class="shrink-0"
      aria-hidden="true"
    >{{ icon }}</span>
    {{ label }}
  </span>
</template>
