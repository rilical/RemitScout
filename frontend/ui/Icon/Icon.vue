<script setup lang="ts">
import { computed } from 'vue'
import { ICONS_OUTLINE, ICONS_SOLID, type IconName, type IconVariant } from './icons'

type IconClass = string | Record<string, boolean> | Array<string | Record<string, boolean>>

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: 10 | 14 | 16 | 20 | 24
    variant?: IconVariant
    title?: string
    decorative?: boolean
    class?: IconClass
  }>(),
  {
    size: 20,
    variant: 'outline',
    title: undefined,
    decorative: true,
    class: undefined,
  },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 10:
      return 'h-2.5 w-2.5'
    case 14:
      return 'h-3.5 w-3.5'
    case 16:
      return 'h-4 w-4'
    case 24:
      return 'h-6 w-6'
    default:
      return 'h-5 w-5'
  }
})

const IconComponent = computed(() => {
  const primary = props.variant === 'solid' ? ICONS_SOLID : ICONS_OUTLINE
  const fallback = props.variant === 'solid' ? ICONS_OUTLINE : ICONS_SOLID
  return primary[props.name] ?? fallback[props.name]
})

const a11yAttrs = computed(() => {
  if (props.decorative) return { 'aria-hidden': 'true' }
  return {
    'role': 'img',
    'aria-label': props.title || props.name,
  }
})
</script>

<template>
  <component
    :is="IconComponent"
    :class="[sizeClass, props.class]"
    v-bind="a11yAttrs"
  />
</template>
