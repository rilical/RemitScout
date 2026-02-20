<template>
  <div
    v-if="shouldShowBanner"
    class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-rs-border bg-surface/95 p-4 shadow-xl backdrop-blur"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-body-sm text-neutral-700">
        <p class="font-semibold text-rs-fg">
          Ads keep the free plan free
        </p>
        <p class="mt-1 text-neutral-600">
          We only use non-essential cookies (functional, analytics, marketing) if you opt in. You can change this anytime.
        </p>
        <div class="mt-2 flex gap-3 text-body-sm">
          <NuxtLink
            to="/legal/privacy"
            class="text-brand-600 hover:text-brand-700"
          >Privacy Policy</NuxtLink>
          <NuxtLink
            to="/cookies"
            class="text-brand-600 hover:text-brand-700"
          >Cookie Policy</NuxtLink>
          <NuxtLink
            to="/legal/do-not-sell"
            class="text-brand-600 hover:text-brand-700"
          >Do Not Sell</NuxtLink>
        </div>
      </div>
      <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
        <button
          type="button"
          class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          @click="rejectAll"
        >
          Reject non-essential
        </button>
        <button
          type="button"
          class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          @click="openCookiePreferences"
        >
          Manage cookies
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700"
          @click="acceptAll"
        >
          Accept &amp; support Remit-Scout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'

const { hasConsent, saveSettings } = usePrivacySettings()
const { open } = useCookiePreferencesModal()
const { request } = useApi()

const region = ref<'unknown' | 'eea' | 'non_eea' | 'error'>('unknown')

const EEA_UK_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB', 'UK',
])

const shouldShowBanner = computed(() => {
  if (hasConsent.value) return false
  if (region.value === 'eea') return true
  // Safe default for compliance: if geo lookup fails, show banner.
  if (region.value === 'error') return true
  return false
})

onMounted(async () => {
  if (hasConsent.value) return
  try {
    const data = await request<{ countryCode?: string, country_code?: string }>('/geo', {
      timeoutMs: 2000,
      retries: 0,
    })
    const raw = (data.countryCode || data.country_code || '').toUpperCase()
    region.value = raw && EEA_UK_COUNTRIES.has(raw) ? 'eea' : 'non_eea'
    // Non-EEA users (e.g. US/CCPA) don't require opt-in consent — auto-accept so
    // analytics and ads can run. They can still opt out via the cookie policy page.
    if (region.value === 'non_eea') {
      await saveSettings({ personalization: true, analytics: true, marketing: true })
    }
  }
  catch {
    region.value = 'error'
  }
})

const acceptAll = async () => {
  await saveSettings({ personalization: true, analytics: true, marketing: true })
}

const rejectAll = async () => {
  await saveSettings({ personalization: false, analytics: false, marketing: false })
}

const openCookiePreferences = () => {
  open()
}
</script>
