<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
    <h3 class="mb-1 text-xl font-bold text-neutral-900">{{ category.title }}</h3>
    <p class="mb-4 text-sm text-neutral-600">{{ category.description }}</p>
    <div class="space-y-3">
      <div
        v-for="(faq, index) in category.faqs"
        :key="index"
        class="rounded-xl border border-neutral-200 bg-white transition-all"
        :class="openFaqs.includes(index) ? 'shadow-md' : ''"
      >
        <button
          class="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600"
          @click="toggleFaq(index)"
        >
          <span class="pr-4 text-base font-semibold text-neutral-800">{{ faq.question }}</span>
          <svg
            class="h-5 w-5 flex-shrink-0 transform text-neutral-400 transition-transform duration-200"
            :class="{ 'rotate-180': openFaqs.includes(index) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          v-if="openFaqs.includes(index)"
          class="prose prose-sm max-w-none px-5 pb-4 text-neutral-600"
          v-html="faq.answer"
        ></div>
      </div>
    </div>
    <NuxtLink
      :to="category.link"
      class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
    >
      <span>Explore all {{ category.count }} articles</span>
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  title: string
  description: string
  link: string
  count: number
  faqs: FaqItem[]
}

defineProps<{
  category: FaqCategory
}>()

const openFaqs = ref<number[]>([])

const toggleFaq = (index: number) => {
  const faqIndex = openFaqs.value.indexOf(index)
  if (faqIndex > -1) {
    openFaqs.value.splice(faqIndex, 1)
  } else {
    openFaqs.value.push(index)
  }
}
</script>
