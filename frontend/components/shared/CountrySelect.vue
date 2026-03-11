<template>
  <div
ref="rootRef"
class="relative"
>
    <div class="relative">
      <input
        :id="resolvedId"
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        class="h-12 w-full rounded-lg border border-neutral-300 bg-surface pr-10 text-black focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        :class="[selectClass, selectedFlagVisible ? 'pl-11' : 'pl-4']"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        role="combobox"
        aria-autocomplete="list"
        autocomplete="off"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? errorId : undefined"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleClick"
        @keydown="handleKeydown"
      >
      <div
        v-if="selectedFlagVisible"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
        aria-hidden="true"
      >
        <span class="text-lg leading-none">{{ selectedCountry?.flag }}</span>
      </div>
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
        v-if="isOpen"
        :id="listboxId"
        ref="dropdownRef"
        role="listbox"
        :class="[
          'fixed z-dropdown overflow-y-auto rounded-lg border-2 py-1 shadow-2xl',
          props.theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-neutral-300 bg-surface',
        ]"
        :style="dropdownStyle"
      >
        <div
          v-if="filteredCountries.length === 0"
          :class="[
            'text-body-sm px-4 py-3',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
          ]"
        >
          No countries found
        </div>
        <button
          v-for="(country, index) in filteredCountries"
          :id="getOptionId(country.value)"
          :key="country.value"
          :data-option-index="index"
          type="button"
          role="option"
          :aria-selected="highlightedIndex === index ? 'true' : 'false'"
          :class="[
            'text-body-sm w-full px-4 py-2.5 text-left transition-colors focus:outline-none',
            props.theme === 'dark'
              ? 'text-white hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 active:bg-neutral-600'
              : 'text-black hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 active:bg-primary-100',
            highlightedIndex === index
              && (props.theme === 'dark'
                ? 'bg-neutral-700 text-white'
                : 'bg-primary-50 text-primary-700'),
          ]"
          @mouseenter="setHighlightedIndex(index)"
          @mousemove="handleOptionHover(index)"
          @mousedown.prevent="selectCountry(country)"
          @touchstart.prevent="selectCountry(country)"
        >
          <span class="inline-flex items-center gap-2">
            <span
              v-if="props.showFlags"
              class="text-lg leading-none"
            >
              {{ country.flag }}
            </span>
            <span>{{ country.name }}</span>
          </span>
        </button>
      </div>
    </Teleport>

    <slot name="error">
      <p
        v-if="error"
        :id="errorId"
        class="text-body-sm mt-1 text-danger-600"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { COUNTRIES, SUPPORTED_COUNTRY_CODES } from '~/utils/countries-currencies'

interface Props {
  modelValue: string
  label?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  labelClass?: string
  selectClass?: string
  theme?: 'light' | 'dark'
  excludeCountry?: string
  supportedOnly?: boolean
  allowedCodes?: string[]
  showFlags?: boolean
}

interface CountryOption {
  value: string
  label: string
  flag: string
  name: string
  code: string
  searchText: string
  currency: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  id: undefined,
  placeholder: 'Select country',
  disabled: false,
  error: '',
  labelClass: '',
  selectClass: '',
  theme: 'light',
  excludeCountry: undefined,
  supportedOnly: false,
  allowedCodes: undefined,
  showFlags: true,
})

const ariaLabel = computed(() => props.label || props.placeholder || 'Select country')

const fallbackId = useId()
const resolvedId = computed(() => props.id ?? `country-select-${fallbackId}`)
const errorId = computed(() => `${resolvedId.value}-error`)
const listboxId = computed(() => `${resolvedId.value}-listbox`)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'country-selected': [countryCode: string, currency: string]
}>()

const sourceCountries = computed(() =>
  props.allowedCodes?.length
    ? COUNTRIES.filter(c => props.allowedCodes!.includes(c.code))
    : props.supportedOnly
      ? COUNTRIES.filter(c => SUPPORTED_COUNTRY_CODES.has(c.code))
      : COUNTRIES,
)

const allCountries = computed<CountryOption[]>(() =>
  sourceCountries.value.map(country => ({
    value: country.code,
    label: country.name,
    flag: country.flag,
    name: country.name,
    code: country.code,
    searchText: `${country.name.toLowerCase()} ${country.code.toLowerCase()}`,
    currency: country.currency,
  })),
)

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const highlightedIndex = ref(-1)
const filteredCountries = ref<CountryOption[]>([])
const dropdownStyle = ref<Record<string, string>>({})

