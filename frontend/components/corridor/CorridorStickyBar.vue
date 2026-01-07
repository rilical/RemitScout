<template>
  <div class="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <!-- Main Query Builder -->
    <div class="p-5">
      <div class="flex flex-col lg:flex-row lg:items-end gap-4">
        <!-- Country Selectors -->
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- From Country -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From</label>
            <div class="relative w-full">
            <CountrySelect
              v-model="localFromCountry"
              placeholder="Sending from"
              @country-selected="emitUpdate"
            />
            </div>
          </div>
          <!-- To Country -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To</label>
            <div class="relative w-full">
            <CountrySelect
              v-model="localToCountry"
              placeholder="Receiving in"
              @country-selected="emitUpdate"
            />
            </div>
          </div>
        </div>

        <!-- Amount & Currency -->
        <div class="flex gap-3">
          <div class="w-32">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">You send</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium z-10">
                {{ fromCurrencySymbol }}
              </span>
              <input
                id="amount-input"
                v-model.number="localAmount"
                type="number"
                min="1"
                step="1"
                class="h-12 w-full rounded-lg border border-gray-300 bg-white pl-7 pr-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                @input="emitUpdate"
                @blur="emitUpdate"
              >
            </div>
          </div>

          <!-- From Currency -->
          <div class="w-24 sm:w-28">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Currency</label>
            <CurrencySelect
              v-model="localFromCurrency"
              :currencies="availableFromCurrenciesArray"
              :country-code="localFromCountry"
              placeholder="USD"
              code-only
              @currency-selected="emitUpdate"
            />
          </div>

          <!-- To Currency -->
          <div class="w-24 sm:w-28">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Receive</label>
            <CurrencySelect
              v-model="localToCurrency"
              :currencies="availableToCurrenciesArray"
              :country-code="localToCountry"
              placeholder="USD"
              code-only
              @currency-selected="emitUpdate"
            />
          </div>
        </div>

        <!-- Compare Button -->
        <div class="flex-shrink-0">
          <label class="block text-xs font-semibold text-transparent uppercase tracking-wider mb-2">Action</label>
          <button
            type="button"
            :disabled="isSearching"
            class="h-12 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            @click="handleSearch"
          >
            <svg
              v-if="isSearching"
              class="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span v-if="isSearching">Searching...</span>
            <span v-else>Compare</span>
            <svg
              v-if="!isSearching"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="border-t border-slate-200 bg-slate-50/50 px-5 py-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Payout Methods -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Delivery</span>
          <!-- Loading state -->
          <div v-if="props.methodsLoading" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <svg class="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span class="text-xs text-slate-500">Loading options...</span>
          </div>
          <!-- Actual method buttons -->
          <div v-else-if="payoutMethods.length > 0" class="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              v-for="method in payoutMethods"
              :key="method.value"
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                localPayoutMethod === method.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              ]"
              @click="selectMethod(method.value)"
            >
              <component :is="method.icon" class="w-3.5 h-3.5" />
              {{ method.label }}
            </button>
          </div>
        </div>

        <!-- Sort & Action Buttons -->
        <div class="flex items-center gap-3">
          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sort</span>
            <select
              v-model="localSortBy"
              class="h-9 rounded-lg border border-brand-600 bg-white px-3 pr-8 text-sm font-semibold text-slate-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 transition-all cursor-pointer"
              @change="$emit('sort', localSortBy)"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Divider -->
          <div class="h-6 w-px bg-slate-200" />

          <!-- Action Icons -->
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Add to watchlist"
              @click="emit('save')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Set rate alert"
              @click="emit('alert')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Share"
              @click="emit('share')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'

const BankIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
])
const CashIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' })
])
const WalletIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' })
])
const CardIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
])

const props = withDefaults(defineProps<{
  amount: number
  payoutMethod: string
  sortBy: string
  currency?: string
  fromCurrency?: string
  fromCountry?: string
  toCountry?: string
  availableToCurrencies?: string | string[]
  availableFromCurrencies?: string | string[]
  availableMethods?: string | string[]
  methodsLoading?: boolean
}>(), {
  currency: 'USD',
  fromCurrency: 'USD',
  fromCountry: 'US',
  toCountry: 'MX',
  availableToCurrencies: () => [],
  availableFromCurrencies: () => [],
  availableMethods: () => [],
  methodsLoading: false,
})

const emit = defineEmits<{
  update: [{ amount: number; payoutMethod: string; currency: string; fromCurrency: string; fromCountry?: string; toCountry?: string }]
  sort: [sortBy: string]
  save: []
  alert: []
  share: []
  'new-query': [{ fromCountry: string; toCountry: string; amount: number; currency: string; fromCurrency: string; payoutMethod: string }]
}>()

