<script setup lang="ts">
import { computed, useId } from 'vue'

type StateVariant = 'terminal' | 'consumer'
type StateMode = 'card' | 'inline' | 'page'

const props = withDefaults(
  defineProps<{
    title?: string
    /** @deprecated Prefer `description` (kept for backward compatibility). */
    message: string
    description?: string
    details?: string
    variant?: StateVariant
    mode?: StateMode
    onRetry?: (() => void) | null
    retryLabel?: string
  }>(),
  {
    title: 'Something went wrong',
    description: undefined,
    details: undefined,
    variant: 'consumer',
    mode: 'card',
    onRetry: null,
    retryLabel: 'Retry',
  },
)

const titleId = useId()
const descriptionId = useId()

const description = computed(() => props.description ?? props.message)
const hasTitle = computed(() => Boolean(props.title))
const hasDescription = computed(() => Boolean(description.value || props.details))

const modeClass = computed(() => {
  if (props.mode === 'inline') return 'border-0 bg-transparent p-0 rounded-none'
  if (props.mode === 'page') return 'border-0 bg-transparent p-0 rounded-none min-h-[40vh] flex items-center justify-center'
  return 'rounded-xl border p-6'
})

const chromeClass = computed(() => {
  if (props.mode !== 'card') return ''
  return props.variant === 'terminal'
    ? 'border-danger-500/30 bg-danger-500/10'
    : 'border-danger-200 bg-danger-50'
})

const contentWrapperClass = computed(() => {
  if (props.mode === 'page') return 'w-full max-w-xl'
  return 'w-full'
})

const retryButtonClass = computed(() => {
  return props.variant === 'terminal'
    ? 'rounded border border-danger-500/40 bg-danger-500/10 px-3 py-1.5 text-body-sm font-semibold text-danger-100 hover:bg-danger-500/20'
    : 'rounded-lg bg-danger-600 px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-danger-700'
})
</script>

<template>
  <section
    :class="[modeClass, chromeClass]"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
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
          :class="props.variant === 'terminal' ? 'text-danger-100' : 'text-danger-900'"
        >
          {{ props.title }}
        </h3>
        <p
          :id="descriptionId"
          class="mt-1 text-body-sm"
          :class="props.variant === 'terminal' ? 'text-danger-200' : 'text-danger-800'"
        >
          {{ description }}
        </p>
        <p
          v-if="props.details"
          :id="description ? undefined : descriptionId"
          class="mt-2 text-body-sm"
          :class="props.variant === 'terminal' ? 'text-danger-300' : 'text-danger-700'"
        >
          {{ props.details }}
        </p>

        <div
          v-if="$slots.actions || props.onRetry"
          class="mt-4 flex flex-wrap items-center gap-2"
        >
          <button
            v-if="props.onRetry"
            type="button"
            :class="retryButtonClass"
            @click="props.onRetry"
          >
            {{ props.retryLabel }}
          </button>
          <slot name="actions" />
        </div>
      </div>
    </div>
  </section>
</template>
