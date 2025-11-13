<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h1 class="mb-6 text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p class="mb-8 text-xl text-gray-600">
            Find answers to common questions about international money transfers and using
            Remit-Scout.
          </p>

          <FaqAccordion :faqs="faqs" />
        </div>

        <div
          class="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-center text-white"
        >
          <h2 class="mb-2 text-2xl font-bold">Still have questions?</h2>
          <p class="mb-4 text-primary-100">
            Our support team is here to help you find the perfect money transfer solution.
          </p>
          <NuxtLink to="/contact" class="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            Contact Support
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Frequently Asked Questions | Money Transfer FAQ | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Find answers to frequently asked questions about international money transfers, fees, exchange rates, and using Remit-Scout to compare providers.',
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'FAQ', path: '/faq' },
];

// FAQ data
const faqs = ref([
  {
    question: 'How do I choose the best money transfer provider?',
    answer:
      'Consider factors like exchange rates, transfer fees, speed, security, and customer service. Use our comparison tools to see side-by-side comparisons of top providers.',
  },
  {
    question: 'Are money transfer services safe?',
    answer:
      'Yes, reputable money transfer services are regulated and use bank-level security. Always check for regulatory compliance and user reviews before choosing a provider.',
  },
  {
    question: 'How long do international transfers take?',
    answer:
      'Transfer times vary by provider and destination. Most transfers complete within 1-5 business days, with some offering instant or same-day delivery.',
  },
  {
    question: 'What are the typical fees for money transfers?',
    answer:
      'Fees vary by provider, amount, and destination. They can range from 0.5% to 3% of the transfer amount plus fixed fees. Compare providers to find the best rates.',
  },
  {
    question: 'Can I track my money transfer?',
    answer:
      "Yes, most providers offer tracking services. You'll receive a reference number and can monitor your transfer status through their website or app.",
  },
  {
    question: 'What information do I need to send money internationally?',
    answer:
      "You typically need the recipient's full name, address, bank details, and sometimes identification. Requirements vary by destination and amount.",
  },
  {
    question: 'Are there limits on how much I can transfer?',
    answer:
      'Yes, providers have daily, monthly, and yearly limits. These vary by provider and your verification level. Contact providers for specific limits.',
  },
  {
    question: 'What is the difference between exchange rates and transfer fees?',
    answer:
      'Exchange rates determine how much foreign currency you get, while transfer fees are the charges for the service. Both affect the total cost of your transfer.',
  },
]);
</script>