const localAmount = ref(props.amount)
const localPayoutMethod = ref(props.payoutMethod || 'bank')
const localSortBy = ref(props.sortBy || 'recipient')
const localToCurrency = ref(props.currency || 'USD')
const localFromCurrency = ref(props.fromCurrency || 'USD')
const localFromCountry = ref(props.fromCountry || 'US')
const localToCountry = ref(props.toCountry || 'MX')
const isSearching = ref(false)

const availableToCurrenciesArray = computed(() => {
  if (Array.isArray(props.availableToCurrencies)) return props.availableToCurrencies
  if (typeof props.availableToCurrencies === 'string' && props.availableToCurrencies) {
    return props.availableToCurrencies.split(',').map(c => c.trim()).filter(Boolean)
  }
  return ['USD', 'EUR']
})

const availableFromCurrenciesArray = computed(() => {
  if (Array.isArray(props.availableFromCurrencies)) return props.availableFromCurrencies
  if (typeof props.availableFromCurrencies === 'string' && props.availableFromCurrencies) {
    return props.availableFromCurrencies.split(',').map(c => c.trim()).filter(Boolean)
  }
  return ['USD', 'EUR', 'GBP']
})

const availableMethodsArray = computed(() => {
  if (Array.isArray(props.availableMethods)) return props.availableMethods
  if (typeof props.availableMethods === 'string' && props.availableMethods) {
    return props.availableMethods.split(',').map(m => m.trim()).filter(Boolean)
  }
  return []
})

const methodConfig: Record<string, { label: string; value: string; icon: ReturnType<typeof h> }> = {
  bank: { label: 'Bank deposit', value: 'bank', icon: BankIcon() },
  cash: { label: 'Cash Pickup', value: 'cash', icon: CashIcon() },
  wallet: { label: 'Mobile Wallet', value: 'wallet', icon: WalletIcon() },
  card: { label: 'Card', value: 'card', icon: CardIcon() },
}

const payoutMethods = computed(() => {
  const available = availableMethodsArray.value
  if (props.methodsLoading || !available.length) return []
  return available
    .map(m => methodConfig[m])
    .filter((m): m is typeof methodConfig[string] => Boolean(m))
})

const sortOptions = [
  { label: 'Recipient Gets', value: 'recipient' },
  { label: 'Total Cost', value: 'cost' },
  { label: 'Lowest Fees', value: 'fees' },
  { label: 'Remit-Score', value: 'remit-score' },
]

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', MXN: '$', BRL: 'R$', KRW: '₩', SGD: 'S$', HKD: 'HK$', SEK: 'kr',
  NOK: 'kr', DKK: 'kr', NZD: 'NZ$', ZAR: 'R', RUB: '₽', TRY: '₺', PLN: 'zł',
  THB: '฿', MYR: 'RM', IDR: 'Rp', PHP: '₱', VND: '₫', AED: 'د.إ', SAR: '﷼',
  EGP: 'E£', NGN: '₦', KES: 'KSh', GHS: 'GH₵', PKR: 'Rs', BDT: '৳', LKR: 'Rs',
}

const fromCurrencySymbol = computed(() => currencySymbols[localFromCurrency.value] || localFromCurrency.value)

watch(() => props.amount, (val) => {
  if (val && val > 0) localAmount.value = val
})
watch(() => props.payoutMethod, (val) => {
  if (val) localPayoutMethod.value = val
})
watch(() => props.sortBy, (val) => {
  if (val) localSortBy.value = val
})
watch(() => props.currency, (val) => {
  if (val) localToCurrency.value = val
})
watch(() => props.fromCurrency, (val) => {
  if (val) localFromCurrency.value = val
})
watch(() => props.fromCountry, (val) => {
  if (val) localFromCountry.value = val
})
watch(() => props.toCountry, (val) => {
  if (val) localToCountry.value = val
})

watch(() => props.methodsLoading, (loading) => {
  if (!loading) {
    isSearching.value = false
  }
})

watch(() => availableMethodsArray.value, (available) => {
  if (available.length && !available.includes(localPayoutMethod.value)) {
    localPayoutMethod.value = available[0]
    emitUpdate()
  }
}, { immediate: true })

function selectMethod(method: string) {
  if (localPayoutMethod.value !== method) {
    localPayoutMethod.value = method
    emitUpdate()
  }
}

function emitUpdate() {
  const amount = localAmount.value && localAmount.value > 0 ? localAmount.value : props.amount
  emit('update', {
    amount,
    payoutMethod: localPayoutMethod.value,
    currency: localToCurrency.value,
    fromCurrency: localFromCurrency.value,
  })
}

function handleSearch() {
  if (!localFromCountry.value || !localToCountry.value) return
  
  isSearching.value = true
  emit('new-query', {
    fromCountry: localFromCountry.value,
    toCountry: localToCountry.value,
    amount: localAmount.value || props.amount,
    currency: localToCurrency.value,
    fromCurrency: localFromCurrency.value,
    payoutMethod: localPayoutMethod.value,
  })
}
</script>
