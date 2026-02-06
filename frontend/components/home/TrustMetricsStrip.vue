<template>
  <ImpactStatsSection
    variant="strip"
    :bg-class="bgClass"
  />
</template>

<script setup lang="ts">
import ImpactStatsSection from '~/components/home/ImpactStatsSection.vue'

interface Props {
  bgClass?: string
}

withDefaults(defineProps<Props>(), {
  bgClass: 'bg-brand-600',
})
</script>
