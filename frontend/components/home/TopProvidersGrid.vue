<template>
  <div class="py-16 bg-surface">
    <div class="mx-auto max-w-[1200px] px-page-x">
      <div class="text-center mb-12">
        <h2 class="text-h1 font-bold text-neutral-900 mb-4">
          {{ title }}
        </h2>
        <p class="text-h4 text-neutral-600 max-w-3xl mx-auto">
          {{ subtitle }}
        </p>
      </div>

      <!-- Desktop Grid: 5 columns, Mobile: Horizontal scroll -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div
          v-for="provider in displayProviders"
          :key="provider.slug"
          class="group relative rounded-2xl border border-neutral-200 bg-surface p-6 shadow-md transition-shadow hover:shadow-lg"
        >
          <!-- Provider Logo (96×32) -->
          <div class="mb-4">
            <ProviderLogo
              :slug="provider.slug"
              :alt="provider.name"
            />
          </div>

          <!-- Score Badge (24px circle top-right) -->
          <div class="absolute top-4 right-4">
            <ScoreBadge :score="provider.score" />
          </div>

          <!-- Metrics Bars -->
          <div class="mb-6 space-y-3">
            <MetricBar
              label="Trust"
              :value="provider.metrics.trust"
            />
            <MetricBar
              label="Service"
              :value="provider.metrics.service"
            />
            <MetricBar
              label="Fees"
              :value="provider.metrics.fees"
            />
            <MetricBar
              label="Satisfaction"
              :value="provider.metrics.satisfaction"
            />
          </div>

          <!-- CTA Buttons -->
          <div class="space-y-2">
            <NuxtLink
              :to="`/learn/providers/${provider.slug}`"
              class="block w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-body-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Read review
            </NuxtLink>
            <button class="block w-full rounded-lg border border-primary-600 px-4 py-2 text-center text-body-sm font-medium text-primary-600 transition-colors hover:bg-primary-50">
              Go to {{ provider.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- View All CTA -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/learn/providers"
          class="inline-flex items-center rounded-lg border border-transparent bg-primary-600 px-6 py-3 text-body font-medium text-white transition-colors hover:bg-primary-700"
        >
          {{ viewAllText }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink } from '#components'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import ScoreBadge from '~/components/shared/ScoreBadge.vue'
import MetricBar from '~/components/shared/MetricBar.vue'

// Props interface
interface Metrics {
  trust: number
  service: number
  fees: number
  satisfaction: number
}

interface Provider {
  slug: string
  name: string
  score: number
  metrics: Metrics
}

interface Props {
  title?: string
  subtitle?: string
  viewAllText?: string
  providers?: Provider[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'We compare and review top money transfer services',
  subtitle: 'Compare rates and services from the most popular and trusted money transfer companies worldwide.',
  viewAllText: 'View All Providers',
})

const DEFAULT_PROVIDERS: readonly Provider[] = [
  {
    slug: 'wise',
    name: 'Wise',
    score: 9.3,
    metrics: { trust: 95, service: 92, fees: 88, satisfaction: 90 },
  },
  {
    slug: 'remitly',
    name: 'Remitly',
    score: 9.1,
    metrics: { trust: 88, service: 90, fees: 85, satisfaction: 92 },
  },
  {
    slug: 'western-union',
    name: 'Western Union',
    score: 8.2,
    metrics: { trust: 82, service: 85, fees: 75, satisfaction: 80 },
  },
  {
    slug: 'xe',
    name: 'XE',
    score: 8.7,
    metrics: { trust: 87, service: 88, fees: 82, satisfaction: 85 },
  },
  {
    slug: 'ofx',
    name: 'OFX',
    score: 8.5,
    metrics: { trust: 85, service: 83, fees: 80, satisfaction: 82 },
  },
] as const

const displayProviders = computed<readonly Provider[]>(() => props.providers ?? DEFAULT_PROVIDERS)
</script>
