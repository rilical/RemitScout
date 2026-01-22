<template>
  <ClientOnly>
    <span v-html="renderedFormula" :class="formulaClass"></span>
    <template #fallback>
      <span class="text-neutral-600 italic">Loading formula...</span>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  formula: string
  display?: boolean
  size?: 'small' | 'normal' | 'large'
}>()

const renderedFormula = ref('')

const formulaClass = computed(() => {
  const classes: string[] = []
  if (props.size === 'small') {
    classes.push('text-sm')
  } else if (props.size === 'large') {
    classes.push('text-2xl')
  }
  return classes.join(' ')
})

onMounted(async () => {
  if (import.meta.client) {
    try {
      const katex = await import('katex')
      renderedFormula.value = katex.default.renderToString(props.formula, {
        displayMode: props.display ?? false,
        throwOnError: false,
        errorColor: '#cc0000',
      })
    } catch (error) {
      renderedFormula.value = props.formula
    }
  }
})
</script>
