<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#content"
      class="sr-only z-50 rounded-md bg-primary-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>

    <NavSiteHeader />

    <main id="content" class="flex-grow">
      <slot />
    </main>

    <NavSiteFooter @open-modal="footerModalOpen = true" />
    
    <HowWeMakeMoneyModal :is-open="footerModalOpen" @update:is-open="footerModalOpen = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavSiteHeader from '~/components/nav/SiteHeader.vue'
import NavSiteFooter from '~/components/nav/SiteFooter.vue'
import HowWeMakeMoneyModal from '~/components/shared/HowWeMakeMoneyModal.vue'

const footerModalOpen = ref(false)
</script>
