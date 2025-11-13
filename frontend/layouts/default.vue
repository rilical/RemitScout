<template>
  <div class="flex min-h-screen flex-col">
    <SkipToContent />

    <NavSiteHeader />

    <main id="main-content" class="flex-grow">
      <slot />
    </main>

    <NavSiteFooter @open-modal="footerModalOpen = true" />
    
    <HowWeMakeMoneyModal :is-open="footerModalOpen" @update:is-open="footerModalOpen = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SkipToContent from '~/components/shared/SkipToContent.vue'
import NavSiteHeader from '~/components/nav/SiteHeader.vue'
import NavSiteFooter from '~/components/nav/SiteFooter.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'

const footerModalOpen = ref(false)
</script>
