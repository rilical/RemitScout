<template>
  <div
    v-if="!hasConsent"
    class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm text-slate-700">
        <p class="font-semibold text-slate-900">
          Ads keep the free plan free
        </p>
        <p class="mt-1 text-slate-600">
          We only use non-essential cookies (functional, analytics, marketing) if you opt in. You can change this anytime.
        </p>
        <div class="mt-2 flex gap-3 text-xs">
          <NuxtLink
            to="/legal/privacy"
            class="text-blue-600 hover:text-blue-700"
          >Privacy Policy</NuxtLink>
          <NuxtLink
            to="/cookies"
            class="text-blue-600 hover:text-blue-700"
          >Cookie Policy</NuxtLink>
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
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          @click="openCookiePreferences"
        >
          Manage cookies
        </button>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          @click="acceptAll"
        >
          Accept &amp; support Remit-Scout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'

const { hasConsent, saveSettings } = usePrivacySettings()
const { open } = useCookiePreferencesModal()

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
