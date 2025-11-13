<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">Disclosure Policy</h1>
            <p class="text-gray-600">Last updated: January 1, 2024</p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6">
              At Remit-Scout, transparency is fundamental to our mission. This Disclosure Policy
              explains how we maintain our independence and how we may earn compensation while
              providing unbiased information.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Our Independence</h2>
            <p class="mb-6">
              Remit-Scout operates independently and is not owned by any money transfer provider. Our
              recommendations and reviews are based on objective analysis of available data and are
              not influenced by commercial relationships.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Affiliate Relationships</h2>
            <p class="mb-6">
              We participate in affiliate marketing programs with some money transfer providers.
              When you use our links to sign up for services, we may receive compensation. This does
              not affect our rankings or reviews.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">How We Make Money</h2>
            <p class="mb-4">Remit-Scout generates revenue through:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Affiliate commissions from referred customers</li>
              <li>Advertising partnerships</li>
              <li>Sponsored content (clearly marked)</li>
              <li>Premium services or tools</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Our Review Process</h2>
            <p class="mb-4">Our evaluations are based on:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Exchange rates and fee structures</li>
              <li>Customer service quality</li>
              <li>User reviews and ratings</li>
              <li>Security and regulatory compliance</li>
              <li>Transfer speed and reliability</li>
              <li>Geographic coverage</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Sponsored Content</h2>
            <p class="mb-6">
              Sponsored content is clearly labeled as such. Sponsored providers receive the same
              rigorous evaluation as non-sponsored providers, and sponsorship does not guarantee
              favorable treatment or placement.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Data Sources</h2>
            <p class="mb-6">
              We collect data from provider websites, regulatory bodies, user submissions, and
              market research. All data is verified for accuracy and updated regularly.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">User Reviews</h2>
            <p class="mb-6">
              User reviews are collected through our platform and verified for authenticity. We
              moderate reviews to ensure they comply with our community guidelines but do not alter
              their content or ratings.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Conflicts of Interest</h2>
            <p class="mb-6">
              Our editorial team operates independently from our business development team.
              Editorial decisions are made without consideration of potential revenue impact.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Updates to This Policy</h2>
            <p class="mb-6">
              We may update this Disclosure Policy from time to time. Changes will be posted on this
              page with an updated effective date.
            </p>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-blue-900">Questions?</h3>
              <p class="text-blue-800">
                If you have questions about our disclosure practices, please contact us at
                <a href="mailto:disclosure@Remit-Scout.com" class="font-medium underline"
                  >disclosure@Remit-Scout.com</a
                >.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Disclosure Policy | How We Maintain Independence | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        "Learn about Remit-Scout's disclosure policy and how we maintain independence while providing unbiased money transfer comparisons and reviews.",
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Disclosure Policy', path: '/disclosure' },
];
</script>
