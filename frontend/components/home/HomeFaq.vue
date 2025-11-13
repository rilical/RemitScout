<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
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
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const openFaqs = ref<number[]>([]);

const toggleFaq = (index: number) => {
  const faqIndex = openFaqs.value.indexOf(index);
  if (faqIndex > -1) {
    openFaqs.value.splice(faqIndex, 1);
  } else {
    openFaqs.value.push(index);
  }
};

const faqs = [
  {
    question: 'How does Remit-Scout compare money transfer providers?',
    answer: 'Remit-Scout pulls <span class="text-brand-600 font-semibold">real-time rates</span> directly from providers to compare exchange rates, fees, and delivery times. We present everything in an <span class="text-brand-600 font-semibold">easy-to-understand format</span> so you can quickly identify the <span class="text-brand-600 font-semibold">best option</span> for your specific transfer needs.'
  },
  {
    question: 'Why do you show more providers than other comparison sites?',
    answer: "We've built partnerships with a wide range of money transfer providers to give you <span class=\"text-brand-600 font-semibold\">more options</span>. More choice means <span class=\"text-brand-600 font-semibold\">better rates and services</span> for different types of transfers. We continuously expand our network to include new and innovative providers."
  },
  {
    question: 'How accurate are your exchange rates and fees?',
    answer: "Our rates are sourced directly from providers and <span class=\"text-brand-600 font-semibold\">updated in real-time</span>. However, exchange rates can fluctuate quickly, so the final rate you receive may vary slightly from what you see on our site. We always recommend <span class=\"text-brand-600 font-semibold\">checking the final rate</span> with the provider before confirming your transfer."
  },
  {
    question: 'How can you offer this service for free?',
    answer: "We earn a small commission from providers when you complete a transfer through our platform. This <span class=\"text-brand-600 font-semibold\">doesn't affect the rates or fees you pay</span>, it's built into the provider's standard pricing. Our commission model allows us to offer our comparison service <span class=\"text-brand-600 font-semibold\">completely free to users</span>."
  },
  {
    question: 'Do you share my information with providers?',
    answer: "We only share the information necessary to provide you with accurate quotes and to facilitate your transfer if you choose to proceed with a provider. We <span class=\"text-brand-600 font-semibold\">never sell your personal information</span> to third parties. Please review our privacy policy for detailed information about how we handle your data."
  }
];

// Strip HTML tags from answers for schema
const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '');
};

// Generate FAQPage schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": stripHtml(faq.answer)
    }
  }))
};

// Inject JSON-LD schema into head
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(faqSchema)
    }
  ]
});
</script>

