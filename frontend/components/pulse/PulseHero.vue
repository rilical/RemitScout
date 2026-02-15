<template>
  <div class="rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-800/50 border border-white/10 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-white/10">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-h4 font-bold text-white flex items-center gap-2">
            <svg
              class="h-5 w-5 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Quick Compare
          </h2>
          <p class="text-body-sm text-neutral-400 mt-1">
            Get quotes for any corridor in seconds
          </p>
        </div>
        <button
          class="text-body-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
          @click="showMethodology = true"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          How it works
        </button>
      </div>
    </div>

    <!-- Filter Form -->
    <div class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
            Sending from
          </label>
          <CountrySelect
            v-model="form.from"
            label="Sending from"
            :exclude-country="form.to"
            placeholder="Select country"
            dark
          />
        </div>

        <div>
          <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
            Receiving in
          </label>
          <CountrySelect
            v-model="form.to"
            label="Receiving in"
            :exclude-country="form.from"
            placeholder="Select country"
            dark
          />
        </div>

          <div>
            <label
              for="pulse-amount"
              class="mb-2 block text-body-sm font-semibold uppercase tracking-wider text-neutral-400"
            >
              Amount
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
              <input
                id="pulse-amount"
                v-model.number="form.amount"
                type="number"
                class="h-12 w-full rounded-xl border border-white/10 bg-surface/5 pl-8 pr-4 text-white placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder="1000"
              >
            </div>
          </div>

          <div>
            <label
              for="pulse-method"
              class="mb-2 block text-body-sm font-semibold uppercase tracking-wider text-neutral-400"
            >
              Payout method
            </label>
            <select
              id="pulse-method"
              v-model="form.method"
              class="h-12 w-full rounded-xl border border-white/10 bg-surface/5 px-4 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
            >
            <option
              value="bank"
              class="bg-neutral-800"
            >
              Bank Transfer
            </option>
            <option
              value="cash"
              class="bg-neutral-800"
            >
              Cash Pickup
            </option>
            <option
              value="wallet"
              class="bg-neutral-800"
            >
              Mobile Wallet
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-body-sm font-semibold uppercase tracking-wider text-neutral-400">
            Sort by
          </label>
          <select
            v-model="form.sortBy"
            class="h-12 w-full rounded-xl border border-white/10 bg-surface/5 px-4 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
          >
            <option
              value="recipient"
              class="bg-neutral-800"
            >
              Max recipient gets
            </option>
            <option
              value="fastest"
              class="bg-neutral-800"
            >
              Fastest delivery
            </option>
            <option
              value="reliable"
              class="bg-neutral-800"
            >
              Most reliable
            </option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-primary-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
          @click="applyFilters"
        >
          <span class="relative z-10 flex items-center justify-center gap-2">
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            View Corridor Pulse
          </span>
          <div class="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 rounded-xl border border-white/10 bg-surface/5 px-4 py-3 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 hover:text-white">
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Save corridor
          </button>
          <button class="flex items-center gap-2 rounded-xl border border-white/10 bg-surface/5 px-4 py-3 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 hover:text-white">
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Set alert
            <span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-body-sm font-bold text-primary-400">Plus</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
      <div class="px-6 py-4 border-r border-white/10 last:border-r-0">
        <div class="text-body-sm text-neutral-400 mb-1">
          Best rate now
        </div>
        <div class="text-body-lg font-bold text-white">
          Wise
        </div>
      </div>
      <div class="px-6 py-4 border-r border-white/10 last:border-r-0">
        <div class="text-body-sm text-neutral-400 mb-1">
          Recipient gets
        </div>
        <div class="text-body-lg font-bold text-success-600">
          ₱56,234
        </div>
      </div>
      <div class="px-6 py-4 border-r border-white/10 last:border-r-0">
        <div class="text-body-sm text-neutral-400 mb-1">
          vs. yesterday
        </div>
        <div class="text-body-lg font-bold text-success-600 flex items-center gap-1">
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          +₱142
        </div>
      </div>
      <div class="px-6 py-4">
        <div class="text-body-sm text-neutral-400 mb-1">
          Fastest option
        </div>
        <div class="text-body-lg font-bold text-white">
          12 min
        </div>
      </div>
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

const applyFilters = () => {
  emit('filter-change', form.value)
}

watch(form, () => {
  applyFilters()
}, { deep: true })
</script>
