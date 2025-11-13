<template>
  <div class="relative" :data-dropdown="id">
    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        @input="handleSearch"
        @focus="isOpen = true"
        @blur="closeDropdown"
        @click="isOpen = true"
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
      v-if="isOpen && filteredCountries.length > 0"
      :data-dropdown="id"
      class="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style="max-height: 240px; overscroll-behavior: contain;"
    >
      <button
        v-for="country in filteredCountries.slice(0, 15)"
        :key="country.value"
        type="button"
        @mousedown.prevent="selectCountry(country)"
        @touchstart.prevent="selectCountry(country)"
        @click.prevent.stop="selectCountry(country)"
        class="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 focus:outline-none active:bg-primary-100 transition-colors"
      >
        {{ country.label }}
      </button>
    </div>

    <!-- Hidden select for form submission -->
    <select
      :id="id"
      :value="modelValue"
      @change="handleChange"
      class="sr-only"
    >
      <option value="" disabled>Select country</option>
      <option
        v-for="country in allCountries"
        :key="country.value"
        :value="country.value"
      >
        {{ country.label }}
      </option>
    </select>

    <!-- Error message (optional, can be handled by parent) -->
    <slot name="error">
      <div v-if="error" class="mt-1 text-sm text-red-500">
        {{ error }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
interface Props {
  modelValue: string
  label: string
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  labelClass?: string
  selectClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select country',
  disabled: false,
  error: '',
  labelClass: '',
  selectClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Comprehensive countries list
const allCountries = ref([
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'NZ', label: '🇳🇿 New Zealand' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'MX', label: '🇲🇽 Mexico' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'PK', label: '🇵🇰 Pakistan' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'AT', label: '🇦🇹 Austria' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'NO', label: '🇳🇴 Norway' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'FI', label: '🇫🇮 Finland' },
  { value: 'IE', label: '🇮🇪 Ireland' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'GR', label: '🇬🇷 Greece' },
  { value: 'PL', label: '🇵🇱 Poland' },
  { value: 'CZ', label: '🇨🇿 Czech Republic' },
  { value: 'RO', label: '🇷🇴 Romania' },
  { value: 'HU', label: '🇭🇺 Hungary' },
  { value: 'BG', label: '🇧🇬 Bulgaria' },
  { value: 'HR', label: '🇭🇷 Croatia' },
  { value: 'SK', label: '🇸🇰 Slovakia' },
  { value: 'SI', label: '🇸🇮 Slovenia' },
  { value: 'LT', label: '🇱🇹 Lithuania' },
  { value: 'LV', label: '🇱🇻 Latvia' },
  { value: 'EE', label: '🇪🇪 Estonia' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'TZ', label: '🇹🇿 Tanzania' },
  { value: 'UG', label: '🇺🇬 Uganda' },
  { value: 'ET', label: '🇪🇹 Ethiopia' },
  { value: 'SN', label: '🇸🇳 Senegal' },
  { value: 'MA', label: '🇲🇦 Morocco' },
  { value: 'DZ', label: '🇩🇿 Algeria' },
  { value: 'TN', label: '🇹🇳 Tunisia' },
  { value: 'TH', label: '🇹🇭 Thailand' },
  { value: 'VN', label: '🇻🇳 Vietnam' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'MY', label: '🇲🇾 Malaysia' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'LK', label: '🇱🇰 Sri Lanka' },
  { value: 'MM', label: '🇲🇲 Myanmar' },
  { value: 'KH', label: '🇰🇭 Cambodia' },
  { value: 'LA', label: '🇱🇦 Laos' },
  { value: 'NP', label: '🇳🇵 Nepal' },
  { value: 'BT', label: '🇧🇹 Bhutan' },
  { value: 'CO', label: '🇨🇴 Colombia' },
  { value: 'CL', label: '🇨🇱 Chile' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'PE', label: '🇵🇪 Peru' },
  { value: 'EC', label: '🇪🇨 Ecuador' },
  { value: 'VE', label: '🇻🇪 Venezuela' },
  { value: 'BO', label: '🇧🇴 Bolivia' },
  { value: 'PY', label: '🇵🇾 Paraguay' },
  { value: 'UY', label: '🇺🇾 Uruguay' },
  { value: 'CR', label: '🇨🇷 Costa Rica' },
  { value: 'PA', label: '🇵🇦 Panama' },
  { value: 'GT', label: '🇬🇹 Guatemala' },
  { value: 'HN', label: '🇭🇳 Honduras' },
  { value: 'SV', label: '🇸🇻 El Salvador' },
  { value: 'NI', label: '🇳🇮 Nicaragua' },
  { value: 'DO', label: '🇩🇴 Dominican Republic' },
  { value: 'CU', label: '🇨🇺 Cuba' },
  { value: 'JM', label: '🇯🇲 Jamaica' },
  { value: 'TT', label: '🇹🇹 Trinidad and Tobago' },
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'LB', label: '🇱🇧 Lebanon' },
  { value: 'IL', label: '🇮🇱 Israel' },
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
  { value: 'BY', label: '🇧🇾 Belarus' },
  { value: 'KZ', label: '🇰🇿 Kazakhstan' },
  { value: 'UZ', label: '🇺🇿 Uzbekistan' },
  { value: 'KR', label: '🇰🇷 South Korea' },
  { value: 'TW', label: '🇹🇼 Taiwan' },
  { value: 'HK', label: '🇭🇰 Hong Kong' }
])

// Search functionality
const searchQuery = ref('')
const isOpen = ref(false)
const filteredCountries = ref(allCountries.value)

// Filter countries based on search query
const filterCountries = () => {
  if (!searchQuery.value) {
    filteredCountries.value = allCountries.value
  } else {
    const query = searchQuery.value.toLowerCase()
    filteredCountries.value = allCountries.value.filter(country =>
      country.label.toLowerCase().includes(query)
    )
  }
}

// Watch for search input changes
watch(searchQuery, filterCountries)

// Select a country from dropdown
const selectCountry = (country: any) => {
  emit('update:modelValue', country.value)
  searchQuery.value = country.label
  isOpen.value = false
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

// Handle search input
const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isOpen.value = true
}

// Close dropdown when clicking outside
let closeTimeout: ReturnType<typeof setTimeout> | null = null

const closeDropdown = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
  closeTimeout = setTimeout(() => {
    // Check if focus moved to dropdown button
    const activeElement = document.activeElement
    const dropdownElement = document.querySelector(`[data-dropdown="${props.id}"]`)
    if (!dropdownElement?.contains(activeElement)) {
      isOpen.value = false
    }
  }, 200)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && allCountries.value.length > 0) {
      const country = allCountries.value.find(c => c.value === newValue)
      if (country) {
        searchQuery.value = country.label
        return
      }
    }
    if (!newValue) {
      searchQuery.value = ''
    }
  },
  { immediate: true }
)

// Initialize search query on mount
onMounted(() => {
  if (props.modelValue && allCountries.value.length > 0) {
    const country = allCountries.value.find(c => c.value === props.modelValue)
    if (country) {
      searchQuery.value = country.label
    }
  }
})
</script>
