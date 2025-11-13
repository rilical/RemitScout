<template>
  <div
    class="w-9 h-9 rounded-full border-2 border-primary-500 grid place-items-center text-sm font-semibold text-primary-600 bg-white"
    role="img"
    :aria-label="`Score: ${score.toFixed(1)} out of 10`"
  >
    {{ score.toFixed(1) }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  score: number
}

const props = defineProps<Props>()
</script>
