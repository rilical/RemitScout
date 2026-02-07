<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="$emit('close')"
    />

    <!-- Modal -->
    <div class="relative w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-800 shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
        <h2 class="text-lg font-bold text-white">
          {{ mode === 'share' ? 'Share Chart' : 'Embed Chart' }}
        </h2>
        <button
          class="rounded-lg p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
          @click="$emit('close')"
        >
          <Icon
            name="x"
            :size="20"
            class="text-current"
          />
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
              class="flex-1 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-sm text-white focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
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
            <p class="mb-3 text-sm text-neutral-400">
              Or share via:
            </p>
            <div class="flex flex-wrap gap-3">
              <a
                :href="twitterShareUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-600/30 transition-colors"
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
                class="inline-flex items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-600/30 transition-colors"
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
                class="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-600 transition-colors"
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

        <!-- Embed Mode -->
        <template v-else>
          <p class="mb-4 text-neutral-400">
            Use the code below to embed this chart on your website.
          </p>

          <!-- Options -->
          <div class="mb-4 flex flex-wrap gap-4">
            <div>
              <label class="mb-1 block text-xs text-neutral-400">Theme</label>
              <select
                v-model="embedTheme"
                class="rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-brand-600 focus:outline-none"
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
              <label class="mb-1 block text-xs text-neutral-400">Width</label>
              <input
                v-model="embedWidth"
                type="text"
                class="w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-brand-600 focus:outline-none"
                placeholder="100%"
              >
            </div>
            <div>
              <label class="mb-1 block text-xs text-neutral-400">Height</label>
              <input
                v-model="embedHeight"
                type="text"
                class="w-24 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-brand-600 focus:outline-none"
                placeholder="400"
              >
            </div>
          </div>

          <!-- Embed Code -->
          <div class="relative">
            <pre
              class="rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-300 overflow-x-auto"
            ><code>{{ embedCode }}</code></pre>
            <button
              class="absolute top-2 right-2 flex items-center gap-1.5 rounded bg-neutral-700 px-2 py-1 text-xs text-white hover:bg-neutral-600 transition-colors"
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
            <p class="mb-2 text-sm text-neutral-400">
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PulseFilters } from '~/types/pulse'
import { getChartById } from '~/lib/pulseChartRegistry'
import { Icon } from '~/ui'

interface Props {
  chartId: string
  filters: PulseFilters
  mode: 'share' | 'embed'
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const shareInput = ref<HTMLInputElement | null>(null)
const copied = ref(false)
const copiedEmbed = ref(false)
const embedTheme = ref<'dark' | 'light'>('dark')
const embedWidth = ref('100%')
const embedHeight = ref('400')

const chartMeta = computed(() => getChartById(props.chartId))

const baseUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
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
  style="border-radius: 8px;"
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
    console.error('Failed to copy:', e)
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
    console.error('Failed to copy:', e)
  }
}
</script>
