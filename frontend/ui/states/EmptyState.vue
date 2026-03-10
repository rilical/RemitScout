<script setup lang="ts">
import { computed, useId } from 'vue'

type StateVariant = 'terminal' | 'consumer'
type StateMode = 'card' | 'inline' | 'page'
type StateReason = 'no-data' | 'no-corridor' | 'suppressed' | 'warming-up' | 'unauthorized' | 'error' | 'loading'

const props = withDefaults(
  defineProps<{
    title?: string
    /** @deprecated Prefer `description` (kept for backward compatibility). */
    message?: string
    description?: string
    details?: string
    variant?: StateVariant
    mode?: StateMode
    corridorLabel?: string
    reason?: StateReason
    daysAvailable?: number
    providerCount?: number
    ctaLabel?: string
    ctaTo?: string
  }>(),
  {
    title: undefined,
    message: undefined,
    description: undefined,
    details: undefined,
    variant: 'consumer',
    mode: 'card',
    corridorLabel: undefined,
    reason: undefined,
    daysAvailable: undefined,
    providerCount: undefined,
    ctaLabel: undefined,
    ctaTo: undefined,
  },
)

const titleId = useId()
const descriptionId = useId()

const reasonTitle = computed<string | undefined>(() => {
  if (!props.reason) return undefined
  switch (props.reason) {
    case 'no-data': return 'Data pending'
    case 'no-corridor': return 'Select a corridor'
    case 'suppressed': return 'Insufficient coverage'
    case 'warming-up': return 'Warming up'
    case 'unauthorized': return 'Upgrade required'
    case 'error': return 'Unable to load'
    case 'loading': return 'Loading'
    default: return undefined
  }
})

const reasonDescription = computed<string | undefined>(() => {
  if (!props.reason) return undefined
  const corridor = props.corridorLabel ?? 'this corridor'
  switch (props.reason) {
    case 'no-data':
      return `We're collecting pricing data for ${corridor}. Check back in a few hours.`
    case 'no-corridor':
      return 'Choose a corridor above to see market intelligence data.'
    case 'suppressed':
      return `Only ${props.providerCount ?? 0} provider(s) available for ${corridor}. We need at least 2 for reliable data.`
    case 'warming-up':
      return `${props.daysAvailable ?? 0} day(s) of data collected. Full analytics require 7+ days of history.`
    case 'unauthorized':
      return 'This feature requires a Plus or Enterprise subscription.'
    case 'error':
      return "We couldn't load this data. Please try refreshing."
    case 'loading':
      return 'Loading data, please wait.'
    default:
      return undefined
  }
})

const resolvedTitle = computed(() => props.title ?? reasonTitle.value)
const resolvedDescription = computed(() => props.description ?? props.message ?? reasonDescription.value)

const hasTitle = computed(() => Boolean(resolvedTitle.value))
const description = computed(() => resolvedDescription.value)
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
          {{ resolvedTitle }}
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

        <NuxtLink
          v-if="ctaLabel && ctaTo"
          :to="ctaTo"
          class="mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors"
          :class="
            props.variant === 'terminal'
              ? 'bg-neutral-700 text-white hover:bg-neutral-600'
              : 'bg-neutral-900 text-white hover:bg-neutral-700'
          "
        >
          {{ ctaLabel }}
        </NuxtLink>

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
