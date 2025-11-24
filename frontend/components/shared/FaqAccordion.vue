<template>
  <div class="space-y-4 break-words [text-wrap:pretty]">
    <div
      v-for="(faq, index) in faqs"
      :key="index"
      class="rounded-lg border border-gray-200"
    >
      <button
        class="flex w-full items-start justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50"
        @click="toggleFaq(index)"
      >
        <span class="flex-1 text-left font-medium leading-relaxed text-gray-900 [text-wrap:pretty]">{{ faq.question }}</span>
        <svg
          class="mt-1 h-5 w-5 flex-shrink-0 transform text-gray-500 transition-transform"
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
        class="px-6 pb-4 text-gray-600 prose prose-sm max-w-none break-words [text-wrap:pretty] mx-auto"
      >
        <div
          class="leading-relaxed"
          v-html="faq.answer"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Faq {
  question: string
  answer: string
}

defineProps<{
  faqs: Faq[]
}>()

const openFaqs = ref<number[]>([])

const toggleFaq = (index: number) => {
  const faqIndex = openFaqs.value.indexOf(index)
  if (faqIndex > -1) {
    openFaqs.value.splice(faqIndex, 1)
  }
  else {
    openFaqs.value.push(index)
  }
}
</script>
