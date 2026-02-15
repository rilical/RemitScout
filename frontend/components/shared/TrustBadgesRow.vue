<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <div
      v-for="badge in badges"
      :key="badge.label"
      :class="pillClass"
    >
      <component
        :is="badge.icon"
        :class="iconClass"
      />
      <span v-if="badge.strong">
        <span class="font-semibold">{{ badge.label }}</span>
      </span>
      <span v-else>{{ badge.label }}</span>
    </div>

    <NuxtLink
      v-if="cta"
      :to="cta.to"
      :class="ctaClass"
    >
      <component
        :is="cta.icon"
        v-if="cta.icon"
        :class="iconClass"
      />
      {{ cta.label }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Badge {
  label: string
  icon: any
  strong?: boolean
}

interface Cta {
  label: string
  to: string
  icon?: any
}

interface Props {
  dark?: boolean
  badges: Badge[]
  cta?: Cta
}

const props = withDefaults(defineProps<Props>(), {
  dark: true,
})

const pillClass = computed(() => {
  return props.dark
    ? 'inline-flex items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-body-sm font-medium text-neutral-200 shadow-sm ring-1 ring-neutral-700'
    : 'inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-body-sm font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200'
})

const ctaClass = computed(() => {
  return props.dark
    ? 'inline-flex items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-body-sm font-medium text-neutral-200 shadow-sm ring-1 ring-neutral-700 hover:bg-neutral-700'
    : 'inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-body-sm font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50'
})

const iconClass = computed(() => 'w-4 h-4 text-brand-600')
</script>
