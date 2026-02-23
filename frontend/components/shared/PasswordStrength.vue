<template>
  <div class="space-y-2">
    <div class="flex gap-1.5">
      <div
        v-for="i in 4"
        :key="i"
        class="h-1.5 flex-1 rounded-full transition-colors duration-200"
        :class="i <= strengthLevel ? strengthColors[strengthLevel] : 'bg-neutral-200'"
      />
    </div>
    <div
      v-if="modelValue"
      class="space-y-1"
    >
      <p
        class="text-body-sm font-semibold"
        :class="strengthLevel >= 3 ? 'text-success-600' : strengthLevel >= 2 ? 'text-warning-600' : 'text-danger-600'"
      >
        {{ strengthLabel }}
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="rule in rules"
          :key="rule.label"
          class="flex items-center gap-1.5 text-body-sm"
          :class="rule.met ? 'text-success-600' : 'text-neutral-400'"
        >
          <svg
            v-if="rule.met"
            class="h-3.5 w-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            v-else
            class="h-3.5 w-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke-width="2"
            />
          </svg>
          {{ rule.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:valid': [valid: boolean]
}>()

const rules = computed(() => [
  { label: 'At least 8 characters', met: props.modelValue.length >= 8 },
  { label: 'One uppercase letter', met: /[A-Z]/.test(props.modelValue) },
  { label: 'One lowercase letter', met: /[a-z]/.test(props.modelValue) },
  { label: 'One number', met: /\d/.test(props.modelValue) },
])

const strengthLevel = computed(() => rules.value.filter(r => r.met).length)

const isValid = computed(() => rules.value.every(r => r.met))

watch(isValid, (v) => emit('update:valid', v), { immediate: true })

const strengthLabel = computed(() => {
  switch (strengthLevel.value) {
    case 0: return 'Too weak'
    case 1: return 'Weak'
    case 2: return 'Fair'
    case 3: return 'Good'
    case 4: return 'Strong'
    default: return ''
  }
})

const strengthColors: Record<number, string> = {
  0: 'bg-neutral-200',
  1: 'bg-danger-500',
  2: 'bg-warning-500',
  3: 'bg-brand-500',
  4: 'bg-success-500',
}
</script>
