<template>
  <div class="animate-pulse">
    <div
      class="mb-2 h-4 rounded bg-gray-200"
      :style="{ width: width + '%' }"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  width?: number
}

withDefaults(defineProps<Props>(), {
  width: 100,
})
</script>
