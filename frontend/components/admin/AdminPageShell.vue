<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  loading?: boolean
  error?: string | null
  meta?: string | null
}>()
</script>

<template>
  <section class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 class="text-h3 font-semibold text-rs-fg">{{ title }}</h1>
        <p
          v-if="subtitle"
          class="mt-1 text-body-sm text-rs-muted"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
    <p
      v-if="meta"
      class="text-body-sm text-rs-muted"
    >
      {{ meta }}
    </p>
    <div
      v-if="error"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-body-sm text-red-700"
    >
      {{ error }}
    </div>
    <div
      v-else-if="loading"
      class="mt-6 flex items-center gap-3 text-body-sm text-rs-muted"
      role="status"
      aria-live="polite"
    >
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
      Loading…
    </div>
    <slot v-else />
  </section>
</template>
