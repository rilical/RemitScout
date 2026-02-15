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
</script>
