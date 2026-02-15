<template>
  <div class="mb-6 rounded-lg bg-surface p-4 shadow-md">
    <div class="flex flex-wrap items-center gap-4">
      <div>
        <label class="mb-1 block text-body-sm font-medium text-neutral-700">Region</label>
        <select
          v-model="filters.region"
          class="rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">
            All Regions
          </option>
          <option value="americas">
            Americas
          </option>
          <option value="asia">
            Asia
          </option>
          <option value="africa">
            Africa
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-body-sm font-medium text-neutral-700">Rating</label>
        <select
          v-model="filters.rating"
          class="rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="0">
            All Ratings
          </option>
          <option value="4">
            4+ Stars
          </option>
          <option value="3">
            3+ Stars
          </option>
        </select>
      </div>

      <div class="flex flex-wrap gap-2">
        <label class="text-body-sm font-medium text-neutral-700">Features:</label>
        <label
          v-for="feature in features"
          :key="feature.id"
          class="inline-flex items-center"
        >
          <input
            v-model="filters.features"
            :value="feature.id"
            type="checkbox"
            class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          >
          <span class="ml-2 text-body-sm text-neutral-700">{{ feature.name }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Feature {
  id: string
  name: string
}

interface Filters {
  region: string
  rating: number
  features: string[]
}

const filters = defineModel<Filters>('modelValue', {
  default: () => ({
    region: '',
    rating: 0,
    features: [],
  }),
})

const features = ref<Feature[]>([
  { id: 'instant', name: 'Instant Transfer' },
  { id: 'mobile', name: 'Mobile App' },
  { id: 'cash', name: 'Cash Pickup' },
  { id: 'tracking', name: 'Transfer Tracking' },
])
</script>
