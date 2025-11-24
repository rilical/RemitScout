<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mx-auto max-w-5xl">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-6 flex items-start justify-between">
            <div>
              <h1 class="mb-3 text-4xl font-bold text-gray-900">
                How We Make Money
              </h1>
              <p class="text-gray-600">
                Transparency on revenue and editorial independence.
              </p>
            </div>
            <Badge variant="secondary">
              Updated 2025
            </Badge>
          </div>

          <div class="prose prose-lg max-w-none">
            <p class="mb-6">
              Remit-Scout compares licensed money transfer providers. We keep the service free by
              earning revenue in a few clearly defined ways. None of these change how we score
              providers or which options we show first.
            </p>

            <h2 class="mb-3 text-2xl font-bold text-gray-900">
              Revenue streams
            </h2>
            <ul class="mb-6 list-inside list-disc space-y-2">
              <li><strong>Affiliate commissions:</strong> Paid when a user we refer completes a sign-up or transfer.</li>
              <li><strong>Advertising placements:</strong> Marked as “Sponsored” and separated from organic rankings.</li>
              <li><strong>Partnerships & APIs:</strong> White-label data access for partners; no impact on consumer rankings.</li>
              <li><strong>Premium tooling:</strong> Optional business-tier analytics (coming soon).</li>
            </ul>

            <h2 class="mb-3 text-2xl font-bold text-gray-900">
              Editorial guardrails
            </h2>
            <ul class="mb-6 list-inside list-disc space-y-2">
              <li>Business and editorial teams are separated; commercial deals cannot alter Remit-Score.</li>
              <li>Sponsored slots never replace top-scoring organic results; they are labeled.</li>
              <li>Promo pricing is tagged and doesn’t inflate long-term scores.</li>
              <li>We publish methodology updates and change logs when weights shift.</li>
            </ul>

            <h2 class="mb-3 text-2xl font-bold text-gray-900">
              User-first ranking policy
            </h2>
            <p class="mb-4">
              Providers are ranked by total cost (fees + FX), delivery speed, payout breadth, and trust
              signals. If a provider we don’t partner with beats a partner on cost or speed, it still
              appears higher.
            </p>
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <strong class="text-emerald-900">Example:</strong>
              <p class="text-emerald-800 mb-0">
                If Provider A (no affiliate link) pays the recipient more than Provider B (affiliate), Provider A ranks above Provider B for that corridor/amount.
              </p>
            </div>

            <h2 class="mb-3 text-2xl font-bold text-gray-900">
              Conflict checks
            </h2>
            <ul class="mb-6 list-inside list-disc space-y-2">
              <li>Quarterly audits of affiliate impact on rankings.</li>
              <li>Dedicated disclosure labels on affiliate buttons and sponsored modules.</li>
              <li>User feedback loop to flag mis-ranked offers.</li>
            </ul>

            <h2 class="mb-3 text-2xl font-bold text-gray-900">
              Questions?
            </h2>
            <p>
              Email <a
                href="mailto:transparency@Remit-Scout.com"
                class="text-primary-600 hover:text-primary-700"
              >transparency@Remit-Scout.com</a>
              if you want more detail about any partnership, ad placement, or ranking decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'How We Make Money | Remit-Scout Transparency',
  meta: [
    {
      name: 'description',
      content:
        'Learn how Remit-Scout earns revenue through affiliate links, ads, and partnerships without affecting rankings or Remit-Score.',
    },
  ],
})

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'How We Make Money', path: '/how-we-make-money' },
]
</script>
