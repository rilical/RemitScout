<template>
  <div class="relative">
    <input
      :id="id"
      :value="modelValue"
      type="number"
      class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      :class="inputClass"
      placeholder="4000"
      min="1"
      step="1"
      :disabled="disabled"
      @input="handleInput"
      @change="handleChange"
      @wheel.prevent="handleWheel"
    >

    <!-- Error message -->
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
import { computed } from 'vue'

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
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  disabled: false,
  error: '',
  labelClass: '',
  inputClass: '',
  from: '',
  to: '',
})

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

const quickAmounts = [100, 300, 1000]

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value) || 0
  emit('update:modelValue', Math.max(1, value))
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number.parseFloat(target.value) || 0
  emit('update:modelValue', Math.max(1, value))
}

const handleWheel = (event: WheelEvent) => {
  // Prevent mousewheel changes when input is focused
  event.preventDefault()
}

const setAmount = (amount: number) => {
  emit('update:modelValue', amount)
}
</script>
