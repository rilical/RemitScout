<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      aria-label="Close dialog"
      @click="$emit('close')"
    />

    <!-- Modal -->
    <div
      ref="modalRef"
      class="relative w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-800 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-share-title"
      tabindex="-1"
      @keydown.esc="$emit('close')"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
        <h2
          id="pulse-share-title"
          class="text-body-lg font-bold text-white"
        >
          {{ modeTitle }}
        </h2>
        <button
          class="rounded-lg p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
          aria-label="Close dialog"
          @click="$emit('close')"
        >
          <Icon
            name="x"
            :size="20"
            class="text-current"
          />
        </button>
      </div>

      <!-- Tab navigation (embed mode) -->
      <div
        v-if="mode === 'embed'"
        class="flex border-b border-neutral-700"
      >
        <button
          class="flex-1 px-4 py-3 text-body-sm font-semibold transition-colors"
          :class="embedTab === 'iframe' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-neutral-400 hover:text-neutral-200'"
          @click="embedTab = 'iframe'"
        >
          Embed Code
        </button>
        <button
          class="flex-1 px-4 py-3 text-body-sm font-semibold transition-colors"
          :class="embedTab === 'image' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-neutral-400 hover:text-neutral-200'"
          @click="embedTab = 'image'"
        >
          Download Image
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Share Mode -->
        <template v-if="mode === 'share'">
          <p class="mb-4 text-neutral-400">
            Copy the link below to share this chart with others.
          </p>

          <!-- URL Input -->
          <div class="flex gap-2">
            <input
              ref="shareInput"
              type="text"
              readonly
              :value="shareUrl"
              aria-label="Share URL"
              class="flex-1 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-body-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              @focus="selectInput"
            >
            <button
              class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 transition-colors"
              @click="copyShareUrl"
            >
              <Icon
                :name="copied ? 'check' : 'copy'"
                :size="16"
                class="text-current"
              />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Social Share -->
          <div class="mt-6">
            <p class="mb-3 text-body-sm text-neutral-400">
              Or share via:
            </p>
            <div class="flex flex-wrap gap-3">
              <a
                :href="twitterShareUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-body-sm font-semibold text-brand-600 hover:bg-brand-600/30 transition-colors"
              >
                <Icon
                  name="share"
                  :size="16"
                  class="text-current"
                />
                X
              </a>
              <a
                :href="linkedinShareUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-body-sm font-semibold text-brand-600 hover:bg-brand-600/30 transition-colors"
              >
                <Icon
                  name="share"
                  :size="16"
                  class="text-current"
                />
                LinkedIn
              </a>
              <a
                :href="emailShareUrl"
                class="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-2 text-body-sm font-semibold text-neutral-200 hover:bg-neutral-600 transition-colors"
              >
                <Icon
                  name="envelope"
                  :size="16"
                  class="text-current"
                />
                Email
              </a>
            </div>
          </div>
        </template>

        <!-- Embed Mode: Iframe Tab -->
        <template v-else-if="embedTab === 'iframe'">
          <p class="mb-4 text-neutral-400">
            Paste this code into your website. The chart updates automatically with live data, branded with your site's look.
          </p>

          <!-- Options -->
          <div class="mb-4 flex flex-wrap gap-4">
            <div>
              <label
                for="pulse-embed-theme"
                class="mb-1 block text-body-sm text-neutral-400"
              >Theme</label>
              <select
                id="pulse-embed-theme"
                v-model="embedTheme"
                class="rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm text-white focus:border-brand-600 focus:outline-none"
              >
                <option value="dark">
                  Dark
                </option>
                <option value="light">
                  Light
                </option>
              </select>
            </div>
            <div>
              <label
                for="pulse-embed-width"
                class="mb-1 block text-body-sm text-neutral-400"
              >Width</label>
              <input
                id="pulse-embed-width"
                v-model="embedWidth"
                type="text"
                class="w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm text-white focus:border-brand-600 focus:outline-none"
                placeholder="100%"
              >
            </div>
            <div>
              <label
                for="pulse-embed-height"
                class="mb-1 block text-body-sm text-neutral-400"
              >Height</label>
              <input
                id="pulse-embed-height"
                v-model="embedHeight"
                type="text"
                class="w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-body-sm text-white focus:border-brand-600 focus:outline-none"
                placeholder="400"
              >
            </div>
          </div>

          <!-- Embed Code -->
          <div class="relative">
            <pre
              class="rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-body-sm text-neutral-300 overflow-x-auto"
            ><code>{{ embedCode }}</code></pre>
            <button
              class="absolute top-2 right-2 flex items-center gap-1.5 rounded bg-neutral-700 px-2 py-1 text-body-sm text-white hover:bg-neutral-600 transition-colors"
              @click="copyEmbedCode"
            >
              <Icon
                :name="copiedEmbed ? 'check' : 'copy'"
                :size="16"
                class="text-current"
              />
              {{ copiedEmbed ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Preview -->
          <div class="mt-6">
            <p class="mb-2 text-body-sm text-neutral-400">
              Preview:
            </p>
            <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <iframe
                :src="embedUrl"
                :width="embedWidth"
                :height="embedHeight"
                frameborder="0"
                style="border-radius: 8px;"
              />
            </div>
          </div>

          <!-- Attribution note -->
          <p class="mt-4 text-[11px] text-neutral-500">
            Embeds are free to use. Charts auto-update with live data and include a "Powered by Remit-Scout" backlink.
          </p>
        </template>

        <!-- Embed Mode: Download Image Tab -->
        <template v-else-if="embedTab === 'image'">
          <p class="mb-4 text-neutral-400">
            Download a high-resolution PNG of this chart with full branding and source attribution. Perfect for blog posts, reports, and presentations.
          </p>

          <!-- Image includes -->
          <div class="mb-6 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
            <p class="mb-3 text-body-sm font-semibold text-white">
              Image includes:
            </p>
            <ul class="space-y-2 text-body-sm text-neutral-400">
              <li class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600">
                  <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5" /></svg>
                </span>
                Remit-Scout branded header with chart title
              </li>
              <li class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600">
                  <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5" /></svg>
                </span>
                Full chart at 2x resolution (retina-ready)
              </li>
              <li class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600">
                  <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5" /></svg>
                </span>
                Source attribution and remit-scout.com backlink
              </li>
              <li class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-600/20 text-success-600">
                  <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5" /></svg>
                </span>
                Corridor and date metadata in footer
              </li>
            </ul>
          </div>

          <!-- Download button -->
          <button
            class="w-full rounded-lg bg-brand-600 px-4 py-3 text-body-sm font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="imageExporting || !chartContainerRef"
            @click="downloadImage"
          >
            {{ imageExporting ? 'Generating...' : 'Download PNG' }}
          </button>

          <p
            v-if="imageError"
            class="mt-2 text-body-sm text-danger-600"
          >
            {{ imageError }}
          </p>

          <p
            v-if="!chartContainerRef"
            class="mt-2 text-[11px] text-neutral-500"
          >
            Image export is available when a chart is currently rendered on the page.
          </p>

          <!-- Usage tips -->
          <div class="mt-6 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
            <p class="mb-2 text-body-sm font-semibold text-white">
              Usage tips for bloggers
            </p>
            <ul class="space-y-1 text-[11px] text-neutral-400">
              <li>Include an alt-text like: "{{ shareTitle }} — Source: Remit-Scout"</li>
              <li>Link the image back to remit-scout.com/pulse for SEO credit</li>
              <li>Use the embed code above for live-updating charts on your site</li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { PulseFilters } from '~/types/pulse'
import { getChartById } from '~/lib/pulseChartRegistry'
import { Icon } from '~/ui'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { useChartImageExport } from '~/composables/useChartImageExport'

interface Props {
  chartId: string
  filters: PulseFilters
  mode: 'share' | 'embed'
  /** Optional ref to the chart container element for image export */
  chartContainerRef?: HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
  chartContainerRef: null,
})

defineEmits<{
  close: []
}>()

const shareInput = ref<HTMLInputElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef)
const copied = ref(false)
const copiedEmbed = ref(false)
const embedTheme = ref<'dark' | 'light'>('dark')
const embedWidth = ref('100%')
const embedHeight = ref('400')
const embedTab = ref<'iframe' | 'image'>('iframe')
const imageError = ref<string | null>(null)

