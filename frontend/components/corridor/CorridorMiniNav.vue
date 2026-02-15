<template>
  <nav class="sticky top-16 z-40 bg-surface border-b border-rs-border shadow-sm">
    <div class="mx-auto max-w-6xl px-4">
      <div class="flex items-center justify-between h-12">
        <div class="flex items-center gap-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            :class="[
              'px-4 py-2 text-body-sm font-medium rounded-lg transition-colors',
              activeSection === item.id
                ? 'bg-brand-50 text-brand-700'
                : 'text-neutral-600 hover:text-rs-fg hover:bg-neutral-50',
            ]"
            @click="scrollTo(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-body-sm text-rs-muted">
          <span class="inline-flex items-center gap-1.5">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-600 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-success-600" />
            </span>
            <span>Updated {{ lastUpdated }}</span>
          </span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  lastUpdated?: string
}>()

const navItems = [
  { id: 'compare', label: 'Compare' },
  { id: 'insights', label: 'Insights' },
  { id: 'how-to-send', label: 'How to send' },
  { id: 'faqs', label: 'FAQs' },
]

const activeSection = ref('compare')

function scrollTo(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    const offset = 120
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function handleScroll() {
  const sections = navItems.map(item => ({
    id: item.id,
    element: document.getElementById(item.id),
  })).filter(s => s.element)

  const scrollPosition = window.scrollY + 150

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section.element && section.element.offsetTop <= scrollPosition) {
      activeSection.value = section.id
      break
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
