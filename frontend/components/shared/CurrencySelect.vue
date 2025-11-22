<template>
  <div class="relative">
    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleFocus"
        type="text"
        class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        :class="selectClass"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
      />
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

    <Teleport to="body" v-if="isMounted">
      <div
        v-show="isOpen && filteredCurrencies.length > 0"
        ref="dropdownRef"
        class="fixed z-[9999] overflow-y-auto rounded-lg border-2 border-gray-300 bg-white py-1 shadow-2xl"
        style="max-height: 400px;"
        :style="dropdownStyle"
      >
        <div v-if="filteredCurrencies.length === 0" class="px-4 py-2 text-sm text-gray-500">
          No currencies found
        </div>
        <button
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          type="button"
          @mousedown.prevent="selectCurrency(currency)"
          @touchstart.prevent="selectCurrency(currency)"
          class="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 focus:outline-none active:bg-primary-100 transition-colors"
        >
          {{ currency.label }}
        </button>
      </div>
    </Teleport>

    <slot name="error">
      <div v-if="error" class="mt-1 text-sm text-red-500">
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
  getAvailableCurrencies 
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
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select currency',
  disabled: false,
  error: '',
  selectClass: '',
  countryCode: undefined,
  currencies: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({})

const availableCurrencyCodes = computed(() => {
  if (props.currencies) {
    console.log('Using provided currencies:', props.currencies)
    return props.currencies
  }
  
  if (props.countryCode) {
    const codes = getAvailableCurrencies(props.countryCode)
    console.log('Country code:', props.countryCode, 'Available currencies:', codes)
    return codes
  }
  
  console.log('Using base currencies:', BASE_CURRENCIES)
  return BASE_CURRENCIES
})

const allCurrencies = computed(() => {
  const codes = availableCurrencyCodes.value
  const currencies: CurrencyOption[] = []
  
  console.log('Building currency list from codes:', codes)
  
  codes.forEach(code => {
    const currencyInfo = CURRENCIES[code]
    if (currencyInfo) {
      currencies.push({
        code: currencyInfo.code,
        label: `${currencyInfo.code} | ${currencyInfo.name}`,
        name: currencyInfo.name,
        symbol: currencyInfo.symbol
      })
    } else {
      console.warn('Currency not found in CURRENCIES:', code)
      currencies.push({
        code,
        label: code,
        name: code,
        symbol: code
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
  if (!searchQuery.value) {
    filteredCurrencies.value = allCurrencies.value
  } else {
    const query = searchQuery.value.toLowerCase()
    filteredCurrencies.value = allCurrencies.value.filter(currency =>
      currency.label.toLowerCase().includes(query) ||
      currency.code.toLowerCase().includes(query)
    )
  }
}

watch(searchQuery, filterCurrencies)
watch(allCurrencies, () => {
  filterCurrencies()
})

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
  console.log('=== Currency Focus ===')
  console.log('Current searchQuery:', searchQuery.value)
  console.log('Current modelValue:', props.modelValue)
  console.log('All currencies count:', allCurrencies.value.length)
  
  isOpen.value = true
  
  // Clear and force update
  searchQuery.value = ''
  await nextTick()
  filteredCurrencies.value = [...allCurrencies.value]
  
  console.log('After clear - searchQuery:', searchQuery.value)
  console.log('Filtered currencies count:', filteredCurrencies.value.length)
  
  updateDropdownPosition()
}

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
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
      width: `${rect.width}px`
    }
  }
}

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    console.log('=== ModelValue Watch ===')
    console.log('Old:', oldValue, 'New:', newValue)
    console.log('isOpen:', isOpen.value)
    
    if (newValue && !isOpen.value) {
      // Only update searchQuery when dropdown is closed
      // Show just the code for brevity
      console.log('Setting searchQuery to:', newValue)
      searchQuery.value = newValue
    } else if (!newValue) {
      console.log('Clearing searchQuery')
      searchQuery.value = ''
    } else {
      console.log('Skipping update because dropdown is open')
    }
  },
  { immediate: true }
)

onMounted(() => {
  isMounted.value = true
  filterCurrencies()
  
  if (props.modelValue) {
    // Show just the code
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
