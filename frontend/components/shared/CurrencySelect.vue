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
        class="h-12 w-full rounded-lg border border-neutral-300 bg-surface px-4 pr-10 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        :class="selectClass"
        :placeholder="placeholder"
        :aria-label="props.label || props.placeholder || 'Select currency'"
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
        v-show="isOpen"
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
          v-if="filteredCurrencies.length === 0"
          :class="[
            'text-body-sm px-4 py-3',
            props.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
          ]"
        >
          No currencies found
        </div>
        <button
          v-for="(currency, index) in filteredCurrencies"
          :id="getOptionId(currency.code)"
          :key="currency.code"
          :data-option-index="index"
          type="button"
          role="option"
          :aria-selected="highlightedIndex === index ? 'true' : 'false'"
          :class="[
            'text-body-sm w-full px-4 py-2.5 text-left transition-colors focus:outline-none',
            props.theme === 'dark'
              ? 'text-white hover:bg-neutral-700 hover:text-white focus:bg-neutral-700 active:bg-neutral-600'
              : 'text-neutral-900 hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50 active:bg-primary-100',
            highlightedIndex === index
              && (props.theme === 'dark'
                ? 'bg-neutral-700 text-white'
                : 'bg-primary-50 text-primary-700'),
          ]"
          @mouseenter="setHighlightedIndex(index)"
          @mousemove="handleOptionHover(index)"
          @mousedown.prevent="selectCurrency(currency)"
          @touchstart.prevent="selectCurrency(currency)"
        >
          {{ props.codeOnly ? currency.code : currency.label }}
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
import { BASE_CURRENCIES, CURRENCIES, getAvailableCurrencies } from '~/utils/countries-currencies'

interface CurrencyOption {
  code: string
  label: string
  name: string
  symbol: string
  searchText: string
}

