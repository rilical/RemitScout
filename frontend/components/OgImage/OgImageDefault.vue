<template>
  <div class="w-full h-full bg-gradient-to-br from-brand-600 to-brand-700 text-white p-12 flex flex-col justify-between relative">
    <div class="text-h2 font-bold">Remit-Scout</div>
    <div>
      <div class="text-6xl font-black leading-tight">{{ title }}</div>
      <div class="mt-6 text-h2 text-white/90 max-w-[880px]">{{ description }}</div>
    </div>
    <div class="text-h4 font-semibold opacity-90">remitscout.com</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
