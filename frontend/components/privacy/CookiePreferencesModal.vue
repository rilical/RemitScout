<template>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        @click="close"
      />
      <div
        ref="modalRef"
        class="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        tabindex="-1"
        @keydown.esc="close"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3
              id="cookie-preferences-title"
              class="text-body-lg font-semibold text-rs-fg"
            >
              Cookie preferences
            </h3>
            <p class="mt-1 text-body-sm text-rs-muted">
              Ads keep the free plan free. You can change this anytime.
            </p>
          </div>
          <button
            type="button"
            class="text-neutral-400 hover:text-neutral-600"
            aria-label="Close dialog"
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
        <div class="rounded-xl border border-rs-border bg-neutral-50 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-body-sm font-semibold text-rs-fg">
                Essential
              </div>
              <div class="text-body-sm text-rs-muted">
                Required for security and core functionality.
              </div>
            </div>
            <span class="text-body-sm font-semibold text-neutral-600">
              Always on
            </span>
          </div>
        </div>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-rs-border p-4">
          <div>
            <div class="text-body-sm font-semibold text-rs-fg">
              Functional
            </div>
            <div class="text-body-sm text-rs-muted">
              Remember your corridor and local preferences.
            </div>
          </div>
          <input
            v-model="draftFunctional"
            type="checkbox"
            class="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-primary-500"
          >
        </label>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-rs-border p-4">
          <div>
            <div class="text-body-sm font-semibold text-rs-fg">
              Analytics
            </div>
            <div class="text-body-sm text-rs-muted">
              Help us improve with aggregated usage analytics.
            </div>
          </div>
          <input
            v-model="draftAnalytics"
            type="checkbox"
            class="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-primary-500"
          >
        </label>

        <label class="flex items-center justify-between gap-4 rounded-xl border border-rs-border p-4">
          <div>
            <div class="text-body-sm font-semibold text-rs-fg">
              Marketing
            </div>
            <div class="text-body-sm text-rs-muted">
              Personalized ads and marketing attribution.
            </div>
          </div>
          <input
            v-model="draftMarketing"
            type="checkbox"
            class="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-primary-500"
          >
        </label>

        <p
          v-if="privacyError"
          class="text-body-sm text-danger-600"
        >
          {{ privacyError }}
        </p>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
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
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useCookiePreferencesModal } from '~/composables/useCookiePreferencesModal'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useFocusTrap } from '~/composables/useFocusTrap'

const { isOpen, close } = useCookiePreferencesModal()
const { settings, saveSettings, loading: privacyLoading, error } = usePrivacySettings()

const draftFunctional = ref(false)
const draftAnalytics = ref(false)
const draftMarketing = ref(false)

const privacyError = computed(() => error.value)

const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef)

const syncDraftFromSettings = () => {
  draftFunctional.value = settings.value.personalization
  draftAnalytics.value = settings.value.analytics
  draftMarketing.value = settings.value.marketing
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) {
      deactivate()
      return
    }
    syncDraftFromSettings()

    await nextTick()
    activate()
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

onBeforeUnmount(() => {
  deactivate()
})
</script>
