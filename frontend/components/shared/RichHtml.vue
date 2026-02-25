<template>
  <div
    v-if="props.tag === 'div'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="sanitizedContent"
  />
  <section
    v-else-if="props.tag === 'section'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="sanitizedContent"
  />
  <article
    v-else-if="props.tag === 'article'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="sanitizedContent"
  />
  <span
    v-else-if="props.tag === 'span'"
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="sanitizedContent"
  />
  <div
    v-else
    class="rich-html"
    v-bind="$attrs"
    @click="handleLinkClick"
    v-html="sanitizedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
})

const blockedTags = [
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'form',
  'script',
  'style',
]

const forbiddenAttributes = new Set(['style', 'srcdoc'])

const globalAllowedAttributes = new Set([
  'class',
  'id',
  'title',
  'aria-label',
  'role',
])

const tagAllowedAttributes: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', ...globalAllowedAttributes]),
  img: new Set(['src', 'alt', ...globalAllowedAttributes]),
  span: new Set(globalAllowedAttributes),
  div: new Set(globalAllowedAttributes),
  section: new Set(globalAllowedAttributes),
  article: new Set(globalAllowedAttributes),
}

const isSafeAttributeUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }

  if (/^\s*[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(trimmed)) {
    return /^\s*(https?|mailto|tel):/i.test(trimmed)
  }

  return true
}

const sanitizeHtmlFallback = (value: string) => {
  let sanitized = value
  for (const tag of blockedTags) {
    sanitized = sanitized
      .replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/\\s*${tag}\\s*>`, 'gi'), '')
      .replace(new RegExp(`<\\/??\\s*${tag}\\b[^>]*>`, 'gi'), '')
  }

  sanitized = sanitized.replace(
    /\s+on[a-z][\w-]*\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    '',
  )
  sanitized = sanitized.replace(
    /\s(?:style|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    '',
  )
  sanitized = sanitized.replace(
    /\s(href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (_match, _attrName, rawValue) => {
      const value = String(rawValue || '').replace(/^['"]?|['"]?$/g, '')
      return isSafeAttributeUrl(value) ? _match : ''
    },
  )

  return sanitized
}

const sanitizeHtml = (value: string) => {
  if (!value) {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    return sanitizeHtmlFallback(value)
  }

  try {
    const parser = new DOMParser()
    const parsed = parser.parseFromString(`<body>${value}</body>`, 'text/html')
    const body = parsed.body
    if (!body) {
      return sanitizeHtmlFallback(value)
    }

    body.querySelectorAll(blockedTags.join(',')).forEach((node) => {
      node.remove()
    })

    body.querySelectorAll('*').forEach((node) => {
      const tagName = node.tagName.toLowerCase()
      const allowedAttributes = tagAllowedAttributes[tagName] || globalAllowedAttributes

      Array.from(node.attributes).forEach((attribute) => {
        const attrName = attribute.name.toLowerCase()

        if (attrName.startsWith('on') || forbiddenAttributes.has(attrName)) {
          node.removeAttribute(attribute.name)
          return
        }

        if ((attrName === 'href' || attrName === 'src') && !isSafeAttributeUrl(attribute.value)) {
          node.removeAttribute(attribute.name)
          return
        }

        if (!globalAllowedAttributes.has(attrName)
          && !allowedAttributes.has(attrName)
          && !attrName.startsWith('aria-')) {
          node.removeAttribute(attribute.name)
        }
      })
    })

    return body.innerHTML
  }
  catch {
    return sanitizeHtmlFallback(value)
  }
}

const sanitizedContent = computed(() => sanitizeHtml(props.content))

const handleLinkClick = (event: MouseEvent) => {
  const root = event.currentTarget
  if (!(root instanceof Element)) return

  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest('a')
  // Only intercept links within the raw HTML itself (not parent links like NuxtLink wrappers).
  if (!anchor || !root.contains(anchor)) return

  // Respect modified clicks (open in new tab/window) and non-left clicks.
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) return

  const href = anchor.getAttribute('href') || ''
  const isRelativeInternal = href.startsWith('/')

  if (isRelativeInternal) {
    event.preventDefault()
    navigateTo(href)
  }
}
</script>
