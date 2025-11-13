<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h1 class="mb-6 text-4xl font-bold text-gray-900">About Remit-Scout</h1>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6 text-xl text-gray-600">
              Remit-Scout is your trusted partner for finding the best international money transfer
              services. We help individuals and businesses compare providers to get the best rates,
              lowest fees, and fastest transfers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Our Mission</h2>
            <p class="mb-6">
              To empower people worldwide with transparent, reliable, and cost-effective
              international money transfer solutions. We believe everyone deserves access to fair
              financial services regardless of where they send money.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">What We Do</h2>
            <ul class="mb-6 list-inside list-disc space-y-2">
              <li>Compare money transfer providers in real-time</li>
              <li>Provide unbiased reviews and ratings</li>
              <li>Offer educational resources about international transfers</li>
              <li>Track exchange rates and market trends</li>
              <li>Help users save money on transfer fees</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Why Choose Us</h2>
            <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="flex items-start">
                <svg
                  class="mr-3 mt-1 h-6 w-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h3 class="font-semibold text-gray-900">Unbiased Comparisons</h3>
                  <p class="text-gray-600">
                    We don't favor any provider - our recommendations are based on data and user
                    reviews.
                  </p>
                </div>
              </div>
              <div class="flex items-start">
                <svg
                  class="mr-3 mt-1 h-6 w-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h3 class="font-semibold text-gray-900">Real-Time Data</h3>
                  <p class="text-gray-600">
                    Exchange rates and fees are updated continuously for accurate comparisons.
                  </p>
                </div>
              </div>
              <div class="flex items-start">
                <svg
                  class="mr-3 mt-1 h-6 w-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h3 class="font-semibold text-gray-900">Expert Analysis</h3>
                  <p class="text-gray-600">
                    Our team of financial experts regularly reviews and updates provider
                    information.
                  </p>
                </div>
              </div>
              <div class="flex items-start">
                <svg
                  class="mr-3 mt-1 h-6 w-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <h3 class="font-semibold text-gray-900">User-Centric</h3>
                  <p class="text-gray-600">
                    Built by users, for users - we prioritize what matters most to you.
                  </p>
                </div>
              </div>
            </div>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Our Team</h2>
            <p class="mb-6">
              Remit-Scout is built by a team of financial technology experts, former remittance
              industry professionals, and user experience designers who understand the challenges of
              international money transfers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Contact Us</h2>
            <p class="mb-6">
              Have questions or feedback? We'd love to hear from you.
              <NuxtLink to="/contact" class="font-medium text-primary-600 hover:text-primary-700"
                >Get in touch</NuxtLink
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'About Us | Remit-Scout - Your Money Transfer Comparison Partner',
  meta: [
    {
      name: 'description',
      content:
        "Learn about Remit-Scout's mission to provide transparent, unbiased money transfer comparisons. Meet our team and understand how we help you save money.",
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];
</script>
