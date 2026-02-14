<template>
  <div class="relative">
    <input
      :id="resolvedId"
      :value="modelValue"
      type="number"
      class="h-12 w-full rounded-lg border border-neutral-300 bg-surface px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      :class="inputClass"
      placeholder="4000"
      :aria-label="props.label"
      :min="inputMin"
      :max="inputMax"
      step="0.01"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? errorId : undefined"
      @input="handleInput"
      @change="handleChange"
      @blur="handleChange"
      @wheel.prevent="handleWheel"
    >

    <!-- Error message -->
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
import { computed, useId } from 'vue'
  import { getCountryByCode } from '~/utils/countries-currencies'
  import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'

interface Props {
  modelValue: number
  label: string
  id?: string
  disabled?: boolean
  error?: string
  labelClass?: string
  inputClass?: string
  from?: string
  to?: string
  currencyCode?: string
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  disabled: false,
  error: '',
  labelClass: '',
  inputClass: '',
  from: '',
  to: '',
  currencyCode: '',
  min: undefined,
  max: undefined,
})

const fallbackId = useId()
const resolvedId = computed(() => props.id ?? `amount-input-${fallbackId}`)
const errorId = computed(() => `${resolvedId.value}-error`)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const currencySymbol = computed(() => {
  const symbols: Record<string, string> = {
    US: '$',
    UK: '£',
    CA: 'C$',
    AU: 'A$',
    MX: 'MX$',
    IN: '₹',
    PH: '₱',
    NG: '₦',
    default: '$',
  }
  return symbols[props.from || 'default'] || symbols.default
})

const resolvedCurrency = computed(() => {
  if (props.currencyCode) return props.currencyCode.toUpperCase()
  const country = props.from ? getCountryByCode(props.from.toUpperCase()) : undefined
  return country?.currency?.toUpperCase() || 'USD'
})

const inputMin = computed(() => (
  props.min ?? getMinAmount(resolvedCurrency.value)
))

const inputMax = computed(() => (
  props.max ?? getMaxAmount(resolvedCurrency.value)
))

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value)
  if (!Number.isFinite(value)) {
    emit('update:modelValue', 0)
    return
  }
  emit('update:modelValue', Math.max(0, value))
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value)
  const sanitized = sanitizeAmount(Number.isFinite(value) ? value : 0, resolvedCurrency.value, {
    minAmount: inputMin.value,
    maxAmount: inputMax.value,
    strict: true,
  })
  emit('update:modelValue', sanitized)
  target.value = String(sanitized)
}

const handleWheel = (event: WheelEvent) => {
  // Prevent mousewheel changes when input is focused
  event.preventDefault()
}

const setAmount = (amount: number) => {
  emit('update:modelValue', amount)
}
</script>
