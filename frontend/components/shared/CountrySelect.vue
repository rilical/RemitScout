<template>
  <div class="relative">
    <div class="relative">
      <input
        :id="resolvedId"
        v-model="searchQuery"
        type="text"
        class="h-12 w-full rounded-lg border border-neutral-300 bg-surface px-4 pr-10 text-black focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
        :class="selectClass"
        :placeholder="placeholder"
        :aria-label="props.label"
        autocomplete="off"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? errorId : undefined"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleFocus"
      >
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          :class="[
            'h-5 w-5 transition-transform duration-200',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-400',
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
        v-show="isOpen && filteredCountries.length > 0"
        ref="dropdownRef"
        :class="[
          'fixed z-dropdown overflow-y-auto rounded-lg border-2 py-1 shadow-2xl',
          props.theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-neutral-300 bg-surface',
        ]"
        style="max-height: 400px;"
        :style="dropdownStyle"
      >
        <div
          v-if="filteredCountries.length === 0"
          :class="[
            'px-4 py-2 text-body-sm',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
          ]"
        >
          No countries found
        </div>
        <button
          v-for="country in filteredCountries"
          :key="country.value"
          type="button"
          :class="[
            'w-full px-4 py-2.5 text-left text-body-sm transition-colors focus:outline-none',
            props.theme === 'dark'
              ? 'text-white hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 active:bg-neutral-600'
              : 'text-black hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 active:bg-primary-100',
          ]"
          @mousedown.prevent="selectCountry(country)"
          @touchstart.prevent="selectCountry(country)"
        >
          {{ country.label }}
        </button>
      </div>
    </Teleport>

    <slot name="error">
      <p
        v-if="error"
        :id="errorId"
        class="mt-1 text-body-sm text-danger-600"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useId } from 'vue'
import { COUNTRIES, SUPPORTED_COUNTRY_CODES } from '~/utils/countries-currencies'

interface Props {
  modelValue: string
  label: string
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  labelClass?: string
  selectClass?: string
  theme?: 'light' | 'dark'
  excludeCountry?: string
  supportedOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select country',
  disabled: false,
  error: '',
  labelClass: '',
  selectClass: '',
  theme: 'light',
  excludeCountry: undefined,
  supportedOnly: false,
})

const fallbackId = useId()
const resolvedId = computed(() => props.id ?? `country-select-${fallbackId}`)
const errorId = computed(() => `${resolvedId.value}-error`)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'country-selected': [countryCode: string, currency: string]
}>()

const sourceCountries = props.supportedOnly
  ? COUNTRIES.filter(c => SUPPORTED_COUNTRY_CODES.has(c.code))
  : COUNTRIES

const allCountries = sourceCountries.map(country => ({
  value: country.code,
  label: `${country.flag} ${country.name}`, // Full label with emoji for dropdown display
  name: country.name, // Country name only (no emoji) for input field
  searchText: country.name.toLowerCase(), // Searchable text without emoji
  currency: country.currency,
}))

const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const filteredCountries = ref(allCountries)
const dropdownStyle = ref({})

const filterCountries = () => {
  let countries = allCountries

  // Exclude the specified country if provided
  if (props.excludeCountry) {
    countries = countries.filter(country => country.value !== props.excludeCountry)
  }

  if (!searchQuery.value) {
    filteredCountries.value = countries
  }
  else {
    const query = searchQuery.value.toLowerCase().trim()
    // Filter by searchText (name only, no emoji) for lookup
    filteredCountries.value = countries.filter(country =>
      country.searchText.includes(query),
    )
  }
}

watch(searchQuery, filterCountries)
watch(() => props.excludeCountry, filterCountries)

const selectCountry = (country: typeof allCountries[0]) => {
  emit('update:modelValue', country.value)
  emit('country-selected', country.value, country.currency)
  searchQuery.value = country.label
  isOpen.value = false
}

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  // If user is typing and there's a selected country, allow free typing for search
  // But preserve emoji if they're just editing the selected country name
  if (props.modelValue && value && !isOpen.value) {
    // User started typing - allow free search
    searchQuery.value = value
    isOpen.value = true
  }
  else {
    searchQuery.value = value
    isOpen.value = true
  }

  updateDropdownPosition()
}

const handleFocus = async () => {
  isOpen.value = true

  searchQuery.value = ''

  await nextTick()
  filteredCountries.value = props.excludeCountry
    ? allCountries.filter(c => c.value !== props.excludeCountry)
    : [...allCountries]

  updateDropdownPosition()
}

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
    // Restore to previous selection if no country was selected
    if (props.modelValue) {
      const country = allCountries.find(c => c.value === props.modelValue)
      if (country) {
        // Show full label with emoji
        searchQuery.value = country.label
      }
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
  (newValue) => {
    if (newValue && !isOpen.value) {
      const country = allCountries.find(c => c.value === newValue)
      if (country) {
        searchQuery.value = country.label
      }
    }
    else if (!newValue) {
      searchQuery.value = ''
    }
  },
  { immediate: true },
)

onMounted(() => {
  isMounted.value = true

  if (props.modelValue) {
    const country = allCountries.find(c => c.value === props.modelValue)
    if (country) {
      // Show full label with emoji
      searchQuery.value = country.label
    }
  }

  window.addEventListener('scroll', updateDropdownPosition)
  window.addEventListener('resize', updateDropdownPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateDropdownPosition)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>
