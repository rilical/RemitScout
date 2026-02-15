<template>
  <SkeletonBlock :width="`${width}%`" />
</template>

<script setup lang="ts">
import SkeletonBlock from './SkeletonBlock.vue'

interface Props {
  width?: number
}

withDefaults(defineProps<Props>(), {
  width: 100,
})
</script>
