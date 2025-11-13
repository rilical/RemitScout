<template>
  <div class="relative">
    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        @input="handleSearch"
        @focus="openDropdown"
        @blur="closeDropdown"
        class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        :class="selectClass"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
      />
      <!-- Dropdown arrow icon -->
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg 
          class="h-5 w-5 text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen && filteredCurrencies.length > 0"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <button
        v-for="currency in filteredCurrencies.slice(0, 12)"
        :key="currency.value"
        type="button"
        @mousedown="selectCurrency(currency)"
        class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-900 hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 focus:outline-none"
      >
        <span>{{ currency.label }}</span>
        <span class="text-xs text-gray-500">{{ currency.value }}</span>
      </button>
    </div>

    <!-- Hidden select for form submission -->
    <select
      :id="id"
      :value="modelValue"
      @change="handleSelectChange"
      class="sr-only"
      :disabled="disabled"
    >
      <option value="" disabled>Select currency</option>
      <option
        v-for="currency in allCurrencies"
        :key="currency.value"
        :value="currency.value"
      >
        {{ currency.label }}
      </option>
    </select>

    <slot name="error">
      <div v-if="error" class="mt-1 text-sm text-red-500">
        {{ error }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface CurrencyOption {
  value: string
  label: string
  symbol?: string
}

interface Props {
  modelValue: string
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  labelClass?: string
  selectClass?: string
  currencies?: CurrencyOption[]
}

const defaultCurrencies: CurrencyOption[] = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { value: 'CAD', label: 'CAD — Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD — Australian Dollar', symbol: 'A$' },
  { value: 'NZD', label: 'NZD — New Zealand Dollar', symbol: 'NZ$' },
  { value: 'INR', label: 'INR — Indian Rupee', symbol: '₹' },
  { value: 'MXN', label: 'MXN — Mexican Peso', symbol: 'MX$' },
  { value: 'PHP', label: 'PHP — Philippine Peso', symbol: '₱' },
  { value: 'NGN', label: 'NGN — Nigerian Naira', symbol: '₦' },
  { value: 'BRL', label: 'BRL — Brazilian Real', symbol: 'R$' },
  { value: 'JPY', label: 'JPY — Japanese Yen', symbol: '¥' }
]

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select currency',
  disabled: false,
  error: '',
  labelClass: '',
  selectClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const searchQuery = ref('')
const isOpen = ref(false)

const allCurrencies = computed(() =>
  props.currencies?.length ? props.currencies : defaultCurrencies
)

const filteredCurrencies = ref(allCurrencies.value)

const setSearchLabelFromValue = (value?: string) => {
  if (!value) {
    searchQuery.value = ''
    return
  }

  const match = allCurrencies.value.find(currency => currency.value === value)
  searchQuery.value = match ? match.label : ''
}

const filterCurrencies = () => {
  if (!searchQuery.value) {
    filteredCurrencies.value = allCurrencies.value
    return
  }

  const query = searchQuery.value.toLowerCase()
  filteredCurrencies.value = allCurrencies.value.filter(currency => {
    return (
      currency.label.toLowerCase().includes(query) ||
      currency.value.toLowerCase().includes(query) ||
      (currency.symbol && currency.symbol.toLowerCase().includes(query))
    )
  })
}

const handleSearch = (event: Event) => {
  if (props.disabled) return
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isOpen.value = true
}

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
  filterCurrencies()
}

const closeDropdown = () => {
  window.setTimeout(() => {
    isOpen.value = false
  }, 160)
}

const selectCurrency = (currency: CurrencyOption) => {
  emit('update:modelValue', currency.value)
  setSearchLabelFromValue(currency.value)
  isOpen.value = false
}

const handleSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  setSearchLabelFromValue(target.value)
}

watch(searchQuery, filterCurrencies)

watch(allCurrencies, newCurrencies => {
  filteredCurrencies.value = newCurrencies
  setSearchLabelFromValue(props.modelValue)
})

watch(
  () => props.modelValue,
  newValue => {
    setSearchLabelFromValue(newValue)
  },
  { immediate: true }
)
</script>
