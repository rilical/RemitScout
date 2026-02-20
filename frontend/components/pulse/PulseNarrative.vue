<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-4">
    <div class="mb-2 flex items-center justify-between gap-3">
      <h2 class="text-body font-semibold text-white">
        AI Narrative Summary
      </h2>
      <span
        v-if="generatedLabel"
        class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
      >
        {{ generatedLabel }}
      </span>
    </div>

    <div
      v-if="loading"
      class="space-y-2"
      role="status"
      aria-live="polite"
      aria-label="Loading narrative"
    >
      <SkeletonBlock
        width="95%"
        height="0.875rem"
        tone="dark"
      />
      <SkeletonBlock
        width="82%"
        height="0.875rem"
        tone="dark"
      />
      <span class="sr-only">Loading narrative</span>
    </div>

    <p
      v-else-if="summaryText"
      class="text-body-sm leading-relaxed text-neutral-300"
    >
      {{ summaryText }}
    </p>

    <p
      v-else
      class="text-body-sm text-neutral-400"
    >
      Narrative insights will appear once enough corridor data is available.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import { formatUpdatedLabel } from '~/shared/lib/format'

interface Props {
  summary?: string | null
  generatedAt?: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  summary: '',
  generatedAt: null,
  loading: false,
})

const summaryText = computed(() => (props.summary || '').trim())
const generatedLabel = computed(() => {
  if (!props.generatedAt) return null
  return formatUpdatedLabel(props.generatedAt)
})
</script>
