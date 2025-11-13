<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <div class="mb-6 flex items-start justify-between">
          <div class="flex items-center">
            <ProviderLogo :provider="provider" class="mr-4 h-16 w-16" />
            <div>
              <h1 class="mb-2 text-4xl font-bold text-gray-900">
                {{ provider?.name }}
              </h1>
              <div class="flex items-center">
                <Stars :rating="provider?.rating" />
                <span class="ml-2 text-gray-600">{{ provider?.reviewCount }} reviews</span>
              </div>
            </div>
          </div>
          <Badge v-if="provider?.featured" variant="primary"> Featured </Badge>
        </div>

        <p class="mb-8 text-lg text-gray-600">
          {{ provider?.description }}
        </p>

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ provider?.transferSpeed }}
            </div>
            <div class="text-gray-600">Transfer Speed</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">{{ provider?.countries }}+</div>
            <div class="text-gray-600">Countries</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">{{ provider?.rating }}/5</div>
            <div class="text-gray-600">User Rating</div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">Key Features</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div v-for="feature in provider?.features" :key="feature" class="flex items-center">
              <svg class="mr-2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ feature }}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Recent Reviews</h2>
        <div class="space-y-4">
          <div
            v-for="review in provider?.recentReviews"
            :key="review.id"
            class="border-b border-gray-200 pb-4"
          >
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center">
                <Stars :rating="review.rating" size="sm" />
                <span class="ml-2 font-medium">{{ review.author }}</span>
              </div>
              <span class="text-sm text-gray-500">{{ review.date }}</span>
            </div>
            <p class="text-gray-600">
              {{ review.comment }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Fees & Exchange Rates</h2>
        <p class="mb-4 text-gray-600">
          Current fees and exchange rates for {{ provider?.name }}. Rates are updated in real-time.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="py-2 text-left">Amount Range</th>
                <th class="py-2 text-left">Transfer Fee</th>
                <th class="py-2 text-left">Exchange Rate</th>
                <th class="py-2 text-left">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rate in provider?.rateTable" :key="rate.range" class="border-b">
                <td class="py-2">
                  {{ rate.range }}
                </td>
                <td class="py-2">
                  {{ rate.fee }}
                </td>
                <td class="py-2">
                  {{ rate.exchangeRate }}
                </td>
                <td class="py-2 font-medium">
                  {{ rate.totalCost }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
const route = useRoute();
useHead({
  title: `${useProvider(route.params.slug as string)?.name || 'Provider'} | Reviews, Fees & Rates | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content: `Read reviews, compare fees and exchange rates for ${useProvider(route.params.slug as string)?.name || 'this provider'}. Get the best deals for international money transfers.`,
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Providers', path: '/providers' },
  { name: useProvider(route.params.slug as string)?.name || 'Provider', path: route.path },
]);

// Provider data
const { data: provider } = await useProvider(route.params.slug as string);
</script>
