<template>
  <section
    :id="id"
    class="py-16 lg:py-20 scroll-mt-20"
    :class="sectionClass"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            {{ title }}
          </h2>
          <p
            v-if="subtitle"
            class="text-lg text-neutral-600 max-w-2xl mx-auto"
          >
            {{ subtitle }}
          </p>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <FaqAccordion :faqs="faqs" />
        </div>

        <div
          v-if="ctaTo"
          class="mt-8 text-center"
        >
          <NuxtLink
            :to="ctaTo"
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
          >
            {{ ctaLabel }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import FaqAccordion from '~/components/shared/FaqAccordion.vue'

type FaqAccordionItem = {
  question: string
  answer: string
}

withDefaults(defineProps<{
  id?: string
  title: string
  subtitle?: string
  faqs: FaqAccordionItem[]
  ctaTo?: string | null
  ctaLabel?: string
  sectionClass?: string
}>(), {
  id: 'faq',
  subtitle: '',
  ctaTo: '/faq',
  ctaLabel: 'View all FAQs →',
  sectionClass: 'bg-neutral-50',
})
</script>
