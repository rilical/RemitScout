<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8">
        <h1 class="mb-4 text-4xl font-bold text-gray-900">Money Transfer Providers</h1>
        <p class="mb-6 text-xl text-gray-600">
          Compare top money transfer companies and find the best provider for your needs.
        </p>

        <FiltersBar v-model="filters" />
      </div>

      <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProviderCard
          v-for="provider in filteredProviders"
          :key="provider.id"
          :provider="provider"
        />
      </div>

      <div class="rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Why Choose These Providers?</h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">Regulated & Secure</h3>
            <p class="text-gray-600">
              All providers are fully regulated and use bank-level security.
            </p>
          </div>
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">Competitive Rates</h3>
            <p class="text-gray-600">Get the best exchange rates and lowest transfer fees.</p>
          </div>
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">Fast Transfers</h3>
            <p class="text-gray-600">Most transfers complete within minutes or hours, not days.</p>
          </div>
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">Global Coverage</h3>
            <p class="text-gray-600">Send money to over 200 countries worldwide.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: 'Money Transfer Providers | Compare Top Companies | Remit-Scout',
  meta: [
    {
      name: 'description',
      content:
        'Compare top money transfer providers including Wise, Western Union, Remitly and more. Find the best rates, lowest fees, and fastest transfers.',
    },
  ],
});

// Breadcrumbs
const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Providers', path: '/providers' },
];

// Data
const filters = ref({
  region: '',
  features: [],
  rating: 0,
});

// Providers data (mock for now)
const { data: providers } = await useProviders();
const filteredProviders = computed(() => {
  return providers.value || [];
});
</script>
