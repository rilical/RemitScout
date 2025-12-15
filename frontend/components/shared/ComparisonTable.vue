<template>
  <div class="overflow-hidden rounded-lg bg-white shadow-md">
    <div class="border-b bg-gray-50 px-6 py-4">
      <h2 class="text-lg font-semibold text-gray-900">
        Provider Comparison
      </h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Provider
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Rating
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Fees
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Speed
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="provider in providers"
            :key="provider.id"
          >
            <td class="whitespace-nowrap px-6 py-4">
              <div class="flex items-center">
                <ProviderLogo
                  :slug="provider.slug"
                  :alt="provider.name"
                  class="mr-3 h-8 w-8"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ provider.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ provider.countries }} countries
                  </div>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="flex items-center">
                <Stars
                  :rating="provider.rating"
                  size="sm"
                />
                <span class="ml-2 text-sm text-gray-900">{{ provider.rating }}/5</span>
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
              {{ provider.fees || 'N/A' }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
              {{ provider.speed }}
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <NuxtLink
                :to="`/providers/${provider.slug}`"
                class="font-medium text-primary-600 hover:text-primary-900"
              >
                View Details
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Provider {
  id: string
  name: string
  slug: string
  rating: number
  countries: number
  fees?: string
  speed: string
}

interface Props {
  providers?: Provider[]
  offers?: any[]
  comparison?: boolean
}

withDefaults(defineProps<Props>(), {
  comparison: false,
})
</script>