const { exportAsImage, exporting: imageExporting } = useChartImageExport()

const chartMeta = computed(() => getChartById(props.chartId))

const modeTitle = computed(() => {
  if (props.mode === 'share') return 'Share Chart'
  return embedTab.value === 'image' ? 'Download Chart Image' : 'Embed Chart'
})

const baseUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
})

onMounted(async () => {
  await nextTick()
  activate()
})

onBeforeUnmount(() => {
  deactivate()
})

const corridorLabel = computed(() => {
  if (props.filters.corridor === 'global') return 'Global'
  return props.filters.corridor.toUpperCase()
})

const queryParams = computed(() => {
  const params = new URLSearchParams()
  if (props.filters.corridor !== 'global') params.set('corridor', props.filters.corridor)
  if (props.filters.corridorId) params.set('corridor_id', props.filters.corridorId)
  if (props.filters.amount !== 200) params.set('amount', String(props.filters.amount))
  if (props.filters.fundingMethod !== 'bank') params.set('fund', props.filters.fundingMethod)
  if (props.filters.payoutMethod !== 'bank') params.set('pay', props.filters.payoutMethod)
  return params.toString()
})

const shareUrl = computed(() => {
  const base = `${baseUrl.value}/pulse/charts/${props.chartId}`
  return queryParams.value ? `${base}?${queryParams.value}` : base
})

