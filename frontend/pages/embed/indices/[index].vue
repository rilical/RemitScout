<template>
  <div
class="min-h-screen p-4"
:class="theme === 'dark' ? 'bg-neutral-900' : 'bg-surface'"
>
    <div
      data-chart-export-root
      class="overflow-hidden rounded-xl"
      :class="
        theme === 'dark'
          ? 'border border-neutral-700 bg-neutral-800'
          : 'border border-neutral-200 bg-neutral-50'
      "
    >
      <div
        class="border-b px-4 py-3"
        :class="theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1
              class="text-body-lg font-bold"
              :class="theme === 'dark' ? 'text-white' : 'text-neutral-900'"
            >
              {{ chartTitle }}
            </h1>
            <p
              class="text-body-sm"
              :class="theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'"
            >
              {{ resolvedCorridorLabel }} · {{ resolvedMethodLabel }} · ${{ resolvedAmountBucket }}
            </p>
          </div>
          <div
            class="text-body-sm"
            :class="theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'"
          >
            {{ weightingLabel }}
          </div>
        </div>
      </div>

      <div class="p-4">
        <div
          v-if="loading"
          class="flex h-64 w-full items-center justify-center"
          role="status"
          aria-live="polite"
          aria-label="Loading chart"
        >
          <SkeletonBlock
width="full"
height="16rem"
:tone="theme === 'dark' ? 'dark' : 'light'"
/>
          <span class="sr-only">Loading chart</span>
        </div>
        <div
          v-else-if="error"
          class="text-body-sm flex h-64 items-center justify-center text-danger-600"
        >
          {{ error }}
        </div>
        <div v-else-if="chartSeries.length">
          <AsyncErrorBoundary skeleton-height="320">
            <PulseLineChart
:series="chartSeries"
:unit="unit"
:unit-label="unitLabel"
/>
          </AsyncErrorBoundary>
        </div>
        <div
v-else
class="text-body-sm flex h-64 items-center justify-center text-neutral-500"
>
          {{ emptyStateMessage }}
        </div>
        <div
          v-if="!loading && !error"
          class="text-body-sm mt-4"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
        >
          {{ citationText }}
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t px-4 py-3"
        :class="
          theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-neutral-200 bg-neutral-100'
        "
      >
        <div
          class="text-body-sm flex flex-wrap items-center gap-2"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
        >
          <span v-if="publicationLabel">{{ publicationLabel }}</span>
          <span>Updated {{ formatLastUpdated(lastUpdated) }}</span>
          <MethodologyVersionBadge :version="methodologyVersion" />
          <PublicationStatusBadge :status="publicationStatus" />
        </div>
        <a
          href="https://remit-scout.com"
          target="_blank"
          rel="dofollow"
          :title="`${chartTitle} — Remit-Scout Remittance Intelligence`"
          class="text-body-sm flex items-center gap-1.5 font-medium transition-colors"
          :class="
            theme === 'dark'
              ? 'text-brand-600 hover:text-brand-700'
              : 'text-brand-600 hover:text-brand-700'
          "
        >
          <svg
