<template>
  <div class="bg-white border-b border-slate-200 py-3">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="relative flex items-center">
          <label for="amount-bar" class="sr-only">Amount</label>
          <input
            id="amount-bar"
            v-model.number="localAmount"
            type="number"
            min="1"
            step="1"
            class="w-24 h-10 px-3 rounded-l-lg border border-r-0 border-slate-300 text-sm font-medium text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            @change="emitUpdate"
          >
          <UniversalDropdown
            v-model="localCurrency"
            :options="currencyOptions"
            button-class="h-10 rounded-l-none rounded-r-lg border-l-0 min-w-[70px]"
            @update:model-value="emitUpdate"
          />
        </div>

        <UniversalDropdown
          v-model="localPayoutMethod"
          :options="payoutOptions"
          button-class="h-10 min-w-[140px]"
          @update:model-value="emitUpdate"
        />
      </div>

      <div class="flex items-center gap-2">
        <UniversalDropdown
          v-model="localSortBy"
          :options="sortOptions"
          button-class="h-10 min-w-[160px]"
          @update:model-value="$emit('sort', localSortBy)"
        />
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          @click="$emit('save')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span class="hidden sm:inline">Save</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          @click="$emit('alert')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="hidden sm:inline">Set alert</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          @click="$emit('share')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'

const props = defineProps<{
  amount: number
  payoutMethod: string
  sortBy: string
  currency?: string
  availableCurrencies?: string[]
}>()

const emit = defineEmits<{
  update: [{ amount: number; payoutMethod: string; currency: string }]
  sort: [sortBy: string]
  save: []
  alert: []
  share: []
}>()

const localAmount = ref(props.amount)
const localPayoutMethod = ref(props.payoutMethod)
const localSortBy = ref(props.sortBy)
const localCurrency = ref(props.currency || 'USD')

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
]

const payoutOptions = [
  { label: 'Bank deposit', value: 'bank' },
  { label: 'Cash pickup', value: 'cash' },
  { label: 'Mobile wallet', value: 'wallet' },
]

const sortOptions = [
  { label: 'Recipient gets', value: 'recipient' },
  { label: 'Lowest cost', value: 'cost' },
  { label: 'Fastest', value: 'speed' },
  { label: 'Best rated', value: 'score' },
  { label: 'Remit Score', value: 'remit-score' },
]

watch(() => props.amount, (val) => { localAmount.value = val })
watch(() => props.payoutMethod, (val) => { localPayoutMethod.value = val })
watch(() => props.sortBy, (val) => { localSortBy.value = val })
watch(() => props.currency, (val) => { if (val) localCurrency.value = val })

function emitUpdate() {
  emit('update', {
    amount: localAmount.value,
    payoutMethod: localPayoutMethod.value,
    currency: localCurrency.value
  })
}
</script>

