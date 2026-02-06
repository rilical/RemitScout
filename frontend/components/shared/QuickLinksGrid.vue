<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
    <NuxtLink
      v-for="item in items"
      :key="item.title"
      :to="item.to"
      class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div class="mb-3">
        <component
          :is="item.icon"
          class="w-8 h-8 text-brand-600"
        />
      </div>
      <h4 class="font-semibold text-neutral-900 mb-2">
        {{ item.title }}
      </h4>
      <p class="text-sm text-neutral-600">
        {{ item.description }}
      </p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QUICK_LINKS } from '~/lib/marketing/trust'

interface Props {
  pulseEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pulseEnabled: true,
})

const items = computed(() => {
  const base = [
    QUICK_LINKS.pulse,
    QUICK_LINKS.providers,
    QUICK_LINKS.founder,
    QUICK_LINKS.report,
  ]
  return props.pulseEnabled ? base : base.filter(item => item.to !== QUICK_LINKS.pulse.to)
})
</script>