class="h-4 w-4"
viewBox="0 0 24 24"
fill="currentColor"
>
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            />
          </svg>
          Powered by Remit-Scout
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'
import AsyncErrorBoundary from '~/components/shared/AsyncErrorBoundary.vue'
import { getPublicIndicesEmbedSnapshot, getPublicIndicesPublishedEmbed } from '~/lib/indicesApi'
import type { IndexKey, PublicationStatus } from '~/types/indices'
import type { ChartSeries } from '~/types/pulse'
import { setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { clampExportDays } from '~/shared/lib/exports'

const PulseLineChart = defineAsyncComponent(() => import('~/components/pulse/PulseLineChart.vue'))

definePageMeta({
  layout: false,
})

const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || 'https://remit-scout.com'
const embedUrl = computed(() => `${siteUrl}${route.path}`)
const { addVideoObjectSchema } = useStructuredData()

const publishedId = computed(() => ((route.query.published_id as string) || '').trim())
const indexKey = computed(() => route.params.index as IndexKey)
const snapshotId = computed(() => ((route.query.snapshot_id as string) || '').trim())
const resolvedTheme = ref<'dark' | 'light' | null>(null)
const theme = computed(() => resolvedTheme.value || (route.query.theme as 'dark' | 'light') || 'dark')
const corridorId = computed(() => (route.query.corridor_id as string) || 'US-PH-USD-PHP')
const amountBucket = computed(() => Number.parseInt(route.query.amount_bucket as string) || 500)
const methodProfile = computed(() => (route.query.method_profile as string) || 'standard_bank')
const days = computed(() => clampExportDays(Number.parseInt(route.query.days as string) || 30))

const indexMeta: Record<
  IndexKey,
  { title: string, color: string, unit: 'rate' | 'percent' | 'bps', unitLabel: string }
> = {
  teer: {
    title: 'Total Effective Exchange Rate (TEER)',
    color: 'rgb(var(--rs-color-brand) / 1)',
    unit: 'rate',
    unitLabel: 'rate',
  },
  rci: {
    title: 'Remittance Cost Index (RCI)',
    color: 'rgb(var(--rs-color-brand) / 0.72)',
    unit: 'percent',
    unitLabel: 'percent',
  },
  rvi_bps: {
    title: 'Remittance Volatility Index (RVI) · bps',
    color: 'rgb(var(--rs-color-brand) / 0.52)',
    unit: 'bps',
    unitLabel: 'bps',
  },
}

const loading = ref(true)
const error = ref<string | null>(null)
const chartSeries = ref<ChartSeries[]>([])
const lastUpdated = ref('')
const weightingLabel = ref('synthetic volume weighted')
const emptyStateMessage = ref('No data available yet.')
const snapshotCreatedAt = ref<string | null>(null)
const publishedAt = ref<string | null>(null)
const snapshotCorridorId = ref<string | null>(null)
const snapshotMethodProfile = ref<string | null>(null)
const snapshotAmountBucket = ref<number | null>(null)
const methodologyVersion = ref<string | null>(null)
const publicationStatus = ref<PublicationStatus | null>(null)

const meta = computed(() => indexMeta[indexKey.value])
const chartTitle = computed(() => meta.value?.title || 'Index')
const unit = computed(() => meta.value?.unit || 'rate')
const unitLabel = computed(() => meta.value?.unitLabel || 'rate')
const resolvedMethodLabel = computed(() => {
  const profile = snapshotMethodProfile.value || methodProfile.value
  if (profile === 'standard_card') return 'Card to Bank'
  if (profile === 'cash_pickup') return 'Cash Pickup'
  return 'Bank to Bank'
})
const resolvedCorridorLabel = computed(() =>
  (snapshotCorridorId.value || corridorId.value).toUpperCase(),
)
const resolvedAmountBucket = computed(() => snapshotAmountBucket.value || amountBucket.value)
const citationText = computed(() => {
  const retrieved = snapshotCreatedAt.value
    ? new Date(snapshotCreatedAt.value).toLocaleDateString()
    : new Date().toLocaleDateString()
  return `Source: Remit-Scout (${indexKey.value.toUpperCase()}) · ${weightingLabel.value} · Retrieved ${retrieved}`
})

const publicationLabel = computed(() => {
  if (!publishedAt.value) return null
  return `Published ${new Date(publishedAt.value).toLocaleDateString()}`
})

const fullIndexUrl = computed(() => {
  const anchor = indexKey.value === 'teer' ? 'teer' : indexKey.value === 'rci' ? 'rci' : 'rvi'
  return `${siteUrl}/indices-methodology#${anchor}`
})

watchEffect(() => {
  const title = `Embed: ${chartTitle.value} | Remit-Scout`
  const description = 'Embeddable Remit-Scout indices chart.'

  setSeo({
    title,
    description,
    canonical: embedUrl.value,
    noindex: true,
  })

  addVideoObjectSchema({
    name: title,
    description,
    thumbnailUrl: `${siteUrl}/og-image.png`,
    uploadDate: new Date().toISOString(),
    contentUrl: fullIndexUrl.value,
    embedUrl: embedUrl.value,
  })
})

function formatLastUpdated(timestamp: string): string {
  if (!timestamp) return 'unknown'
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

onMounted(async () => {
  if (!meta.value) {
    error.value = 'Invalid index type.'
    loading.value = false
    return
  }
  try {
    if (!publishedId.value && !snapshotId.value) {
      error.value = 'A published_id or legacy snapshot_id is required.'
      return
    }

    const data = publishedId.value
      ? await getPublicIndicesPublishedEmbed(publishedId.value)
      : snapshotId.value
        ? await getPublicIndicesEmbedSnapshot(snapshotId.value)
        : null

    if (!data) {
      error.value = 'A published embed link is required.'
      return
    }

    if ('publishedId' in data) {
      snapshotCreatedAt.value = data.createdAt
      publishedAt.value = data.publishedAt
      resolvedTheme.value = data.theme
      snapshotCorridorId.value = data.corridorId
      snapshotMethodProfile.value = data.methodProfile
      snapshotAmountBucket.value = data.amountBucket
    }

    if ('snapshotId' in data) {
      snapshotCreatedAt.value = data.createdAt
      snapshotCorridorId.value = data.corridorId
      snapshotMethodProfile.value = data.methodProfile
      snapshotAmountBucket.value = data.amountBucket
    }

    methodologyVersion.value
      = data.methodologyVersion ?? data.series?.[data.series.length - 1]?.methodologyVersion ?? null
    publicationStatus.value = data.series?.[data.series.length - 1]?.publicationStatus ?? null

    lastUpdated.value = data.lastUpdated || ''
    weightingLabel.value = data.weightingModel?.replace(/_/g, ' ') || 'synthetic volume weighted'

    const hasOnlySuppressed
      = Array.isArray(data.series)
        && data.series.length > 0
        && data.series.every(point => Boolean(point.suppressionFlag))
    emptyStateMessage.value = hasOnlySuppressed
      ? 'Index data is currently suppressed (coverage/confidence too low).'
      : 'No data available yet.'

    const points = data.series
      .filter(point => !point.suppressionFlag)
      .map((point) => {
        const rawValue = point[indexKey.value]
        if (rawValue === null || rawValue === undefined) return null
        const value = meta.value?.unit === 'percent' ? rawValue * 100 : rawValue
        return { t: new Date(point.date).getTime(), v: value }
      })
      .filter((point): point is { t: number, v: number } => Boolean(point))

    chartSeries.value = points.length
      ? [
          {
            id: indexKey.value,
            label: indexKey.value.toUpperCase(),
            color: meta.value.color,
            points,
          },
        ]
      : []
  }
 catch (err: unknown) {
    const data
      = err && typeof err === 'object' && 'data' in err
        ? ((err as { data?: Record<string, unknown> }).data ?? null)
        : null
    const code = typeof data?.error === 'string' ? data.error : ''
    switch (code) {
      case 'invalid_published_id':
        error.value = 'This published index embed link is invalid. Ask the publisher for a fresh embed link.'
        break
      case 'published_embed_revoked':
        error.value = 'This published index embed was removed by the publisher.'
        break
      case 'invalid_snapshot_id':
        error.value = 'This legacy index snapshot link is invalid.'
        break
      case 'not_found':
        error.value = publishedId.value
          ? 'This published index embed could not be found. Ask the publisher to republish it.'
          : 'This legacy index snapshot has expired or no longer exists.'
        break
      default:
        error.value = err instanceof Error ? err.message : 'Failed to load index data.'
        break
    }
  }
 finally {
    loading.value = false
  }
})

useHead({
  title: computed(() => (meta.value ? `${meta.value.title} | Remit-Scout` : 'Index Embed')),
  bodyAttrs: {
    style: 'margin: 0; padding: 0;',
  },
})
</script>
