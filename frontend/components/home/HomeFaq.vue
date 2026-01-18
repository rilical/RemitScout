<template>
  <section class="py-12 sm:py-16 bg-slate-900">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h2>
      </div>

      <div class="space-y-3">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="rounded-xl border border-neutral-200 bg-white overflow-hidden transition-all"
          :class="openFaqs.includes(index) ? 'shadow-md' : ''"
        >
          <button
            class="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600"
            @click="toggleFaq(index)"
          >
            <span class="font-semibold text-neutral-900 text-base sm:text-lg pr-4">{{ faq.question }}</span>
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
            class="px-6 pb-5 text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4"
            v-html="faq.answer"
          />
        </div>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink
          to="/faq"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-700 transition-colors shadow-lg"
        >
          View More Questions
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
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

const faqs = [
  {
    question: 'How does Remit-Scout compare money transfer providers?',
    answer: 'Remit‑Scout collects provider quotes and standardizes them so you can compare <span class="text-brand-600 font-semibold">exchange rates</span>, <span class="text-brand-600 font-semibold">fees</span>, and <span class="text-brand-600 font-semibold">estimated delivery times</span> on the same basis. We highlight <span class="text-brand-600 font-semibold">Recipient gets</span> so you can see the delivered amount after fees and FX markup.',
  },
  {
    question: 'Why do you show more providers than other comparison sites?',
    answer: 'We focus on coverage. If a provider serves a corridor and we can capture <span class="text-brand-600 font-semibold">consistent, comparable quotes</span>, we include it, even when it’s not a household name. That usually means you see more options, including specialists and bank alternatives.',
  },
  {
    question: 'How accurate are your exchange rates and fees?',
    answer: 'Quotes are captured at <span class="text-brand-600 font-semibold">specific timestamps</span> and refreshed regularly (cadence varies by provider and corridor). Rates can move quickly, so what you see may differ slightly from what you get at checkout. The provider’s checkout is the <span class="text-brand-600 font-semibold">final source of truth</span> before you confirm a transfer.',
  },
  {
    question: 'How can you offer this service for free?',
    answer: 'We may earn a commission if you click a <span class="text-brand-600 font-semibold">disclosed</span> provider link and complete a transfer. You don’t pay extra because of that commission, and providers cannot pay for better placement. Comparisons stay <span class="text-brand-600 font-semibold">free to use</span>.',
  },
  {
    question: 'Do you share my information with providers?',
    answer: 'We don’t sell your personal information. If you click through to a provider, you complete your transfer on their site and they collect whatever details they need directly from you. For the full breakdown of how we handle data, see our <span class="text-brand-600 font-semibold">privacy policy</span>.',
  },
]

// Strip HTML tags from answers for schema
const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '')
}

// Generate FAQPage schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': stripHtml(faq.answer),
    },
  })),
}

// Inject JSON-LD schema into head
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(faqSchema),
    },
  ],
})
</script>
