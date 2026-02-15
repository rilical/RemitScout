<template>
  <section
    :id="id"
    class="py-16 lg:py-20 scroll-mt-20"
    :class="sectionClass"
  >
    <div class="container">
      <div class="mx-auto max-w-4xl">
        <div class="text-center mb-12">
          <span
            v-if="!hideFaqLabel"
            class="inline-flex items-center gap-2 text-brand-600 font-semibold text-body-sm mb-3"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            FAQ
          </span>
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

        <div class="rounded-2xl border border-neutral-200 bg-surface shadow-sm overflow-hidden">
          <FaqAccordion :faqs="faqs" />
        </div>

        <div
          v-if="ctaTo"
          class="mt-8 text-center"
        >
          <NuxtLink
            :to="ctaTo"
            :class="['inline-flex items-center justify-center rounded-xl border-2 px-6 py-3 text-body font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2', ctaClass]"
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
