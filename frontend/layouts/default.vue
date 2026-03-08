<template>
  <div class="flex min-h-screen flex-col">
    <SkipToContent />
    <NavSiteHeader />

    <main
id="main-content"
class="flex-grow"
>
      <slot />
    </main>

    <NavSiteFooter @open-modal="footerModalOpen = true" />

    <HowWeMakeMoneyModal
:is-open="footerModalOpen"
@update:is-open="footerModalOpen = $event"
/>

    <SaveAlertModal v-if="saveAlertModal.context" />
    <WelcomeBackCorridorPrompt />

    <div
      v-if="sessionTimeout.showWarning.value"
      class="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-md"
      role="alert"
    >
      <span>Your session is about to expire. Refresh it to stay signed in.</span>
      <button
        class="ml-4 rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700"
        @click="sessionTimeout.refresh()"
      >
        Stay signed in
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import NavSiteHeader from '~/components/nav/SiteHeader.vue'
import NavSiteFooter from '~/components/nav/SiteFooter.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'
import WelcomeBackCorridorPrompt from '~/components/home/WelcomeBackCorridorPrompt.vue'
import SkipToContent from '~/components/shared/SkipToContent.vue'

const SaveAlertModal = defineAsyncComponent(() => import('~/components/shared/SaveAlertModal.vue'))

const footerModalOpen = ref(false)
const saveAlertModal = useSaveAlertModal()
const sessionTimeout = useSessionTimeout()
</script>
