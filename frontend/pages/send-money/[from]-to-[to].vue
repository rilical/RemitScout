<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h1 class="mb-4 text-3xl font-bold text-gray-900">
          Send Money from {{ $route.params.from?.toUpperCase() }} to
          {{ $route.params.to?.toUpperCase() }}
        </h1>
        <p class="mb-6 text-gray-600">
          Compare the best money transfer providers for sending money from
          {{ $route.params.from?.toUpperCase() }} to {{ $route.params.to?.toUpperCase() }}.
        </p>

        <CountrySelect v-model:from="fromCountry" v-model:to="toCountry" />
        <AmountInput v-model="amount" :from="fromCountry" :to="toCountry" />
      </div>

      <ComparisonTable :offers="offers" />
      <StickyCTA />
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: `Send Money from ${useRoute().params.from?.toUpperCase()} to ${useRoute().params.to?.toUpperCase()} | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content: `Compare money transfer providers for sending money from ${useRoute().params.from?.toUpperCase()} to ${useRoute().params.to?.toUpperCase()}. Get the best rates and lowest fees.`,
    },
  ],
});

// Data
const route = useRoute();
const fromCountry = ref(route.params.from || '');
const toCountry = ref(route.params.to || '');
const amount = ref(1000);

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Send Money', path: '/send-money' },
  {
    name: `${fromCountry.value.toUpperCase()} to ${toCountry.value.toUpperCase()}`,
    path: route.path,
  },
]);

// Offers
const { data: offers } = await $fetch('/api/offers', {
  query: {
    from: fromCountry.value,
    to: toCountry.value,
    amount: amount.value,
  },
});
</script>
