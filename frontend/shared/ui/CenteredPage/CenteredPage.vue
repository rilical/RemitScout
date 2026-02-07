<template>
  <component
    :is="as"
    class="w-full"
    :class="paddingYClass"
  >
    <div :class="containerClass">
      <header
        v-if="hasHeader"
        class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <slot name="header">
          <div class="min-w-0">
            <h1
              v-if="hasTitle"
              class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              <slot name="title">{{ title }}</slot>
            </h1>
            <p
              v-if="hasSubtitle"
              class="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base"
            >
              <slot name="subtitle">{{ subtitle }}</slot>
            </p>
          </div>

          <div
            v-if="hasActions"
            class="flex shrink-0 flex-wrap items-center gap-2"
          >
            <slot name="actions" />
          </div>
        </slot>
      </header>

      <div :class="bodyClass">
        <slot />
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * CenteredPage is the single source of truth for "centered container" page layout.
 *
 * Slots:
 * - `header` (optional): fully custom header rendering. When provided, it replaces the default header layout.
 * - `title` (optional): overrides the title area (or use `title` prop).
 * - `subtitle` (optional): overrides the subtitle area (or use `subtitle` prop).
 * - `actions` (optional): right-side actions area (buttons/links).
 * - default: page body.
 */
type CenteredPageMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl' | '7xl' | 'full'
type CenteredPagePaddingY = 'none' | 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    as?: string
    title?: string
    subtitle?: string
    maxWidth?: CenteredPageMaxWidth
    paddingY?: CenteredPagePaddingY
    sectionGapClass?: string
  }>(),
  {
    as: 'div',
    maxWidth: '7xl',
    paddingY: 'md',
    sectionGapClass: 'space-y-8',
  },
)

const slots = useSlots()

const containerClass = computed(() => {
  const maxWidthClass: Record<CenteredPageMaxWidth, string> = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-none',
  }

  return `mx-auto w-full ${maxWidthClass[props.maxWidth]} px-4 sm:px-6 lg:px-8`
})

const paddingYClass = computed(() => {
  const map: Record<CenteredPagePaddingY, string> = {
    none: '',
    sm: 'py-6 sm:py-8',
    md: 'py-10 sm:py-12',
    lg: 'py-14 sm:py-16',
  }

  return map[props.paddingY]
})

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasSubtitle = computed(() => Boolean(slots.subtitle || props.subtitle))
const hasActions = computed(() => Boolean(slots.actions))

const hasHeader = computed(() =>
  Boolean(slots.header || hasTitle.value || hasSubtitle.value || hasActions.value),
)

const bodyClass = computed(() => {
  return props.sectionGapClass
})
</script>
