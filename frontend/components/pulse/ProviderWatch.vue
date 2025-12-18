<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">
        Provider Watch
      </h2>
      <div class="text-sm text-gray-500">
        Showing {{ providers.length }} providers
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Provider
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                Delivered value
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                Speed
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                Reliability
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Notes
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="provider in providers"
              :key="provider.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-4">
                <div class="flex items-center">
                  <div class="mr-3 h-8 w-8 rounded bg-gray-100" />
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ provider.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ provider.countries }} countries
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-col items-center">
                  <div
                    class="mb-1 text-lg font-bold"
                    :class="provider.valueColor"
                  >
                    {{ provider.valueIndex }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ provider.valueLabel }}
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="provider.speedClass"
                >
                  {{ provider.speed }}
                </span>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <div class="mb-1 text-sm font-semibold text-gray-900">
                    {{ provider.reliability }}%
                  </div>
                  <div class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div
                      class="h-full rounded-full"
                      :class="provider.reliabilityColor"
                      :style="{ width: `${provider.reliability}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="note in provider.notes"
                    :key="note"
                    class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {{ note }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const providers = [
  {
    id: 'wise',
    name: 'Wise',
    countries: 80,
    valueIndex: '9.8',
    valueLabel: 'Excellent',
    valueColor: 'text-green-600',
    speed: 'Minutes-2d',
    speedClass: 'bg-blue-100 text-blue-700',
    reliability: 99,
    reliabilityColor: 'bg-green-500',
    notes: ['Transparent pricing', 'Real mid-rate'],
  },
  {
    id: 'remitly',
    name: 'Remitly',
    countries: 135,
    valueIndex: '9.5',
    valueLabel: 'Excellent',
    valueColor: 'text-green-600',
    speed: '15min-2d',
    speedClass: 'bg-green-100 text-green-700',
    reliability: 98,
    reliabilityColor: 'bg-green-500',
    notes: ['Promo detected', 'Cash pickup strong'],
  },
  {
    id: 'xe',
    name: 'XE Money',
    countries: 130,
    valueIndex: '8.9',
    valueLabel: 'Very Good',
    valueColor: 'text-blue-600',
    speed: '1-4 days',
    speedClass: 'bg-yellow-100 text-yellow-700',
    reliability: 97,
    reliabilityColor: 'bg-green-500',
    notes: ['Large amount focus'],
  },
  {
    id: 'xoom',
    name: 'Xoom',
    countries: 160,
    valueIndex: '8.7',
    valueLabel: 'Very Good',
    valueColor: 'text-blue-600',
    speed: 'Minutes-days',
    speedClass: 'bg-blue-100 text-blue-700',
    reliability: 96,
    reliabilityColor: 'bg-green-500',
    notes: ['PayPal backed'],
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    countries: 150,
    valueIndex: '8.4',
    valueLabel: 'Good',
    valueColor: 'text-gray-700',
    speed: 'Minutes-days',
    speedClass: 'bg-blue-100 text-blue-700',
    reliability: 95,
    reliabilityColor: 'bg-yellow-500',
    notes: ['Higher FX spread', 'Wide coverage'],
  },
]
</script>

