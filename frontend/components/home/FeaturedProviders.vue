<template>
  <section
    class="bg-gray-50 py-12"
    aria-labelledby="providers-heading"
  >
    <div class="container mx-auto px-4">
      <div class="mb-8 text-center">
        <h2
          id="providers-heading"
          class="mb-4 text-2xl font-bold text-gray-900 md:text-3xl"
        >
          Popular money transfer providers
        </h2>
        <p class="mx-auto max-w-2xl text-lg text-gray-600">
          Trusted by millions worldwide for fast, secure international money transfers.
        </p>
      </div>

      <!-- Loading state -->
      <div
        v-if="loading"
        class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="flex h-20 animate-pulse items-center justify-center rounded-lg bg-white p-6"
        >
          <div class="h-8 w-16 rounded bg-gray-200" />
        </div>
      </div>

      <!-- Providers grid -->
      <div
        v-else
        class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6"
      >
        <NuxtLink
          v-for="provider in providers"
          :key="provider.id"
          :to="`/providers/${provider.slug}`"
          class="group flex items-center justify-center rounded-lg bg-white p-6 transition-all duration-200 hover:shadow-lg"
          :aria-label="`View ${provider.name} reviews and rates`"
        >
          <div class="relative">
            <!-- Provider logo -->
            <NuxtImg
              :src="`/logos/${provider.slug}.svg`"
              :alt="`${provider.name} logo`"
              width="96"
              height="32"
              loading="lazy"
              class="h-8 w-24 object-contain transition-transform duration-200 group-hover:scale-105"
              :placeholder="[50, 25, 75, 5]"
              @error="handleImageError"
            />

            <!-- Rating badge -->
            <div
              v-if="provider.rating"
              class="absolute -right-2 -top-2 rounded-full bg-primary-600 px-1.5 py-0.5 text-xs font-medium text-white"
            >
              {{ provider.rating }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Error state -->
      <div
        v-if="error"
        class="mt-8 text-center"
      >
        <p class="mb-4 text-gray-600">
          Unable to load providers. Please try again later.
        </p>
        <button
          class="btn-secondary"
          @click="retry"
        >
          Retry
        </button>
      </div>

      <!-- View all link -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/providers"
          class="inline-flex items-center font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          Compare all providers
          <svg
            class="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Import shared components and composables
import { NuxtImg } from '#components'
import { useProviders } from '~/composables/useProviders'

interface Provider {
  id: string
  name: string
  slug: string
  rating?: number
}

// Props
interface Props {
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 6,
})

// State
const providers = ref<Provider[]>([])
const loading = ref(true)
const error = ref(false)

// Fetch providers
const fetchProviders = async () => {
  loading.value = true
  error.value = false

  try {
    const { data } = await useProviders()
    if (data.value) {
      providers.value = data.value.slice(0, props.count)
    }
  }
  catch (err) {
    console.error('Failed to fetch providers:', err)
    error.value = true
  }
  finally {
    loading.value = false
  }
}

// Image error handler
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'

  // Show fallback text
  const fallback = document.createElement('div')
  fallback.className = 'text-gray-400 text-sm font-medium'
  fallback.textContent = target.alt?.replace(' logo', '') || 'Provider'
  target.parentElement?.appendChild(fallback)
}

// Retry function
const retry = () => {
  fetchProviders()
}

// Initialize
await fetchProviders()
</script>

<style scoped>
.btn-secondary {
  @apply rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-900 transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}
</style>
