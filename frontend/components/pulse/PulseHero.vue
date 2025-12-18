<template>
  <div class="rounded-lg bg-white p-6 shadow-sm">
    <div class="mb-6">
      <h1 class="mb-2 text-3xl font-bold text-gray-900">
        Pulse
      </h1>
      <p class="text-lg text-gray-600">
        Live market signals for rates, fees, and delivery—based on real quotes.
      </p>
      <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-green-500" />
          <span>Last updated {{ lastUpdated }}</span>
        </div>
        <button
          class="text-primary-600 hover:text-primary-700"
          @click="showMethodology = true"
        >
          How Pulse works
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          Sending from
        </label>
        <CountrySelect
          v-model="form.from"
          placeholder="Select country"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          Receiving in
        </label>
        <CountrySelect
          v-model="form.to"
          placeholder="Select country"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          v-model.number="form.amount"
          type="number"
          class="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="1000"
        >
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          Payout method
        </label>
        <select
          v-model="form.method"
          class="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="bank">
            Bank Transfer
          </option>
          <option value="cash">
            Cash Pickup
          </option>
          <option value="wallet">
            Mobile Wallet
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          Sort by
        </label>
        <select
          v-model="form.sortBy"
          class="h-12 w-full rounded-lg border border-gray-300 px-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="recipient">
            Max recipient gets
          </option>
          <option value="fastest">
            Fastest
          </option>
          <option value="reliable">
            Most reliable
          </option>
        </select>
      </div>
    </div>

    <div class="mt-6 flex gap-3">
      <button
        class="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        @click="applyFilters"
      >
        View corridor pulse
      </button>
      <button
        class="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        @click="createAlert"
      >
        Create alert
        <span class="ml-1 text-xs text-primary-600">Plus</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits<{
  'filter-change': [filters: {
    from: string
    to: string
    amount: number
    method: 'bank' | 'cash' | 'wallet'
    sortBy: 'recipient' | 'fastest' | 'reliable'
  }]
}>()

const form = ref({
  from: 'US',
  to: 'PH',
  amount: 1000,
  method: 'bank' as 'bank' | 'cash' | 'wallet',
  sortBy: 'recipient' as 'recipient' | 'fastest' | 'reliable',
})

const showMethodology = ref(false)

const lastUpdated = ref('2 minutes ago')

const applyFilters = () => {
  emit('filter-change', form.value)
}

const createAlert = () => {
  console.log('Create alert clicked')
}

watch(form, () => {
  applyFilters()
}, { deep: true })
</script>

