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
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
              <svg
                v-if="!copied"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Social Share -->
          <div class="mt-6">
            <p class="mb-3 text-sm text-neutral-400">
              Or share via:
            </p>
            <div class="flex gap-3">
              <a
                :href="twitterShareUrl"
                target="_blank"
                rel="noopener"
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600 hover:bg-brand-600/30 transition-colors"
              >
                <svg
                  class="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                :href="linkedinShareUrl"
                target="_blank"
                rel="noopener"
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20 text-brand-600 hover:bg-brand-600/30 transition-colors"
              >
                <svg
                  class="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                :href="emailShareUrl"
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 text-neutral-400 hover:bg-neutral-600 transition-colors"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
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
              <svg
                v-if="!copiedEmbed"
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
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