const embedUrl = computed(() => {
  const params = new URLSearchParams(queryParams.value)
  params.set('theme', embedTheme.value)
  return `${baseUrl.value}/embed/pulse/${props.chartId}?${params.toString()}`
})

const embedCode = computed(() => {
  return `<iframe
  src="${embedUrl.value}"
  width="${embedWidth.value}"
  height="${embedHeight.value}"
  frameborder="0"
  loading="lazy"
  style="border: 0; border-radius: 8px;"
  title="${shareTitle.value} — Remit-Scout"
  allow="clipboard-write"
></iframe>`
})

const shareTitle = computed(() => {
  return chartMeta.value?.title || 'Remit-Pulse Chart'
})

const twitterShareUrl = computed(() => {
  const text = encodeURIComponent(`Check out this ${shareTitle.value} from Remit-Scout`)
  const url = encodeURIComponent(shareUrl.value)
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
})

const linkedinShareUrl = computed(() => {
  const url = encodeURIComponent(shareUrl.value)
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
})

const emailShareUrl = computed(() => {
  const subject = encodeURIComponent(`${shareTitle.value} - Remit-Scout`)
  const body = encodeURIComponent(`Check out this chart: ${shareUrl.value}`)
  return `mailto:?subject=${subject}&body=${body}`
})

function selectInput() {
  shareInput.value?.select()
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (e) {
    useLogger('PulseShareModal').error('Failed to copy', e)
  }
}

async function copyEmbedCode() {
  try {
    await navigator.clipboard.writeText(embedCode.value)
    copiedEmbed.value = true
    setTimeout(() => {
      copiedEmbed.value = false
    }, 2000)
  }
  catch (e) {
    useLogger('PulseShareModal').error('Failed to copy', e)
  }
}

async function downloadImage() {
  if (!props.chartContainerRef) return
  imageError.value = null
  try {
    await exportAsImage(props.chartContainerRef, {
      title: shareTitle.value,
      subtitle: `${corridorLabel.value} · $${props.filters.amount}`,
      source: `Source: Remit-Scout · remit-scout.com/pulse · ${corridorLabel.value}`,
      filename: `remit-scout-${props.chartId}-${props.filters.corridor}`,
    })
  }
  catch (e) {
    imageError.value = e instanceof Error ? e.message : 'Failed to generate image.'
  }
}
</script>
