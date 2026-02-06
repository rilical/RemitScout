<template>
  <div class="space-y-4 break-words [text-wrap:pretty]">
    <div
      v-for="(faq, index) in faqs"
      :key="index"
      class="rounded-lg border border-gray-200 overflow-hidden"
    >
      <button
        type="button"
        class="flex w-full items-start justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        @click="toggleFaq(index)"
      >
        <span class="flex-1 text-left font-medium leading-relaxed text-gray-900 [text-wrap:pretty]">{{ faq.question }}</span>
        <svg
          class="mt-1 h-5 w-5 flex-shrink-0 transform text-gray-500 transition-transform"
          :class="{ 'rotate-180': openFaqs.includes(index) }"
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
      </button>
      <div
        v-if="openFaqs.includes(index)"
        class="px-6 pb-6 pt-2 border-t border-gray-100"
      >
        <div
          :ref="el => setAnswerEl(index, el)"
          class="prose prose-sm max-w-none text-slate-700 leading-relaxed"
          v-html="faq.answer"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

interface Faq {
  question: string
  answer: string
}

defineProps<{
  faqs: Faq[]
}>()

const openFaqs = ref<number[]>([])
const answerEls = ref<Map<number, HTMLElement>>(new Map())

const setAnswerEl = (index: number, el: Element | ComponentPublicInstance | null) => {
  if (!el || !(el instanceof HTMLElement)) {
    answerEls.value.delete(index)
    return
  }
  answerEls.value.set(index, el)
}

const renderMathIfPresent = async (index: number) => {
  if (!import.meta.client) return

  const el = answerEls.value.get(index)
  if (!el) return

  // Avoid double-rendering KaTeX when toggling open/close.
  if (el.dataset.katexRendered === '1') return

  // Only \(...\) and \[...\] delimiters to avoid clobbering currency ($500, etc.).
  const mod = await import('katex/contrib/auto-render')
  const renderMathInElement = (mod as any).default ?? (mod as any).renderMathInElement ?? mod
  ;(renderMathInElement as any)(el, {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
    throwOnError: false,
  })

  el.dataset.katexRendered = '1'
}

const toggleFaq = (index: number) => {
  const faqIndex = openFaqs.value.indexOf(index)
  if (faqIndex > -1) {
    openFaqs.value.splice(faqIndex, 1)
  }
  else {
    openFaqs.value.push(index)
    nextTick(() => {
      void renderMathIfPresent(index)
    })
  }
}
</script>
