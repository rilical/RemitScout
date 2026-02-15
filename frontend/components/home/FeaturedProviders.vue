<template>
  <section
    class="bg-neutral-50 py-12"
    aria-labelledby="providers-heading"
  >
    <div class="container mx-auto px-4">
      <div class="mb-8 text-center">
        <h2
          id="providers-heading"
          class="mb-4 text-h3 font-bold text-neutral-900"
        >
          Popular money transfer providers
        </h2>
        <p class="mx-auto max-w-2xl text-body-lg text-neutral-600">
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
          class="flex h-20 animate-pulse items-center justify-center rounded-lg bg-surface p-6"
        >
          <div class="h-8 w-16 rounded bg-neutral-200" />
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="mt-8"
      >
        <ErrorState
          mode="card"
          message="Unable to load featured providers"
          :on-retry="refresh"
        />
      </div>

      <!-- Providers grid -->
      <div
        v-else
        class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6"
      >
        <NuxtLink
          v-for="provider in providers"
          :key="provider.id"
          :to="`/learn/providers/${provider.slug}`"
          class="group flex items-center justify-center rounded-lg bg-surface p-6 transition-all duration-200 hover:shadow-lg"
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
              class="absolute -right-2 -top-2 rounded-full bg-primary-600 px-1.5 py-0.5 text-body-sm font-medium text-white"
            >
              {{ provider.rating }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- View all link -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/learn/providers"
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
import { ErrorState } from '~/ui/states'

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
    const payload = data.value as { data?: Provider[] } | Provider[] | null
    const list = Array.isArray(payload) ? payload : payload?.data ?? []
    providers.value = list.slice(0, props.count).map(provider => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug || provider.id,
      rating: provider.rating,
    }))
  }
  catch (err) {
    useLogger('FeaturedProviders').error('Failed to fetch providers', err)
    error.value = true
  }
  finally {
    loading.value = false
  }
}

// Image error handler
const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  const target = event.target as HTMLImageElement
  if (!target) return
  target.style.display = 'none'

  // Show fallback text
  const fallback = document.createElement('div')
  fallback.className = 'text-neutral-400 text-body-sm font-medium'
  fallback.textContent = target.alt?.replace(' logo', '') || 'Provider'
  target.parentElement?.appendChild(fallback)
}

// Retry function
const refresh = () => {
  void fetchProviders()
}

// Initialize
await fetchProviders()
</script>
