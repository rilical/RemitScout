<template>
  <div
    class="space-y-4 break-words [text-wrap:pretty]"
    @keydown="onAccordionKeydown"
  >
    <div
      v-for="(faq, index) in props.faqs"
      :key="index"
      :class="dark ? 'rounded-lg border border-white/15 overflow-hidden' : 'rounded-lg border border-neutral-200 overflow-hidden'"
    >
      <button
        :id="`faq-button-${index}`"
        :ref="el => setButtonEl(index, el)"
        type="button"
        :class="[
          'flex w-full items-start justify-between gap-4 px-6 py-4 text-left cursor-pointer motion-safe:transition-colors focus:outline-none focus:ring-2 focus:ring-inset',
          dark
            ? 'hover:bg-white/10 focus:ring-white/30'
            : 'hover:bg-neutral-50 focus:ring-brand-600',
        ]"
        :aria-expanded="openFaqs.includes(index)"
        :aria-controls="`faq-panel-${index}`"
        @click="toggleFaq(index)"
      >
        <span :class="['flex-1 text-left font-medium leading-relaxed [text-wrap:pretty]', dark ? 'text-white' : 'text-neutral-900']">{{ faq.question }}</span>
        <svg
          :class="['mt-1 h-5 w-5 flex-shrink-0 transform motion-safe:transition-transform', dark ? 'text-white/50' : 'text-neutral-500', { 'rotate-180': openFaqs.includes(index) }]"
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
        :id="`faq-panel-${index}`"
        role="region"
        :aria-labelledby="`faq-button-${index}`"
        :class="['px-6 pb-6 pt-2 border-t', dark ? 'border-white/10' : 'border-neutral-100']"
      >
        <RichHtml
          :ref="el => setAnswerEl(index, el)"
          :class="['prose prose-sm max-w-none leading-relaxed', dark ? 'prose-invert text-white/70' : 'text-neutral-700']"
          :content="faq.answer"
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

const props = defineProps<{
  faqs: Faq[]
  dark?: boolean
}>()

const openFaqs = ref<number[]>([])
const answerEls = ref<Map<number, HTMLElement>>(new Map())
const buttonEls = ref<Map<number, HTMLButtonElement>>(new Map())

const setButtonEl = (index: number, el: Element | ComponentPublicInstance | null) => {
  if (!el || !(el instanceof HTMLButtonElement)) {
    buttonEls.value.delete(index)
    return
  }
  buttonEls.value.set(index, el)
}

const setAnswerEl = (index: number, el: Element | ComponentPublicInstance | null) => {
  const resolved = el instanceof HTMLElement
    ? el
    : (el as ComponentPublicInstance | null)?.$el

  if (!resolved || !(resolved instanceof HTMLElement)) {
    answerEls.value.delete(index)
    return
  }
  answerEls.value.set(index, resolved)
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

const focusButton = (index: number) => {
  buttonEls.value.get(index)?.focus()
}

const onAccordionKeydown = (e: KeyboardEvent) => {
  const count = props.faqs.length
  if (count <= 1) return

  const active = document.activeElement
  if (!(active instanceof HTMLButtonElement)) return

  const activeIndex = Array.from(buttonEls.value.entries()).find(([, el]) => el === active)?.[0]
  if (typeof activeIndex !== 'number') return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusButton((activeIndex + 1) % count)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusButton((activeIndex - 1 + count) % count)
    return
  }

  if (e.key === 'Home') {
    e.preventDefault()
    focusButton(0)
    return
  }

  if (e.key === 'End') {
    e.preventDefault()
    focusButton(count - 1)
  }
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
