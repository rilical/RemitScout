<script setup lang="ts">
import { computed, useId } from 'vue'

type StateVariant = 'terminal' | 'consumer'
type StateMode = 'card' | 'inline' | 'page'

const props = withDefaults(
  defineProps<{
    title?: string
    /** @deprecated Prefer `description` (kept for backward compatibility). */
    message?: string
    description?: string
    variant?: StateVariant
    mode?: StateMode
  }>(),
  {
    title: undefined,
    message: 'Loading…',
    description: undefined,
    variant: 'consumer',
    mode: 'card',
  },
)

const titleId = useId()
const descriptionId = useId()

const description = computed(() => props.description ?? props.message)
const hasTitle = computed(() => Boolean(props.title))

const modeClass = computed(() => {
  if (props.mode === 'inline') return 'border-0 bg-transparent p-0 rounded-none'
  if (props.mode === 'page') return 'border-0 bg-transparent p-0 rounded-none min-h-[40vh] flex items-center justify-center'
  return 'rounded-xl border p-6'
})

const chromeClass = computed(() => {
  if (props.mode !== 'card') return ''
  return props.variant === 'terminal'
    ? 'border-neutral-700 bg-neutral-900'
    : 'border-rs-border bg-surface'
})

const contentWrapperClass = computed(() => {
  if (props.mode === 'page') return 'w-full max-w-xl'
  return 'w-full'
})
</script>

<template>
  <section
    :class="[modeClass, chromeClass]"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-describedby="description ? descriptionId : undefined"
  >
    <div
      class="flex items-start gap-4"
      :class="contentWrapperClass"
    >
      <div
        class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50"
        aria-hidden="true"
        :class="props.variant === 'terminal' ? 'bg-neutral-800' : 'bg-neutral-50'"
      >
        <slot name="icon">
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            :class="props.variant === 'terminal' ? 'border-neutral-600' : 'border-neutral-300'"
          />
        </slot>
      </div>

      <div class="min-w-0 flex-1">
        <h3
          v-if="props.title"
          :id="titleId"
          class="text-body-sm font-semibold"
          :class="props.variant === 'terminal' ? 'text-white' : 'text-rs-fg'"
        >
          {{ props.title }}
        </h3>
        <p
          :id="descriptionId"
          class="text-body-sm"
          :class="props.variant === 'terminal' ? 'text-neutral-300' : 'text-rs-muted'"
        >
          {{ description }}
        </p>

        <div
          v-if="$slots.actions"
          class="mt-4 flex flex-wrap items-center gap-2"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
  </section>
</template>