const activeDescendant = computed(() => {
  if (highlightedIndex.value < 0) return undefined
  const option = filteredCountries.value[highlightedIndex.value]
  return option ? getOptionId(option.value) : undefined
})

const getOptionId = (value: string) => `${resolvedId.value}-option-${value.toLowerCase()}`

const selectedCountry = computed(() =>
  allCountries.value.find(country => country.value === props.modelValue) ?? null,
)

const getSelectedCountry = () => selectedCountry.value

const selectedFlagVisible = computed(() =>
  props.showFlags && !isOpen.value && selectedCountry.value !== null,
)

const getAvailableCountries = () => {
  if (!props.excludeCountry) return allCountries.value
  return allCountries.value.filter(country => country.value !== props.excludeCountry)
}

const restoreSelectedValue = () => {
  searchQuery.value = getSelectedCountry()?.name ?? ''
}

const matchCountry = (country: CountryOption, query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return 0

  if (country.code.toLowerCase() === normalized) return 0
  if (country.name.toLowerCase() === normalized) return 0
  if (country.name.toLowerCase().startsWith(normalized)) return 1
  if (country.code.toLowerCase().startsWith(normalized)) return 1
  if (
    country.name
      .toLowerCase()
      .split(/\s+/)
      .some(part => part.startsWith(normalized))
  )
    return 2
  if (country.searchText.includes(normalized)) return 3
  return Number.POSITIVE_INFINITY
}

const updateFilteredCountries = (preferSelected: boolean = false) => {
  const countries = getAvailableCountries()

  const query = searchQuery.value.trim()
  if (!query) {
    filteredCountries.value = countries
  }
 else {
    filteredCountries.value = countries
      .map(country => ({ country, rank: matchCountry(country, query) }))
      .filter(item => Number.isFinite(item.rank))
      .sort((a, b) => a.rank - b.rank || a.country.name.localeCompare(b.country.name))
      .map(item => item.country)
  }

  if (filteredCountries.value.length === 0) {
    highlightedIndex.value = -1
    return
  }

  if (preferSelected) {
    const selectedIndex = filteredCountries.value.findIndex(
      country => country.value === props.modelValue,
    )
    highlightedIndex.value = selectedIndex >= 0 ? selectedIndex : 0
    return
  }

  if (highlightedIndex.value < 0 || highlightedIndex.value >= filteredCountries.value.length) {
    highlightedIndex.value = 0
  }
}

const setHighlightedIndex = (index: number) => {
  if (!filteredCountries.value.length) {
    highlightedIndex.value = -1
    return
  }
  highlightedIndex.value = Math.min(Math.max(index, 0), filteredCountries.value.length - 1)
}

const scrollHighlightedOptionIntoView = () => {
  if (!dropdownRef.value || highlightedIndex.value < 0) return
  const option = dropdownRef.value.querySelector<HTMLElement>(
    `[data-option-index="${highlightedIndex.value}"]`,
  )
  option?.scrollIntoView({ block: 'nearest' })
}

const closeDropdown = (restoreSelection: boolean = true) => {
  isOpen.value = false
  highlightedIndex.value = -1
  if (restoreSelection) {
    restoreSelectedValue()
  }
}

const updateDropdownPosition = () => {
  if (!inputRef.value || !isOpen.value) return

  const rect = inputRef.value.getBoundingClientRect()
  const viewportPadding = 12
  const gutter = 4
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(rect.width, viewportWidth - viewportPadding * 2)
  const spaceBelow = viewportHeight - rect.bottom - viewportPadding
  const spaceAbove = rect.top - viewportPadding
  const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow
  const availableSpace = openAbove ? spaceAbove : spaceBelow
  const maxHeight = Math.max(140, Math.min(360, availableSpace - gutter))
  let left = rect.left

  if (left + width + viewportPadding > viewportWidth) {
    left = viewportWidth - width - viewportPadding
  }
  left = Math.max(viewportPadding, left)

  const top = openAbove
    ? Math.max(viewportPadding, rect.top - maxHeight - gutter)
    : rect.bottom + gutter

  dropdownStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(width)}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
  }
}

const openDropdown = async (resetSearch: boolean) => {
  if (props.disabled) return
  isOpen.value = true
  if (resetSearch) {
    searchQuery.value = ''
  }
  updateFilteredCountries(true)
  await nextTick()
  updateDropdownPosition()
  scrollHighlightedOptionIntoView()
}

