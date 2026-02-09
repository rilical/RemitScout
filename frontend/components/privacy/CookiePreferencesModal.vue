<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div
      class="absolute inset-0 bg-black/50"
      @click="close"
    />
    <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">
            Cookie preferences
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            Ads keep the free plan free. You can change this anytime.
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600"
          @click="close"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="mt-5 space-y-4">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-semibold text-slate-900">
                Essential
              </div>
              <div class="text-xs text-slate-500">
                Required for security and core functionality.
              </div>
            </div>
            <span class="text-xs font-semibold text-slate-600">
              Always on
            </span>
          </div>
        </div>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <div class="text-sm font-semibold text-slate-900">
              Functional
            </div>
            <div class="text-xs text-slate-500">
              Remember your corridor and local preferences.
            </div>
          </div>
          <input
            v-model="draftFunctional"
            type="checkbox"
            class="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          >
        </label>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <div class="text-sm font-semibold text-slate-900">
              Analytics
            </div>
            <div class="text-xs text-slate-500">
              Help us improve with aggregated usage analytics.
            </div>
          </div>
          <input
            v-model="draftAnalytics"
            type="checkbox"
            class="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          >
        </label>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <div class="text-sm font-semibold text-slate-900">
              Marketing
            </div>
            <div class="text-xs text-slate-500">
              Personalized ads and marketing attribution.
            </div>
          </div>
          <input
            v-model="draftMarketing"
            type="checkbox"
            class="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          >
        </label>

        <p
          v-if="privacyError"
          class="text-xs text-red-600"
        >
          {{ privacyError }}
        </p>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          :disabled="privacyLoading"
          @click="save"
        >
          {{ privacyLoading ? 'Saving…' : 'Save preferences' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'
import { usePrivacySettings } from '~/composables/usePrivacySettings'

const { isOpen, close } = useCookiePreferencesModal()
const { settings, saveSettings, loading: privacyLoading, error } = usePrivacySettings()

const draftFunctional = ref(false)
const draftAnalytics = ref(false)
const draftMarketing = ref(false)

const privacyError = computed(() => error.value)

const syncDraftFromSettings = () => {
  draftFunctional.value = settings.value.personalization
  draftAnalytics.value = settings.value.analytics
  draftMarketing.value = settings.value.marketing
}

watch(
  () => isOpen.value,
  (open) => {
    if (!open) return
    syncDraftFromSettings()
  },
  { immediate: true },
)

watch(
  () => settings.value,
  () => {
    if (!isOpen.value) return
    syncDraftFromSettings()
  },
  { deep: true },
)

const save = async () => {
  await saveSettings({
    personalization: draftFunctional.value,
    analytics: draftAnalytics.value,
    marketing: draftMarketing.value,
  })

  if (!error.value) {
    close()
  }
}
</script>

