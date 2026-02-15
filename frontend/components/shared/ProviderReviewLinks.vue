<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-h3 font-bold text-neutral-900">
          Provider reviews
        </h2>
        <p class="text-body-sm text-neutral-600">
          Learn more about the providers available for this corridor.
        </p>
      </div>
      <NuxtLink
        to="/learn/providers"
        class="text-body-sm font-semibold text-brand-600 hover:underline"
      >
        View all providers
      </NuxtLink>
    </div>

    <div
      v-if="!uniqueProviders.length"
      class="rounded-xl border border-rs-border bg-neutral-50 px-4 py-6 text-body-sm text-neutral-600"
    >
      Provider reviews will appear once quotes are available.
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <NuxtLink
        v-for="provider in uniqueProviders"
        :key="provider.slug"
        :to="`/learn/providers/${provider.slug}`"
        class="group flex items-center gap-4 rounded-xl border border-rs-border bg-surface p-4 hover:border-brand-300 hover:shadow-md transition-all"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-50">
          <ProviderLogo
            :slug="provider.slug"
            :alt="provider.name"
            class="h-8 w-auto"
          />
        </div>
        <div>
          <p class="text-body-sm font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
            {{ provider.name }}
          </p>
          <p class="text-body-sm text-neutral-500">Read review</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { normalizeProviderSlug } from '~/composables/useProviderLogo'

type ProviderInput = {
  provider?: string
  providerId?: string
}

const props = defineProps<{
  providers?: ProviderInput[]
}>()

const uniqueProviders = computed(() => {
  const seen = new Set<string>()
  const list: Array<{ slug: string, name: string }> = []

  for (const item of props.providers || []) {
    const name = item.provider || item.providerId || ''
    if (!name) continue
    const slug = normalizeProviderSlug(name)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    list.push({ slug, name })
  }

  return list
})
</script>
