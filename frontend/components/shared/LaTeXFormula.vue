<template>
  <span
    :class="formulaClass"
    v-html="renderedFormula"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as katexImport from 'katex'

const props = defineProps<{
  formula: string
  display?: boolean
  size?: 'small' | 'normal' | 'large'
}>()

const katex = (katexImport as any).default ?? katexImport

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formulaClass = computed(() => {
  const classes: string[] = []
  if (props.size === 'small') {
    classes.push('text-body-sm')
  }
  else if (props.size === 'large') {
    classes.push('text-h3')
  }
  return classes.join(' ')
})

const renderedFormula = computed(() => {
  try {
    return (katex as any).renderToString(props.formula, {
      displayMode: props.display ?? false,
      throwOnError: false,
      errorColor: '#cc0000',
    })
  }
  catch {
    return escapeHtml(props.formula)
  }
})
</script>
