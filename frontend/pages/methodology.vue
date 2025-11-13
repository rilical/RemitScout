<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-4xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-8">
            <h1 class="mb-4 text-4xl font-bold text-gray-900">Our Methodology</h1>
            <p class="text-gray-600">Last updated: January 1, 2024</p>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6">
              Our methodology ensures that our money transfer provider comparisons, ratings, and
              reviews are objective, data-driven, and reliable. Here's how we evaluate and rank
              providers.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Rating Criteria</h2>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Exchange Rates (25%)</h3>
            <p class="mb-4">
              We analyze the exchange rates offered compared to the mid-market rate. Providers
              offering rates closer to the mid-market rate receive higher scores.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Transfer Fees (25%)</h3>
            <p class="mb-4">
              We evaluate the fee structure for different transfer amounts and destinations. Lower
              fees and transparent pricing receive higher scores.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">User Reviews (20%)</h3>
            <p class="mb-4">
              We aggregate and analyze user reviews from multiple sources, focusing on satisfaction
              ratings, complaint resolution, and overall experience.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Transfer Speed (15%)</h3>
            <p class="mb-4">
              We assess how quickly transfers are typically completed, including processing times
              and delivery speeds.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Security & Regulation (10%)</h3>
            <p class="mb-4">
              We evaluate regulatory compliance, security measures, and data protection practices.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Customer Service (5%)</h3>
            <p class="mb-4">
              We assess the quality and availability of customer support channels and response
              times.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Data Collection Process</h2>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Rate Collection</h3>
            <p class="mb-4">
              We collect exchange rates and fees through API integrations, web scraping, and manual
              verification. Data is updated multiple times daily to ensure accuracy.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Review Aggregation</h3>
            <p class="mb-4">
              We collect reviews from our platform, Trustpilot, Google Reviews, and other reputable
              sources. Reviews are weighted by recency and verified for authenticity.
            </p>

            <h3 class="mb-2 text-xl font-semibold text-gray-900">Speed Testing</h3>
            <p class="mb-4">
              We conduct regular transfer tests and analyze user-reported transfer times to verify
              speed claims.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Ranking Algorithm</h2>
            <p class="mb-6">
              Our ranking algorithm combines all criteria using weighted averages. The algorithm is
              regularly reviewed and updated to reflect changing market conditions and user
              priorities.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Quality Assurance</h2>
            <p class="mb-4">Our quality assurance process includes:</p>
            <ul class="mb-6 list-inside list-disc space-y-1">
              <li>Daily data validation checks</li>
              <li>Monthly algorithm reviews</li>
              <li>Quarterly methodology updates</li>
              <li>Independent audits of our processes</li>
              <li>User feedback integration</li>
            </ul>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Limitations</h2>
            <p class="mb-6">
              While we strive for accuracy, our ratings are based on available data and may not
              reflect every user's experience. Exchange rates fluctuate, and individual transfer
              experiences may vary.
            </p>

            <h2 class="mb-4 text-2xl font-bold text-gray-900">Continuous Improvement</h2>
            <p class="mb-6">
              We continuously refine our methodology based on user feedback, industry changes, and
              technological advancements. Our goal is to provide the most accurate and useful
              comparisons possible.
            </p>

            <div class="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 class="mb-2 text-lg font-semibold text-green-900">Transparent & Accountable</h3>
              <p class="text-green-800">
                We're committed to transparency in our methodology. If you have questions or
                suggestions for improvement, please contact us at
                <a href="mailto:methodology@Remit-Scout.com" class="font-medium underline"
                  >methodology@Remit-Scout.com</a
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
  title: 'Our Methodology | How We Rate Money Transfer Providers | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        "Learn about Remit-Scout's methodology for rating and ranking money transfer providers. Understand our data collection, rating criteria, and quality assurance processes.",
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Methodology', path: '/methodology' },
];
</script>
