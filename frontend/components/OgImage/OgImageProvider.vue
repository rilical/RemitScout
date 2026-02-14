<template>
  <div class="w-full h-full bg-surface text-neutral-900 p-12 flex flex-col justify-between border border-neutral-200">
    <div class="text-body-sm font-semibold text-brand-600">Remit-Scout provider review</div>
    <div class="space-y-4">
      <div class="text-hero font-black">{{ providerName }}</div>
      <div class="inline-flex items-center rounded-full bg-brand-600 text-white px-4 py-2 text-h3 font-bold">Remit-Score {{ remitScore.toFixed(1) }} / 10</div>
      <div class="text-h4">Independent Review | Remit-Scout</div>
    </div>
    <div class="flex items-center justify-end">
      <img
:src="logoUrl"
alt="provider logo"
class="h-16 w-auto"
>
    </div>
    <div class="text-body-sm text-neutral-600">remitscout.com</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  providerName: string
  remitScore: number
  logoUrl: string
}>()
</script>
