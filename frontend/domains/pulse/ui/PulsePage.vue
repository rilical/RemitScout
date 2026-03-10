<template>
  <PulsePagePublic v-if="!isPlus" />
  <PulseTabShell v-else />
</template>

<script setup lang="ts">
import PulsePagePublic from './PulsePagePublic.vue'
import PulseTabShell from './PulseTabShell.vue'
import { useEntitlements } from '~/composables/useEntitlements'
import { useFeatureFlags } from '~/composables/useFeatureFlags'

const { pulseEnabled } = useFeatureFlags()

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 })
}

const { isPlus } = useEntitlements()

useHead({
  title: 'Remit-Scout Pulse | Remittance Market Dashboard',
  meta: [
    {
      name: 'description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:title',
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
    },
    {
      property: 'og:description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://remitscout.com/pulse',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Remit-Scout Pulse | Remittance Market Dashboard',
    },
    {
      name: 'twitter:description',
      content:
        'Market dashboard for remittance pricing. Track spreads, markups, winners, volatility, and reliability by corridor.',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://remitscout.com/pulse',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Remit-Scout Pulse',
        'description': 'Market dashboard for remittance pricing',
        'url': 'https://remitscout.com/pulse',
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
        'provider': {
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': 'https://remitscout.com',
        },
      }),
    },
  ],
})
</script>