const selectCountry = (country: CountryOption) => {
  emit('update:modelValue', country.value)
  emit('country-selected', country.value, country.currency)
  searchQuery.value = country.name
  isOpen.value = false
  highlightedIndex.value = -1
}

const resolveExactCountryMatch = (query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return null

  return (
    getAvailableCountries().find(country =>
      country.code.toLowerCase() === normalized || country.name.toLowerCase() === normalized,
    ) ?? null
  )
}

const commitTypedCountry = () => {
  const match = resolveExactCountryMatch(searchQuery.value)
  if (!match) return false

  if (match.value === props.modelValue) {
    searchQuery.value = match.name
    isOpen.value = false
    highlightedIndex.value = -1
    return true
  }

  selectCountry(match)
  return true
}

const handleSearch = async (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  if (commitTypedCountry()) {
    return
  }
  isOpen.value = true
  updateFilteredCountries(false)
  await nextTick()
  updateDropdownPosition()
}

const handleFocus = async () => {
  if (isOpen.value) return
  await openDropdown(true)
}

const handleClick = async () => {
  if (isOpen.value) return
  await openDropdown(true)
}

const handleBlur = () => {
  window.setTimeout(() => {
    if (!isOpen.value) return
    const activeElement = document.activeElement
    if (
      activeElement
      && (rootRef.value?.contains(activeElement) || dropdownRef.value?.contains(activeElement))
    ) {
      return
    }
    if (commitTypedCountry()) {
      return
    }
    closeDropdown(true)
  }, 0)
}

const moveHighlight = async (delta: number) => {
  if (!filteredCountries.value.length) return
  if (!isOpen.value) {
    await openDropdown(true)
    return
  }
  if (highlightedIndex.value < 0) {
    updateFilteredCountries(true)
  }
 else {
    const next
      = (highlightedIndex.value + delta + filteredCountries.value.length)
        % filteredCountries.value.length
    highlightedIndex.value = next
  }
  await nextTick()
  scrollHighlightedOptionIntoView()
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (props.disabled) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    await moveHighlight(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) {
      await openDropdown(true)
      return
    }
    await moveHighlight(-1)
    return
  }

  if (event.key === 'Home' && isOpen.value) {
    event.preventDefault()
    setHighlightedIndex(0)
    await nextTick()
    scrollHighlightedOptionIntoView()
    return
  }

  if (event.key === 'End' && isOpen.value) {
    event.preventDefault()
    setHighlightedIndex(filteredCountries.value.length - 1)
    await nextTick()
    scrollHighlightedOptionIntoView()
    return
  }

  if (event.key === 'Enter' && isOpen.value) {
    if (highlightedIndex.value >= 0 && filteredCountries.value[highlightedIndex.value]) {
      event.preventDefault()
      selectCountry(filteredCountries.value[highlightedIndex.value])
    }
    return
  }

  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    closeDropdown(true)
    inputRef.value?.blur()
    return
  }

  if (event.key === 'Tab' && isOpen.value) {
    closeDropdown(true)
  }
}

const handleOptionHover = (index: number) => {
  if (highlightedIndex.value !== index) {
    highlightedIndex.value = index
  }
}

const handleOutsidePointer = (event: MouseEvent | TouchEvent) => {
  const target = event.target as Node | null
  if (!target) return
  if (rootRef.value?.contains(target) || dropdownRef.value?.contains(target)) return
  if (isOpen.value && commitTypedCountry()) {
    return
  }
  closeDropdown(true)
}

watch(
  () => props.excludeCountry,
  () => {
    updateFilteredCountries(true)
    if (isOpen.value) {
      void nextTick().then(() => {
        updateDropdownPosition()
        scrollHighlightedOptionIntoView()
      })
    }
  },
)

watch(
  () => props.allowedCodes,
  () => {
    updateFilteredCountries(true)
  },
)

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      restoreSelectedValue()
      return
    }
    updateFilteredCountries(true)
  },
  { immediate: true },
)

onMounted(() => {
  isMounted.value = true
  restoreSelectedValue()
  updateFilteredCountries(true)

  document.addEventListener('mousedown', handleOutsidePointer)
  document.addEventListener('touchstart', handleOutsidePointer)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsidePointer)
  document.removeEventListener('touchstart', handleOutsidePointer)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>