interface Props {
  modelValue: string
  label?: string
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
  label: '',
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

const fallbackId = useId()
const resolvedId = computed(() => props.id ?? `currency-select-${fallbackId}`)
const errorId = computed(() => `${resolvedId.value}-error`)
const listboxId = computed(() => `${resolvedId.value}-listbox`)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'currency-selected': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const isOpen = ref(false)
const isMounted = ref(false)
const highlightedIndex = ref(-1)
const filteredCurrencies = ref<CurrencyOption[]>([])
const dropdownStyle = ref<Record<string, string>>({})

const availableCurrencyCodes = computed(() => {
  if (props.currencies && props.currencies.length > 0) {
    return props.currencies
  }

  if (props.countryCode) {
    const codes = getAvailableCurrencies(props.countryCode)
    return codes.length > 0 ? codes : BASE_CURRENCIES
  }

  return BASE_CURRENCIES
})

const allCurrencies = computed<CurrencyOption[]>(() => {
  const currencies: CurrencyOption[] = []

  availableCurrencyCodes.value.forEach((code) => {
    const currencyInfo = CURRENCIES[code]
    if (currencyInfo) {
      currencies.push({
        code: currencyInfo.code,
        label: props.codeOnly ? currencyInfo.code : `${currencyInfo.code} | ${currencyInfo.name}`,
        name: currencyInfo.name,
        symbol: currencyInfo.symbol,
        searchText: `${currencyInfo.code.toLowerCase()} ${currencyInfo.name.toLowerCase()}`,
      })
      return
    }

    useLogger('CurrencySelect').warn('Currency not found in CURRENCIES', code)
    currencies.push({
      code,
      label: code,
      name: code,
      symbol: code,
      searchText: code.toLowerCase(),
    })
  })

  return currencies.sort((a, b) => {
    const aIsBase = BASE_CURRENCIES.includes(a.code)
    const bIsBase = BASE_CURRENCIES.includes(b.code)

    if (aIsBase && !bIsBase) return -1
    if (!aIsBase && bIsBase) return 1

    const baseOrder = BASE_CURRENCIES.indexOf(a.code) - BASE_CURRENCIES.indexOf(b.code)
    if (baseOrder !== 0) return baseOrder

    return a.name.localeCompare(b.name)
  })
})

const activeDescendant = computed(() => {
  if (highlightedIndex.value < 0) return undefined
  const option = filteredCurrencies.value[highlightedIndex.value]
  return option ? getOptionId(option.code) : undefined
})

const getOptionId = (code: string) => `${resolvedId.value}-option-${code.toLowerCase()}`

const restoreSelectedValue = () => {
  searchQuery.value = props.modelValue || ''
}

const matchCurrency = (currency: CurrencyOption, query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return 0

  if (currency.code.toLowerCase() === normalized) return 0
  if (currency.name.toLowerCase() === normalized) return 0
  if (currency.code.toLowerCase().startsWith(normalized)) return 1
  if (currency.name.toLowerCase().startsWith(normalized)) return 1
  if (
    currency.name
      .toLowerCase()
      .split(/\s+/)
      .some(part => part.startsWith(normalized))
  )
    return 2
  if (currency.searchText.includes(normalized)) return 3
  return Number.POSITIVE_INFINITY
}

const updateFilteredCurrencies = (preferSelected: boolean = false) => {
  let currencies = [...allCurrencies.value]

  if (props.excludeCurrency) {
    currencies = currencies.filter(currency => currency.code !== props.excludeCurrency)
  }

  const query = searchQuery.value.trim()
  if (!query) {
    filteredCurrencies.value = currencies
  }
 else {
    filteredCurrencies.value = currencies
      .map(currency => ({ currency, rank: matchCurrency(currency, query) }))
      .filter(item => Number.isFinite(item.rank))
      .sort((a, b) => a.rank - b.rank || a.currency.name.localeCompare(b.currency.name))
      .map(item => item.currency)
  }

  if (filteredCurrencies.value.length === 0) {
    highlightedIndex.value = -1
    return
  }

  if (preferSelected) {
    const selectedIndex = filteredCurrencies.value.findIndex(
      currency => currency.code === props.modelValue,
    )
    highlightedIndex.value = selectedIndex >= 0 ? selectedIndex : 0
    return
  }

  if (highlightedIndex.value < 0 || highlightedIndex.value >= filteredCurrencies.value.length) {
    highlightedIndex.value = 0
  }
}

const setHighlightedIndex = (index: number) => {
  if (!filteredCurrencies.value.length) {
    highlightedIndex.value = -1
    return
  }
  highlightedIndex.value = Math.min(Math.max(index, 0), filteredCurrencies.value.length - 1)
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
  updateFilteredCurrencies(true)
  await nextTick()
  updateDropdownPosition()
  scrollHighlightedOptionIntoView()
}

const selectCurrency = (currency: CurrencyOption) => {
  emit('update:modelValue', currency.code)
  emit('currency-selected', currency.code)
  searchQuery.value = currency.code
  isOpen.value = false
  highlightedIndex.value = -1
}

const handleSearch = async (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isOpen.value = true
  updateFilteredCurrencies(false)
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
    closeDropdown(true)
  }, 0)
}

const moveHighlight = async (delta: number) => {
  if (!filteredCurrencies.value.length) return
  if (!isOpen.value) {
    await openDropdown(true)
    return
  }
  if (highlightedIndex.value < 0) {
    updateFilteredCurrencies(true)
  }
 else {
    const next
      = (highlightedIndex.value + delta + filteredCurrencies.value.length)
        % filteredCurrencies.value.length
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
    setHighlightedIndex(filteredCurrencies.value.length - 1)
    await nextTick()
    scrollHighlightedOptionIntoView()
    return
  }

  if (event.key === 'Enter' && isOpen.value) {
    if (highlightedIndex.value >= 0 && filteredCurrencies.value[highlightedIndex.value]) {
      event.preventDefault()
      selectCurrency(filteredCurrencies.value[highlightedIndex.value])
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
  closeDropdown(true)
}

watch([allCurrencies, () => props.excludeCurrency], () => {
  updateFilteredCurrencies(true)
  if (isOpen.value) {
    void nextTick().then(() => {
      updateDropdownPosition()
      scrollHighlightedOptionIntoView()
    })
  }
})

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      restoreSelectedValue()
      return
    }
    updateFilteredCurrencies(true)
  },
  { immediate: true },
)

onMounted(() => {
  isMounted.value = true
  restoreSelectedValue()
  updateFilteredCurrencies(true)

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
