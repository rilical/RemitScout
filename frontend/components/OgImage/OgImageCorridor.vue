<template>
  <div class="w-full h-full bg-surface text-neutral-900 p-12 flex flex-col justify-between border border-neutral-200">
    <div class="text-body-sm font-semibold text-brand-600">Remit-Scout corridor insight</div>
    <div class="space-y-6">
      <div class="text-hero font-black">{{ from }} -> {{ to }}</div>
      <div class="text-h2">Best rates from {{ providerCount }} providers</div>
      <div class="text-6xl font-black text-brand-600">{{ bestRate }}</div>
    </div>
    <div class="text-body-lg font-semibold">{{ from }} {{ fromFlag }} → {{ toFlag }} {{ to }}</div>
    <div class="text-body-sm text-neutral-600">remitscout.com</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  from: string
  to: string
  providerCount: number
  bestRate: string
}>()

const EMOJI_BY_COUNTRY: Record<string, string> = {
  us: '🇺🇸',
  gb: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
  in: '🇮🇳',
  ng: '🇳🇬',
  ph: '🇵🇭',
  mx: '🇲🇽',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
}

const fromFlag = EMOJI_BY_COUNTRY[props.from?.toLowerCase()] || '🌍'
const toFlag = EMOJI_BY_COUNTRY[props.to?.toLowerCase()] || '🌎'
</script>
