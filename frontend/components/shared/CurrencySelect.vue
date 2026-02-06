<template>
  <div class="relative">
    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        type="text"
        class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        :class="selectClass"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleFocus"
      >
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          :class="[
            'h-5 w-5 transition-transform duration-200',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-gray-400',
            { 'rotate-180': isOpen },
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <Teleport
      v-if="isMounted"
      to="body"
    >
      <div
        v-show="isOpen && filteredCurrencies.length > 0"
        ref="dropdownRef"
        :class="[
          'fixed z-[9999] overflow-y-auto rounded-lg border-2 py-1 shadow-2xl',
          props.theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-gray-300 bg-white',
        ]"
        style="max-height: 400px;"
        :style="dropdownStyle"
      >
        <div
          v-if="filteredCurrencies.length === 0"
          :class="[
            'px-4 py-2 text-sm',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-gray-500',
          ]"
        >
          No currencies found
        </div>
        <button
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          type="button"
          :class="[
            'w-full px-4 py-2.5 text-left text-sm transition-colors focus:outline-none',
            props.theme === 'dark'
              ? 'text-white hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 active:bg-neutral-600'
              : 'text-gray-900 hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 active:bg-primary-100',
          ]"
          @mousedown.prevent="selectCurrency(currency)"
          @touchstart.prevent="selectCurrency(currency)"
        >
          {{ props.codeOnly ? currency.code : currency.label }}
        </button>
      </div>
    </Teleport>

    <slot name="error">
      <div
        v-if="error"
        class="mt-1 text-sm text-red-500"
      >
        {{ error }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  CURRENCIES,
  BASE_CURRENCIES,
  getAvailableCurrencies,
} from '~/utils/countries-currencies'

interface CurrencyOption {
  code: string
  label: string
  name: string
  symbol: string
}

interface Props {
  modelValue: string
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  selectClass?: string
  countryCode?: string
  currencies?: string[]
  theme?: 'light' | 'dark'
  codeOnly?: boolean
  excludeCurrency?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select currency',
  disabled: false,
  error: '',
  selectClass: '',
  countryCode: undefined,
  currencies: undefined,
  theme: 'light',
  codeOnly: false,
  excludeCurrency: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'currency-selected': [value: string]
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({})

const availableCurrencyCodes = computed(() => {
  if (props.currencies && props.currencies.length > 0) {
    console.log('Using provided currencies:', props.currencies)
    return props.currencies
  }

  if (props.countryCode) {
    const codes = getAvailableCurrencies(props.countryCode)
    console.log('Country code:', props.countryCode, 'Available currencies:', codes)
    return codes.length > 0 ? codes : BASE_CURRENCIES
  }

  console.log('Using base currencies:', BASE_CURRENCIES)
  return BASE_CURRENCIES
})

const allCurrencies = computed(() => {
  const codes = availableCurrencyCodes.value
  const currencies: CurrencyOption[] = []

  console.log('Building currency list from codes:', codes)

  codes.forEach((code) => {
    const currencyInfo = CURRENCIES[code]
    if (currencyInfo) {
      currencies.push({
        code: currencyInfo.code,
        label: props.codeOnly ? currencyInfo.code : `${currencyInfo.code} | ${currencyInfo.name}`,
        name: currencyInfo.name,
        symbol: currencyInfo.symbol,
      })
    }
    else {
      console.warn('Currency not found in CURRENCIES:', code)
      currencies.push({
        code,
        label: code,
        name: code,
        symbol: code,
      })
    }
  })

  // Sort: base currencies first, then alphabetically
  const sorted = currencies.sort((a, b) => {
    const aIsBase = BASE_CURRENCIES.includes(a.code)
    const bIsBase = BASE_CURRENCIES.includes(b.code)

    if (aIsBase && !bIsBase) return -1
    if (!aIsBase && bIsBase) return 1

    const baseOrder = BASE_CURRENCIES.indexOf(a.code) - BASE_CURRENCIES.indexOf(b.code)
    if (baseOrder !== 0) return baseOrder

    return a.name.localeCompare(b.name)
  })

  console.log('Final currency list:', sorted.map(c => c.code))
  return sorted
})

const filteredCurrencies = ref<CurrencyOption[]>([])

const filterCurrencies = () => {
  let currencies = allCurrencies.value

  // Exclude the specified currency if provided
  if (props.excludeCurrency) {
    currencies = currencies.filter(currency => currency.code !== props.excludeCurrency)
  }

  if (!searchQuery.value) {
    filteredCurrencies.value = currencies
  }
  else {
    const query = searchQuery.value.toLowerCase()
    filteredCurrencies.value = currencies.filter(currency =>
      currency.label.toLowerCase().includes(query)
      || currency.code.toLowerCase().includes(query),
    )
  }
}

watch(searchQuery, filterCurrencies)
watch(allCurrencies, () => {
  filterCurrencies()
})
watch(() => props.excludeCurrency, filterCurrencies)

const selectCurrency = (currency: CurrencyOption) => {
  console.log('=== Select Currency ===')
  console.log('Selected:', currency.code, currency.name)

  emit('update:modelValue', currency.code)
  emit('currency-selected', currency.code)
  // Show just the code, not the full label
  searchQuery.value = currency.code
  isOpen.value = false

  console.log('searchQuery set to:', searchQuery.value)
}

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isOpen.value = true
  updateDropdownPosition()
}

const handleFocus = async () => {
  isOpen.value = true

  // Clear search query when focusing to show all currencies
  searchQuery.value = ''
  await nextTick()
  filteredCurrencies.value = [...allCurrencies.value]

  updateDropdownPosition()
}

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
    // Restore to previous selection if no currency was selected
    if (props.modelValue) {
      searchQuery.value = props.modelValue
    }
    else {
      searchQuery.value = ''
    }
  }, 200)
}

const updateDropdownPosition = async () => {
  await nextTick()
  const input = document.getElementById(props.id || '')
  if (input) {
    const rect = input.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    }
  }
}

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue && !isOpen.value) {
      // Always show just the code (regardless of codeOnly prop for input display)
      searchQuery.value = newValue
    }
    else if (!newValue) {
      searchQuery.value = ''
    }
    else {
      // Dropdown is open: don't clobber in-progress user input.
    }
  },
  { immediate: true },
)

onMounted(() => {
  isMounted.value = true

  // Initialize filtered currencies immediately
  filteredCurrencies.value = [...allCurrencies.value]
  filterCurrencies()

  if (props.modelValue) {
    // Always show just the currency code in the input
    searchQuery.value = props.modelValue
  }

  window.addEventListener('scroll', updateDropdownPosition)
  window.addEventListener('resize', updateDropdownPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateDropdownPosition)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>
