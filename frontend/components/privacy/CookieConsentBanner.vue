<template>
  <div
    v-if="!hasConsent"
    class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm text-slate-700">
        <p class="font-semibold text-slate-900">We use cookies for analytics</p>
        <p class="mt-1 text-slate-600">
          Help us improve Remit-Scout by allowing analytics cookies. You can change this anytime in your privacy settings.
        </p>
        <div class="mt-2 flex gap-3 text-xs">
          <NuxtLink to="/legal/privacy" class="text-blue-600 hover:text-blue-700">Privacy Policy</NuxtLink>
          <NuxtLink to="/cookies" class="text-blue-600 hover:text-blue-700">Cookie Policy</NuxtLink>
        </div>
      </div>
      <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          @click="rejectAll"
        >
          Reject non-essential
        </button>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          @click="acceptAll"
        >
          Accept all
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePrivacySettings } from '~/composables/usePrivacySettings'

const { hasConsent, saveSettings } = usePrivacySettings()

const acceptAll = async () => {
  await saveSettings({ analytics: true, personalization: true })
}

const rejectAll = async () => {
  await saveSettings({ analytics: false, personalization: false })
}
</script>
