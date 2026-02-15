<template>
  <div
    v-if="tag === 'div'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="content"
  />
  <section
    v-else-if="tag === 'section'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="content"
  />
  <article
    v-else-if="tag === 'article'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="content"
  />
  <span
    v-else-if="tag === 'span'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="content"
  />
  <div
    v-else
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="content"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  content: string
  tag?: string
}>(), {
  tag: 'div',
})

const handleLinkClick = (event: MouseEvent) => {
  const root = event.currentTarget
  if (!(root instanceof Element)) return

  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest('a')
  // Only intercept links within the raw HTML itself (not parent links like NuxtLink wrappers).
  if (!anchor || !root.contains(anchor)) return

  // Respect modified clicks (open in new tab/window) and non-left clicks.
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const href = anchor.getAttribute('href') || ''
  const isRelativeInternal = href.startsWith('/')

  if (isRelativeInternal) {
    event.preventDefault()
    navigateTo(href)
  }
}
</script>
