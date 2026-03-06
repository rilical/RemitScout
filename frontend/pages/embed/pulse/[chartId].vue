<template>
  <div class="min-h-screen p-4" :class="theme === 'dark' ? 'bg-neutral-900' : 'bg-surface'">
    <!-- Chart Container -->
    <div
      data-chart-export-root
      class="overflow-hidden rounded-xl"
      :class="
        theme === 'dark'
          ? 'border border-neutral-700 bg-neutral-800'
          : 'border border-neutral-200 bg-neutral-50'
      "
    >
      <!-- Header -->
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
              {{ chartMeta?.title }}
            </h1>
            <p
              v-if="insight"
              class="text-body-sm"
              :class="theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'"
            >
              {{ insight }}
            </p>
          </div>
          <div
            class="text-body-sm"
            :class="theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'"
          >
            {{ corridorLabel }} · ${{ filters.amount }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="p-4">
        <div
          v-if="loading"
          class="flex h-64 w-full items-center justify-center"
          role="status"
          aria-live="polite"
          aria-label="Loading chart"
        >
          <SkeletonBlock width="full" height="16rem" :tone="theme === 'dark' ? 'dark' : 'light'" />
          <span class="sr-only">Loading chart</span>
        </div>
        <div
          v-else-if="loadError"
          class="text-body-sm flex h-64 items-center justify-center"
          :class="theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'"
        >
          {{ loadError }}
        </div>
        <AsyncErrorBoundary v-else-if="chartComponent && chartData" skeleton-height="320">
          <component
            :is="chartComponent"
            :series="chartData.series"
            :unit="chartData.metadata.unit"
            :unit-label="chartData.metadata.unitLabel"
            :rows="matrixRows"
          />
        </AsyncErrorBoundary>
      </div>

      <!-- Footer Attribution -->
      <div
        class="flex items-center justify-between border-t px-4 py-3"
        :class="
          theme === 'dark'
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-neutral-200 bg-neutral-100'
        "
      >
        <div
          class="text-body-sm flex items-center gap-2"
          :class="theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
        >
          <span v-if="publicationLabel">{{ publicationLabel }}</span>
          <span>Updated {{ formatLastUpdated(lastUpdated) }}</span>
        </div>
        <a
          href="https://remit-scout.com"
          target="_blank"
          rel="dofollow"
          :title="`${chartMeta?.title || 'Pulse Chart'} — Remit-Scout Remittance Intelligence`"
          class="text-body-sm flex items-center gap-1.5 font-medium transition-colors"
          :class="
            theme === 'dark'
              ? 'text-brand-600 hover:text-brand-700'
              : 'text-brand-600 hover:text-brand-700'
          "
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
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
import { ref, computed, onMounted, watchEffect, markRaw, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import type { ChartData, PulseFilters, MethodCoverageRow, AmountBucket } from '~/types/pulse';
import { getChartById } from '~/lib/pulseChartRegistry';
import { getPublicPulseEmbedSnapshot, getPublicPulsePublishedEmbed } from '~/lib/pulseApi';
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue';
import AsyncErrorBoundary from '~/components/shared/AsyncErrorBoundary.vue';
import PulseBarChart from '~/components/pulse/PulseBarChart.vue';
import PulseStackedChart from '~/components/pulse/PulseStackedChart.vue';
import PulseScatterChart from '~/components/pulse/PulseScatterChart.vue';
import PulseMatrixTable from '~/components/pulse/PulseMatrixTable.vue';
import { useFeatureFlags } from '~/composables/useFeatureFlags';
import { setSeo } from '~/composables/useSeo';
import { useStructuredData } from '~/composables/useStructuredData';

const PulseLineChart = defineAsyncComponent(() => import('~/components/pulse/PulseLineChart.vue'));

const { pulseEnabled } = useFeatureFlags();

if (!pulseEnabled.value) {
  await navigateTo('/plus', { redirectCode: 302 });
}

definePageMeta({
  layout: false,
});

const route = useRoute();
const config = useRuntimeConfig();
const siteUrl = config.public.siteUrl || 'https://remit-scout.com';
const embedUrl = computed(() => `${siteUrl}${route.path}`);
const { addVideoObjectSchema } = useStructuredData();

const chartId = computed(() => route.params.chartId as string);
const publishedId = computed(() => ((route.query.published_id as string) || '').trim());
const snapshotId = computed(() => ((route.query.snapshot_id as string) || '').trim());
const resolvedTheme = ref<'dark' | 'light' | null>(null);
const theme = computed(() => resolvedTheme.value || (route.query.theme as 'dark' | 'light') || 'dark');

const filters = ref<PulseFilters>({
  corridor: (route.query.corridor as string) || 'global',
  corridorId: (route.query.corridor_id as string) || undefined,
  amount: (Number.parseInt(route.query.amount as string, 10) as AmountBucket) || 200,
  fundingMethod: (route.query.fund as 'bank' | 'card' | 'cash') || 'bank',
  payoutMethod: (route.query.pay as 'bank' | 'cash' | 'wallet') || 'bank',
});

const loading = ref(true);
const chartData = ref<ChartData | null>(null);
const matrixRows = ref<MethodCoverageRow[]>([]);
const lastUpdated = ref('');
const insight = ref('');
const loadError = ref<string | null>(null);
const snapshotCorridorLabel = ref<string | null>(null);
const publishedAt = ref<string | null>(null);

const chartMeta = computed(() => getChartById(chartId.value));

const corridorLabel = computed(() => {
  if (snapshotCorridorLabel.value) return snapshotCorridorLabel.value;
  if (filters.value.corridor === 'global') return 'Global';
  return filters.value.corridor;
});

const publicationLabel = computed(() => {
  if (!publishedAt.value) return null;
  return `Published ${new Date(publishedAt.value).toLocaleDateString()}`
})

const fullChartUrl = computed(() => {
  const params = new URLSearchParams();
  if (filters.value.corridor !== 'global') params.set('corridor', filters.value.corridor);
  if (filters.value.corridorId) params.set('corridor_id', filters.value.corridorId);
  if (filters.value.amount !== 200) params.set('amount', String(filters.value.amount));
  const queryStr = params.toString();
  return `/pulse/charts/${chartId.value}${queryStr ? '?' + queryStr : ''}`;
});

watchEffect(() => {
  const title = chartMeta.value?.title
    ? `Embed: ${chartMeta.value.title} | Remit-Scout`
    : 'Embed: Pulse Chart | Remit-Scout';
  const description = 'Embeddable Remit-Scout Pulse chart.';

  setSeo({
    title,
    description,
    canonical: embedUrl.value,
    noindex: true,
  });

  addVideoObjectSchema({
    name: title,
    description,
    thumbnailUrl: `${siteUrl}/og-image.png`,
    uploadDate: new Date().toISOString(),
    contentUrl: `${siteUrl}${fullChartUrl.value}`,
    embedUrl: embedUrl.value,
  });
});

const chartComponent = computed(() => {
  if (!chartMeta.value) return null;

  switch (chartMeta.value.type) {
    case 'line':
      return markRaw(PulseLineChart);
    case 'bar':
      return markRaw(PulseBarChart);
    case 'stacked':
      return markRaw(PulseStackedChart);
    case 'scatter':
      return markRaw(PulseScatterChart);
    case 'matrix':
      return markRaw(PulseMatrixTable);
    default:
      return markRaw(PulseLineChart);
  }
});

function formatLastUpdated(timestamp: string): string {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function resolvePublicEmbedError(error: unknown, mode: 'published' | 'snapshot'): string {
  const candidate = error as {
    data?: { error?: unknown; message?: unknown };
    message?: unknown;
  };
  const code = typeof candidate?.data?.error === 'string' ? candidate.data.error : '';
  switch (code) {
    case 'invalid_published_id':
      return 'This published Pulse embed link is invalid. Ask the publisher for a fresh embed link.';
    case 'invalid_snapshot_id':
      return 'This public Pulse snapshot link is invalid. Ask the publisher for a fresh embed link.';
    case 'published_embed_revoked':
      return 'This published Pulse embed was removed by the publisher.';
    case 'not_found':
      return mode === 'published'
        ? 'This published Pulse embed could not be found. Ask the publisher to republish it.'
        : 'This public Pulse snapshot has expired or no longer exists. Ask the publisher to generate a new snapshot.';
    default:
      if (
        typeof candidate?.data?.message === 'string' &&
        candidate.data.message.trim().length > 0
      ) {
        return candidate.data.message;
      }
      if (
        typeof candidate?.message === 'string' &&
        candidate.message.trim().length > 0 &&
        candidate.message !== 'fetch failed'
      ) {
        return candidate.message;
      }
      return mode === 'published'
        ? 'Unable to load this published Pulse embed right now.'
        : 'Unable to load this public Pulse snapshot right now.';
  }
}

onMounted(async () => {
  try {
    loadError.value = null;
    publishedAt.value = null;
    resolvedTheme.value = null;

    if (!publishedId.value && !snapshotId.value) {
      loadError.value =
        'This embed link is incomplete. A published_id or legacy snapshot_id is required to render a public Pulse embed.';
      return;
    }

    if (publishedId.value) {
      const published = await getPublicPulsePublishedEmbed(publishedId.value);
      if (published.chartId !== chartId.value) {
        loadError.value = 'This public Pulse embed does not match the requested chart.';
        return;
      }

      chartData.value = published.chart;
      matrixRows.value = published.methodCoverage || [];
      lastUpdated.value = published.chart.updatedAt || published.chart.metadata.lastUpdated;
      insight.value = published.chart.insight;
      snapshotCorridorLabel.value = published.corridorLabel || null;
      publishedAt.value = published.publishedAt;
      resolvedTheme.value = published.theme;
      filters.value = {
        corridor: published.filters.corridor as PulseFilters['corridor'],
        corridorId: published.filters.corridorId,
        amount: published.filters.amount as AmountBucket,
        fundingMethod: published.filters.fundingMethod,
        payoutMethod: published.filters.payoutMethod,
      };
      return;
    }

    const snapshot = await getPublicPulseEmbedSnapshot(snapshotId.value);
    if (snapshot.chartId !== chartId.value) {
      loadError.value = 'This public Pulse snapshot does not match the requested chart.';
      return;
    }

    chartData.value = snapshot.chart;
    matrixRows.value = snapshot.methodCoverage || [];
    lastUpdated.value = snapshot.chart.updatedAt || snapshot.chart.metadata.lastUpdated;
    insight.value = snapshot.chart.insight;
    snapshotCorridorLabel.value = snapshot.corridorLabel || null;
    filters.value = {
      corridor: snapshot.filters.corridor as PulseFilters['corridor'],
      corridorId: snapshot.filters.corridorId,
      amount: snapshot.filters.amount as AmountBucket,
      fundingMethod: snapshot.filters.fundingMethod,
      payoutMethod: snapshot.filters.payoutMethod,
    };
  } catch (e) {
    loadError.value = resolvePublicEmbedError(e, publishedId.value ? 'published' : 'snapshot');
  } finally {
    loading.value = false;
  }
});

useHead({
  title: computed(() =>
    chartMeta.value ? `${chartMeta.value.title} | Remit-Scout` : 'Chart Embed'
  ),
  bodyAttrs: {
    style: 'margin: 0; padding: 0;',
  },
});
</script>
