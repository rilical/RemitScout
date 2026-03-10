<template>
  <div class="rounded-xl border border-brand-600/30 bg-brand-600/10 p-4">
    <div class="mb-2 flex items-center justify-between gap-3">
      <h2 class="text-body font-semibold text-white">
        Your Send Timing
      </h2>
      <span
        v-if="savingsLabel"
        class="rounded-full border border-brand-600/40 bg-brand-600/20 px-2.5 py-1 text-label font-bold text-brand-600 text-mono-value"
      >
        {{ savingsLabel }}
      </span>
    </div>

    <div
      v-if="loading"
      class="space-y-2"
      role="status"
      aria-live="polite"
      aria-label="Loading personal history"
    >
      <SkeletonBlock
        width="92%"
        height="0.875rem"
        tone="dark"
      />
      <SkeletonBlock
        width="74%"
        height="0.875rem"
        tone="dark"
      />
      <span class="sr-only">Loading personal history</span>
    </div>

    <p
      v-else
      class="text-body-sm leading-relaxed text-neutral-200"
    >
      {{ messageText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PulsePersonalHistoryData } from '~/lib/pulseApi'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

interface Props {
  data?: PulsePersonalHistoryData | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  loading: false,
})

const messageText = computed(() => {
  const message = props.data?.message
  if (typeof message === 'string' && message.trim().length > 0) return message
  return 'Compare a corridor to unlock personalized send timing insights.'
})

const savingsLabel = computed(() => {
  const savings = props.data?.savingsAmount
  if (typeof savings !== 'number' || !Number.isFinite(savings) || savings <= 0) return null
  return `Saved $${savings.toFixed(2)}`
})
</script>
