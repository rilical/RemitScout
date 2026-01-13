<template>
  <div class="flex min-h-screen flex-col">
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

    <SaveAlertModal />
    <ProviderVisitPrompt />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavSiteHeader from '~/components/nav/SiteHeader.vue'
import NavSiteFooter from '~/components/nav/SiteFooter.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'
import SaveAlertModal from '~/components/shared/SaveAlertModal.vue'
import ProviderVisitPrompt from '~/components/provider/ProviderVisitPrompt.vue'

const footerModalOpen = ref(false)
</script>
