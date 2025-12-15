<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h1 class="mb-4 text-4xl font-bold text-gray-900">
          {{ providerA?.name || 'Provider A' }} vs {{ providerB?.name || 'Provider B' }}
        </h1>
        <p class="mb-6 text-xl text-gray-600">
          Compare {{ providerA?.name || 'Provider A' }} and {{ providerB?.name || 'Provider B' }} side by side to find the best
          money transfer provider for your needs.
        </p>

        <div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div class="flex items-center">
            <svg
              class="mr-2 h-5 w-5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="font-medium text-blue-800">Comparison based on current rates and user reviews</span>
          </div>
        </div>
      </div>

      <ComparisonTable
        v-if="providerA && providerB"
        :providers="[{
          id: providerA.id,
          name: providerA.name,
          slug: providerA.slug,
          rating: providerA.rating,
          countries: providerA.countries,
          speed: providerA.speed,
        }, {
          id: providerB.id,
          name: providerB.name,
          slug: providerB.slug,
          rating: providerB.rating,
          countries: providerB.countries,
          speed: providerB.speed,
        }]"
        :comparison="true"
      />

      <div class="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-2xl font-bold text-gray-900">
            {{ providerA?.name }} Overview
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Rating</span>
              <div class="flex items-center">
                <Stars :rating="providerA?.rating" />
                <span class="ml-2 text-gray-900">{{ providerA?.rating }}/5</span>
              </div>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Transfer Speed</span>
              <span class="text-gray-900">{{ providerA?.speed }}</span>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Countries</span>
              <span class="text-gray-900">{{ providerA?.countries }}+</span>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Trust Score</span>
              <span class="text-gray-900">{{ providerA?.score }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-2xl font-bold text-gray-900">
            {{ providerB?.name }} Overview
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Rating</span>
              <div class="flex items-center">
                <Stars :rating="providerB?.rating" />
                <span class="ml-2 text-gray-900">{{ providerB?.rating }}/5</span>
              </div>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Transfer Speed</span>
              <span class="text-gray-900">{{ providerB?.speed }}</span>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Countries</span>
              <span class="text-gray-900">{{ providerB?.countries }}+</span>
            </div>
            <div class="flex items-center justify-between border-b py-2">
              <span class="text-gray-600">Trust Score</span>
              <span class="text-gray-900">{{ providerB?.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">
          Which Should You Choose?
        </h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">
              Choose {{ providerA?.name }} if:
            </h3>
            <ul class="list-inside list-disc space-y-1 text-gray-600">
              <li
                v-for="reason in (providerA?.features || [])"
                :key="reason"
              >
                {{ reason }}
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-2 text-lg font-semibold text-gray-900">
              Choose {{ providerB?.name }} if:
            </h3>
            <ul class="list-inside list-disc space-y-1 text-gray-600">
              <li
                v-for="reason in (providerB?.features || [])"
                :key="reason"
              >
                {{ reason }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
const route = useRoute()
const { data: providerAForMeta } = await useProvider(route.params.a as string)
const { data: providerBForMeta } = await useProvider(route.params.b as string)

useHead({
  title: `${providerAForMeta.value?.name || 'Provider A'} vs ${providerBForMeta.value?.name || 'Provider B'} | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content: `Compare ${providerAForMeta.value?.name || 'Provider A'} vs ${providerBForMeta.value?.name || 'Provider B'}. Side-by-side comparison of fees, rates, speed, and user reviews.`,
    },
  ],
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Compare', path: '/compare' },
  { name: `${route.params.a} vs ${route.params.b}`, path: route.path },
])

// Provider data
const { data: providerA } = await useProvider(route.params.a as string)
const { data: providerB } = await useProvider(route.params.b as string)
</script>
