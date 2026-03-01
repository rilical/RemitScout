<template>
  <div class="relative">
    <div class="relative">
      <input
        :id="id"
        v-model="searchQuery"
        type="text"
        class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-black focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
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
            { 'rotate-180': isOpen }
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
          'fixed z-[9999] overflow-y-auto rounded-lg border-2 py-1 shadow-2xl',
          props.theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-gray-300 bg-white'
        ]"
        style="max-height: 400px;"
        :style="dropdownStyle"
      >
        <div
          v-if="filteredCountries.length === 0"
          :class="[
            'px-4 py-2 text-sm',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
          ]"
        >
          No countries found
        </div>
        <button
          v-for="country in filteredCountries"
          :key="country.value"
          type="button"
          :class="[
            'w-full px-4 py-2.5 text-left text-sm transition-colors focus:outline-none',
            props.theme === 'dark'
              ? 'text-white hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 active:bg-neutral-600'
              : 'text-black hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 active:bg-primary-100'
          ]"
          @mousedown.prevent="selectCountry(country)"
          @touchstart.prevent="selectCountry(country)"
        >
          {{ country.label }}
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
import { COUNTRIES } from '~/utils/countries-currencies'

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
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  placeholder: 'Select country',
  disabled: false,
  error: '',
  labelClass: '',
  selectClass: '',
  theme: 'light',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'country-selected': [countryCode: string, currency: string]
}>()

const allCountries = COUNTRIES.map(country => ({
  value: country.code,
  label: `${country.flag} ${country.name}`,
  currency: country.currency,
}))

const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const filteredCountries = ref(allCountries)
const dropdownStyle = ref({})

const filterCountries = () => {
  if (!searchQuery.value) {
    filteredCountries.value = allCountries
  }
  else {
    const query = searchQuery.value.toLowerCase()
    filteredCountries.value = allCountries.filter(country =>
      country.label.toLowerCase().includes(query),
    )
  }
}

watch(searchQuery, filterCountries)

const selectCountry = (country: typeof allCountries[0]) => {
  emit('update:modelValue', country.value)
  emit('country-selected', country.value, country.currency)
  // Show the full label
  searchQuery.value = country.label
  isOpen.value = false
}

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isOpen.value = true
  updateDropdownPosition()
}

const handleFocus = async () => {
  isOpen.value = true

  // Clear and force update
  searchQuery.value = ''
  await nextTick()
  filteredCountries.value = [...allCountries]

  updateDropdownPosition()
}

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
    // Restore to previous selection if no country was selected
    if (props.modelValue) {
      const country = allCountries.find(c => c.value === props.modelValue)
      if (country) {
        searchQuery.value = country.label
      }
    } else {
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
      // Only update searchQuery when dropdown is closed
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
