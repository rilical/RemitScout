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
    details?: string
    variant?: StateVariant
    mode?: StateMode
  }>(),
  {
    title: undefined,
    message: undefined,
    description: undefined,
    details: undefined,
    variant: 'consumer',
    mode: 'card',
  },
)

const titleId = useId()
const descriptionId = useId()

const hasTitle = computed(() => Boolean(props.title))
const description = computed(() => props.description ?? props.message)
const hasDescription = computed(() => Boolean(description.value || props.details))

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
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-describedby="hasDescription ? descriptionId : undefined"
  >
    <div
      class="flex items-start gap-4"
      :class="contentWrapperClass"
    >
      <div class="mt-0.5">
        <slot name="icon" />
      </div>

      <div class="min-w-0 flex-1">
        <h3
          v-if="hasTitle"
          :id="titleId"
          class="text-body-sm font-semibold"
          :class="props.variant === 'terminal' ? 'text-white' : 'text-rs-fg'"
        >
          {{ props.title }}
        </h3>
        <p
          v-if="description"
          :id="descriptionId"
          class="mt-1 text-body-sm"
          :class="props.variant === 'terminal' ? 'text-neutral-300' : 'text-rs-muted'"
        >
          {{ description }}
        </p>
        <p
          v-if="props.details"
          :id="description ? undefined : descriptionId"
          class="mt-2 text-body-sm"
          :class="props.variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
        >
          {{ props.details }}
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
