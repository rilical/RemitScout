<template>
  <div class="w-full h-full bg-neutral-50 p-12 flex flex-col justify-between border border-neutral-200">
    <div>
      <div class="text-body-sm font-semibold text-brand-600 uppercase tracking-wide">{{ category }}</div>
      <div class="mt-8 text-hero font-black leading-tight text-rs-fg">{{ title }}</div>
    </div>
    <div class="space-y-3">
      <div class="text-h3">Read on Remit-Scout</div>
      <div class="inline-flex items-center rounded-full bg-brand-600 text-white px-4 py-2">{{ readTime }}</div>
    </div>
    <div class="text-body-sm text-neutral-600">remitscout.com</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  category: string
  readTime: string
}>()
</script>
