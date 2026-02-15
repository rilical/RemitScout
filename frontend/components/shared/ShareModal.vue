<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
        aria-label="Close dialog"
        @click.self="close"
        @keydown.esc="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />

        <!-- Modal -->
        <div
          ref="modalRef"
          class="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          tabindex="-1"
        >
          <!-- Close button -->
          <button
            type="button"
            class="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Close dialog"
            @click="close"
          >
            <svg
              class="w-5 h-5"
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

          <!-- Header -->
          <div class="text-center mb-6">
            <div class="mx-auto w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mb-3">
              <svg
                class="w-6 h-6 text-brand-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <h3
              id="share-modal-title"
              class="text-h4 font-bold text-rs-fg"
            >
              Share these rates
            </h3>
            <p class="text-body-sm text-neutral-600 mt-1">
              Help others find the best rates for {{ corridor }}
            </p>
          </div>

          <!-- Share message preview -->
          <div class="bg-neutral-50 rounded-xl p-4 mb-6">
            <p class="text-body-sm text-neutral-700 leading-relaxed">
              {{ shareText }}
            </p>
            <div class="mt-3 flex items-center gap-2 text-body-sm text-rs-muted">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span class="truncate">{{ shareUrl }}</span>
            </div>
          </div>

          <!-- Share options -->
          <div class="grid grid-cols-4 gap-3 mb-6">
            <!-- WhatsApp -->
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
              @click="shareVia('whatsapp')"
            >
              <div class="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span class="text-body-sm font-medium text-neutral-700">WhatsApp</span>
            </button>

            <!-- Twitter/X -->
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
              @click="shareVia('twitter')"
            >
              <div class="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span class="text-body-sm font-medium text-neutral-700">X</span>
            </button>

            <!-- Facebook -->
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
              @click="shareVia('facebook')"
            >
              <div class="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span class="text-body-sm font-medium text-neutral-700">Facebook</span>
            </button>

            <!-- Email -->
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
              @click="shareVia('email')"
            >
              <div class="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
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
              </div>
              <span class="text-body-sm font-medium text-neutral-700">Email</span>
            </button>
          </div>

          <!-- Copy link button -->
          <button
            type="button"
            class="w-full h-12 rounded-xl border-2 border-rs-border font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            @click="copyLink"
          >
            <svg
              v-if="!copied"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-success-600"
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
            {{ copied ? 'Link copied!' : 'Copy link' }}
          </button>

          <!-- Native share (mobile) -->
          <button
            v-if="canNativeShare"
            type="button"
            class="w-full h-12 mt-3 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
            @click="nativeShare"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            More sharing options
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'

const props = defineProps<{
  isOpen: boolean
  fromCountry?: string
  toCountry?: string
  amount?: number
  currency?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef)

const copied = ref(false)
const toast = useToast()

const corridor = computed(() => {
  if (props.fromCountry && props.toCountry) {
    return `${props.fromCountry} to ${props.toCountry}`
  }
  return 'this corridor'
})

const shareUrl = computed(() => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('utm_source', 'remitscout')
    url.searchParams.set('utm_medium', 'share')

    const path = window.location.pathname
    // Canonicalize legacy provider review URLs so shared links always point at /learn/providers/*.
    const canonicalPath = path.replace(/^\/reviews(?=\/|$)/, '/learn/providers')
    if (canonicalPath !== path) {
      url.pathname = canonicalPath
    }

    if (canonicalPath.includes('/send-money/')) {
      url.searchParams.set('utm_campaign', 'corridor_comparison')
    }
    else if (canonicalPath.includes('/learn/providers/')) {
      url.searchParams.set('utm_campaign', 'provider_review')
    }
    else if (canonicalPath.includes('/learn/')) {
      url.searchParams.set('utm_campaign', 'guide')
    }
    else {
      url.searchParams.set('utm_campaign', 'share')
    }

    return url.toString()
  }
  return ''
})

const shareText = computed(() => {
  if (props.amount && props.currency) {
    return `Found the best ${props.currency} to ${props.toCountry || 'destination'} rates! Compare 10+ providers on Remit-Scout and save on fees.`
  }
  return `Found the best money transfer rates for ${corridor.value}! Compare 10+ providers on Remit-Scout and save on fees.`
})

const shareTitle = computed(() => {
  return `Best money transfer rates: ${corridor.value} | Remit-Scout`
})

const canNativeShare = computed(() => {
  return typeof navigator !== 'undefined' && !!navigator.share
})

function close() {
  emit('close')
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!open) {
      deactivate()
      return
    }

    await nextTick()
    activate()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  deactivate()
})

async function shareVia(platform: 'whatsapp' | 'twitter' | 'facebook' | 'email') {
  // Use native Web Share API when available (prevents redirects)
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle.value,
        text: shareText.value,
        url: shareUrl.value,
      })
      return
    }
    catch (error: any) {
      // User cancelled or error occurred, fall through to URL-based sharing
      if (error.name === 'AbortError') {
        return
      }
    }
  }

  // Fallback: Use platform-specific share URLs
  const text = encodeURIComponent(shareText.value)
  const url = encodeURIComponent(shareUrl.value)
  const title = encodeURIComponent(shareTitle.value)

  const urls: Record<string, string> = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    email: `mailto:?subject=${title}&body=${text}%0A%0A${url}`,
  }

  // For email, use mailto which opens email client (not a redirect)
  if (platform === 'email') {
    window.location.href = urls[platform]
    return
  }

  // For other platforms, open in new window
  window.open(urls[platform], '_blank', 'noopener,noreferrer')
}

async function copyLink() {
  if (!shareUrl.value) {
    toast.error('No link available to copy.')
    return
  }

  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl.value)
      copied.value = true
      toast.success('Link copied!')
      setTimeout(() => {
        copied.value = false
      }, 2000)
      return
    }
  }
  catch (error) {
    // Fall through to legacy copy fallback.
  }

  // Fallback for older browsers or when clipboard API fails
  try {
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl.value
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      copied.value = true
      toast.success('Link copied!')
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
    else {
      toast.error('Failed to copy link. Please try again.')
    }
  }
  catch (error) {
    toast.error('Failed to copy link. Please try again.')
  }
}

async function nativeShare() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle.value,
        text: shareText.value,
        url: shareUrl.value,
      })
    }
    catch {
      toast.error('Failed to share. Please try again.')
    }
  }
}
</script>
