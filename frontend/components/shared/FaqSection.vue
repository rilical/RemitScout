<template>
  <section
    :id="id"
    class="py-16 lg:py-20 scroll-mt-20"
    :class="sectionClass"
  >
    <div class="container">
      <div class="mx-auto max-w-4xl">
        <div class="text-center mb-12">
          <h2
            class="text-h2 font-bold mb-4"
            :class="titleClass"
          >
            {{ title }}
          </h2>
          <p
            v-if="subtitle"
            class="text-body-lg max-w-2xl mx-auto"
            :class="subtitleClass"
          >
            {{ subtitle }}
          </p>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm">
          <FaqAccordion :faqs="faqs" />
        </div>

        <div
          v-if="ctaTo"
          class="mt-8 text-center"
        >
          <NuxtLink
            :to="ctaTo"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
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
  hideFaqLabel?: boolean
  titleClass?: string
  subtitleClass?: string
  ctaClass?: string
}>(), {
  id: 'faq',
  subtitle: '',
  ctaTo: '/faq',
  ctaLabel: 'View all FAQs →',
  sectionClass: 'bg-neutral-50',
  hideFaqLabel: false,
  titleClass: 'text-neutral-900',
  subtitleClass: 'text-neutral-600',
  ctaClass: 'border-neutral-300 bg-surface text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400',
})
</script>
