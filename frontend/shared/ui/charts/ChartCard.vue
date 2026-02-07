<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { formatUpdatedLabel } from '../../lib/format'
import EmptyState from '../states/EmptyState.vue'
import ErrorState from '../states/ErrorState.vue'
import LoadingState from '../states/LoadingState.vue'

type ChartCardVariant = 'terminal' | 'consumer'

const props = withDefaults(
  defineProps<{
    variant?: ChartCardVariant
    title: string
    subtitle?: string
    rangeLabel?: string
    updatedAt?: string | Date | null | undefined
    loading?: boolean
    error?: { title?: string, message: string } | null
    dataAvailable?: boolean
    empty?: { title?: string, message?: string } | null
  }>(),
  {
    variant: 'terminal',
    subtitle: undefined,
    rangeLabel: undefined,
    updatedAt: null,
    loading: false,
    error: null,
    dataAvailable: true,
    empty: null,
  },
)

const slots = useSlots()

const updatedLabel = computed(() => formatUpdatedLabel(props.updatedAt))

const hasActions = computed(() => Boolean(slots.actions))

const styles = computed(() => {
  if (props.variant === 'consumer') {
    return {
      outer: 'overflow-hidden rounded-xl border border-slate-200 bg-white',
      header: 'flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-4',
      title: 'text-base font-semibold text-slate-900',
      subtitle: 'mt-1 text-sm text-slate-600',
      rangePill: 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700',
      body: 'px-6 py-5',
      footer: 'border-t border-slate-200 bg-slate-50/60 px-6 py-2.5 text-slate-500',
      stateVariant: 'consumer' as const,
    }
  }

  return {
    outer: 'overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800',
    header: 'flex items-start justify-between gap-6 border-b border-neutral-700 px-6 py-4',
    title: 'text-base font-semibold text-white',
    subtitle: 'mt-1 text-sm text-neutral-400',
    rangePill: 'rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-300',
    body: 'px-6 py-5',
    footer: 'border-t border-neutral-700 bg-neutral-900/50 px-6 py-2.5 text-neutral-500',
    stateVariant: 'terminal' as const,
  }
})
</script>

<template>
  <section :class="styles.outer">
    <header :class="styles.header">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h2 :class="styles.title">
            {{ title }}
          </h2>
          <span
            v-if="rangeLabel"
            :class="styles.rangePill"
          >
            {{ rangeLabel }}
          </span>
        </div>
        <p
          v-if="subtitle"
          :class="styles.subtitle"
        >
          {{ subtitle }}
        </p>
      </div>

      <div
        v-if="hasActions"
        class="flex shrink-0 items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </header>

    <div :class="styles.body">
      <slot
        v-if="loading"
        name="loading"
      >
        <LoadingState
          :variant="styles.stateVariant"
          title="Loading"
          message="Loading…"
        />
      </slot>

      <slot
        v-else-if="error"
        name="error"
      >
        <ErrorState
          :variant="styles.stateVariant"
          :title="error.title || 'Could not load'"
          :message="error.message"
        />
      </slot>

      <slot
        v-else-if="!dataAvailable"
        name="empty"
      >
        <EmptyState
          :variant="styles.stateVariant"
          :title="empty?.title || 'No data available'"
          :message="empty?.message || 'No data available for this filter yet.'"
        />
      </slot>

      <div
        v-else
        class="space-y-6"
      >
        <slot name="chart" />
        <slot name="table" />
      </div>
    </div>

    <footer :class="styles.footer">
      <div class="flex items-center justify-between gap-4">
        <div class="text-xs">
          {{ updatedLabel }}
        </div>
        <slot name="footer" />
      </div>
    </footer>
  </section>
</template>
